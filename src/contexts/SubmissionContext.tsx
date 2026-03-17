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
  loadingSubmissions: boolean;
  refreshNotifications: () => void;
  refreshSubmissions: () => void;
}

const SubmissionContext = createContext<SubmissionContextType | null>(null);

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // ── Load submissions from DB ──
  const refreshSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading submissions:", error);
        return;
      }
      if (data) {
        setSubmissions(
          data.map((s: any) => ({
            entityId: s.entity_id,
            fiscalYearId: s.fiscal_year_id,
            status: s.status as SubmissionStatus,
            submittedAt: s.submitted_at,
            recepcionadoAt: s.recepcionado_at,
            rejeitadoAt: s.rejeitado_at,
            motivoRejeicao: s.motivo_rejeicao,
            uploadedDocIds: s.uploaded_doc_ids,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // ── Load notifications from DB ──
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
    refreshSubmissions();
    refreshNotifications();
  }, [refreshSubmissions, refreshNotifications]);

  // ── Persist submission to DB (upsert) ──
  const upsertSubmission = useCallback(async (entry: SubmissionEntry) => {
    const { error } = await supabase.from("submissions").upsert(
      {
        entity_id: entry.entityId,
        fiscal_year_id: entry.fiscalYearId,
        status: entry.status,
        submitted_at: entry.submittedAt || null,
        recepcionado_at: entry.recepcionadoAt || null,
        rejeitado_at: entry.rejeitadoAt || null,
        motivo_rejeicao: entry.motivoRejeicao || null,
        uploaded_doc_ids: entry.uploadedDocIds || null,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "entity_id,fiscal_year_id" }
    );
    if (error) console.error("Error upserting submission:", error);
  }, []);

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
      const { error } = await supabase.functions.invoke("send-notification-email", {
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
      if (error) console.error("Edge function error:", error);
      await refreshNotifications();
    } catch (err) {
      console.error("Error sending notification:", err);
      // Fallback: insert notification directly
      await supabase.from("submission_notifications").insert({
        entity_id: entityId,
        entity_name: entityName || entityId,
        entity_email: entityEmail || null,
        fiscal_year_id: fiscalYearId,
        fiscal_year: year,
        type,
        message,
        detail,
        deadline: deadline || null,
      } as any);
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const getUploadedDocs = useCallback((entityId: string, fiscalYearId: string): string[] => {
    const entry = submissions.find(
      (s) => s.entityId === entityId && s.fiscalYearId === fiscalYearId
    );
    return entry?.uploadedDocIds || [];
  }, [submissions]);

  const submit = useCallback(async (entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string, uploadedDocIds?: string[]) => {
    const entry: SubmissionEntry = {
      entityId,
      fiscalYearId,
      status: "pendente",
      submittedAt: new Date().toISOString(),
      uploadedDocIds,
    };

    // Optimistic update
    setSubmissions((prev) => {
      const idx = prev.findIndex(s => s.entityId === entityId && s.fiscalYearId === fiscalYearId);
      if (idx >= 0) { const u = [...prev]; u[idx] = entry; return u; }
      return [...prev, entry];
    });

    // Persist
    await upsertSubmission(entry);

    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(entityId, fiscalYearId, "submissao",
      `Nova prestação de contas submetida — Exercício ${year}`,
      `A entidade ${entityName || entityId} submeteu a prestação de contas do exercício ${year}. Aguarda recepção e conferência documental pela Secretaria.`,
      entityName, entityEmail
    );
  }, [upsertSubmission, sendNotification]);

  const recepcionar = useCallback(async (entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string) => {
    const now = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "recepcionado" as SubmissionStatus, recepcionadoAt: now }
          : s
      )
    );

    const existing = submissions.find(s => s.entityId === entityId && s.fiscalYearId === fiscalYearId);
    await upsertSubmission({ ...existing!, status: "recepcionado", recepcionadoAt: now });

    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(entityId, fiscalYearId, "recepcionado",
      `Prestação de contas do exercício ${year} foi recepcionada`,
      "A Secretaria do Tribunal verificou a documentação e emitiu a Acta de Recepção. O processo transitou para análise técnica.",
      entityName, entityEmail
    );
  }, [submissions, upsertSubmission, sendNotification]);

  const rejeitar = useCallback(async (entityId: string, fiscalYearId: string, motivo: string, entityName?: string, entityEmail?: string) => {
    const now = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "rejeitado" as SubmissionStatus, rejeitadoAt: now, motivoRejeicao: motivo }
          : s
      )
    );

    const existing = submissions.find(s => s.entityId === entityId && s.fiscalYearId === fiscalYearId);
    await upsertSubmission({ ...existing!, status: "rejeitado", rejeitadoAt: now, motivoRejeicao: motivo });

    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(entityId, fiscalYearId, "rejeitado",
      `Prestação de contas do exercício ${year} foi devolvida`,
      motivo, entityName, entityEmail
    );
  }, [submissions, upsertSubmission, sendNotification]);

  const remeterParaTecnico = useCallback(async (entityId: string, fiscalYearId: string, entityName?: string, entityEmail?: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "em_analise" as SubmissionStatus }
          : s
      )
    );

    const existing = submissions.find(s => s.entityId === entityId && s.fiscalYearId === fiscalYearId);
    if (existing) await upsertSubmission({ ...existing, status: "em_analise" });

    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    sendNotification(entityId, fiscalYearId, "em_analise",
      `Processo do exercício ${year} encaminhado para o Chefe de Divisão`,
      "O processo foi autuado e encaminhado para o Chefe de Divisão competente para prosseguimento da tramitação. Poderá acompanhar o estado no portal.",
      entityName, entityEmail
    );
  }, [submissions, upsertSubmission, sendNotification]);

  const solicitarElementos = useCallback((
    entityId: string, fiscalYearId: string, documentos: string[], mensagem: string,
    prazo: number, entityName?: string, entityEmail?: string
  ) => {
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    const docList = documentos.map((d) => `• ${d}`).join("\n");
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + prazo);
    sendNotification(entityId, fiscalYearId, "solicitacao_elementos",
      `Solicitação de elementos adicionais — Exercício ${year}`,
      `${mensagem}\n\nDocumentos solicitados:\n${docList}`,
      entityName, entityEmail, deadlineDate.toISOString()
    );
  }, [sendNotification]);

  const unreadCount = useCallback(
    (entityId: string) => notifications.filter((n) => n.entityId === entityId && !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    await supabase.from("submission_notifications").update({ read: true }).eq("id", notificationId);
  }, []);

  const markAllAsRead = useCallback(async (entityId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.entityId === entityId ? { ...n, read: true } : n))
    );
    await supabase.from("submission_notifications").update({ read: true }).eq("entity_id", entityId);
  }, []);

  return (
    <SubmissionContext.Provider
      value={{
        submissions, notifications, unreadCount, markAsRead, markAllAsRead,
        getStatus, getUploadedDocs, submit, recepcionar, rejeitar,
        solicitarElementos, remeterParaTecnico,
        loadingNotifications, loadingSubmissions,
        refreshNotifications, refreshSubmissions,
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
