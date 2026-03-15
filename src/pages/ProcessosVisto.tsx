import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Stamp, Clock, CheckCircle, XCircle, Eye, Building2, FileText,
  AlertTriangle, ShieldCheck, Search, TrendingUp, BarChart3,
  CalendarCheck, Filter, ArrowUpDown, Banknote, Briefcase,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──
interface SolicitacaoVisto {
  id: string;
  entidade: string;
  orgao: string;
  tipo: "sucessivo" | "previo";
  natureza: string;
  objecto: string;
  valor: string;
  valorNum: number;
  dataSubmissao: string;
  estado: "pendente" | "em_analise" | "aprovado" | "recusado";
  fonte: string;
  entidadeContratada: string;
  nif: string;
  documentos: string[];
  observacoes?: string;
  dataDecisao?: string;
}

// ── Mock data (simula submissões do Portal da Entidade) ──
const mockVistos: SolicitacaoVisto[] = [
  {
    id: "SV-2025-001",
    entidade: "INE - Instituto Nacional de Estatística",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto Normal (30 dias)",
    objecto: "Serviços de consultoria em auditoria interna",
    valor: "18.500.000,00 Kz",
    valorNum: 18500000,
    dataSubmissao: "2025-01-10",
    estado: "pendente",
    fonte: "Orçamento Geral do Estado (OGE)",
    entidadeContratada: "Deloitte Angola, Lda.",
    nif: "123456789",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
  },
  {
    id: "SV-2025-002",
    entidade: "MAPESS - Ministério da Administração Pública",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto Simplificado de Urgência (10 dias)",
    objecto: "Empreitada de reabilitação das instalações sede",
    valor: "120.000.000,00 Kz",
    valorNum: 120000000,
    dataSubmissao: "2025-01-05",
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
    valorNum: 45000000,
    dataSubmissao: "2024-11-15",
    estado: "aprovado",
    fonte: "Fundos Autónomos",
    entidadeContratada: "TechSolutions Angola, Lda.",
    nif: "111222333",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
    observacoes: "Visto concedido. Processo regular e documentação completa.",
    dataDecisao: "2024-11-20",
  },
  {
    id: "SV-2024-002",
    entidade: "MAPESS - Ministério da Administração Pública",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto de Carácter Urgente (5 dias)",
    objecto: "Aquisição de viaturas de serviço",
    valor: "85.000.000,00 Kz",
    valorNum: 85000000,
    dataSubmissao: "2024-09-20",
    estado: "recusado",
    fonte: "Orçamento Geral do Estado (OGE)",
    entidadeContratada: "AutoAngola, S.A.",
    nif: "444555666",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato"],
    observacoes: "Documentação incompleta. Falta cabimento orçamental e caderno de encargos.",
    dataDecisao: "2024-09-25",
  },
  {
    id: "SV-2025-003",
    entidade: "Hospital Américo Boavida",
    orgao: "C. Governo (Executivo Central)",
    tipo: "previo",
    natureza: "Visto Normal (30 dias)",
    objecto: "Fornecimento de equipamento médico-cirúrgico para bloco operatório",
    valor: "250.000.000,00 Kz",
    valorNum: 250000000,
    dataSubmissao: "2025-02-01",
    estado: "pendente",
    fonte: "Cooperação Internacional",
    entidadeContratada: "MedEquip International, Lda.",
    nif: "777888999",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental", "Documentos de Habilitação da Empresa"],
  },
  {
    id: "SV-2025-004",
    entidade: "Universidade Agostinho Neto",
    orgao: "C. Governo (Executivo Central)",
    tipo: "sucessivo",
    natureza: "Visto Simplificado de Urgência (10 dias)",
    objecto: "Prestação de serviços de manutenção de sistemas informáticos",
    valor: "32.000.000,00 Kz",
    valorNum: 32000000,
    dataSubmissao: "2025-02-10",
    estado: "em_analise",
    fonte: "Receitas Próprias",
    entidadeContratada: "IT Services Angola, S.A.",
    nif: "555666777",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
  },
];

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
  aprovado: { label: "Visto Concedido", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  recusado: { label: "Recusado", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-AO", { minimumFractionDigits: 2 }).format(value) + " Kz";

export default function ProcessosVisto() {
  const [vistos, setVistos] = useState<SolicitacaoVisto[]>(mockVistos);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");
  const [selectedVisto, setSelectedVisto] = useState<SolicitacaoVisto | null>(null);
  const [actionDialog, setActionDialog] = useState<{ visto: SolicitacaoVisto; action: "aprovar" | "recusar" } | null>(null);
  const [observacoesDecisao, setObservacoesDecisao] = useState("");

  const filtered = vistos.filter((v) => {
    const matchEstado = filtroEstado === "todos" || v.estado === filtroEstado;
    const matchTipo = filtroTipo === "todos" || v.tipo === filtroTipo;
    const matchPesquisa =
      !pesquisa ||
      v.id.toLowerCase().includes(pesquisa.toLowerCase()) ||
      v.entidade.toLowerCase().includes(pesquisa.toLowerCase()) ||
      v.objecto.toLowerCase().includes(pesquisa.toLowerCase()) ||
      v.entidadeContratada.toLowerCase().includes(pesquisa.toLowerCase());
    return matchEstado && matchTipo && matchPesquisa;
  });

  // ── Estatísticas ──
  const resumo = {
    total: vistos.length,
    pendentes: vistos.filter((v) => v.estado === "pendente").length,
    emAnalise: vistos.filter((v) => v.estado === "em_analise").length,
    aprovados: vistos.filter((v) => v.estado === "aprovado").length,
    recusados: vistos.filter((v) => v.estado === "recusado").length,
  };

  const valorTotal = vistos.reduce((acc, v) => acc + v.valorNum, 0);
  const valorPendente = vistos
    .filter((v) => v.estado === "pendente" || v.estado === "em_analise")
    .reduce((acc, v) => acc + v.valorNum, 0);
  const entidadesUnicas = new Set(vistos.map((v) => v.entidade)).size;

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.action === "recusar" && !observacoesDecisao.trim()) {
      toast.error("Indique o motivo da recusa");
      return;
    }

    setVistos((prev) =>
      prev.map((v) =>
        v.id === actionDialog.visto.id
          ? {
              ...v,
              estado: actionDialog.action === "aprovar" ? "aprovado" as const : "recusado" as const,
              observacoes: observacoesDecisao || (actionDialog.action === "aprovar" ? "Visto concedido." : undefined),
              dataDecisao: new Date().toISOString().split("T")[0],
            }
          : v
      )
    );

    const label = actionDialog.action === "aprovar" ? "Visto concedido" : "Visto recusado";
    toast.success(`${label} — ${actionDialog.visto.id}`);
    setActionDialog(null);
    setObservacoesDecisao("");
  };

  return (
    <AppLayout>
      <PageHeader
        title="Processos de Visto"
        description="Dashboard de gestão das solicitações de visto submetidas pelas entidades"
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Processos Pendentes"
          value={resumo.pendentes}
          subtitle="aguardam análise"
          icon={<Clock className="h-5 w-5" />}
          variant={resumo.pendentes > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Em Análise"
          value={resumo.emAnalise}
          subtitle="em fase de instrução"
          icon={<Eye className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Vistos Concedidos"
          value={resumo.aprovados}
          subtitle={`de ${resumo.total} total`}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Recusados"
          value={resumo.recusados}
          subtitle="documentação incompleta"
          icon={<XCircle className="h-5 w-5" />}
          variant={resumo.recusados > 0 ? "warning" : "default"}
        />
      </div>

      {/* ── Cards financeiros ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Valor Total dos Contratos</p>
              <p className="text-lg font-bold">{formatCurrency(valorTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2.5">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Valor Pendente de Decisão</p>
              <p className="text-lg font-bold">{formatCurrency(valorPendente)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-2.5">
              <Building2 className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Entidades Requerentes</p>
              <p className="text-lg font-bold">{entidadesUnicas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nº, entidade, objecto ou contratada..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-44">
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
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="previo">Visto Prévio</SelectItem>
            <SelectItem value="sucessivo">Visto Sucessivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Tabela de Processos ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Solicitações de Visto ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Entidade Requerente</TableHead>
                <TableHead className="hidden md:table-cell">Objecto</TableHead>
                <TableHead className="hidden lg:table-cell">Contratada</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Valor</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Stamp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum processo de visto encontrado.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => {
                  const config = estadoConfig[v.estado];
                  return (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedVisto(v)}
                    >
                      <TableCell className="font-mono text-xs font-semibold">{v.id}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium line-clamp-1">{v.entidade}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(v.dataSubmissao).toLocaleDateString("pt-AO")}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{v.objecto}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-xs line-clamp-1">{v.entidadeContratada}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">NIF: {v.nif}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-sm font-medium">
                        {v.valor}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => { e.stopPropagation(); setSelectedVisto(v); }}
                          >
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

      {/* ── Dialog Detalhe ── */}
      <Dialog open={!!selectedVisto} onOpenChange={() => setSelectedVisto(null)}>
        <DialogContent className="max-w-2xl w-[95vw]">
          {selectedVisto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-primary" />
                  Processo {selectedVisto.id}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
                {/* Status banner */}
                <div className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2.5",
                  estadoConfig[selectedVisto.estado].color
                )}>
                  {(() => { const Icon = estadoConfig[selectedVisto.estado].icon; return <Icon className="h-4 w-4" />; })()}
                  <span className="text-sm font-semibold">{estadoConfig[selectedVisto.estado].label}</span>
                  {selectedVisto.dataDecisao && (
                    <span className="text-xs ml-auto opacity-75">
                      Decisão em {new Date(selectedVisto.dataDecisao).toLocaleDateString("pt-AO")}
                    </span>
                  )}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Entidade Requerente</p>
                    <p className="text-sm font-medium">{selectedVisto.entidade}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Órgão de Soberania</p>
                    <p className="text-sm">{selectedVisto.orgao}</p>
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
                    <p className="text-[11px] text-muted-foreground mb-0.5">Entidade Contratada</p>
                    <p className="text-sm">{selectedVisto.entidadeContratada}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">NIF da Contratada</p>
                    <p className="text-sm font-mono">{selectedVisto.nif}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Valor do Contrato</p>
                    <p className="text-sm font-bold">{selectedVisto.valor}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Fonte de Financiamento</p>
                    <p className="text-sm">{selectedVisto.fonte}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-muted-foreground mb-0.5">Data de Submissão</p>
                    <p className="text-sm">{new Date(selectedVisto.dataSubmissao).toLocaleDateString("pt-AO")}</p>
                  </div>
                </div>

                {/* Objecto */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Objecto do Contrato</p>
                  <p className="text-sm bg-muted/30 rounded-md p-3">{selectedVisto.objecto}</p>
                </div>

                {/* Observações / Decisão */}
                {selectedVisto.observacoes && (
                  <div className={cn(
                    "rounded-md p-3 text-sm border",
                    selectedVisto.estado === "recusado"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {selectedVisto.estado === "recusado" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <span className="text-xs font-semibold">
                        {selectedVisto.estado === "recusado" ? "Motivo da Recusa" : "Observações da Decisão"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedVisto.observacoes}</p>
                  </div>
                )}

                {/* Documentos */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Documentos Anexados ({selectedVisto.documentos.length})</p>
                  <div className="space-y-1">
                    {selectedVisto.documentos.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1">{doc}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                          <Eye className="h-3 w-3 mr-1" /> Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acções no detalhe */}
              {(selectedVisto.estado === "pendente" || selectedVisto.estado === "em_analise") && (
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t">
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

      {/* ── Dialog Decisão ── */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setObservacoesDecisao(""); }}>
        <DialogContent className="max-w-md w-[95vw]">
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
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Processo</p>
                  <p className="text-sm font-semibold">{actionDialog.visto.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">{actionDialog.visto.entidade}</p>
                  <p className="text-xs text-muted-foreground">{actionDialog.visto.objecto}</p>
                  <p className="text-sm font-bold mt-1">{actionDialog.visto.valor}</p>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {actionDialog.action === "aprovar" ? "Observações (opcional)" : "Motivo da Recusa *"}
                  </Label>
                  <Textarea
                    value={observacoesDecisao}
                    onChange={(e) => setObservacoesDecisao(e.target.value)}
                    placeholder={
                      actionDialog.action === "aprovar"
                        ? "Observações sobre a decisão..."
                        : "Indique o motivo da recusa..."
                    }
                    rows={4}
                  />
                  {actionDialog.action === "recusar" && (
                    <p className="text-[10px] text-muted-foreground">
                      A fundamentação da recusa é obrigatória e será comunicada à entidade requerente.
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => { setActionDialog(null); setObservacoesDecisao(""); }}>
                  Cancelar
                </Button>
                <Button
                  variant={actionDialog.action === "aprovar" ? "default" : "destructive"}
                  onClick={handleAction}
                  className="gap-2"
                >
                  {actionDialog.action === "aprovar" ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> Conceder Visto
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Confirmar Recusa
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
