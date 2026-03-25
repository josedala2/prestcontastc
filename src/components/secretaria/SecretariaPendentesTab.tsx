import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/ui-custom/PageElements";
import {
  Clock, Send, Loader2, CheckCircle, Building2, FileText, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { useAuth } from "@/contexts/AuthContext";

interface ProcessoPendente {
  id: string;
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

  const isChefe = user?.role === "Chefe da Secretaria-Geral" ||
    user?.role === "Administrador do Sistema" ||
    user?.role === "Presidente do Tribunal de Contas";
  const isTecnicoSecretaria = user?.role === "Técnico da Secretaria-Geral";

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 3)
      .eq("estado", "pendente")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProcessos(data as unknown as ProcessoPendente[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const pendentesCount = processos.filter(p => !enviados.includes(p.id)).length;

  const handleEnviarParaChefe = async (processo: ProcessoPendente) => {
    setEnviando(processo.id);
    try {
      await avancarEtapaProcesso({
        processoId: processo.id,
        novaEtapa: 3,
        novoEstado: "em_validacao",
        executadoPor: user?.role || "Técnico da Secretaria-Geral",
        perfilExecutor: "Técnico da Secretaria-Geral",
        observacoes: "Encaminhado para validação da Chefe da Secretaria-Geral",
      });

      // Update responsavel_atual
      await supabase.from("processos").update({
        responsavel_atual: "Chefe da Secretaria-Geral",
      } as any).eq("id", processo.id);

      // Generate activities
      try {
        await gerarAtividadesParaEvento("validacao_aprovada", processo.id, {
          categoriaEntidade: processo.categoria_entidade || "resolucao_1_17",
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
      toast.success(`Processo ${processo.numero_processo} encaminhado para a Chefe da Secretaria-Geral`);
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : processos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Nenhum processo pendente de envio.</p>
              <p className="text-xs mt-1">Todos os processos foram encaminhados.</p>
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
                {processos.map((p) => {
                  const isEnviado = enviados.includes(p.id);
                  const isEnviando = enviando === p.id;
                  return (
                    <TableRow key={p.id} className={isEnviado ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-xs">{p.numero_processo}</TableCell>
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
