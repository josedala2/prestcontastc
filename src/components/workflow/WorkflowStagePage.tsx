import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Send, CheckCircle2, Loader2, FolderOpen,
  Calendar, UserCheck, ClipboardList, Search, type LucideIcon,
} from "lucide-react";

export interface StageField {
  key: string;
  label: string;
  required?: boolean;
  type: "select" | "text";
  options?: string[];
  placeholder?: string;
  /** DB column to update on processos table */
  dbColumn?: string;
}

export interface StageAction {
  label: string;
  nextEtapa: number;
  nextEstado: string;
  evento: string;
  variant?: "default" | "destructive" | "outline";
  /** If set, used as the confirmation message */
  confirmLabel?: string;
}

export interface WorkflowStagePageConfig {
  etapa: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  perfilExecutor: string;
  fields?: StageField[];
  actions: StageAction[];
  /** Show process history on detail view */
  showHistory?: boolean;
  /** If set, navigate to this route (with /:id) instead of showing inline detail */
  detailRoute?: string;
}

interface Processo {
  id: string;
  numero_processo: string;
  entity_name: string;
  entity_id: string;
  ano_gerencia: number;
  categoria_entidade: string;
  data_submissao: string;
  estado: string;
  etapa_atual: number;
  completude_documental: number;
  responsavel_atual: string | null;
  divisao_competente: string | null;
  seccao_competente: string | null;
  coordenador_equipa: string | null;
  tecnico_analise: string | null;
  canal_entrada: string;
  urgencia: string;
  juiz_relator: string | null;
  juiz_adjunto: string | null;
}

export default function WorkflowStagePage({ config }: { config: WorkflowStagePageConfig }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const executadoPor = user?.displayName || config.perfilExecutor;

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selected, setSelected] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [search, setSearch] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<StageAction | null>(null);

  useEffect(() => { fetchProcessos(); }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", config.etapa)
      .order("created_at", { ascending: false });
    setProcessos((data as any[]) || []);
    setLoading(false);
  };

  const handleSelect = (p: Processo) => {
    setSelected(p);
    setObservacoes("");
    const initial: Record<string, string> = {};
    config.fields?.forEach(f => {
      initial[f.key] = (p as any)[f.dbColumn || f.key] || "";
    });
    setFieldValues(initial);
  };

  const handleAction = async (action: StageAction) => {
    if (!selected) return;
    setActing(true);
    try {
      // Update any DB columns from fields
      const updates: Record<string, any> = {};
      config.fields?.forEach(f => {
        if (f.dbColumn && fieldValues[f.key]) {
          updates[f.dbColumn] = fieldValues[f.key];
        }
      });
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from("processos").update(updates).eq("id", selected.id);
        if (error) throw error;
      }

      // Build observation text
      const obs = [
        ...Object.entries(fieldValues).filter(([_, v]) => v).map(([k, v]) => {
          const field = config.fields?.find(f => f.key === k);
          return `${field?.label || k}: ${v}`;
        }),
        observacoes,
      ].filter(Boolean).join(". ");

      await avancarEtapaProcesso({
        processoId: selected.id,
        novaEtapa: action.nextEtapa,
        novoEstado: action.nextEstado,
        executadoPor,
        perfilExecutor: config.perfilExecutor,
        observacoes: obs || `Processo avançado para etapa ${action.nextEtapa}`,
      });

      await gerarAtividadesParaEvento(action.evento, selected.id, {
        categoriaEntidade: selected.categoria_entidade,
      });

      toast.success(`Processo ${selected.numero_processo} — ${action.label}`);
      setSelected(null);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setConfirmAction(null);
    }
  };

  const canAct = (action: StageAction) => {
    if (config.fields) {
      return config.fields.filter(f => f.required).every(f => fieldValues[f.key]?.trim());
    }
    return true;
  };

  const filtered = processos.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.numero_processo.toLowerCase().includes(q) || p.entity_name.toLowerCase().includes(q);
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-AO");
  const urgenciaColor = (u: string) => u === "urgente" ? "destructive" as const : u === "alta" ? "default" as const : "secondary" as const;

  const Icon = config.icon;

  // ──── Detail View ────
  if (selected) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Button variant="ghost" className="gap-2 text-sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {config.title} — {selected.numero_processo}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
            </div>
            <Badge variant={urgenciaColor(selected.urgencia)} className="text-xs">
              {selected.urgencia === "urgente" ? "URGENTE" : selected.urgencia === "alta" ? "Alta Prioridade" : "Normal"}
            </Badge>
          </div>

          {/* Process Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Dados do Processo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground text-xs">Entidade</span><p className="font-medium">{selected.entity_name}</p></div>
                <div><span className="text-muted-foreground text-xs">Exercício</span><p className="font-medium">{selected.ano_gerencia}</p></div>
                <div><span className="text-muted-foreground text-xs">Data Submissão</span><p className="font-medium">{formatDate(selected.data_submissao)}</p></div>
                <div><span className="text-muted-foreground text-xs">Completude</span><p className="font-medium">{selected.completude_documental}%</p></div>
                <div><span className="text-muted-foreground text-xs">Divisão</span><p className="font-medium">{selected.divisao_competente || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Secção</span><p className="font-medium">{selected.seccao_competente || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Coordenador</span><p className="font-medium">{selected.coordenador_equipa || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Etapa</span><Badge className="text-[10px] bg-primary">Etapa {config.etapa}</Badge></div>
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          {config.fields && config.fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" /> Formulário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {config.fields.map(f => (
                    <div key={f.key} className="space-y-2">
                      <Label className="text-xs font-semibold">{f.label} {f.required && "*"}</Label>
                      {f.type === "select" ? (
                        <Select value={fieldValues[f.key] || ""} onValueChange={v => setFieldValues(prev => ({ ...prev, [f.key]: v }))}>
                          <SelectTrigger><SelectValue placeholder={f.placeholder || `Seleccionar ${f.label.toLowerCase()}`} /></SelectTrigger>
                          <SelectContent>
                            {f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={fieldValues[f.key] || ""}
                          onChange={e => setFieldValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observations */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Observações</Label>
                <Textarea
                  placeholder="Observações ou instruções adicionais..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                {config.actions.map(action => (
                  <Button
                    key={action.label}
                    variant={action.variant || "default"}
                    disabled={!canAct(action) || acting}
                    className="gap-2"
                    onClick={() => setConfirmAction(action)}
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Confirmar Acção
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Confirma a acção <strong>{confirmAction?.label}</strong> no processo <strong>{selected?.numero_processo}</strong>?</p>
                <p className="text-xs text-muted-foreground mt-2">
                  O processo avançará para a Etapa {confirmAction?.nextEtapa}.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmAction && handleAction(confirmAction)} disabled={acting}>
                {acting ? "A processar..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    );
  }

  // ──── List View ────
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {config.title} — Etapa {config.etapa}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pendentes</p>
                  <p className="text-2xl font-bold text-primary mt-1">{processos.length}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Urgentes</p>
                  <p className="text-2xl font-bold text-destructive mt-1">
                    {processos.filter(p => p.urgencia === "urgente" || p.urgencia === "alta").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-destructive/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Perfil</p>
                  <p className="text-sm font-medium mt-1">{executadoPor}</p>
                  <p className="text-[10px] text-muted-foreground">{config.perfilExecutor}</p>
                </div>
                <UserCheck className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar por nº processo ou entidade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhum processo encontrado." : "Sem processos pendentes nesta etapa."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nº Processo</TableHead>
                    <TableHead className="text-xs">Entidade</TableHead>
                    <TableHead className="text-xs">Exercício</TableHead>
                    <TableHead className="text-xs">Urgência</TableHead>
                    <TableHead className="text-xs">Data Submissão</TableHead>
                    <TableHead className="text-xs text-right">Acção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelect(p)}>
                      <TableCell className="font-mono text-xs font-medium">{p.numero_processo}</TableCell>
                      <TableCell className="text-sm">{p.entity_name}</TableCell>
                      <TableCell className="text-sm">{p.ano_gerencia}</TableCell>
                      <TableCell><Badge variant={urgenciaColor(p.urgencia)} className="text-[10px]">{p.urgencia}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.data_submissao)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Icon className="h-3 w-3" /> Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
