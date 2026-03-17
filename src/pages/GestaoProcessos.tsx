import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOW_STAGES, WORKFLOW_ESTADOS, CATEGORIAS_ENTIDADE, type Processo } from "@/types/workflow";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { gerarNumeroProcesso } from "@/hooks/useBackendFunctions";
import { useEntities } from "@/hooks/useEntities";
import { EntityTipologia } from "@/types";

// Mapping: workflow category → entity tipologias
const CATEGORIA_TIPOLOGIA_MAP: Record<string, EntityTipologia[]> = {
  categoria_1: ["orgao_soberania"],
  categoria_2: ["admin_central", "admin_local", "instituto_admin"],
  categoria_3: ["servico_estrangeiro"],
  categoria_4: ["orgao_autonomo", "instituto_publico", "fundo_autonomo", "servico_autonomo", "empresa_publica"],
};
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Search, Plus, Eye, Filter, ArrowUpDown, Clock, AlertTriangle,
  CheckCircle2, XCircle, FileText, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const GestaoProcessos = () => {
  const { entities: allEntities } = useEntities();
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos");
  const [showNewProcess, setShowNewProcess] = useState(false);

  // New process form
  const [newProcess, setNewProcess] = useState({
    entity_name: "",
    entity_id: "",
    categoria_entidade: "categoria_1",
    ano_gerencia: new Date().getFullYear() - 1,
    canal_entrada: "presencial",
    urgencia: "normal",
    portador_nome: "",
    portador_documento: "",
    portador_contacto: "",
    observacoes: "",
  });

  useEffect(() => {
    loadProcessos();
  }, []);

  const loadProcessos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading processos:", error);
    } else {
      setProcessos((data as any[]) || []);
    }
    setLoading(false);
  };

  const createProcesso = async () => {
    const cat = CATEGORIAS_ENTIDADE.find(c => c.id === newProcess.categoria_entidade);

    let numero: string;
    try {
      numero = await gerarNumeroProcesso(newProcess.ano_gerencia);
    } catch (err: any) {
      toast({ title: "Erro ao gerar número", description: err.message, variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.from("processos").insert({
      numero_processo: numero,
      entity_id: newProcess.entity_id || newProcess.entity_name.toLowerCase().replace(/\s+/g, "-"),
      entity_name: newProcess.entity_name,
      categoria_entidade: newProcess.categoria_entidade,
      resolucao_aplicavel: cat?.baseLegal || null,
      ano_gerencia: newProcess.ano_gerencia,
      canal_entrada: newProcess.canal_entrada,
      urgencia: newProcess.urgencia,
      etapa_atual: 1,
      estado: "submetido",
      responsavel_atual: "Secretaria-Geral",
      portador_nome: newProcess.portador_nome || null,
      portador_documento: newProcess.portador_documento || null,
      portador_contacto: newProcess.portador_contacto || null,
      observacoes: newProcess.observacoes || null,
      submetido_por: newProcess.canal_entrada === "portal" ? "Entidade" : "Secretaria-Geral",
    } as any).select();

    if (error) {
      toast({ title: "Erro ao criar processo", description: error.message, variant: "destructive" });
      return;
    }

    // Add history entry and generate activities
    if (data && data[0]) {
      const processoId = (data[0] as any).id;
      await supabase.from("processo_historico").insert({
        processo_id: processoId,
        etapa_seguinte: 1,
        estado_seguinte: "submetido",
        acao: "Processo criado e registado no sistema",
        executado_por: "Secretaria-Geral",
        perfil_executor: "Técnico da Secretaria-Geral",
        documentos_gerados: ["Acta de Recebimento"],
      } as any);

      // Gerar atividades automáticas
      try {
        await gerarAtividadesParaEvento("expediente_submetido", processoId, {
          canal: newProcess.canal_entrada as "portal" | "presencial",
          categoriaEntidade: newProcess.categoria_entidade,
          checklistIncompleta: false,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }
    }

    toast({ title: "Processo criado", description: `Processo ${numero} registado com sucesso.` });
    setShowNewProcess(false);
    setNewProcess({
      entity_name: "", entity_id: "", categoria_entidade: "categoria_1",
      ano_gerencia: new Date().getFullYear() - 1, canal_entrada: "presencial",
      urgencia: "normal", portador_nome: "", portador_documento: "",
      portador_contacto: "", observacoes: "",
    });
    loadProcessos();
  };

  const getEstadoBadge = (estado: string) => {
    const e = WORKFLOW_ESTADOS.find(ws => ws.value === estado);
    return (
      <Badge variant="outline" className={cn("text-xs font-medium", e?.color || "bg-muted text-muted-foreground")}>
        {e?.label || estado}
      </Badge>
    );
  };

  const getEtapaNome = (etapa: number) => {
    return WORKFLOW_STAGES.find(s => s.id === etapa)?.nome || `Etapa ${etapa}`;
  };

  const filtered = processos.filter(p => {
    if (searchTerm && !p.numero_processo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filtroEstado !== "todos" && p.estado !== filtroEstado) return false;
    if (filtroEtapa !== "todas" && p.etapa_atual !== Number(filtroEtapa)) return false;
    if (filtroCategoria !== "todas" && p.categoria_entidade !== filtroCategoria) return false;
    if (filtroCanal !== "todos" && p.canal_entrada !== filtroCanal) return false;
    if (filtroUrgencia !== "todos" && p.urgencia !== filtroUrgencia) return false;
    return true;
  });

  // Stats
  const totalProcessos = processos.length;
  const emAnalise = processos.filter(p => ["em_analise", "em_validacao", "em_decisao"].includes(p.estado)).length;
  const urgentes = processos.filter(p => p.urgencia === "urgente").length;
  const arquivados = processos.filter(p => p.estado === "arquivado").length;

  return (
    <AppLayout>
      <PageHeader
        title="Gestão de Processos"
        description="Tramitação processual completa — desde a entrada do expediente até ao arquivamento"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{totalProcessos}</p>
                <p className="text-xs text-muted-foreground">Total Processos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100"><Clock className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{emAnalise}</p>
                <p className="text-xs text-muted-foreground">Em Tramitação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-2xl font-bold">{urgentes}</p>
                <p className="text-xs text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{arquivados}</p>
                <p className="text-xs text-muted-foreground">Arquivados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nº processo ou entidade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Estados</SelectItem>
                {WORKFLOW_ESTADOS.map(e => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Etapas</SelectItem>
                {WORKFLOW_STAGES.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.id}. {s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroCanal} onValueChange={setFiltroCanal}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroUrgencia} onValueChange={setFiltroUrgencia}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Urgência" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={showNewProcess} onOpenChange={setShowNewProcess}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Novo Processo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registar Novo Processo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Categoria da Entidade *</Label>
                    <Select value={newProcess.categoria_entidade} onValueChange={v => setNewProcess(p => ({ ...p, categoria_entidade: v, entity_name: "", entity_id: "" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_ENTIDADE.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Entidade *</Label>
                      <Select
                        value={newProcess.entity_id || ""}
                        onValueChange={v => {
                          const ent = mockEntities.find(e => e.id === v);
                          if (ent) setNewProcess(p => ({ ...p, entity_id: ent.id, entity_name: ent.name }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccione a entidade" /></SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const tipologias = CATEGORIA_TIPOLOGIA_MAP[newProcess.categoria_entidade] || [];
                            const filtered = mockEntities.filter(e => tipologias.includes(e.tipologia));
                            if (filtered.length === 0) return <SelectItem value="_none" disabled>Nenhuma entidade nesta categoria</SelectItem>;
                            return filtered.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Código da Entidade</Label>
                      <Input value={newProcess.entity_id} readOnly placeholder="Auto-preenchido" className="bg-muted/30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ano de Gerência *</Label>
                      <Input type="number" value={newProcess.ano_gerencia} onChange={e => setNewProcess(p => ({ ...p, ano_gerencia: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <Label>Canal de Entrada *</Label>
                      <Select value={newProcess.canal_entrada} onValueChange={v => setNewProcess(p => ({ ...p, canal_entrada: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="portal">Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Urgência</Label>
                      <Select value={newProcess.urgencia} onValueChange={v => setNewProcess(p => ({ ...p, urgencia: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newProcess.canal_entrada === "presencial" && (
                    <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Dados do Portador</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Nome</Label>
                          <Input value={newProcess.portador_nome} onChange={e => setNewProcess(p => ({ ...p, portador_nome: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs">Documento</Label>
                          <Input value={newProcess.portador_documento} onChange={e => setNewProcess(p => ({ ...p, portador_documento: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs">Contacto</Label>
                          <Input value={newProcess.portador_contacto} onChange={e => setNewProcess(p => ({ ...p, portador_contacto: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Observações</Label>
                    <Textarea value={newProcess.observacoes} onChange={e => setNewProcess(p => ({ ...p, observacoes: e.target.value }))} rows={2} />
                  </div>
                  <Button onClick={createProcesso} disabled={!newProcess.entity_name} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Registar Processo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Etapa Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">A carregar...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum processo encontrado</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/gestao-processos/${p.id}`)}>
                  <TableCell className="font-mono font-semibold text-sm">{p.numero_processo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{p.entity_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.ano_gerencia}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="font-semibold text-primary">{p.etapa_atual}.</span>{" "}
                      <span>{getEtapaNome(p.etapa_atual)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getEstadoBadge(p.estado)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", p.canal_entrada === "portal" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")}>
                      {p.canal_entrada === "portal" ? "Portal" : "Presencial"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.urgencia === "urgente" ? (
                      <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Urgente</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Normal</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(p.data_submissao).toLocaleDateString("pt-AO")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); navigate(`/gestao-processos/${p.id}`); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default GestaoProcessos;
