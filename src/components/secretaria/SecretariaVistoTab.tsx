import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Stamp, Clock, CheckCircle, XCircle, Eye, Building2, FileText,
  AlertTriangle, Send, ShieldCheck, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface SolicitacaoVisto {
  id: string;
  entidade: string;
  orgao: string;
  tipo: "sucessivo" | "previo";
  natureza: string;
  objecto: string;
  valor: string;
  dataSubmissao: string;
  estado: "pendente" | "em_analise" | "aprovado" | "recusado";
  fonte: string;
  entidadeContratada: string;
  nif: string;
  documentos: string[];
  observacoes?: string;
}

const mockVistos: SolicitacaoVisto[] = [
  {
    id: "SV-2025-001",
    entidade: "INE - Instituto Nacional de Estatística",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto Normal (30 dias)",
    objecto: "Serviços de consultoria em auditoria interna",
    valor: "18.500.000,00 Kz",
    dataSubmissao: "2025-01-10",
    estado: "pendente",
    fonte: "Orçamento Geral do Estado (OGE)",
    entidadeContratada: "Deloitte Angola, Lda.",
    nif: "123456789",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
  },
  {
    id: "SV-2024-002",
    entidade: "MAPESS - Ministério da Administração Pública",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto Simplificado de Urgência (10 dias)",
    objecto: "Empreitada de reabilitação das instalações sede",
    valor: "120.000.000,00 Kz",
    dataSubmissao: "2024-12-01",
    estado: "em_analise",
    fonte: "Orçamento Geral do Estado (OGE)",
    entidadeContratada: "Construções Modernas, S.A.",
    nif: "987654321",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental", "Programa de Concurso / Caderno de Encargos"],
  },
  {
    id: "SV-2024-001",
    entidade: "INE - Instituto Nacional de Estatística",
    orgao: "C. Governo (Executivo Central)",
    tipo: "sucessivo",
    natureza: "Visto Normal (30 dias)",
    objecto: "Contrato de fornecimento de material informático para o exercício 2024",
    valor: "45.000.000,00 Kz",
    dataSubmissao: "2024-11-15",
    estado: "aprovado",
    fonte: "Fundos Autónomos",
    entidadeContratada: "TechSolutions Angola, Lda.",
    nif: "111222333",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
    observacoes: "Visto concedido em 20/11/2024",
  },
  {
    id: "SV-2024-003",
    entidade: "MAPESS - Ministério da Administração Pública",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto de Carácter Urgente (5 dias)",
    objecto: "Aquisição de viaturas de serviço",
    valor: "85.000.000,00 Kz",
    dataSubmissao: "2024-09-20",
    estado: "recusado",
    fonte: "Orçamento Geral do Estado (OGE)",
    entidadeContratada: "AutoAngola, S.A.",
    nif: "444555666",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato"],
    observacoes: "Documentação incompleta. Falta cabimento orçamental e caderno de encargos.",
  },
];

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
  aprovado: { label: "Visto Concedido", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  recusado: { label: "Recusado", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

export function SecretariaVistoTab() {
  const [vistos] = useState<SolicitacaoVisto[]>(mockVistos);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pesquisa, setPesquisa] = useState("");
  const [selectedVisto, setSelectedVisto] = useState<SolicitacaoVisto | null>(null);
  const [actionDialog, setActionDialog] = useState<{ visto: SolicitacaoVisto; action: "aprovar" | "recusar" } | null>(null);
  const [observacoesDecisao, setObservacoesDecisao] = useState("");

  const filtered = vistos.filter((v) => {
    const matchEstado = filtroEstado === "todos" || v.estado === filtroEstado;
    const matchPesquisa = !pesquisa || v.id.toLowerCase().includes(pesquisa.toLowerCase()) ||
      v.entidade.toLowerCase().includes(pesquisa.toLowerCase()) ||
      v.objecto.toLowerCase().includes(pesquisa.toLowerCase());
    return matchEstado && matchPesquisa;
  });

  const resumo = {
    total: vistos.length,
    pendentes: vistos.filter((v) => v.estado === "pendente").length,
    emAnalise: vistos.filter((v) => v.estado === "em_analise").length,
    aprovados: vistos.filter((v) => v.estado === "aprovado").length,
    recusados: vistos.filter((v) => v.estado === "recusado").length,
  };

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.action === "recusar" && !observacoesDecisao.trim()) {
      toast.error("Indique o motivo da recusa");
      return;
    }
    const label = actionDialog.action === "aprovar" ? "Visto concedido" : "Visto recusado";
    toast.success(`${label} — ${actionDialog.visto.id}`);
    setActionDialog(null);
    setObservacoesDecisao("");
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: resumo.total, icon: Stamp, color: "text-foreground" },
          { label: "Pendentes", value: resumo.pendentes, icon: Clock, color: "text-amber-600" },
          { label: "Em Análise", value: resumo.emAnalise, icon: Eye, color: "text-blue-600" },
          { label: "Aprovados", value: resumo.aprovados, icon: CheckCircle, color: "text-green-600" },
          { label: "Recusados", value: resumo.recusados, icon: XCircle, color: "text-destructive" },
        ].map((item) => (
          <Card key={item.label} className="border">
            <CardContent className="p-3 flex items-center gap-2">
              <item.icon className={cn("h-4 w-4 shrink-0", item.color)} />
              <div>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nº, entidade ou objecto..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
            <SelectItem value="recusado">Recusados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Processos de Visto ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="hidden md:table-cell">Objecto</TableHead>
                <TableHead className="hidden lg:table-cell">Valor</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum processo de visto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => {
                  const config = estadoConfig[v.estado];
                  return (
                    <TableRow key={v.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedVisto(v)}>
                      <TableCell className="font-mono text-xs font-semibold">{v.id}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium line-clamp-1">{v.entidade}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(v.dataSubmissao).toLocaleDateString("pt-AO")}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{v.objecto}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm font-medium">{v.valor}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-[10px]">
                          {v.tipo === "previo" ? "Prévio" : "Sucessivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]", config.color)} variant="secondary">
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setSelectedVisto(v); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {(v.estado === "pendente" || v.estado === "em_analise") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                                onClick={(e) => { e.stopPropagation(); setActionDialog({ visto: v, action: "aprovar" }); }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
                                onClick={(e) => { e.stopPropagation(); setActionDialog({ visto: v, action: "recusar" }); }}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Detalhe */}
      <Dialog open={!!selectedVisto} onOpenChange={() => setSelectedVisto(null)}>
        <DialogContent className="max-w-lg w-[95vw]">
          {selectedVisto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-primary" />
                  {selectedVisto.id}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Entidade Requerente</p>
                    <p className="text-sm font-medium">{selectedVisto.entidade}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Estado</p>
                    <Badge className={cn("text-[11px]", estadoConfig[selectedVisto.estado].color)} variant="secondary">
                      {estadoConfig[selectedVisto.estado].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Tipo de Visto</p>
                    <p className="text-sm">{selectedVisto.tipo === "previo" ? "Visto Prévio" : "Visto Sucessivo"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Natureza</p>
                    <p className="text-sm">{selectedVisto.natureza}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Órgão de Soberania</p>
                    <p className="text-sm">{selectedVisto.orgao}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Data de Submissão</p>
                    <p className="text-sm">{new Date(selectedVisto.dataSubmissao).toLocaleDateString("pt-AO")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Entidade Contratada</p>
                    <p className="text-sm">{selectedVisto.entidadeContratada}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">NIF</p>
                    <p className="text-sm font-mono">{selectedVisto.nif}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Valor</p>
                    <p className="text-sm font-semibold">{selectedVisto.valor}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Fonte de Financiamento</p>
                    <p className="text-sm">{selectedVisto.fonte}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Objecto do Contrato</p>
                  <p className="text-sm">{selectedVisto.objecto}</p>
                </div>

                {selectedVisto.observacoes && (
                  <div className={cn(
                    "rounded-md p-3 text-sm",
                    selectedVisto.estado === "recusado" ? "bg-destructive/5 border border-destructive/20" : "bg-green-50 border border-green-200 dark:bg-green-900/10 dark:border-green-800"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {selectedVisto.estado === "recusado" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <span className="text-xs font-semibold">
                        {selectedVisto.estado === "recusado" ? "Motivo da Recusa" : "Observações"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedVisto.observacoes}</p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Documentos Anexados</p>
                  <div className="space-y-1">
                    {selectedVisto.documentos.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(selectedVisto.estado === "pendente" || selectedVisto.estado === "em_analise") && (
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="destructive"
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => { setSelectedVisto(null); setActionDialog({ visto: selectedVisto, action: "recusar" }); }}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Recusar Visto
                  </Button>
                  <Button
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => { setSelectedVisto(null); setActionDialog({ visto: selectedVisto, action: "aprovar" }); }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Conceder Visto
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Acção (Aprovar/Recusar) */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setObservacoesDecisao(""); }}>
        <DialogContent className="max-w-md">
          {actionDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {actionDialog.action === "aprovar" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  {actionDialog.action === "aprovar" ? "Conceder Visto" : "Recusar Visto"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processo</span>
                    <span className="font-semibold font-mono">{actionDialog.visto.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entidade</span>
                    <span className="font-medium text-right max-w-[200px] truncate">{actionDialog.visto.entidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium">{actionDialog.visto.valor}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Observações {actionDialog.action === "recusar" && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    placeholder={actionDialog.action === "aprovar" ? "Observações adicionais (opcional)..." : "Indique o motivo da recusa..."}
                    value={observacoesDecisao}
                    onChange={(e) => setObservacoesDecisao(e.target.value)}
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{observacoesDecisao.length}/500</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setActionDialog(null); setObservacoesDecisao(""); }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAction}
                  className={cn("gap-2", actionDialog.action === "recusar" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                >
                  {actionDialog.action === "aprovar" ? (
                    <><CheckCircle className="h-3.5 w-3.5" /> Confirmar Visto</>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5" /> Confirmar Recusa</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
