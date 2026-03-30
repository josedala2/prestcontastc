import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui-custom/PageElements";
import {
  Clock, Send, Loader2, CheckCircle, Building2, FileText, Inbox, Search, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { avancarEtapaProcesso, gerarNumeroProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { useAuth } from "@/contexts/AuthContext";

interface ProcessoPendente {
  id: string;
  processo_id: string | null;
  acta_id: string;
  acta_numero: string;
  numero_processo: string;
  entity_id: string;
  entity_name: string;
  categoria_entidade: string;
  ano_gerencia: number;
  etapa_atual: number;
  estado: string;
  responsavel_atual: string | null;
  observacoes: string | null;
  data_submissao: string;
  created_at: string;
  completude_documental: number;
}

export function SecretariaPendentesTab() {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<ProcessoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<string[]>([]);
  const [filtroAno, setFiltroAno] = useState<string>("todos");
  const [filtroEntidade, setFiltroEntidade] = useState("");

  const isChefe = user?.role === "Chefe da Secretaria-Geral" ||
    user?.role === "Administrador do Sistema" ||
    user?.role === "Presidente do Tribunal de Contas";
  const isTecnicoSecretaria = user?.role === "Técnico da Secretaria-Geral";

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    const [actasResult, processosResult] = await Promise.all([
      supabase
        .from("actas_recepcao")
        .select("id, acta_numero, entity_id, entity_name, fiscal_year, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("processos")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (!actasResult.error && !processosResult.error && actasResult.data && processosResult.data) {
      const processosPorChave = new Map(
        (processosResult.data as any[]).map((processo) => [
          `${processo.entity_id}-${processo.ano_gerencia}`,
          processo,
        ])
      );

      const pendentes = actasResult.data
        .map((acta) => {
          const anoGerencia = Number(acta.fiscal_year);
          const processo = processosPorChave.get(`${acta.entity_id}-${anoGerencia}`);

          if (
            processo &&
            (
              processo.etapa_atual > 3 ||
              processo.estado === "em_analise" ||
              processo.estado === "arquivado" ||
              processo.estado === "aguardando_elementos" ||
              processo.estado === "devolvido" ||
              (processo.etapa_atual === 3 && processo.estado === "em_validacao")
            )
          ) {
            return null;
          }

          return {
            id: processo?.id ?? `acta-${acta.id}`,
            processo_id: processo?.id ?? null,
            acta_id: acta.id,
            acta_numero: acta.acta_numero,
            numero_processo: processo?.numero_processo ?? "Por gerar",
            entity_id: acta.entity_id,
            entity_name: acta.entity_name,
            categoria_entidade: processo?.categoria_entidade ?? "empresa_publica",
            ano_gerencia: anoGerencia,
            etapa_atual: processo?.etapa_atual ?? 3,
            estado: processo?.estado ?? "pendente",
            responsavel_atual: processo?.responsavel_atual ?? "Técnico da Secretaria-Geral",
            observacoes: processo?.observacoes ?? `Acta ${acta.acta_numero} gerada e pronta para encaminhamento.`,
            data_submissao: processo?.data_submissao ?? acta.created_at,
            created_at: processo?.created_at ?? acta.created_at,
            completude_documental: processo?.completude_documental ?? 100,
          } satisfies ProcessoPendente;
        })
        .filter((item): item is ProcessoPendente => item !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setProcessos(pendentes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const anosDisponiveis = useMemo(() => {
    const anos = [...new Set(processos.map((p) => p.ano_gerencia))].sort((a, b) => b - a);
    return anos;
  }, [processos]);

  const processosFiltrados = useMemo(() => {
    return processos.filter((p) => {
      if (filtroAno !== "todos" && p.ano_gerencia !== Number(filtroAno)) return false;
      if (filtroEntidade && !p.entity_name.toLowerCase().includes(filtroEntidade.toLowerCase())) return false;
      return true;
    });
  }, [processos, filtroAno, filtroEntidade]);

  const pendentesCount = processosFiltrados.filter(p => !enviados.includes(p.id)).length;

  const handleEnviarParaChefe = async (processo: ProcessoPendente) => {
    setEnviando(processo.id);
    try {
      let processoId = processo.processo_id;
      let numeroProcesso = processo.numero_processo;

      // Fetch entity tipologia to use as categoria_entidade
      let categoriaReal = processo.categoria_entidade;
      if (categoriaReal === "empresa_publica" || !categoriaReal) {
        const { data: entData } = await supabase
          .from("entities")
          .select("tipologia")
          .eq("id", processo.entity_id)
          .limit(1);
        if (entData && entData.length > 0) {
          categoriaReal = entData[0].tipologia;
        }
      }

      if (!processoId) {
        numeroProcesso = await gerarNumeroProcesso(processo.ano_gerencia);
        const { data: novoProcesso, error: novoProcessoError } = await supabase
          .from("processos")
          .insert({
            numero_processo: numeroProcesso,
            entity_id: processo.entity_id,
            entity_name: processo.entity_name,
            categoria_entidade: categoriaReal,
            ano_gerencia: processo.ano_gerencia,
            canal_entrada: "portal",
            etapa_atual: 3,
            estado: "em_validacao",
            responsavel_atual: "Chefe da Secretaria-Geral",
            submetido_por: "Técnico da Secretaria-Geral",
            observacoes: "Encaminhado para validação da Chefe da Secretaria-Geral",
            completude_documental: processo.completude_documental,
          } as any)
          .select("id, numero_processo")
          .single();

        if (novoProcessoError || !novoProcesso) throw novoProcessoError;

        processoId = novoProcesso.id;
        numeroProcesso = novoProcesso.numero_processo;

        await supabase.from("processo_historico").insert({
          processo_id: processoId,
          etapa_anterior: 1,
          etapa_seguinte: 3,
          estado_anterior: "submetido",
          estado_seguinte: "em_validacao",
          acao: "Acta gerada e processo encaminhado para validação da Chefe da Secretaria-Geral",
          executado_por: user?.role || "Técnico da Secretaria-Geral",
          perfil_executor: "Técnico da Secretaria-Geral",
          observacoes: `Encaminhamento originado a partir da acta ${processo.acta_numero}.`,
          documentos_gerados: ["Acta de Recepção"],
        } as any);
      } else {
        await avancarEtapaProcesso({
          processoId,
          novaEtapa: 3,
          novoEstado: "em_validacao",
          executadoPor: user?.role || "Técnico da Secretaria-Geral",
          perfilExecutor: "Técnico da Secretaria-Geral",
          observacoes: "Encaminhado para validação da Chefe da Secretaria-Geral",
        });

        await supabase.from("processos").update({
          responsavel_atual: "Chefe da Secretaria-Geral",
        } as any).eq("id", processoId);
      }

      // Generate activities
      try {
        await gerarAtividadesParaEvento("encaminhamento_validacao", processoId, {
          categoriaEntidade: processo.categoria_entidade || "empresa_publica",
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      // Notification
      try {
        await supabase.from("submission_notifications").insert({
          entity_id: processo.entity_id,
          entity_name: processo.entity_name,
          fiscal_year_id: `${processo.entity_id}-${processo.ano_gerencia}`,
          fiscal_year: String(processo.ano_gerencia),
          type: "encaminhamento_validacao",
          message: `Processo de ${processo.entity_name} (${processo.ano_gerencia}) encaminhado para validação`,
          detail: `O Técnico da Secretaria-Geral concluiu a verificação. Processo ${processo.numero_processo} aguarda aprovação da Chefe da Secretaria-Geral.`,
        } as any);
      } catch (err) {
        console.error("Erro ao criar notificação:", err);
      }

      setEnviados(prev => [...prev, processo.id]);
      setProcessos(prev => prev.filter((item) => item.id !== processo.id));
      toast.success(`Processo ${numeroProcesso} encaminhado para a Chefe da Secretaria-Geral`);
    } catch (err: any) {
      console.error("Erro ao encaminhar:", err);
      toast.error(`Erro ao encaminhar: ${err.message}`);
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Pendentes de Envio"
          value={pendentesCount}
          subtitle="aguardam encaminhamento"
          icon={<Clock className="h-5 w-5" />}
          variant={pendentesCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Enviados (sessão)"
          value={enviados.length}
          subtitle="encaminhados nesta sessão"
          icon={<Send className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total Processos"
          value={processos.length}
          subtitle="na etapa de validação"
          icon={<FileText className="h-5 w-5" />}
          variant="primary"
        />
      </div>

      {/* Chefe read-only notice */}
      {isChefe && !isTecnicoSecretaria && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4 text-primary shrink-0" />
          Modo de consulta — o encaminhamento é da responsabilidade do Técnico da Secretaria-Geral.
        </div>
      )}

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Processos Pendentes de Envio à Chefe da Secretaria
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Processos com acta gerada que aguardam encaminhamento para validação da Chefe da Secretaria-Geral.
          </p>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar entidade…"
                value={filtroEntidade}
                onChange={(e) => setFiltroEntidade(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anosDisponiveis.map((ano) => (
                    <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filtroAno !== "todos" || filtroEntidade) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setFiltroAno("todos"); setFiltroEntidade(""); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : processosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {processos.length === 0 ? "Nenhum processo pendente de envio." : "Nenhum resultado para os filtros aplicados."}
              </p>
              <p className="text-xs mt-1">
                {processos.length === 0 ? "Todos os processos foram encaminhados." : "Ajuste os filtros para ver mais resultados."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Data Recepção</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processosFiltrados.map((p) => {
                  const isEnviado = enviados.includes(p.id);
                  const isEnviando = enviando === p.id;
                  return (
                    <TableRow key={p.id} className={isEnviado ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-xs">
                        {p.numero_processo !== "Por gerar" ? p.numero_processo : p.acta_numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{p.entity_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.ano_gerencia}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-AO")}
                      </TableCell>
                      <TableCell>
                        {isEnviado ? (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <CheckCircle className="h-3 w-3" /> Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning/30 bg-warning/5">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEnviado ? (
                          <span className="text-xs text-muted-foreground">Encaminhado</span>
                        ) : (
                          <Button
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() => handleEnviarParaChefe(p)}
                            disabled={isEnviando || (isChefe && !isTecnicoSecretaria)}
                          >
                            {isEnviando ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Enviar para Chefe
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
