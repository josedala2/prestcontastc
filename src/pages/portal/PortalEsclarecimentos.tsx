import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockClarifications } from "@/data/mockData";
import { ClarificationRequest } from "@/types";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import {
  MessageSquare,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Calendar,
  User,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pendente: { label: "Pendente", variant: "warning" as const },
  respondido: { label: "Respondido", variant: "info" as const },
  encerrado: { label: "Encerrado", variant: "success" as const },
};

const PortalEsclarecimentos = () => {
  const { entity } = usePortalEntity();
  
  // Filter clarifications for current entity
  const entityClarifications = mockClarifications.filter((cr) => {
    const entityShort = entity.name.split(" - ")[1]?.split(",")[0] || entity.name.split(" ")[0];
    return cr.entityName.includes(entityShort);
  });

  const [requests, setRequests] = useState<ClarificationRequest[]>(entityClarifications);
  const [selectedRequest, setSelectedRequest] = useState<ClarificationRequest | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const pendingCount = requests.filter((r) => r.status === "pendente").length;

  const getDaysRemaining = (deadline: string) =>
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleSendReply = () => {
    if (!newMessage.trim() || !selectedRequest) return;

    const updatedRequests = requests.map((r) => {
      if (r.id === selectedRequest.id) {
        const updated: ClarificationRequest = {
          ...r,
          status: "respondido",
          responses: [
            ...(r.responses || []),
            {
              user: `Contabilista ${entity.name.split(" - ")[1]?.split(",")[0] || entity.name.split(" ")[0]}`,
              message: newMessage.trim(),
              date: new Date().toISOString().split("T")[0],
            },
          ],
        };
        setSelectedRequest(updated);
        return updated;
      }
      return r;
    });

    setRequests(updatedRequests);
    setNewMessage("");
    toast.success("Resposta enviada ao Tribunal de Contas");
  };

  return (
    <PortalLayout>
      <PageHeader
        title="Pedidos de Esclarecimento"
        description="Responda aos pedidos do Tribunal de Contas"
      />

      {pendingCount > 0 && (
        <div className="mb-6 p-4 rounded-lg border bg-warning/10 border-warning/30 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium text-foreground">
            Tem {pendingCount} pedido(s) de esclarecimento pendente(s) de resposta.
          </p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-card rounded-lg border border-border card-shadow p-12 text-center animate-fade-in">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Sem pedidos de esclarecimento para esta entidade.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
          {/* List */}
          <div className="lg:col-span-1 bg-card rounded-lg border border-border card-shadow flex flex-col">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {requests.length} pedido(s)
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {requests.map((req) => {
                  const daysLeft = getDaysRemaining(req.deadline);
                  const isOverdue = daysLeft < 0 && req.status === "pendente";
                  const isSelected = selectedRequest?.id === req.id;

                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <p className="text-sm font-medium text-foreground line-clamp-2 mb-1.5">{req.subject}</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={STATUS_CONFIG[req.status].label}
                          variant={STATUS_CONFIG[req.status].variant}
                        />
                        {isOverdue && (
                          <span className="text-[10px] text-destructive font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" /> {Math.abs(daysLeft)}d
                          </span>
                        )}
                        {!isOverdue && req.status === "pendente" && (
                          <span className="text-[10px] text-muted-foreground">{daysLeft}d</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Thread */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border card-shadow flex flex-col">
            {!selectedRequest ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Seleccione um pedido para responder</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-border">
                  <button
                    className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground mb-2"
                    onClick={() => setSelectedRequest(null)}
                  >
                    <ArrowLeft className="h-3 w-3" /> Voltar
                  </button>
                  <h3 className="text-base font-semibold text-foreground">{selectedRequest.subject}</h3>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {selectedRequest.createdAt}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Prazo: {selectedRequest.deadline}
                    </span>
                    <StatusBadge
                      status={STATUS_CONFIG[selectedRequest.status].label}
                      variant={STATUS_CONFIG[selectedRequest.status].variant}
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Original message from TCA */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">Tribunal de Contas</span>
                          <span className="text-[10px] text-muted-foreground">{selectedRequest.createdAt}</span>
                        </div>
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRequest.message}</p>
                        </div>
                      </div>
                    </div>

                    {/* Responses */}
                    {selectedRequest.responses?.map((resp, idx) => {
                      const isTCA =
                        resp.user.toLowerCase().includes("tca") ||
                        resp.user.toLowerCase().includes("tribunal");
                      return (
                        <div key={idx} className="flex gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              isTCA ? "bg-primary/20" : "bg-secondary"
                            )}
                          >
                            <User className={cn("h-4 w-4", isTCA ? "text-primary" : "text-secondary-foreground")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground">{resp.user}</span>
                              <span className="text-[10px] text-muted-foreground">{resp.date}</span>
                            </div>
                            <div
                              className={cn(
                                "rounded-lg p-3 border",
                                isTCA ? "bg-primary/5 border-primary/10" : "bg-muted/30 border-border"
                              )}
                            >
                              <p className="text-sm text-foreground whitespace-pre-wrap">{resp.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Deadline warning */}
                    {selectedRequest.status === "pendente" && (() => {
                      const daysLeft = getDaysRemaining(selectedRequest.deadline);
                      if (daysLeft < 0) {
                        return (
                          <div className="flex justify-center">
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Prazo ultrapassado — responda urgentemente
                            </Badge>
                          </div>
                        );
                      }
                      if (daysLeft <= 3) {
                        return (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="text-xs text-warning border-warning/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Prazo expira em {daysLeft} dia(s)
                            </Badge>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </ScrollArea>

                {/* Reply */}
                {selectedRequest.status !== "encerrado" && (
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Escrever resposta ao Tribunal..."
                        rows={2}
                        className="resize-none text-sm"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply();
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button size="sm" onClick={handleSendReply} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Anexar ficheiro">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Ctrl+Enter para enviar</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default PortalEsclarecimentos;
