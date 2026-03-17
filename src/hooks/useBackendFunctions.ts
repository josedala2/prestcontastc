/**
 * Hooks para interagir com as funções de backend (RPC)
 */
import { supabase } from "@/integrations/supabase/client";

export async function gerarNumeroProcesso(ano: number): Promise<string> {
  const { data, error } = await supabase.rpc("gerar_numero_processo", { p_ano: ano });
  if (error) throw new Error(`Erro ao gerar número: ${error.message}`);
  return data as string;
}

export async function avancarEtapaProcesso(params: {
  processoId: string;
  novaEtapa: number;
  novoEstado: string;
  executadoPor: string;
  perfilExecutor?: string;
  observacoes?: string;
  documentosGerados?: string[];
}) {
  const { data, error } = await supabase.rpc("avancar_etapa_processo", {
    p_processo_id: params.processoId,
    p_nova_etapa: params.novaEtapa,
    p_novo_estado: params.novoEstado,
    p_executado_por: params.executadoPor,
    p_perfil_executor: params.perfilExecutor || null,
    p_observacoes: params.observacoes || null,
    p_documentos_gerados: params.documentosGerados || null,
  });
  if (error) throw new Error(`Erro ao avançar etapa: ${error.message}`);
  return data as { success: boolean; etapa_anterior: number; nova_etapa: number; estado: string };
}

export async function obterEstatisticasDashboard() {
  const { data, error } = await supabase.rpc("estatisticas_dashboard");
  if (error) throw new Error(`Erro ao obter estatísticas: ${error.message}`);
  return data as {
    total_processos: number;
    processos_por_estado: Record<string, number>;
    processos_por_etapa: Record<string, number>;
    total_atividades: number;
    atividades_pendentes: number;
    atividades_em_curso: number;
    atividades_concluidas: number;
    atividades_atrasadas: number;
    total_pareceres: number;
    total_actas: number;
    submissions_pendentes: number;
  };
}

export async function obterEstatisticasPorPerfil(perfil: string) {
  const { data, error } = await supabase.rpc("estatisticas_por_perfil", { p_perfil: perfil });
  if (error) throw new Error(`Erro ao obter estatísticas do perfil: ${error.message}`);
  return data as {
    total: number;
    pendentes: number;
    em_curso: number;
    concluidas: number;
    atrasadas: number;
  };
}

export async function obterPerfil(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function obterRolesUtilizador(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) return [];
  return data.map(r => r.role);
}
