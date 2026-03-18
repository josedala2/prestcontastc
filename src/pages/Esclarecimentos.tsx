import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { getEntityShortName } from "@/data/mockData";
import { ClarificationRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Calendar,
  Building2,
  Filter,
  Search,
  ChevronRight,
  User,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pendente: { label: "Pendente", variant: "warning" as const, icon: Clock },
  respondido: { label: "Respondido", variant: "info" as const, icon: CheckCircle },
  encerrado: { label: "Encerrado", variant: "success" as const, icon: CheckCircle },
};

const Esclarecimentos = () => {
  const [requests, setRequests] = useState<ClarificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClarificationRequest | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  // New request form state
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newEntity, setNewEntity] = useState("");
  const [newDeadlineDays, setNewDeadlineDays] = useState("14");

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === "todos" || r.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pendente").length;
  const respondedCount = requests.filter((r) => r.status === "respondido").length;

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

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
              user: "Carlos Mendes (Administrador TCA)",
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
    toast.success("Resposta enviada com sucesso");
  };

  const handleCloseRequest = () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map((r) => {
      if (r.id === selectedRequest.id) {
        const updated: ClarificationRequest = { ...r, status: "encerrado" };
        setSelectedRequest(updated);
        return updated;
      }
      return r;
    });

    setRequests(updatedRequests);
    toast.success("Pedido encerrado");
  };

  const handleCreateRequest = () => {
    if (!newSubject.trim() || !newBody.trim() || !newEntity) return;

    // Create a clarification request (placeholder - no FY lookup needed)
    const fy = { entityName: newEntity, year: 2024 } as any;
    if (!fy) return;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + parseInt(newDeadlineDays));

    const newReq: ClarificationRequest = {
      id: `cr${Date.now()}`,
      exercicioId: fy.id,
      entityId: fy.entityId,
      entityName: fy.entityName,
      subject: newSubject.trim(),
      message: newBody.trim(),
      status: "pendente",
      createdAt: new Date().toISOString().split("T")[0],
      deadline: deadline.toISOString().split("T")[0],
    };

    setRequests([newReq, ...requests]);
    setNewSubject("");
    setNewBody("");
    setNewEntity("");
    setNewDeadlineDays("14");
    setNewRequestOpen(false);
    toast.success("Pedido de esclarecimento criado");
  };

  return (
    <AppLayout>
      <PageHeader
        title="Pedidos de Esclarecimento"
        description="Comunicação entre o Tribunal de Contas e as entidades fiscalizadas"
      />

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">{pendingCount} pendente(s)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{respondedCount} respondido(s)</span>
        </div>
        <div className="ml-auto">
          <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Pedido de Esclarecimento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Entidade / Exercício</label>
                  <Select value={newEntity} onValueChange={setNewEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar exercício..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockFiscalYears
                        .filter((fy) => ["submetido", "em_analise", "com_pedidos"].includes(fy.status))
                        .map((fy) => (
                          <SelectItem key={fy.id} value={fy.id}>
                            {fy.entityName} — {fy.year}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Assunto</label>
                  <Input
                    placeholder="Ex.: Justificação de variação em custos com pessoal"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem</label>
                  <Textarea
                    placeholder="Descreva o pedido de esclarecimento..."
                    rows={4}
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Prazo de resposta</label>
                  <Select value={newDeadlineDays} onValueChange={setNewDeadlineDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                      <SelectItem value="21">21 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateRequest} className="w-full" disabled={!newSubject || !newBody || !newEntity}>
                  <Send className="h-4 w-4" /> Enviar Pedido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
        {/* Left panel: list */}
        <div className="lg:col-span-1 bg-card rounded-lg border border-border card-shadow flex flex-col">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="pl-8 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              {["todos", "pendente", "respondido", "encerrado"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-medium transition-colors",
                    filterStatus === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {s === "todos" ? "Todos" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum pedido encontrado</p>
              ) : (
                filteredRequests.map((req) => {
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
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{req.subject}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{req.entityName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={STATUS_CONFIG[req.status].label}
                          variant={STATUS_CONFIG[req.status].variant}
                        />
                        {isOverdue && (
                          <span className="text-[10px] text-destructive font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" /> {Math.abs(daysLeft)}d atraso
                          </span>
                        )}
                        {!isOverdue && req.status === "pendente" && (
                          <span className="text-[10px] text-muted-foreground">{daysLeft}d restantes</span>
                        )}
                        {req.responses && req.responses.length > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {req.responses.length} msg
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right panel: thread */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border card-shadow flex flex-col">
          {!selectedRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Seleccione um pedido para ver a conversa</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground mb-2"
                      onClick={() => setSelectedRequest(null)}
                    >
                      <ArrowLeft className="h-3 w-3" /> Voltar
                    </button>
                    <h3 className="text-base font-semibold text-foreground">{selectedRequest.subject}</h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {selectedRequest.entityName}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {selectedRequest.createdAt}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Prazo: {selectedRequest.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge
                      status={STATUS_CONFIG[selectedRequest.status].label}
                      variant={STATUS_CONFIG[selectedRequest.status].variant}
                    />
                    {selectedRequest.status !== "encerrado" && (
                      <Button variant="outline" size="sm" onClick={handleCloseRequest}>
                        Encerrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Original message */}
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
                    const isTCA = resp.user.toLowerCase().includes("tca") || resp.user.toLowerCase().includes("tribunal");
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
                              isTCA
                                ? "bg-primary/5 border-primary/10"
                                : "bg-muted/30 border-border"
                            )}
                          >
                            <p className="text-sm text-foreground whitespace-pre-wrap">{resp.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Deadline warning */}
                  {selectedRequest.status === "pendente" && (
                    <div className="flex justify-center">
                      {(() => {
                        const daysLeft = getDaysRemaining(selectedRequest.deadline);
                        if (daysLeft < 0) {
                          return (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Prazo ultrapassado há {Math.abs(daysLeft)} dia(s)
                            </Badge>
                          );
                        }
                        if (daysLeft <= 3) {
                          return (
                            <Badge variant="outline" className="text-xs text-warning border-warning/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Prazo expira em {daysLeft} dia(s)
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Reply box */}
              {selectedRequest.status !== "encerrado" && (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escrever resposta..."
                      rows={2}
                      className="resize-none text-sm"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          handleSendReply();
                        }
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
    </AppLayout>
  );
};

export default Esclarecimentos;
