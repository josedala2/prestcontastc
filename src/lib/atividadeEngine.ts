/**
 * Motor de geração automática de atividades por perfil
 * Gera atividades quando eventos ocorrem no fluxo de prestação de contas
 */
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOW_STAGES } from "@/types/workflow";
import { CATEGORIAS_EntIDADE } from "@/types/workflow";

export type AtividadeEstado =
  | "pendente"
  | "em_curso"
  | "concluida"
  | "devolvida"
  | "bloqueada"
  | "cancelada"
  | "aguardando_resposta"
  | "aguardando_documentos"
  | "aguardando_validacao";

export type AtividadePrioridade = "baixa" | "normal" | "alta" | "urgente";

export interface AtividadeInput {
  processo_id: string;
  etapa_fluxo: number;
  titulo: string;
  descricao: string;
  perfil_responsavel: string;
  utilizador_responsavel?: string;
  prioridade?: AtividadePrioridade;
  prazo_dias?: number;
  acao_esperada?: string;
  documentos_necessarios?: string[];
  documentos_gerados?: string[];
  canal_submissao?: "portal" | "presencial";
  tipo_evento?: string;
  categoria_entidade?: string;
  dependencia_atividade_id?: string;
  ordem?: number;
}

function prazo(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

// ─── REGRAS DE GERAÇÃO POR EVENTO ───

function gerarAtividadesSubmissao(
  processoId: string,
  canal: "portal" | "presencial",
  categoriaEntidade: string,
  checklistIncompleta: boolean
): AtividadeInput[] {
  const atividades: AtividadeInput[] = [];
  let ordem = 1;

  if (canal === "portal") {
    // Entidade já submeteu via portal
    atividades.push({
      processo_id: processoId,
      etapa_fluxo: 1,
      titulo: "Validar recepção do expediente",
      descricao: "Verificar o expediente submetido via portal e confirmar recepção no backoffice.",
      perfil_responsavel: "Técnico da Secretaria-Geral",
      prioridade: "normal",
      prazo_dias: 1,
      acao_esperada: "Validar e confirmar recepção",
      canal_submissao: canal,
      tipo_evento: "expediente_submetido",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    });
  } else {
    // Submissão presencial
    atividades.push({
      processo_id: processoId,
      etapa_fluxo: 1,
      titulo: "Registar expediente presencial",
      descricao: "Registar o expediente entregue presencialmente em nome da entidade.",
      perfil_responsavel: "Técnico da Secretaria-Geral",
      prioridade: "alta",
      prazo_dias: 1,
      acao_esperada: "Registar entrada e gerar acta de recebimento",
      documentos_gerados: ["Acta de Recebimento"],
      canal_submissao: canal,
      tipo_evento: "expediente_submetido",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    });

    atividades.push({
      processo_id: processoId,
      etapa_fluxo: 2,
      titulo: "Digitalizar documentos físicos",
      descricao: "Digitalizar todos os documentos entregues presencialmente e associar ao processo.",
      perfil_responsavel: "Técnico da Secretaria-Geral",
      prioridade: "normal",
      prazo_dias: 2,
      acao_esperada: "Digitalizar e anexar ficheiros",
      canal_submissao: canal,
      tipo_evento: "submissao_presencial",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    });

    atividades.push({
      processo_id: processoId,
      etapa_fluxo: 2,
      titulo: "Classificar e confirmar anexos",
      descricao: "Classificar os documentos digitalizados por categoria e confirmar completude.",
      perfil_responsavel: "Técnico da Secretaria-Geral",
      prioridade: "normal",
      prazo_dias: 2,
      acao_esperada: "Classificar anexos digitalizados",
      canal_submissao: canal,
      tipo_evento: "submissao_presencial",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    });
  }

  // Atividade de verificação documental (ambos os canais)
  atividades.push({
    processo_id: processoId,
    etapa_fluxo: 3,
    titulo: "Validar conformidade inicial",
    descricao: "Verificar se todos os documentos obrigatórios foram entregues conforme a checklist da categoria.",
    perfil_responsavel: "Chefe da Secretaria-Geral",
    prioridade: "normal",
    prazo_dias: 3,
    acao_esperada: "Aprovar conformidade ou devolver para correcção",
    canal_submissao: canal,
    tipo_evento: "expediente_submetido",
    categoria_entidade: categoriaEntidade,
    ordem: ordem++,
  });

  // Acompanhamento da entidade
  atividades.push({
    processo_id: processoId,
    etapa_fluxo: 1,
    titulo: "Acompanhar estado do processo",
    descricao: "Acompanhar o progresso do expediente submetido e responder a eventuais notificações.",
    perfil_responsavel: "Representante da Entidade",
    prioridade: "baixa",
    prazo_dias: 30,
    acao_esperada: "Acompanhar e responder notificações",
    canal_submissao: canal,
    tipo_evento: "expediente_submetido",
    categoria_entidade: categoriaEntidade,
    ordem: ordem++,
  });

  // Se checklist incompleta
  if (checklistIncompleta) {
    atividades.push({
      processo_id: processoId,
      etapa_fluxo: 3,
      titulo: "Devolver expediente para correcção",
      descricao: "A checklist documental está incompleta. Devolver ao remetente com indicação dos documentos em falta.",
      perfil_responsavel: "Chefe da Secretaria-Geral",
      prioridade: "alta",
      prazo_dias: 2,
      acao_esperada: "Devolver com observações",
      canal_submissao: canal,
      tipo_evento: "checklist_incompleta",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    });

    atividades.push({
      processo_id: processoId,
      etapa_fluxo: 1,
      titulo: "Corrigir submissão e anexar documentos em falta",
      descricao: "A entidade deve corrigir a submissão e anexar os documentos obrigatórios identificados como em falta.",
      perfil_responsavel: "Representante da Entidade",
      prioridade: "alta",
      prazo_dias: 15,
      acao_esperada: "Corrigir e resubmeter",
      canal_submissao: canal,
      tipo_evento: "checklist_incompleta",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    });
  }

  return atividades;
}

function gerarAtividadesValidacaoAprovada(processoId: string, categoriaEntidade: string): AtividadeInput[] {
  let ordem = 100;
  return [
    {
      processo_id: processoId,
      etapa_fluxo: 4,
      titulo: "Verificar documentos e confirmar checklist",
      descricao: "Conferir detalhadamente os documentos submetidos e confirmar checklist mínima.",
      perfil_responsavel: "Técnico da Contadoria Geral",
      prioridade: "normal",
      prazo_dias: 5,
      acao_esperada: "Verificar e encaminhar para autuação",
      tipo_evento: "validacao_aprovada",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 5,
      titulo: "Registar e autuar processo",
      descricao: "Gerar número único do processo, criar capa e preparar termos processuais.",
      perfil_responsavel: "Escrivão dos Autos",
      prioridade: "normal",
      prazo_dias: 3,
      acao_esperada: "Autuar processo e gerar número",
      documentos_gerados: ["Capa do Processo", "Termo de Autuação"],
      tipo_evento: "validacao_aprovada",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 6,
      titulo: "Distribuir processo à secção competente",
      descricao: "Analisar urgência e natureza do processo e distribuir para a secção competente.",
      perfil_responsavel: "Chefe de Divisão",
      prioridade: "normal",
      prazo_dias: 2,
      acao_esperada: "Distribuir para secção ou a si mesmo",
      tipo_evento: "validacao_aprovada",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 7,
      titulo: "Distribuir a técnico ou equipa",
      descricao: "Receber processo e distribuir a técnico de análise ou indicar coordenador.",
      perfil_responsavel: "Chefe de Secção",
      prioridade: "normal",
      prazo_dias: 2,
      acao_esperada: "Distribuir e indicar coordenador",
      tipo_evento: "validacao_aprovada",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 8,
      titulo: "Analisar conta e emitir parecer",
      descricao: "Analisar demonstrações financeiras, consultar anexos e emitir parecer individual.",
      perfil_responsavel: "Técnico de Análise",
      prioridade: "normal",
      prazo_dias: 15,
      acao_esperada: "Emitir parecer técnico",
      documentos_gerados: ["Parecer Individual"],
      tipo_evento: "validacao_aprovada",
      categoria_entidade: categoriaEntidade,
      ordem: ordem++,
    },
  ];
}

function gerarAtividadesAnalise(processoId: string): AtividadeInput[] {
  let ordem = 200;
  return [
    {
      processo_id: processoId,
      etapa_fluxo: 9,
      titulo: "Consolidar pareceres e emitir relatório síntese",
      descricao: "Consolidar pareceres individuais dos técnicos e produzir relatório síntese.",
      perfil_responsavel: "Coordenador de Equipa",
      prioridade: "normal",
      prazo_dias: 5,
      acao_esperada: "Emitir relatório síntese consolidado",
      documentos_gerados: ["Relatório Síntese"],
      tipo_evento: "analise_concluida",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 10,
      titulo: "Validar relatório consolidado",
      descricao: "Rever relatório síntese da secção e validar ou devolver para aperfeiçoamento.",
      perfil_responsavel: "Chefe de Divisão",
      prioridade: "normal",
      prazo_dias: 3,
      acao_esperada: "Validar ou devolver relatório",
      tipo_evento: "analise_concluida",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 11,
      titulo: "Rever processo e submeter ao Juiz",
      descricao: "Controlar qualidade, rever relatório síntese e submeter processo ao Juiz Relator.",
      perfil_responsavel: "Diretor dos Serviços Técnicos",
      prioridade: "alta",
      prazo_dias: 5,
      acao_esperada: "Assinar ofício de remessa e submeter",
      documentos_gerados: ["Ofício de Remessa"],
      tipo_evento: "analise_concluida",
      ordem: ordem++,
    },
  ];
}

function gerarAtividadesDecisaoJuiz(processoId: string): AtividadeInput[] {
  let ordem = 300;
  return [
    {
      processo_id: processoId,
      etapa_fluxo: 12,
      titulo: "Analisar processo e decidir",
      descricao: "Analisar processo, rever relatório síntese e proferir decisão sobre a conta.",
      perfil_responsavel: "Juiz Relator",
      prioridade: "alta",
      prazo_dias: 15,
      acao_esperada: "Decidir conta em termos ou não em termos",
      documentos_gerados: ["Decisão/Acórdão"],
      tipo_evento: "submissao_juiz",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 12,
      titulo: "Acompanhar análise do processo",
      descricao: "Consultar documentação e apoiar apreciação com o Juiz Relator.",
      perfil_responsavel: "Juiz Adjunto",
      prioridade: "normal",
      prazo_dias: 15,
      acao_esperada: "Consultar e apoiar apreciação",
      tipo_evento: "submissao_juiz",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 13,
      titulo: "Calcular emolumentos e emitir guia",
      descricao: "Calcular emolumentos devidos e emitir guia de cobrança.",
      perfil_responsavel: "Técnico da Secção de Custas e Emolumentos",
      prioridade: "normal",
      prazo_dias: 3,
      acao_esperada: "Emitir guia de cobrança",
      documentos_gerados: ["Guia de Cobrança"],
      tipo_evento: "decisao_juiz",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 14,
      titulo: "Emitir despacho de promoção",
      descricao: "Receber processo com decisão e guia, consultar dossiê e emitir despacho.",
      perfil_responsavel: "Ministério Público",
      prioridade: "normal",
      prazo_dias: 10,
      acao_esperada: "Emitir despacho de promoção",
      documentos_gerados: ["Despacho de Promoção"],
      tipo_evento: "decisao_juiz",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 15,
      titulo: "Cumprir despachos e notificar entidade",
      descricao: "Cumprir despachos posteriores e preparar notificação da entidade.",
      perfil_responsavel: "Escrivão dos Autos",
      prioridade: "normal",
      prazo_dias: 5,
      acao_esperada: "Preparar e remeter notificação",
      tipo_evento: "decisao_juiz",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 17,
      titulo: "Entregar notificação à entidade",
      descricao: "Entregar ofício, decisão e guia de cobrança à entidade notificada.",
      perfil_responsavel: "Oficial de Diligências",
      prioridade: "alta",
      prazo_dias: 5,
      acao_esperada: "Entregar e registar diligência",
      documentos_gerados: ["Certidão de Notificação"],
      tipo_evento: "decisao_juiz",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 16,
      titulo: "Receber decisão e efetuar pagamento",
      descricao: "Tomar conhecimento da decisão do Tribunal e efetuar pagamento dos emolumentos.",
      perfil_responsavel: "Representante da Entidade",
      prioridade: "alta",
      prazo_dias: 30,
      acao_esperada: "Pagar emolumentos e submeter comprovativo",
      tipo_evento: "decisao_juiz",
      ordem: ordem++,
    },
  ];
}

function gerarAtividadesPagamento(processoId: string): AtividadeInput[] {
  let ordem = 400;
  return [
    {
      processo_id: processoId,
      etapa_fluxo: 15,
      titulo: "Confirmar comprovativo de pagamento",
      descricao: "Verificar e confirmar comprovativo de pagamento dos emolumentos.",
      perfil_responsavel: "Escrivão dos Autos",
      prioridade: "alta",
      prazo_dias: 2,
      acao_esperada: "Confirmar e juntar aos autos",
      tipo_evento: "pagamento_recebido",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 18,
      titulo: "Remeter para arquivamento",
      descricao: "Após cumprimento final, remeter processo para arquivamento definitivo.",
      perfil_responsavel: "Escrivão dos Autos",
      prioridade: "normal",
      prazo_dias: 5,
      acao_esperada: "Arquivar processo",
      tipo_evento: "pagamento_recebido",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 18,
      titulo: "Decidir arquivamento final",
      descricao: "Confirmar o cumprimento de todas as obrigações e ordenar arquivamento.",
      perfil_responsavel: "Juiz Relator",
      prioridade: "normal",
      prazo_dias: 5,
      acao_esperada: "Ordenar arquivamento",
      tipo_evento: "pagamento_recebido",
      ordem: ordem++,
    },
  ];
}

function gerarAtividadesSolicitacaoElementos(processoId: string): AtividadeInput[] {
  let ordem = 500;
  return [
    {
      processo_id: processoId,
      etapa_fluxo: 8,
      titulo: "Emitir solicitação de elementos adicionais",
      descricao: "Preparar ofício de solicitação de elementos adicionais à entidade.",
      perfil_responsavel: "Técnico de Análise",
      prioridade: "alta",
      prazo_dias: 3,
      acao_esperada: "Redigir solicitação",
      documentos_gerados: ["Ofício de Solicitação de Elementos"],
      tipo_evento: "falta_elementos",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 11,
      titulo: "Assinar ofício de solicitação de elementos",
      descricao: "Rever e assinar ofício de solicitação antes do envio à entidade.",
      perfil_responsavel: "Diretor dos Serviços Técnicos",
      prioridade: "alta",
      prazo_dias: 2,
      acao_esperada: "Assinar ofício",
      tipo_evento: "falta_elementos",
      ordem: ordem++,
    },
    {
      processo_id: processoId,
      etapa_fluxo: 1,
      titulo: "Responder à solicitação de elementos",
      descricao: "Enviar documentos complementares solicitados pelo Tribunal.",
      perfil_responsavel: "Representante da Entidade",
      prioridade: "alta",
      prazo_dias: 15,
      acao_esperada: "Enviar documentos complementares",
      tipo_evento: "falta_elementos",
      ordem: ordem++,
    },
  ];
}

// ─── API PÚBLICA ───

export async function gerarAtividadesParaEvento(
  evento: string,
  processoId: string,
  options: {
    canal?: "portal" | "presencial";
    categoriaEntidade?: string;
    checklistIncompleta?: boolean;
  } = {}
): Promise<number> {
  const { canal = "portal", categoriaEntidade = "resolucao_1_17", checklistIncompleta = false } = options;

  let inputs: AtividadeInput[] = [];

  switch (evento) {
    case "expediente_submetido":
      inputs = gerarAtividadesSubmissao(processoId, canal, categoriaEntidade, checklistIncompleta);
      break;
    case "validacao_aprovada":
      inputs = gerarAtividadesValidacaoAprovada(processoId, categoriaEntidade);
      break;
    case "analise_concluida":
      inputs = gerarAtividadesAnalise(processoId);
      break;
    case "submissao_juiz":
    case "decisao_juiz":
      inputs = gerarAtividadesDecisaoJuiz(processoId);
      break;
    case "pagamento_recebido":
      inputs = gerarAtividadesPagamento(processoId);
      break;
    case "falta_elementos":
      inputs = gerarAtividadesSolicitacaoElementos(processoId);
      break;
    default:
      console.warn(`Evento desconhecido: ${evento}`);
      return 0;
  }

  if (inputs.length === 0) return 0;

  const rows = inputs.map((a) => ({
    processo_id: a.processo_id,
    etapa_fluxo: a.etapa_fluxo,
    titulo: a.titulo,
    descricao: a.descricao,
    perfil_responsavel: a.perfil_responsavel,
    utilizador_responsavel: a.utilizador_responsavel || null,
    prioridade: a.prioridade || "normal",
    prazo: a.prazo_dias ? prazo(a.prazo_dias) : null,
    estado: "pendente",
    acao_esperada: a.acao_esperada || null,
    documentos_necessarios: a.documentos_necessarios || null,
    documentos_gerados: a.documentos_gerados || null,
    canal_submissao: a.canal_submissao || canal,
    tipo_evento: a.tipo_evento || evento,
    categoria_entidade: a.categoria_entidade || categoriaEntidade,
    dependencia_atividade_id: a.dependencia_atividade_id || null,
    ordem: a.ordem || 0,
  }));

  const { error } = await supabase.from("atividades").insert(rows as any);
  if (error) {
    console.error("Erro ao gerar atividades:", error);
    return 0;
  }

  return rows.length;
}

export async function atualizarEstadoAtividade(
  atividadeId: string,
  novoEstado: AtividadeEstado,
  executadoPor: string,
  perfilExecutor?: string,
  observacoes?: string
): Promise<boolean> {
  // Get current state
  const { data: atividade } = await supabase
    .from("atividades")
    .select("estado")
    .eq("id", atividadeId)
    .single();

  if (!atividade) return false;

  const estadoAnterior = (atividade as any).estado;

  // Update atividade
  const updates: Record<string, any> = { estado: novoEstado, updated_at: new Date().toISOString() };
  if (novoEstado === "em_curso" && !atividade) updates.data_inicio = new Date().toISOString();
  if (novoEstado === "concluida") updates.data_conclusao = new Date().toISOString();
  if (novoEstado === "em_curso") updates.data_inicio = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("atividades")
    .update(updates)
    .eq("id", atividadeId);

  if (updateError) {
    console.error("Erro ao atualizar atividade:", updateError);
    return false;
  }

  // Insert history
  await supabase.from("atividade_historico").insert({
    atividade_id: atividadeId,
    estado_anterior: estadoAnterior,
    estado_novo: novoEstado,
    executado_por: executadoPor,
    perfil_executor: perfilExecutor || null,
    observacoes: observacoes || null,
  } as any);

  return true;
}

export async function obterAtividadesPorPerfil(perfil: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("atividades")
    .select("*")
    .eq("perfil_responsavel", perfil)
    .not("estado", "in", '("concluida","cancelada")')
    .order("prioridade", { ascending: true })
    .order("prazo", { ascending: true });

  if (error) {
    console.error("Erro ao obter atividades:", error);
    return [];
  }
  return data || [];
}

export async function obterAtividadesPorProcesso(processoId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("atividades")
    .select("*")
    .eq("processo_id", processoId)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao obter atividades:", error);
    return [];
  }
  return data || [];
}

export const ESTADO_LABELS: Record<AtividadeEstado, { label: string; color: string; bgColor: string }> = {
  pendente: { label: "Pendente", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  em_curso: { label: "Em Curso", color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  concluida: { label: "Concluída", color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  devolvida: { label: "Devolvida", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  bloqueada: { label: "Bloqueada", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
  cancelada: { label: "Cancelada", color: "text-muted-foreground", bgColor: "bg-muted" },
  aguardando_resposta: { label: "Aguardando Resposta", color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  aguardando_documentos: { label: "Aguardando Documentos", color: "text-indigo-700 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  aguardando_validacao: { label: "Aguardando Validação", color: "text-cyan-700 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
};

export const PRIORIDADE_LABELS: Record<AtividadePrioridade, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "text-muted-foreground" },
  normal: { label: "Normal", color: "text-blue-600" },
  alta: { label: "Alta", color: "text-orange-600" },
  urgente: { label: "Urgente", color: "text-red-600" },
};
