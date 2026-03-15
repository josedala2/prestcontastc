import { useState, useEffect, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useSubmissions, PortalNotification } from "@/contexts/SubmissionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileQuestion,
  Upload,
  Send,
  CheckCircle,
  Clock,
  FileText,
  X,
  Inbox,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  id: string;
}

interface ResponseState {
  message: string;
  files: UploadedFile[];
  uploading: boolean;
}

const PortalSolicitacoes = () => {
  const { entity } = usePortalEntity();
  const { notifications, markAsRead } = useSubmissions();
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [loadingSubmitted, setLoadingSubmitted] = useState(true);

  // Filter only solicitacao_elementos notifications for this entity
  const solicitacoes = notifications.filter(
    (n) => n.entityId === entity.id && n.type === "solicitacao_elementos"
  );

  // Load already-responded requests from DB
  const loadResponses = useCallback(async () => {
    setLoadingSubmitted(true);
    try {
      const { data } = await supabase
        .from("element_request_responses")
        .select("notification_id, status")
        .eq("entity_id", entity.id);

      if (data) {
        setSubmittedIds(new Set(data.map((r: any) => r.notification_id)));
      }
    } catch (err) {
      console.error("Error loading responses:", err);
    } finally {
      setLoadingSubmitted(false);
    }
  }, [entity.id]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  const getResponse = (notifId: string): ResponseState =>
    responses[notifId] || { message: "", files: [], uploading: false };

  const updateResponse = (notifId: string, update: Partial<ResponseState>) => {
    setResponses((prev) => ({
      ...prev,
      [notifId]: { ...getResponse(notifId), ...update },
    }));
  };

  const addFiles = (notifId: string, fileList: FileList) => {
    const current = getResponse(notifId);
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      file: f,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    updateResponse(notifId, { files: [...current.files, ...newFiles] });
  };

  const removeFile = (notifId: string, fileId: string) => {
    const current = getResponse(notifId);
    updateResponse(notifId, {
      files: current.files.filter((f) => f.id !== fileId),
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmitResponse = async (notif: PortalNotification) => {
    const state = getResponse(notif.id);
    if (state.files.length === 0 && !state.message.trim()) {
      toast.error("Adicione pelo menos um ficheiro ou uma mensagem.");
      return;
    }

    updateResponse(notif.id, { uploading: true });

    try {
      // 1. Create response record
      const { data: responseRecord, error: dbError } = await supabase
        .from("element_request_responses")
        .insert({
          notification_id: notif.id,
          entity_id: entity.id,
          fiscal_year_id: notif.fiscalYearId,
          response_message: state.message || null,
          status: "respondido",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Upload files to storage and register in DB
      for (const uploadedFile of state.files) {
        const filePath = `${entity.id}/${notif.id}/${uploadedFile.id}-${uploadedFile.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("element-requests")
          .upload(filePath, uploadedFile.file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        await supabase.from("element_request_files").insert({
          response_id: (responseRecord as any).id,
          file_name: uploadedFile.file.name,
          file_path: filePath,
          file_size: uploadedFile.file.size,
          content_type: uploadedFile.file.type,
        });
      }

      // 3. Mark notification as read
      markAsRead(notif.id);

      // 4. Update local state
      setSubmittedIds((prev) => new Set([...prev, notif.id]));
      updateResponse(notif.id, { message: "", files: [], uploading: false });

      toast.success("Resposta enviada com sucesso!");
    } catch (err) {
      console.error("Error submitting response:", err);
      toast.error("Erro ao enviar resposta. Tente novamente.");
      updateResponse(notif.id, { uploading: false });
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-AO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const pendingSolicitacoes = solicitacoes.filter((s) => !submittedIds.has(s.id));
  const respondedSolicitacoes = solicitacoes.filter((s) => submittedIds.has(s.id));

  return (
    <PortalLayout>
      <PageHeader
        title="Solicitações de Elementos"
        description="Responda aos pedidos de documentos adicionais do Tribunal de Contas"
      />

      {/* Pending requests */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          Pendentes
          {pendingSolicitacoes.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {pendingSolicitacoes.length}
            </Badge>
          )}
        </h2>

        {loadingSubmitted ? (
          <div className="text-center py-10">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">A carregar...</p>
          </div>
        ) : pendingSolicitacoes.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                Sem solicitações pendentes
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                As solicitações do Tribunal aparecerão aqui quando forem enviadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingSolicitacoes.map((notif) => {
            const state = getResponse(notif.id);
            return (
              <Card key={notif.id} className="border-amber-200 dark:border-amber-800/50">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full p-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <FileQuestion className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{notif.message}</CardTitle>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDate(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 text-[10px] shrink-0"
                    >
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detail / requested documents */}
                  {notif.detail && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Documentos Solicitados
                      </p>
                      <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                        {notif.detail}
                      </div>
                    </div>
                  )}

                  {/* Response message */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Mensagem de resposta (opcional)
                    </label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                      placeholder="Adicione observações ou esclarecimentos..."
                      value={state.message}
                      onChange={(e) =>
                        updateResponse(notif.id, { message: e.target.value })
                      }
                    />
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Ficheiros
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id={`file-upload-${notif.id}`}
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            addFiles(notif.id, e.target.files);
                            e.target.value = "";
                          }
                        }}
                      />
                      <Upload className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground mb-2">
                        PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document
                            .getElementById(`file-upload-${notif.id}`)
                            ?.click()
                        }
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Seleccionar Ficheiros
                      </Button>
                    </div>

                    {/* File list */}
                    {state.files.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {state.files.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-2 p-2 rounded-md bg-muted/40 group"
                          >
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {f.file.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatFileSize(f.file.size)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFile(notif.id, f.id)}
                              className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={() => handleSubmitResponse(notif)}
                      disabled={state.uploading}
                      className="gap-2"
                    >
                      {state.uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {state.uploading ? "A enviar..." : "Enviar Resposta"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Responded requests */}
      {respondedSolicitacoes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Respondidas
            <Badge variant="secondary" className="text-[10px]">
              {respondedSolicitacoes.length}
            </Badge>
          </h2>

          {respondedSolicitacoes.map((notif) => (
            <Card key={notif.id} className="opacity-75">
              <CardHeader className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 rounded-full p-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{notif.message}</CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 text-[10px] shrink-0"
                  >
                    Respondido
                  </Badge>
                </div>
              </CardHeader>
              {notif.detail && (
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground whitespace-pre-line">
                      {notif.detail}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalSolicitacoes;
