import { useParams, useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/ui-custom/PageElements";
import {
  mockFiscalYears,
  mockEntities,
  mockValidations,
  mockAttachments,
  mockAuditLog,
  mockClarifications,
  submissionChecklist,
  formatKz,
} from "@/data/mockData";
import { STATUS_LABELS, VALIDATION_LEVEL_LABELS } from "@/types";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  BarChart3,
  Shield,
  MessageSquare,
  Upload,
  Download,
  Paperclip,
  Send,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PortalExercicioDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entityId } = usePortalEntity();

  const entityExercicios = mockFiscalYears.filter((fy) => fy.entityId === entityId);
  const fy = entityExercicios.find((f) => f.id === id);
  const entity = fy ? mockEntities.find((e) => e.id === fy.entityId) : null;

  if (!fy) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Exercício não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/portal/exercicios")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const daysLeft = Math.ceil((new Date(fy.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0 && !["conforme", "nao_conforme", "submetido", "em_analise", "com_pedidos"].includes(fy.status);
  const clarifications = mockClarifications.filter((c) => c.entityName === fy.entityName || c.entityName.includes(fy.entityName.split(",")[0]));
  const validationsByLevel = {
    completude: mockValidations.filter((v) => v.level === "completude"),
    consistencia: mockValidations.filter((v) => v.level === "consistencia"),
    regras_tribunal: mockValidations.filter((v) => v.level === "regras_tribunal"),
  };

  return (
    <PortalLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-3" onClick={() => navigate("/portal/exercicios")}>
          <ArrowLeft className="h-4 w-4" /> Voltar aos Exercícios
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">Exercício {fy.year}</h1>
              <StatusBadge status={STATUS_LABELS[fy.status].label} variant={STATUS_LABELS[fy.status].color as any} />
            </div>
            <p className="text-sm text-muted-foreground">Período: {fy.startDate} a {fy.endDate}</p>
          </div>
          <div className="text-right text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Prazo: {fy.deadline}
            </div>
            {isOverdue && (
              <span className="text-destructive font-semibold flex items-center gap-1 justify-end mt-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {Math.abs(daysLeft)} dias em atraso
              </span>
            )}
            {fy.submittedAt && (
              <span className="text-success flex items-center gap-1 justify-end mt-1">
                <CheckCircle className="h-3.5 w-3.5" /> Submetido: {fy.submittedAt}
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="geral" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Dados Gerais</TabsTrigger>
          <TabsTrigger value="mapas" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Mapas</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Documentos</TabsTrigger>
          <TabsTrigger value="validacoes" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Validações</TabsTrigger>
          <TabsTrigger value="esclarecimentos" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Esclarecimentos</TabsTrigger>
        </TabsList>

        {/* ── Dados Gerais ── */}
        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Débito</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-bold font-mono">{formatKz(fy.totalDebito)} Kz</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Crédito</CardTitle></CardHeader>
              <CardContent><p className="text-lg font-bold font-mono">{formatKz(fy.totalCredito)} Kz</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Validações</CardTitle></CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  {fy.errorsCount > 0 && <span className="text-destructive">{fy.errorsCount} erros</span>}
                  {fy.errorsCount > 0 && fy.warningsCount > 0 && " / "}
                  {fy.warningsCount > 0 && <span className="text-warning">{fy.warningsCount} avisos</span>}
                  {fy.errorsCount === 0 && fy.warningsCount === 0 && <span className="text-success">✓ OK</span>}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Checklist</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Progress value={fy.checklistProgress} className="flex-1 h-2" />
                  <span className="text-lg font-bold">{fy.checklistProgress}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {entity && (
            <Card>
              <CardHeader><CardTitle className="text-base">Dados da Entidade</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs uppercase mb-1">Nome</p><p className="font-medium">{entity.name}</p></div>
                  <div><p className="text-muted-foreground text-xs uppercase mb-1">NIF</p><p className="font-mono">{entity.nif}</p></div>
                  <div><p className="text-muted-foreground text-xs uppercase mb-1">Tutela</p><p>{entity.tutela}</p></div>
                  <div><p className="text-muted-foreground text-xs uppercase mb-1">Contacto</p><p>{entity.contacto}</p></div>
                  <div><p className="text-muted-foreground text-xs uppercase mb-1">Morada</p><p>{entity.morada}</p></div>
                  <div><p className="text-muted-foreground text-xs uppercase mb-1">Província</p><p>{entity.provincia || "—"}</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {fy.status === "rascunho" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pronto para submeter?</p>
                    <p className="text-xs text-muted-foreground">Complete o checklist documental e corrija todos os erros de validação antes de submeter ao Tribunal.</p>
                  </div>
                  <Button
                    className="gap-2"
                    disabled={fy.checklistProgress < 100 || fy.errorsCount > 0}
                    onClick={() => toast.info("Funcionalidade disponível após activação do backend.")}
                  >
                    <Send className="h-4 w-4" /> Submeter ao Tribunal
                  </Button>
                </div>
                {(fy.checklistProgress < 100 || fy.errorsCount > 0) && (
                  <p className="text-[11px] text-destructive mt-2">
                    {fy.checklistProgress < 100 && "Checklist incompleto. "}
                    {fy.errorsCount > 0 && `${fy.errorsCount} erro(s) por resolver.`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Mapas Preenchidos ── */}
        <TabsContent value="mapas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Modelos de Prestação de Contas (Resolução 1/17)</CardTitle>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/portal/mapas")}>
                  <BarChart3 className="h-3.5 w-3.5" /> Abrir Formulários
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { n: 1, desc: "Caracterização da Entidade", filled: true },
                    { n: 2, desc: "Composição dos Órgãos Sociais / Dirigentes", filled: true },
                    { n: 3, desc: "Mapa de Despesas com o Pessoal", filled: false },
                    { n: 4, desc: "Mapa de Retenções Fiscais", filled: true },
                    { n: 5, desc: "Mapa de Investimentos", filled: false },
                    { n: 6, desc: "Mapa de Financiamentos", filled: true },
                    { n: 7, desc: "Mapa de Subsídios e Subvenções", filled: false },
                    { n: 8, desc: "Mapa de Pessoal (SIGPE)", filled: true },
                    { n: 9, desc: "Mapa de Contas de Ordem", filled: false },
                    { n: 10, desc: "Mapa de Participações Financeiras", filled: true },
                  ].map((m) => (
                    <TableRow key={m.n}>
                      <TableCell className="font-medium">Modelo nº {m.n}</TableCell>
                      <TableCell>{m.desc}</TableCell>
                      <TableCell>
                        {m.filled ? (
                          <span className="flex items-center gap-1 text-success text-xs font-medium"><CheckCircle className="h-3.5 w-3.5" /> Preenchido</span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive text-xs font-medium"><XCircle className="h-3.5 w-3.5" /> Pendente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/portal/mapas")}>
                          {m.filled ? "Editar" : "Preencher"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documentos ── */}
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Checklist Documental</CardTitle>
              <span className="text-xs text-muted-foreground">{submissionChecklist.filter((c) => c.required).length} obrigatórios</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {submissionChecklist.map((item) => {
                  const uploaded = mockAttachments.some((a) => a.category === item.category);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        {uploaded ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        <span className="text-sm">{item.label}</span>
                        {item.required && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Obrigatório</span>}
                      </div>
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => toast.info("Upload disponível após activação do backend.")}>
                        <Upload className="h-3 w-3" /> {uploaded ? "Substituir" : "Carregar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ficheiros Carregados</CardTitle></CardHeader>
            <CardContent>
              {mockAttachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum ficheiro carregado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficheiro</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acção</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAttachments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5 text-muted-foreground" />{a.name}</TableCell>
                        <TableCell className="capitalize text-xs">{a.category}</TableCell>
                        <TableCell className="text-xs">{(a.size / 1024 / 1024).toFixed(1)} MB</TableCell>
                        <TableCell className="text-xs">{a.uploadedAt}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-xs gap-1"><Download className="h-3 w-3" /> Baixar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Validações ── */}
        <TabsContent value="validacoes" className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/40 border border-border mb-2">
            <p className="text-xs text-muted-foreground">
              As validações são executadas automaticamente pelo sistema. Corrija os itens assinalados e recarregue os documentos para actualizar o estado.
            </p>
          </div>
          {(["completude", "consistencia", "regras_tribunal"] as const).map((level) => (
            <Card key={level}>
              <CardHeader>
                <CardTitle className="text-base">{VALIDATION_LEVEL_LABELS[level].label}</CardTitle>
                <p className="text-xs text-muted-foreground">{VALIDATION_LEVEL_LABELS[level].description}</p>
              </CardHeader>
              <CardContent>
                {validationsByLevel[level].length === 0 ? (
                  <p className="text-sm text-success flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Sem problemas neste nível.</p>
                ) : (
                  <div className="space-y-2">
                    {validationsByLevel[level].map((v) => (
                      <div
                        key={v.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          v.resolved ? "bg-muted/20 border-border opacity-60" : v.type === "error" ? "bg-destructive/5 border-destructive/20" : "bg-warning/5 border-warning/20"
                        }`}
                      >
                        {v.type === "error" ? <XCircle className="h-4 w-4 text-destructive mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{v.code}</span>
                            <span className="text-sm font-medium">{v.message}</span>
                            {v.resolved && <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">Resolvido</span>}
                          </div>
                          {v.detail && <p className="text-xs text-muted-foreground mt-1">{v.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Esclarecimentos ── */}
        <TabsContent value="esclarecimentos" className="space-y-4">
          {clarifications.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p>Sem pedidos de esclarecimento para este exercício.</p>
              </CardContent>
            </Card>
          ) : (
            clarifications.map((cr) => {
              const dLeft = Math.ceil((new Date(cr.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Card key={cr.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{cr.subject}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Recebido: {cr.createdAt} · Prazo de resposta: {cr.deadline}</p>
                      </div>
                      <StatusBadge
                        status={cr.status === "pendente" ? "Pendente" : cr.status === "respondido" ? "Respondido" : "Encerrado"}
                        variant={cr.status === "pendente" ? "warning" : cr.status === "respondido" ? "success" : "default"}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground mb-1">Tribunal de Contas</p>
                      <p className="text-sm">{cr.message}</p>
                    </div>
                    {cr.responses?.map((r, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg border-l-2 border-success/40 ml-4">
                        <p className="text-xs text-muted-foreground mb-1">{r.user} · {r.date}</p>
                        <p className="text-sm">{r.message}</p>
                      </div>
                    ))}
                    {dLeft < 0 && cr.status === "pendente" && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Prazo ultrapassado há {Math.abs(dLeft)} dias
                      </p>
                    )}
                    {cr.status === "pendente" && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <Textarea placeholder="Escreva a sua resposta ao Tribunal..." className="min-h-[80px] text-sm" />
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <Paperclip className="h-3 w-3" /> Anexar ficheiro
                          </Button>
                          <Button size="sm" className="text-xs gap-1" onClick={() => toast.success("Resposta enviada (simulação).")}>
                            <Send className="h-3 w-3" /> Enviar Resposta
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
};

export default PortalExercicioDetalhe;
