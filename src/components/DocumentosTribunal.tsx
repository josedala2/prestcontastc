import { useState, useMemo } from "react";
import { mockDocumentosTribunal } from "@/data/mockData";
import { useEntities } from "@/hooks/useEntities";
import { exportDocumentoTribunalPdf } from "@/lib/exportUtils";
import {
  DocumentoTribunal,
  DocumentoTribunalTipo,
  DocumentoTribunalEstado,
  DOCUMENTO_TIPO_LABELS,
  DOCUMENTO_ESTADO_LABELS,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/ui-custom/PageElements";
import {
  Bell,
  HelpCircle,
  FileSearch,
  Gavel,
  Mail,
  Plus,
  Eye,
  Lock,
  Unlock,
  Hash,
  Clock,
  History,
  Shield,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DocumentosTribunalProps {
  exercicioId: string;
  entidadeId: string;
  readOnly?: boolean; // Portal mode
}

const TIPO_ICONS: Record<DocumentoTribunalTipo, React.ReactNode> = {
  notificacao: <Bell className="h-4 w-4" />,
  diligencia: <HelpCircle className="h-4 w-4" />,
  relatorio_analise: <FileSearch className="h-4 w-4" />,
  acordao: <Gavel className="h-4 w-4" />,
  notif_acordao: <Mail className="h-4 w-4" />,
};

export function DocumentosTribunal({ exercicioId, entidadeId, readOnly = false }: DocumentosTribunalProps) {
  const { findById } = useEntities();
  const [documentos, setDocumentos] = useState<DocumentoTribunal[]>(
    mockDocumentosTribunal.filter((d) => d.exercicioId === exercicioId && d.entidadeId === entidadeId)
  );
  const [selectedDoc, setSelectedDoc] = useState<DocumentoTribunal | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDocTipo, setNewDocTipo] = useState<DocumentoTribunalTipo>("notificacao");
  const [newDocAssunto, setNewDocAssunto] = useState("");
  const [newDocConteudo, setNewDocConteudo] = useState("");
  const [newDocPrazo, setNewDocPrazo] = useState("");
  const [newDocJuiz, setNewDocJuiz] = useState("");
  const [newDocResultado, setNewDocResultado] = useState<"em_termos" | "com_recomendacoes" | "nao_em_termos">("em_termos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  const filteredDocs = useMemo(() => {
    if (filterTipo === "todos") return documentos;
    return documentos.filter((d) => d.tipo === filterTipo);
  }, [documentos, filterTipo]);

  const stats = useMemo(() => ({
    total: documentos.length,
    emitidos: documentos.filter((d) => d.estado === "emitido").length,
    rascunhos: documentos.filter((d) => d.estado === "rascunho" || d.estado === "em_revisao").length,
    imutaveis: documentos.filter((d) => d.imutavel).length,
  }), [documentos]);

  const generateHash = () => {
    const chars = "0123456789abcdef";
    return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join("");
  };

  const generateNumero = (tipo: DocumentoTribunalTipo) => {
    const prefixes: Record<DocumentoTribunalTipo, string> = {
      notificacao: "NOT",
      diligencia: "DIL",
      relatorio_analise: "REL",
      acordao: "ACO",
      notif_acordao: "NTA",
    };
    const count = documentos.filter((d) => d.tipo === tipo).length + 1;
    return `${prefixes[tipo]}/TCA/2025/${String(count).padStart(3, "0")}`;
  };

  const handleCreate = () => {
    if (!newDocAssunto.trim() || !newDocConteudo.trim()) {
      toast.error("Preencha o assunto e o conteúdo do documento.");
      return;
    }

    const hash = generateHash();
    const now = new Date().toISOString().split("T")[0];
    const newDoc: DocumentoTribunal = {
      id: `dt_new_${Date.now()}`,
      processoId: `p_${exercicioId}`,
      exercicioId,
      entidadeId,
      tipo: newDocTipo,
      numeroDocumento: generateNumero(newDocTipo),
      assunto: newDocAssunto.trim(),
      conteudo: newDocConteudo.trim(),
      estado: "rascunho",
      versao: 1,
      imutavel: false,
      hashSha256: hash,
      criadoPor: "Utilizador Actual (TCA)",
      createdAt: now,
      updatedAt: now,
      ...(newDocTipo === "diligencia" && newDocPrazo ? { prazoResposta: newDocPrazo } : {}),
      ...(newDocTipo === "acordao" ? { juizRelator: newDocJuiz || undefined, resultadoAcordao: newDocResultado } : {}),
      historico: [
        { versao: 1, alteradoPor: "Utilizador Actual", alteradoAt: now, resumoAlteracao: "Criação do documento", hashSha256: hash },
      ],
    };

    setDocumentos((prev) => [newDoc, ...prev]);
    setShowNewForm(false);
    setNewDocAssunto("");
    setNewDocConteudo("");
    setNewDocPrazo("");
    setNewDocJuiz("");
    toast.success(`${DOCUMENTO_TIPO_LABELS[newDocTipo].label} criado com sucesso.`);
  };

  const handleTransition = (doc: DocumentoTribunal, newEstado: DocumentoTribunalEstado) => {
    if (doc.imutavel) {
      toast.error("Este documento é imutável e não pode ser alterado.");
      return;
    }

    const now = new Date().toISOString().split("T")[0];
    const hash = generateHash();
    const isEmitting = newEstado === "emitido";
    const isAcordao = doc.tipo === "acordao";

    setDocumentos((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              estado: newEstado,
              versao: d.versao + 1,
              updatedAt: now,
              imutavel: isEmitting && (isAcordao || doc.tipo === "notif_acordao"),
              hashSha256: hash,
              seloTemporal: isEmitting && isAcordao ? new Date().toISOString() : d.seloTemporal,
              emitidoAt: isEmitting ? now : d.emitidoAt,
              aprovadoPor: newEstado === "aprovado" ? "Coordenador TCA" : d.aprovadoPor,
              historico: [
                ...(d.historico || []),
                {
                  versao: d.versao + 1,
                  alteradoPor: "Utilizador Actual",
                  alteradoAt: now,
                  resumoAlteracao: `Estado alterado para: ${DOCUMENTO_ESTADO_LABELS[newEstado].label}`,
                  hashSha256: hash,
                },
              ],
            }
          : d
      )
    );

    if (selectedDoc?.id === doc.id) {
      setSelectedDoc((prev) =>
        prev ? { ...prev, estado: newEstado, imutavel: isEmitting && (isAcordao || doc.tipo === "notif_acordao") } : null
      );
    }

    toast.success(`Documento ${isEmitting ? "emitido" : "actualizado"} com sucesso.`);
    if (isEmitting && isAcordao) {
      toast.info("Acórdão emitido — documento marcado como IMUTÁVEL.");
    }
  };

  const getNextStates = (doc: DocumentoTribunal): { estado: DocumentoTribunalEstado; label: string; icon: React.ReactNode }[] => {
    if (doc.imutavel) return [];
    switch (doc.estado) {
      case "rascunho":
        return [{ estado: "em_revisao", label: "Enviar para Revisão", icon: <FileSearch className="h-3.5 w-3.5" /> }];
      case "em_revisao":
        return [
          { estado: "aprovado", label: "Aprovar", icon: <CheckCircle className="h-3.5 w-3.5" /> },
          { estado: "rascunho", label: "Devolver ao Rascunho", icon: <History className="h-3.5 w-3.5" /> },
        ];
      case "aprovado":
        return [{ estado: "emitido", label: "Emitir Oficialmente", icon: <Send className="h-3.5 w-3.5" /> }];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Total Documentos</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Emitidos</p>
            <p className="text-lg font-bold text-success">{stats.emitidos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Em Preparação</p>
            <p className="text-lg font-bold text-warning">{stats.rascunhos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Imutáveis</p>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold text-foreground">{stats.imutaveis}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Documentos do Tribunal</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todos os tipos</SelectItem>
                {(Object.keys(DOCUMENTO_TIPO_LABELS) as DocumentoTribunalTipo[]).map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{DOCUMENTO_TIPO_LABELS[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!readOnly && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowNewForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Novo Documento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDocs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Sem documentos {filterTipo !== "todos" ? "deste tipo" : ""} para este exercício.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nº Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">V.</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className={cn(doc.imutavel && "bg-muted/20")}>
                    <TableCell>
                      <span className={cn(
                        "flex items-center justify-center",
                        doc.tipo === "acordao" ? "text-primary" :
                        doc.tipo === "diligencia" ? "text-warning" :
                        "text-muted-foreground"
                      )}>
                        {TIPO_ICONS[doc.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{doc.numeroDocumento}</TableCell>
                    <TableCell className="text-xs">{DOCUMENTO_TIPO_LABELS[doc.tipo].label}</TableCell>
                    <TableCell className="text-sm max-w-[250px] truncate">{doc.assunto}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={DOCUMENTO_ESTADO_LABELS[doc.estado].label}
                        variant={DOCUMENTO_ESTADO_LABELS[doc.estado].color as any}
                      />
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">v{doc.versao}</TableCell>
                    <TableCell>
                      {doc.imutavel ? (
                        <Tooltip>
                          <TooltipTrigger><Lock className="h-3.5 w-3.5 text-destructive" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs">Documento imutável — não pode ser editado</p></TooltipContent>
                        </Tooltip>
                      ) : (
                        <Unlock className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => {
                        const entity = findById(entidadeId);
                        exportDocumentoTribunalPdf(doc, entity?.name || "Entidade");
                      }}>
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSelectedDoc(doc)}>
                        <Eye className="h-3 w-3" /> Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {TIPO_ICONS[selectedDoc.tipo]}
                  <DialogTitle className="text-lg">{DOCUMENTO_TIPO_LABELS[selectedDoc.tipo].label}</DialogTitle>
                </div>
                <DialogDescription className="font-mono text-xs">{selectedDoc.numeroDocumento}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={DOCUMENTO_ESTADO_LABELS[selectedDoc.estado].label}
                      variant={DOCUMENTO_ESTADO_LABELS[selectedDoc.estado].color as any}
                    />
                    <span className="text-xs text-muted-foreground">Versão {selectedDoc.versao}</span>
                    {selectedDoc.imutavel && (
                      <Badge variant="destructive" className="text-[10px] gap-1">
                        <Lock className="h-3 w-3" /> Imutável
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-[10px] text-muted-foreground">
                      <p>Criado: {selectedDoc.createdAt}</p>
                      {selectedDoc.emitidoAt && <p>Emitido: {selectedDoc.emitidoAt}</p>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        const entity = findById(entidadeId);
                        exportDocumentoTribunalPdf(selectedDoc, entity?.name || "Entidade");
                      }}
                    >
                      <Download className="h-3.5 w-3.5" /> Exportar PDF
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Criado por</p>
                    <p className="font-medium">{selectedDoc.criadoPor}</p>
                  </div>
                  {selectedDoc.aprovadoPor && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Aprovado por</p>
                      <p className="font-medium">{selectedDoc.aprovadoPor}</p>
                    </div>
                  )}
                  {selectedDoc.juizRelator && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Juiz Relator</p>
                      <p className="font-medium">{selectedDoc.juizRelator}</p>
                    </div>
                  )}
                  {selectedDoc.prazoResposta && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Prazo de Resposta</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3 text-warning" /> {selectedDoc.prazoResposta}
                      </p>
                    </div>
                  )}
                  {selectedDoc.resultadoAcordao && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Resultado</p>
                      <Badge variant={
                        selectedDoc.resultadoAcordao === "em_termos" ? "default" :
                        selectedDoc.resultadoAcordao === "com_recomendacoes" ? "secondary" : "destructive"
                      }>
                        {selectedDoc.resultadoAcordao === "em_termos" ? "Em Termos" :
                         selectedDoc.resultadoAcordao === "com_recomendacoes" ? "Com Recomendações" : "Não em Termos"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <p className="text-sm font-semibold mb-1">{selectedDoc.assunto}</p>
                  <div className="p-4 rounded-lg bg-muted/20 border text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.conteudo}
                  </div>
                </div>

                {/* Hash */}
                {selectedDoc.hashSha256 && (
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30 border">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">SHA-256</p>
                      <p className="font-mono text-[10px] text-foreground break-all">{selectedDoc.hashSha256}</p>
                    </div>
                    {selectedDoc.seloTemporal && (
                      <div className="ml-auto text-right">
                        <p className="text-[10px] text-muted-foreground uppercase">Selo Temporal</p>
                        <p className="text-[10px] font-mono">{new Date(selectedDoc.seloTemporal).toLocaleString("pt-AO")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Version History */}
                {selectedDoc.historico && selectedDoc.historico.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <History className="h-4 w-4 text-muted-foreground" /> Histórico de Versões
                    </p>
                    <div className="space-y-2">
                      {selectedDoc.historico.map((v) => (
                        <div key={v.versao} className="flex items-start gap-3 p-2 rounded bg-muted/20 border text-xs">
                          <Badge variant="outline" className="shrink-0 text-[10px]">v{v.versao}</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{v.resumoAlteracao}</p>
                            <p className="text-muted-foreground">{v.alteradoPor} · {v.alteradoAt}</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger><Shield className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p className="font-mono text-[10px]">{v.hashSha256.substring(0, 16)}...</p></TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transition actions */}
                {!readOnly && !selectedDoc.imutavel && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {getNextStates(selectedDoc).map((next) => (
                      <Button
                        key={next.estado}
                        variant={next.estado === "emitido" ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          handleTransition(selectedDoc, next.estado);
                          setSelectedDoc(null);
                        }}
                      >
                        {next.icon} {next.label}
                      </Button>
                    ))}
                  </div>
                )}

                {selectedDoc.imutavel && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <Lock className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">
                      Este documento foi emitido oficialmente e é <strong>imutável</strong>. Nenhuma alteração é permitida.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Document Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Documento do Tribunal</DialogTitle>
            <DialogDescription>Criar um novo documento oficial associado a este processo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Tipo de Documento</Label>
              <Select value={newDocTipo} onValueChange={(v) => setNewDocTipo(v as DocumentoTribunalTipo)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOCUMENTO_TIPO_LABELS) as DocumentoTribunalTipo[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        {TIPO_ICONS[t]}
                        {DOCUMENTO_TIPO_LABELS[t].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Assunto</Label>
              <Input
                className="mt-1"
                placeholder="Assunto do documento..."
                value={newDocAssunto}
                onChange={(e) => setNewDocAssunto(e.target.value)}
                maxLength={500}
              />
            </div>

            <div>
              <Label className="text-xs">Conteúdo</Label>
              <Textarea
                className="mt-1 min-h-[120px]"
                placeholder="Conteúdo do documento..."
                value={newDocConteudo}
                onChange={(e) => setNewDocConteudo(e.target.value)}
                maxLength={5000}
              />
            </div>

            {newDocTipo === "diligencia" && (
              <div>
                <Label className="text-xs">Prazo de Resposta</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={newDocPrazo}
                  onChange={(e) => setNewDocPrazo(e.target.value)}
                />
              </div>
            )}

            {newDocTipo === "acordao" && (
              <>
                <div>
                  <Label className="text-xs">Juiz Relator</Label>
                  <Input
                    className="mt-1"
                    placeholder="Nome do Juiz Conselheiro..."
                    value={newDocJuiz}
                    onChange={(e) => setNewDocJuiz(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div>
                  <Label className="text-xs">Resultado do Acórdão</Label>
                  <Select value={newDocResultado} onValueChange={(v) => setNewDocResultado(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_termos">Em Termos</SelectItem>
                      <SelectItem value="com_recomendacoes">Em Termos com Recomendações</SelectItem>
                      <SelectItem value="nao_em_termos">Não em Termos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {newDocTipo === "acordao" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Acórdãos tornam-se <strong>imutáveis</strong> após emissão oficial. Verifique todo o conteúdo antes de emitir.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Criar como Rascunho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
