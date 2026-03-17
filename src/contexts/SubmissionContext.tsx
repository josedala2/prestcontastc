import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubmissionStatus = "rascunho" | "pendente" | "recepcionado" | "rejeitado" | "em_analise";
export type NotificationType = "submissao" | "recepcionado" | "rejeitado" | "solicitacao_elementos" | "em_analise";

interface SubmissionEntry {
  entityId: string;
  fiscalYearId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  recepcionadoAt?: string;
  rejeitadoAt?: string;
  motivoRejeicao?: string;
  uploadedDocIds?: string[];
}

export interface PortalNotification {
  id: string;
  entityId: string;
  fiscalYearId: string;
  type: NotificationType;
  message: string;
  detail?: string;
  deadline?: string;
  createdAt: string;
  read: boolean;
  emailSent?: boolean;
}

interface SubmissionContextType {
  submissions: SubmissionEntry[];
  notifications: PortalNotification[];
  unreadCount: (entityId: string) => number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (entityId: string) => void;
  getStatus: (entityId: string, fiscalYearId?: string) => SubmissionStatus;
  submit: (entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string, uploadedDocIds?: string[]) => void;
  getUploadedDocs: (entityId: string, fiscalYearId: string) => string[];
  recepcionar: (entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string) => void;
  rejeitar: (entityId: string, fiscalYearId: string, motivo: string, entityName?: string, entityEmail?: string) => void;
  solicitarElementos: (entityId: string, fiscalYearId: string, documentos: string[], mensagem: string, prazo: number, entityName?: string, entityEmail?: string) => void;
  remeterParaTecnico: (entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string) => void;
  loadingNotifications: boolean;
  refreshNotifications: () => void;
}

const SubmissionContext = createContext<SubmissionContextType | null>(null);

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Load notifications from DB on mount
  const refreshNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("submission_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
        return;
      }

      if (data) {
        setNotifications(
          data.map((n: any) => ({
            id: n.id,
            entityId: n.entity_id,
            fiscalYearId: n.fiscal_year_id,
            type: n.type as NotificationType,
            message: n.message,
            detail: n.detail,
            deadline: n.deadline,
            createdAt: n.created_at,
            read: n.read,
            emailSent: n.email_sent,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const getStatus = useCallback(
    (entityId: string, fiscalYearId?: string): SubmissionStatus => {
      const entry = submissions.find(
        (s) => s.entityId === entityId && (!fiscalYearId || s.fiscalYearId === fiscalYearId)
      );
      return entry?.status ?? "rascunho";
    },
    [submissions]
  );

  const sendNotification = useCallback(async (
    entityId: string,
    fiscalYearId: string,
    type: NotificationType,
    message: string,
    detail?: string,
    entityName?: string,
    entityEmail?: string,
    deadline?: string
  ) => {
    const year = fiscalYearId.split("-").pop() || fiscalYearId;

    try {
      // Call edge function to persist notification and send email
      const { data, error } = await supabase.functions.invoke("send-notification-email", {
        body: {
          entityId,
          entityName: entityName || entityId,
          entityEmail: entityEmail || null,
          fiscalYearId,
          fiscalYear: year,
          type,
          message,
          detail,
          deadline,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
      }

      // Refresh notifications from DB
      await refreshNotifications();
    } catch (err) {
      console.error("Error sending notification:", err);
      // Fallback: add notification locally
      const notification: PortalNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        entityId,
        fiscalYearId,
        type,
        message,
        detail,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    }
  }, [refreshNotifications]);

  const getUploadedDocs = useCallback((entityId: string, fiscalYearId: string): string[] => {
    const entry = submissions.find(
      (s) => s.entityId === entityId && s.fiscalYearId === fiscalYearId
    );
    return entry?.uploadedDocIds || [];
  }, [submissions]);

  const submit = useCallback((entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string, uploadedDocIds?: string[]) => {
    setSubmissions((prev) => {
      const existing = prev.findIndex(
        (s) => s.entityId === entityId && s.fiscalYearId === fiscalYearId
      );
      const entry: SubmissionEntry = {
        entityId,
        fiscalYearId,
        status: "pendente",
        submittedAt: new Date().toISOString(),
        uploadedDocIds,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(
      entityId,
      fiscalYearId,
      "submissao",
      `Nova prestação de contas submetida — Exercício ${year}`,
      `A entidade ${entityName || entityId} submeteu a prestação de contas do exercício ${year}. Aguarda recepção e conferência documental pela Secretaria.`,
      entityName,
      entityEmail
    );
  }, [sendNotification]);

  const recepcionar = useCallback((entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "recepcionado" as SubmissionStatus, recepcionadoAt: new Date().toISOString() }
          : s
      )
    );
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(
      entityId,
      fiscalYearId,
      "recepcionado",
      `Prestação de contas do exercício ${year} foi recepcionada`,
      "A Secretaria do Tribunal verificou a documentação e emitiu a Acta de Recepção. O processo transitou para análise técnica.",
      entityName,
      entityEmail
    );
  }, [sendNotification]);

  const rejeitar = useCallback((entityId: string, fiscalYearId: string, motivo: string, entityName?: string, entityEmail?: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "rejeitado" as SubmissionStatus, rejeitadoAt: new Date().toISOString(), motivoRejeicao: motivo }
          : s
      )
    );
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(
      entityId,
      fiscalYearId,
      "rejeitado",
      `Prestação de contas do exercício ${year} foi devolvida`,
      motivo,
      entityName,
      entityEmail
    );
  }, [sendNotification]);

  const remeterParaTecnico = useCallback((entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "em_analise" as SubmissionStatus }
          : s
      )
    );
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(
      entityId,
      fiscalYearId,
      "em_analise",
      `Processo do exercício ${year} remetido para análise técnica`,
      "O processo foi enviado pela Secretaria ao Técnico Validador para análise e emissão de parecer. Poderá acompanhar o estado no portal.",
      entityName,
      entityEmail
    );
  }, [sendNotification]);

  const solicitarElementos = useCallback((
    entityId: string,
    fiscalYearId: string,
    documentos: string[],
    mensagem: string,
    prazo: number,
    entityName?: string,
    entityEmail?: string
  ) => {
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    const docList = documentos.map((d) => `• ${d}`).join("\n");
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + prazo);
    sendNotification(
      entityId,
      fiscalYearId,
      "solicitacao_elementos",
      `Solicitação de elementos adicionais — Exercício ${year}`,
      `${mensagem}\n\nDocumentos solicitados:\n${docList}`,
      entityName,
      entityEmail,
      deadlineDate.toISOString()
    );
  }, [sendNotification]);

  const unreadCount = useCallback(
    (entityId: string) => notifications.filter((n) => n.entityId === entityId && !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    // Persist to DB
    await supabase
      .from("submission_notifications")
      .update({ read: true })
      .eq("id", notificationId);
  }, []);

  const markAllAsRead = useCallback(async (entityId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.entityId === entityId ? { ...n, read: true } : n))
    );
    // Persist to DB
    await supabase
      .from("submission_notifications")
      .update({ read: true })
      .eq("entity_id", entityId);
  }, []);

  return (
    <SubmissionContext.Provider
      value={{
        submissions,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        getStatus,
        getUploadedDocs,
        submit,
        recepcionar,
        rejeitar,
        solicitarElementos,
        remeterParaTecnico,
        loadingNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) throw new Error("useSubmissions must be used within SubmissionProvider");
  return ctx;
}
