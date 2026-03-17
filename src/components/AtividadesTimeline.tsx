/**
 * Timeline de atividades dentro de um processo
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Play, CheckCircle, RotateCcw, Lock, XCircle, MessageSquare, FileText, Eye,
  CalendarDays, AlertTriangle, ChevronDown, ChevronUp, User,
} from "lucide-react";
import { ESTADO_LABELS, PRIORIDADE_LABELS, type AtividadeEstado } from "@/lib/atividadeEngine";
import { WORKFLOW_STAGES } from "@/types/workflow";

const estadoIcons: Record<string, typeof Clock> = {
  pendente: Clock,
  em_curso: Play,
  concluida: CheckCircle,
  devolvida: RotateCcw,
  bloqueada: Lock,
  cancelada: XCircle,
  aguardando_resposta: MessageSquare,
  aguardando_documentos: FileText,
  aguardando_validacao: Eye,
};

interface Props {
  processoId: string;
  compact?: boolean;
}

export function AtividadesTimeline({ processoId, compact }: Props) {
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("atividades")
        .select("*")
        .eq("processo_id", processoId)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      setAtividades(data || []);
      setLoading(false);
    };
    load();
  }, [processoId]);

  if (loading) return <p className="text-xs text-muted-foreground py-4 text-center">A carregar atividades...</p>;
  if (atividades.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">Sem atividades geradas para este processo.</p>;

  const concluidas = atividades.filter(a => a.estado === "concluida").length;
  const total = atividades.length;
  const progresso = Math.round((concluidas / total) * 100);
  const stageName = (id: number) => WORKFLOW_STAGES.find(s => s.id === id)?.nome || `Etapa ${id}`;

  // Group by etapa
  const byEtapa = atividades.reduce((acc: Record<number, any[]>, a) => {
    if (!acc[a.etapa_fluxo]) acc[a.etapa_fluxo] = [];
    acc[a.etapa_fluxo].push(a);
    return acc;
  }, {});

  const displayed = expanded ? atividades : atividades.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Atividades do Processo</span>
          <Badge variant="outline" className="text-[10px]">{concluidas}/{total} concluídas ({progresso}%)</Badge>
        </div>
        {compact && atividades.length > 5 && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setExpanded(!expanded)}>
            {expanded ? <><ChevronUp className="h-3 w-3" /> Recolher</> : <><ChevronDown className="h-3 w-3" /> Ver todas</>}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${progresso}%` }} />
      </div>

      {/* Timeline */}
      <div className="relative ml-4">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
        {displayed.map((a, i) => {
          const est = ESTADO_LABELS[a.estado as AtividadeEstado] || ESTADO_LABELS.pendente;
          const Icon = estadoIcons[a.estado] || Clock;
          const overdue = a.prazo && new Date(a.prazo) < new Date() && !["concluida", "cancelada"].includes(a.estado);

          return (
            <div key={a.id} className="relative pl-6 pb-4 last:pb-0">
              <div className={`absolute left-0 top-1 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center ${est.bgColor} border-2 border-background`}>
                <Icon className={`h-2.5 w-2.5 ${est.color}`} />
              </div>
              <div className={`p-2.5 rounded-lg border text-sm ${overdue ? "border-destructive/40 bg-destructive/5" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm leading-tight">{a.titulo}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={`text-[9px] px-1.5 py-0 ${est.bgColor} ${est.color} border-0`}>{est.label}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <User className="h-2.5 w-2.5" /> {a.perfil_responsavel}
                      </span>
                    </div>
                  </div>
                  {a.prazo && (
                    <span className={`text-[10px] whitespace-nowrap flex items-center gap-0.5 ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      <CalendarDays className="h-2.5 w-2.5" />
                      {new Date(a.prazo).toLocaleDateString("pt-AO")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
