import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type SubmissionStatus = "rascunho" | "pendente" | "recepcionado" | "rejeitado";

interface SubmissionEntry {
  entityId: string;
  fiscalYearId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  recepcionadoAt?: string;
  rejeitadoAt?: string;
  motivoRejeicao?: string;
}

export interface PortalNotification {
  id: string;
  entityId: string;
  fiscalYearId: string;
  type: "recepcionado" | "rejeitado";
  message: string;
  detail?: string;
  createdAt: string;
  read: boolean;
}

interface SubmissionContextType {
  submissions: SubmissionEntry[];
  notifications: PortalNotification[];
  unreadCount: (entityId: string) => number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (entityId: string) => void;
  getStatus: (entityId: string, fiscalYearId?: string) => SubmissionStatus;
  submit: (entityId: string, fiscalYearId: string) => void;
  recepcionar: (entityId: string, fiscalYearId: string) => void;
  rejeitar: (entityId: string, fiscalYearId: string, motivo: string) => void;
}

const SubmissionContext = createContext<SubmissionContextType | null>(null);

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);

  const getStatus = useCallback(
    (entityId: string, fiscalYearId?: string): SubmissionStatus => {
      const entry = submissions.find(
        (s) => s.entityId === entityId && (!fiscalYearId || s.fiscalYearId === fiscalYearId)
      );
      return entry?.status ?? "rascunho";
    },
    [submissions]
  );

  const submit = useCallback((entityId: string, fiscalYearId: string) => {
    setSubmissions((prev) => {
      const existing = prev.findIndex(
        (s) => s.entityId === entityId && s.fiscalYearId === fiscalYearId
      );
      const entry: SubmissionEntry = {
        entityId,
        fiscalYearId,
        status: "pendente",
        submittedAt: new Date().toISOString(),
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  }, []);

  const addNotification = useCallback((
    entityId: string,
    fiscalYearId: string,
    type: "recepcionado" | "rejeitado",
    message: string,
    detail?: string
  ) => {
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
  }, []);

  const recepcionar = useCallback((entityId: string, fiscalYearId: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "recepcionado" as SubmissionStatus, recepcionadoAt: new Date().toISOString() }
          : s
      )
    );
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    addNotification(
      entityId,
      fiscalYearId,
      "recepcionado",
      `Prestação de contas do exercício ${year} foi recepcionada`,
      "A Secretaria do Tribunal verificou a documentação e emitiu a Acta de Recepção. O processo transitou para análise técnica."
    );
  }, [addNotification]);

  const rejeitar = useCallback((entityId: string, fiscalYearId: string, motivo: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "rejeitado" as SubmissionStatus, rejeitadoAt: new Date().toISOString(), motivoRejeicao: motivo }
          : s
      )
    );
    const year = fiscalYearId.split("-").pop() || fiscalYearId;
    addNotification(
      entityId,
      fiscalYearId,
      "rejeitado",
      `Prestação de contas do exercício ${year} foi devolvida`,
      motivo
    );
  }, [addNotification]);

  const unreadCount = useCallback(
    (entityId: string) => notifications.filter((n) => n.entityId === entityId && !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback((entityId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.entityId === entityId ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <SubmissionContext.Provider
      value={{ submissions, notifications, unreadCount, markAsRead, markAllAsRead, getStatus, submit, recepcionar, rejeitar }}
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
