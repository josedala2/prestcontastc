import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Stamp, Clock, CheckCircle, XCircle, Eye, Building2, FileText,
  AlertTriangle, ShieldCheck, Search, TrendingUp, Banknote,
  FileCheck, Undo2, Inbox, Download, Printer, ExternalLink, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { exportActaRecepcaoVistoPdf, type ActaRecepcaoVistoData } from "@/lib/actaVistoGenerator";

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
  estado: "pendente" | "recepcionado" | "devolvido";
  fonte: string;
  entidadeContratada: string;
  nif: string;
  documentos: string[];
  observacoes?: string;
}

// ── Checklist documental para processos de visto ──
const vistoChecklist = [
  { id: "oficio", label: "Ofício de Solicitação de Visto", required: true },
  { id: "minuta", label: "Minuta do Contrato", required: true },
  { id: "cabimento", label: "Cabimento Orçamental", required: true },
  { id: "adjudicacao", label: "Proposta / Despacho de Adjudicação", required: false },
  { id: "concurso", label: "Programa de Concurso / Caderno de Encargos", required: false },
  { id: "habilitacao", label: "Documentos de Habilitação da Empresa", required: false },
  { id: "certidao", label: "Certidão Negativa de Dívidas Fiscais", required: false },
  { id: "seguranca_social", label: "Declaração de Regularidade com Segurança Social", required: false },
];

// ── Mock data ──
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
    estado: "pendente",
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
    estado: "recepcionado",
    fonte: "Fundos Autónomos",
    entidadeContratada: "TechSolutions Angola, Lda.",
    nif: "111222333",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
    observacoes: "Acta de recepção emitida em 20/11/2024. Processo encaminhado para análise.",
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
    estado: "devolvido",
    fonte: "Orçamento Geral do Estado (OGE)",
    entidadeContratada: "AutoAngola, S.A.",
    nif: "444555666",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato"],
    observacoes: "Documentação incompleta. Falta cabimento orçamental e caderno de encargos.",
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
    estado: "pendente",
    fonte: "Receitas Próprias",
    entidadeContratada: "IT Services Angola, S.A.",
    nif: "555666777",
    documentos: ["Ofício de Solicitação", "Minuta do Contrato", "Cabimento Orçamental"],
  },
];

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  recepcionado: { label: "Recepcionado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  devolvido: { label: "Devolvido", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-AO", { minimumFractionDigits: 2 }).format(value) + " Kz";

export default function ProcessosVisto() {
  const [vistos, setVistos] = useState<SolicitacaoVisto[]>(mockVistos);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");

  // Verificação documental
  const [selectedVisto, setSelectedVisto] = useState<SolicitacaoVisto | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [viewedDocs, setViewedDocs] = useState<Record<string, boolean>>({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [detailDialog, setDetailDialog] = useState<SolicitacaoVisto | null>(null);
  const [actasGeradas, setActasGeradas] = useState<string[]>([]);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [editingActaVisto, setEditingActaVisto] = useState<SolicitacaoVisto | null>(null);
  const [representanteNome, setRepresentanteNome] = useState("");
  const [representanteTelefone, setRepresentanteTelefone] = useState("");
  const [representanteCargo, setRepresentanteCargo] = useState("");
  const [oficioNumero, setOficioNumero] = useState("");
  const previewObjectUrlRef = useRef<string | null>(null);

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

  const pendentes = vistos.filter((v) => v.estado === "pendente");

  // ── Estatísticas ──
  const resumo = {
    total: vistos.length,
    pendentes: pendentes.length,
    recepcionados: vistos.filter((v) => v.estado === "recepcionado").length,
    devolvidos: vistos.filter((v) => v.estado === "devolvido").length,
  };

  const valorTotal = vistos.reduce((acc, v) => acc + v.valorNum, 0);
  const valorPendente = pendentes.reduce((acc, v) => acc + v.valorNum, 0);
  const entidadesUnicas = new Set(vistos.map((v) => v.entidade)).size;

  // ── Checklist logic ──
  const requiredItems = vistoChecklist.filter((c) => c.required);
  const allRequiredChecked = requiredItems.every((item) => checkedDocs[item.id]);
  const checkedCount = vistoChecklist.filter((item) => checkedDocs[item.id]).length;

  const handleSelectProcesso = (visto: SolicitacaoVisto) => {
    setSelectedVisto(visto);
    setCheckedDocs({});
    setViewedDocs({});
    setRepresentanteNome("");
    setRepresentanteTelefone("");
    setRepresentanteCargo("");
    setOficioNumero(`${visto.id}/GMF/${now.getFullYear()}`);
  };

  const handleToggleDoc = (docId: string) => {
    if (!viewedDocs[docId]) {
      toast.warning("Deve visualizar o documento antes de o verificar.");
      return;
    }
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleViewDoc = (docId: string, docLabel: string) => {
    setViewedDocs((prev) => ({ ...prev, [docId]: true }));
    toast.info(`A visualizar: ${docLabel}`, { duration: 2000 });
  };

  const closePdfPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPdfPreviewUrl(null);
  };

  const setPdfPreviewFromBlob = (blob: Blob) => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(blob);
    previewObjectUrlRef.current = objectUrl;
    setPdfPreviewUrl(objectUrl);
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const now = new Date();
  const actaNumero = selectedVisto
    ? `ARV-${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(pendentes.indexOf(selectedVisto) + 1).padStart(3, "0")}`
    : "";

  const buildActaData = (visto: SolicitacaoVisto, numero: string): ActaRecepcaoVistoData => ({
    actaNumero: numero,
    representanteNome: representanteNome.trim() || "Representante",
    representanteTelefone: representanteTelefone.trim() || "---",
    representanteCargo: representanteCargo.trim() || "técnico",
    entidadeNome: visto.entidade,
    oficioNumero: oficioNumero.trim() || `${visto.id}/GMF/${now.getFullYear()}`,
    oficioData: new Date(visto.dataSubmissao).toLocaleDateString("pt-AO"),
    objecto: visto.objecto,
    entidadeContratada: visto.entidadeContratada,
    tipoFiscalizacao: visto.tipo === "previo" ? "Fiscaliza\u00E7\u00E3o Preventiva" : "Fiscaliza\u00E7\u00E3o Sucessiva",
    dataActa: now,
    documentosAcompanham: vistoChecklist.filter((item) => checkedDocs[item.id]).map((item) => item.label),
    documentosHabilitacao: [
      "Declara\u00E7\u00E3o de Identifica\u00E7\u00E3o",
      "Identifica\u00E7\u00E3o dos S\u00F3cios",
      "Pacto Social, Publicado em Di\u00E1rio da Rep\u00FAblica",
      "Alvar\u00E1 Comercial",
    ],
  });

  const handlePreviewPdf = async (visto?: SolicitacaoVisto) => {
    const target = visto || selectedVisto;
    if (!target) return;
    const numero = `ARV-${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(pendentes.indexOf(target) + 1).padStart(3, "0")}`;
    const data = buildActaData(target, numero);
    const { blob } = await exportActaRecepcaoVistoPdf(data);
    setPdfPreviewFromBlob(blob);
  };

  const handleDownloadPdf = async (visto: SolicitacaoVisto) => {
    const numero = `ARV-${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(pendentes.indexOf(visto) + 1).padStart(3, "0")}`;
    const data = buildActaData(visto, numero);
    const { blob, fileName } = await exportActaRecepcaoVistoPdf(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmRecepcao = async () => {
    if (!selectedVisto) return;
    const data = buildActaData(selectedVisto, actaNumero);
    const { blob } = await exportActaRecepcaoVistoPdf(data);

    setVistos((prev) =>
      prev.map((v) =>
        v.id === selectedVisto.id
          ? { ...v, estado: "recepcionado" as const, observacoes: `Acta de recepção ${actaNumero} emitida em ${now.toLocaleDateString("pt-AO")}. Processo encaminhado para análise técnica.` }
          : v
      )
    );
    setActasGeradas((prev) => [...prev, selectedVisto.id]);
    setConfirmDialogOpen(false);
    setPdfPreviewFromBlob(blob);
    toast.success(`Acta de recepção gerada — ${selectedVisto.id} — ${selectedVisto.entidade}`);
    setSelectedVisto(null);
    setCheckedDocs({});
  };

  const handleConfirmDevolucao = () => {
    if (!selectedVisto || !motivoDevolucao.trim()) {
      toast.error("Indique o motivo da devolução");
      return;
    }
    setVistos((prev) =>
      prev.map((v) =>
        v.id === selectedVisto.id
          ? { ...v, estado: "devolvido" as const, observacoes: motivoDevolucao.trim() }
          : v
      )
    );
    setRejectDialogOpen(false);
    setMotivoDevolucao("");
    toast.warning(`Processo devolvido — ${selectedVisto.id} — ${selectedVisto.entidade}`);
    setSelectedVisto(null);
    setCheckedDocs({});
  };

  return (
    <AppLayout>
      <PageHeader
        title="Processos de Visto — Recepção"
        description="Recepção e verificação documental das solicitações de visto submetidas pelas entidades"
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pendentes de Recepção"
          value={resumo.pendentes}
          subtitle="aguardam verificação"
          icon={<Inbox className="h-5 w-5" />}
          variant={resumo.pendentes > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Actas Emitidas"
          value={resumo.recepcionados}
          subtitle="processos recepcionados"
          icon={<Stamp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Devolvidos"
          value={resumo.devolvidos}
          subtitle="documentação incompleta"
          icon={<Undo2 className="h-5 w-5" />}
          variant={resumo.devolvidos > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Total de Processos"
          value={resumo.total}
          subtitle={`${entidadesUnicas} entidades`}
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* ── Cards financeiros ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              <p className="text-[11px] text-muted-foreground">Valor Pendente de Recepção</p>
              <p className="text-lg font-bold">{formatCurrency(valorPendente)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Coluna 1: Lista de processos pendentes ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="recepcionado">Recepcionados</SelectItem>
                  <SelectItem value="devolvido">Devolvidos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="previo">Prévio</SelectItem>
                  <SelectItem value="sucessivo">Sucessivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de processos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Processos Recebidos ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum processo encontrado.</p>
                </div>
              ) : (
                filtered.map((v) => {
                  const config = estadoConfig[v.estado];
                  const isSelected = selectedVisto?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => v.estado === "pendente" ? handleSelectProcesso(v) : setDetailDialog(v)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-semibold">{v.id}</p>
                          <p className="text-sm font-medium line-clamp-1">{v.entidade}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{v.objecto}</p>
                        </div>
                        <Badge className={cn("text-[9px] shrink-0", config.color)} variant="secondary">
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {v.tipo === "previo" ? "Prévio" : "Sucessivo"}
                        </span>
                        <span>{v.valor}</span>
                        <span>{new Date(v.dataSubmissao).toLocaleDateString("pt-AO")}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Actas geradas nesta sessão */}
          {actasGeradas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Stamp className="h-4 w-4" />
                  Actas Emitidas ({actasGeradas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {actasGeradas.map((id) => {
                  const v = vistos.find((x) => x.id === id);
                  if (!v) return null;
                  return (
                    <div key={id} className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-2.5">
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-medium">{v.id}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{v.entidade}</p>
                          <p className="text-[10px] text-muted-foreground">Emitida em {now.toLocaleDateString("pt-AO")}</p>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-green-200 dark:border-green-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-[11px] px-2"
                          onClick={() => handlePreviewPdf(v)}
                        >
                          <Eye className="h-3 w-3" /> Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-[11px] px-2"
                          onClick={() => handleDownloadPdf(v)}
                        >
                          <Download className="h-3 w-3" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-[11px] px-2"
                          onClick={() => {
                            setEditingActaVisto(v);
                            setVistos((prev) =>
                              prev.map((x) =>
                                x.id === v.id ? { ...x, estado: "pendente" as const, observacoes: undefined } : x
                              )
                            );
                            setActasGeradas((prev) => prev.filter((x) => x !== v.id));
                            setSelectedVisto(v);
                            setCheckedDocs({});
                            toast.info(`Processo ${v.id} reaberto para edição da acta.`);
                          }}
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-[11px] px-2 text-destructive hover:text-destructive"
                          onClick={() => {
                            setActasGeradas((prev) => prev.filter((x) => x !== v.id));
                            setVistos((prev) =>
                              prev.map((x) =>
                                x.id === v.id ? { ...x, estado: "pendente" as const, observacoes: undefined } : x
                              )
                            );
                            toast.warning(`Acta removida — ${v.id}. Processo retornado a pendente.`);
                          }}
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Coluna 2: Painel de verificação documental ── */}
        <div className="lg:col-span-2">
          {!selectedVisto ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">Seleccione um processo pendente</p>
                <p className="text-sm">Escolha um processo da lista para verificar a conformidade documental e emitir a acta de recepção.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumo do processo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {selectedVisto.id} — {selectedVisto.entidade}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Tipo</p>
                      <p className="font-medium">{selectedVisto.tipo === "previo" ? "Visto Prévio" : "Visto Sucessivo"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Natureza</p>
                      <p className="font-medium">{selectedVisto.natureza}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Valor</p>
                      <p className="font-bold">{selectedVisto.valor}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Contratada</p>
                      <p className="font-medium">{selectedVisto.entidadeContratada}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">NIF</p>
                      <p className="font-mono">{selectedVisto.nif}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Fonte</p>
                      <p>{selectedVisto.fonte}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-[11px] text-muted-foreground">Objecto do Contrato</p>
                      <p>{selectedVisto.objecto}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados do Representante e Ofício */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Dados do Representante e Ofício
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Preencha os dados de quem entrega o processo para constar na acta de recepção.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="rep-nome">Nome do Representante *</Label>
                      <Input
                        id="rep-nome"
                        placeholder="Nome completo do representante"
                        value={representanteNome}
                        onChange={(e) => setRepresentanteNome(e.target.value)}
                        maxLength={120}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rep-cargo">Cargo / Função</Label>
                      <Input
                        id="rep-cargo"
                        placeholder="Ex: Director Administrativo"
                        value={representanteCargo}
                        onChange={(e) => setRepresentanteCargo(e.target.value)}
                        maxLength={80}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rep-telefone">Telefone de Contacto</Label>
                      <Input
                        id="rep-telefone"
                        placeholder="Ex: 923 456 789"
                        value={representanteTelefone}
                        onChange={(e) => setRepresentanteTelefone(e.target.value)}
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="oficio-numero">N.º do Ofício</Label>
                      <Input
                        id="oficio-numero"
                        placeholder="Número do ofício de solicitação"
                        value={oficioNumero}
                        onChange={(e) => setOficioNumero(e.target.value)}
                        maxLength={60}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verificação documental */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Verificação Documental
                    </CardTitle>
                    <Badge variant={allRequiredChecked ? "default" : "secondary"}>
                      {checkedCount}/{vistoChecklist.length} verificados
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confirme a existência de cada documento antes de emitir a acta de recepção.
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">✓</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead className="text-center">Obrigatório</TableHead>
                        <TableHead className="text-center w-28">Visualizar</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vistoChecklist.map((item) => {
                        const isChecked = !!checkedDocs[item.id];
                        const isViewed = !!viewedDocs[item.id];
                        return (
                          <TableRow key={item.id} className={isChecked ? "bg-green-50/50 dark:bg-green-900/5" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleDoc(item.id)}
                                disabled={!isViewed}
                                title={!isViewed ? "Visualize o documento primeiro" : undefined}
                              />
                            </TableCell>
                            <TableCell className="text-sm">{item.label}</TableCell>
                            <TableCell className="text-center">
                              {item.required ? (
                                <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant={isViewed ? "ghost" : "outline"}
                                size="sm"
                                className={cn("h-7 text-[11px] gap-1", isViewed && "text-muted-foreground")}
                                onClick={() => handleViewDoc(item.id, item.label)}
                              >
                                <Eye className="h-3 w-3" />
                                {isViewed ? "Visto" : "Ver"}
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
                              {isChecked ? (
                                <span className="flex items-center justify-center gap-1 text-green-600 text-xs">
                                  <CheckCircle className="h-3.5 w-3.5" /> Verificado
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                                  <XCircle className="h-3.5 w-3.5" /> Pendente
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Acções */}
              <div className="flex items-center justify-between">
                {!allRequiredChecked ? (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Todos os documentos obrigatórios devem ser verificados para emitir a acta.
                  </p>
                ) : <div />}
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={() => { setSelectedVisto(null); setCheckedDocs({}); }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                    className="gap-2"
                  >
                    <Undo2 className="h-4 w-4" />
                    Devolver
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handlePreviewPdf()}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar PDF
                  </Button>
                  <Button
                    disabled={!allRequiredChecked}
                    onClick={() => setConfirmDialogOpen(true)}
                    className="gap-2"
                  >
                    <Stamp className="h-4 w-4" />
                    Confirmar e Autuar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog Detalhe (processos já tratados) ── */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg w-[95vw]">
          {detailDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-primary" />
                  {detailDialog.id}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detalhes do processo de visto e documentos anexados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className={cn("flex items-center gap-2 rounded-lg px-4 py-2.5", estadoConfig[detailDialog.estado].color)}>
                  {(() => { const Icon = estadoConfig[detailDialog.estado].icon; return <Icon className="h-4 w-4" />; })()}
                  <span className="text-sm font-semibold">{estadoConfig[detailDialog.estado].label}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Entidade</p>
                    <p className="font-medium">{detailDialog.entidade}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Tipo</p>
                    <p>{detailDialog.tipo === "previo" ? "Visto Prévio" : "Visto Sucessivo"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Contratada</p>
                    <p>{detailDialog.entidadeContratada}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Valor</p>
                    <p className="font-bold">{detailDialog.valor}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Objecto</p>
                  <p className="text-sm">{detailDialog.objecto}</p>
                </div>

                {detailDialog.observacoes && (
                  <div className={cn(
                    "rounded-md p-3 text-sm border",
                    detailDialog.estado === "devolvido"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {detailDialog.estado === "devolvido" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <span className="text-xs font-semibold">
                        {detailDialog.estado === "devolvido" ? "Motivo da Devolução" : "Observações"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{detailDialog.observacoes}</p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Documentos Anexados</p>
                  <div className="space-y-1">
                    {detailDialog.documentos.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirmação de Recepção ── */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" />
              Confirmar Recepção
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Confirma a recepção do processo <strong>{selectedVisto?.id}</strong> da entidade{" "}
                <strong>{selectedVisto?.entidade}</strong>?
              </p>
              <p className="text-xs">
                Será gerada a acta de recepção <strong>{actaNumero}</strong> e o processo será
                encaminhado para análise técnica.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRecepcao} className="gap-2">
              <Stamp className="h-3.5 w-3.5" />
              Confirmar e Autuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Devolução com motivo ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => { setRejectDialogOpen(open); if (!open) setMotivoDevolucao(""); }}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-destructive" />
              Devolver Processo
            </DialogTitle>
            <DialogDescription>
              Indique o motivo da devolução para comunicar à entidade requerente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Processo</p>
              <p className="text-sm font-semibold">{selectedVisto?.id}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedVisto?.entidade}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo da Devolução *</Label>
              <Textarea
                value={motivoDevolucao}
                onChange={(e) => setMotivoDevolucao(e.target.value)}
                placeholder="Indique os documentos em falta ou irregularidades encontradas..."
                rows={4}
              />
              <p className="text-[10px] text-muted-foreground">
                O motivo será comunicado à entidade requerente para correcção e nova submissão.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setMotivoDevolucao(""); }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDevolucao} className="gap-2">
              <Undo2 className="h-3.5 w-3.5" /> Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview PDF da Acta ── */}
      <Dialog
        open={!!pdfPreviewUrl}
        onOpenChange={(open) => {
          if (!open) closePdfPreview();
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" />
              Acta de Recepção — Pré-visualização
            </DialogTitle>
            <DialogDescription>
              Pré-visualização do PDF da acta de recepção, com opções de abrir em nova aba e imprimir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {pdfPreviewUrl && (
              <object
                data={pdfPreviewUrl}
                type="application/pdf"
                className="w-full h-full border rounded-md"
                aria-label="Pré-visualização da Acta de Recepção"
              >
                <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                  <p>Não foi possível carregar o PDF no visualizador interno.</p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir PDF
                  </Button>
                </div>
              </object>
            )}
          </div>
          <DialogFooter className="flex-row justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (pdfPreviewUrl) {
                  window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir em Nova Aba
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (pdfPreviewUrl) {
                  const printWindow = window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
                  printWindow?.addEventListener("load", () => printWindow.print(), { once: true });
                }
              }}
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
            <Button variant="outline" onClick={closePdfPreview}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
