import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type SubmissionStatus = "rascunho" | "pendente" | "recepcionado";

interface SubmissionEntry {
  entityId: string;
  fiscalYearId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  recepcionadoAt?: string;
}

interface SubmissionContextType {
  submissions: SubmissionEntry[];
  getStatus: (entityId: string, fiscalYearId?: string) => SubmissionStatus;
  submit: (entityId: string, fiscalYearId: string) => void;
  recepcionar: (entityId: string, fiscalYearId: string) => void;
}

const SubmissionContext = createContext<SubmissionContextType | null>(null);

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);

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

  const recepcionar = useCallback((entityId: string, fiscalYearId: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.entityId === entityId && s.fiscalYearId === fiscalYearId
          ? { ...s, status: "recepcionado" as SubmissionStatus, recepcionadoAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  return (
    <SubmissionContext.Provider value={{ submissions, getStatus, submit, recepcionar }}>
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) throw new Error("useSubmissions must be used within SubmissionProvider");
  return ctx;
}
