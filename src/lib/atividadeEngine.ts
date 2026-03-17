/**
 * Motor de geração automática de atividades por perfil
 * Gera atividades quando eventos ocorrem no fluxo de prestação de contas
 * 
 * Perfis suportados (18):
 *  1. Representante da Entidade
 *  2. Técnico da Secretaria-Geral
 *  3. Chefe da Secretaria-Geral
 *  4. Técnico da Contadoria Geral
 *  5. Escrivão dos Autos
 *  6. Chefe de Divisão
 *  7. Chefe de Secção
 *  8. Técnico de Análise
 *  9. Coordenador de Equipa
 * 10. Diretor dos Serviços Técnicos (DST)
 * 11. Juiz Relator
 * 12. Juiz Adjunto
 * 13. Técnico da Secção de Custas e Emolumentos
 * 14. Ministério Público
 * 15. Oficial de Diligências
 * 16. Presidente da Câmara
 * 17. Presidente do Tribunal de Contas
 * 18. Administrador do Sistema
 */
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOW_STAGES } from "@/types/workflow";
import { CATEGORIAS_ENTIDADE } from "@/types/workflow";

// ─── TIPOS ───

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

// ─── PERFIS ───

export const PERFIS_WORKFLOW = [
  "Representante da Entidade",
  "Técnico da Secretaria-Geral",
  "Chefe da Secretaria-Geral",
  "Técnico da Contadoria Geral",
  "Escrivão dos Autos",
  "Chefe de Divisão",
  "Chefe de Secção",
  "Técnico de Análise",
  "Coordenador de Equipa",
  "Diretor dos Serviços Técnicos",
  "Juiz Relator",
  "Juiz Adjunto",
  "Técnico da Secção de Custas e Emolumentos",
  "Ministério Público",
  "Oficial de Diligências",
  "Presidente da Câmara",
  "Presidente do Tribunal de Contas",
  "Administrador do Sistema",
] as const;

export type PerfilWorkflow = typeof PERFIS_WORKFLOW[number];

// ─── EVENTOS ───

export const EVENTOS_WORKFLOW = [
  "expediente_submetido",
  "submissao_presencial",
  "checklist_incompleta",
  "validacao_aprovada",
  "validacao_reprovada",
  "autuacao_concluida",
  "distribuicao_divisao",
  "distribuicao_seccao",
  "analise_concluida",
  "falta_elementos",
  "relatorio_sintese_pronto",
  "validacao_seccao_aprovada",
  "validacao_divisao_aprovada",
  "controle_qualidade_aprovado",
  "submissao_juiz",
  "decisao_juiz",
  "contraditorio_ordenado",
  "diligencia_solicitada",
  "emolumentos_calculados",
  "despacho_mp",
  "pagamento_recebido",
  "notificacao_expedida",
  "arquivamento",
] as const;

export type EventoWorkflow = typeof EVENTOS_WORKFLOW[number];

function prazo(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

// Helper to create activity input
function act(
  processoId: string,
  etapa: number,
  titulo: string,
  descricao: string,
  perfil: string,
  opts: Partial<Omit<AtividadeInput, "processo_id" | "etapa_fluxo" | "titulo" | "descricao" | "perfil_responsavel">> = {}
): AtividadeInput {
  return {
    processo_id: processoId,
    etapa_fluxo: etapa,
    titulo,
    descricao,
    perfil_responsavel: perfil,
    prioridade: "normal",
    ...opts,
  };
}

// ═══════════════════════════════════════════════════════════════
// REGRAS DE GERAÇÃO POR EVENTO
// ═══════════════════════════════════════════════════════════════

function gerarAtividadesSubmissaoPortal(
  processoId: string,
  categoriaEntidade: string,
  checklistIncompleta: boolean
): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 1;

  // ── Representante da Entidade ──
  a.push(act(processoId, 1, "Acompanhar estado do processo",
    "Acompanhar o progresso do expediente submetido e responder a eventuais notificações.",
    "Representante da Entidade",
    { prioridade: "baixa", prazo_dias: 30, acao_esperada: "Acompanhar e responder notificações", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
  ));

  // ── Técnico da Secretaria-Geral ──
  a.push(act(processoId, 1, "Validar recepção do expediente via portal",
    "Verificar o expediente submetido via portal e confirmar recepção no backoffice.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 1, acao_esperada: "Validar e confirmar recepção", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
  ));

  a.push(act(processoId, 2, "Classificar e indexar anexos digitais",
    "Classificar os documentos submetidos via portal por categoria e verificar integridade dos ficheiros.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 2, acao_esperada: "Classificar e indexar documentos", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
  ));

  a.push(act(processoId, 2, "Encaminhar expediente para validação da Secretaria",
    "Após classificação, encaminhar o expediente para o Chefe da Secretaria-Geral para validação de conformidade.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 1, acao_esperada: "Encaminhar para validação", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
  ));

  // ── Chefe da Secretaria-Geral ──
  a.push(act(processoId, 3, "Validar conformidade inicial do expediente",
    "Verificar se todos os documentos obrigatórios foram entregues conforme a checklist da categoria.",
    "Chefe da Secretaria-Geral",
    { prazo_dias: 3, acao_esperada: "Aprovar conformidade ou devolver para correcção", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
  ));

  // ── Se checklist incompleta ──
  if (checklistIncompleta) {
    a.push(act(processoId, 3, "Devolver expediente para correcção",
      "A checklist documental está incompleta. Devolver ao remetente com indicação dos documentos em falta.",
      "Chefe da Secretaria-Geral",
      { prioridade: "alta", prazo_dias: 2, acao_esperada: "Devolver com observações", tipo_evento: "checklist_incompleta", categoria_entidade: categoriaEntidade, ordem: o++ }
    ));

    a.push(act(processoId, 1, "Corrigir submissão e anexar documentos em falta",
      "A entidade deve corrigir a submissão e anexar os documentos obrigatórios identificados como em falta.",
      "Representante da Entidade",
      { prioridade: "alta", prazo_dias: 15, acao_esperada: "Corrigir e resubmeter", tipo_evento: "checklist_incompleta", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
    ));

    a.push(act(processoId, 1, "Anexar documentos em falta",
      "Reunir e submeter os documentos obrigatórios pendentes conforme indicado na notificação.",
      "Representante da Entidade",
      { prioridade: "alta", prazo_dias: 15, acao_esperada: "Anexar documentos", tipo_evento: "checklist_incompleta", categoria_entidade: categoriaEntidade, canal_submissao: "portal", ordem: o++ }
    ));
  }

  return a;
}

function gerarAtividadesSubmissaoPresencial(
  processoId: string,
  categoriaEntidade: string,
  checklistIncompleta: boolean
): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 1;

  // ── Técnico da Secretaria-Geral ──
  a.push(act(processoId, 1, "Registar expediente presencial",
    "Registar o expediente entregue presencialmente em nome da entidade.",
    "Técnico da Secretaria-Geral",
    { prioridade: "alta", prazo_dias: 1, acao_esperada: "Registar entrada e gerar acta de recebimento", documentos_gerados: ["Acta de Recebimento"], canal_submissao: "presencial", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 1, "Anexar documentos entregues presencialmente",
    "Receber e organizar os documentos físicos entregues pelo portador.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 1, acao_esperada: "Organizar e registar documentos físicos", canal_submissao: "presencial", tipo_evento: "submissao_presencial", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 2, "Digitalizar documentos físicos",
    "Digitalizar todos os documentos entregues presencialmente e associar ao processo.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 2, acao_esperada: "Digitalizar e anexar ficheiros", canal_submissao: "presencial", tipo_evento: "submissao_presencial", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 2, "Confirmar anexação de todos os documentos físicos",
    "Verificar que todos os documentos físicos foram digitalizados e associados ao processo.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 2, acao_esperada: "Confirmar completude da digitalização", canal_submissao: "presencial", tipo_evento: "submissao_presencial", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 2, "Classificar e indexar anexos digitalizados",
    "Classificar os documentos digitalizados por categoria e confirmar completude.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 2, acao_esperada: "Classificar anexos digitalizados", canal_submissao: "presencial", tipo_evento: "submissao_presencial", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 2, "Encaminhar expediente para validação da Secretaria",
    "Após classificação, encaminhar o expediente para o Chefe da Secretaria-Geral.",
    "Técnico da Secretaria-Geral",
    { prazo_dias: 1, acao_esperada: "Encaminhar para validação", tipo_evento: "submissao_presencial", categoria_entidade: categoriaEntidade, canal_submissao: "presencial", ordem: o++ }
  ));

  // ── Chefe da Secretaria-Geral ──
  a.push(act(processoId, 3, "Validar conformidade inicial do expediente",
    "Verificar se todos os documentos obrigatórios foram entregues conforme a checklist.",
    "Chefe da Secretaria-Geral",
    { prazo_dias: 3, acao_esperada: "Aprovar conformidade ou devolver para correcção", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "presencial", ordem: o++ }
  ));

  a.push(act(processoId, 3, "Verificar documentos obrigatórios entregues",
    "Conferir lista de documentos obrigatórios da categoria contra os documentos recebidos.",
    "Chefe da Secretaria-Geral",
    { prazo_dias: 2, acao_esperada: "Confirmar checklist completa", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "presencial", ordem: o++ }
  ));

  // ── Representante da Entidade ──
  a.push(act(processoId, 1, "Acompanhar estado do processo",
    "Acompanhar o progresso do expediente submetido presencialmente.",
    "Representante da Entidade",
    { prioridade: "baixa", prazo_dias: 30, acao_esperada: "Acompanhar e responder notificações", tipo_evento: "expediente_submetido", categoria_entidade: categoriaEntidade, canal_submissao: "presencial", ordem: o++ }
  ));

  // ── Se checklist incompleta ──
  if (checklistIncompleta) {
    a.push(act(processoId, 3, "Devolver expediente para correcção",
      "A checklist documental está incompleta. Devolver ao remetente com observações.",
      "Chefe da Secretaria-Geral",
      { prioridade: "alta", prazo_dias: 2, acao_esperada: "Devolver com observações", tipo_evento: "checklist_incompleta", categoria_entidade: categoriaEntidade, ordem: o++ }
    ));

    a.push(act(processoId, 1, "Corrigir submissão e anexar documentos em falta",
      "Corrigir a submissão e entregar os documentos obrigatórios identificados como em falta.",
      "Representante da Entidade",
      { prioridade: "alta", prazo_dias: 15, acao_esperada: "Corrigir e resubmeter", tipo_evento: "checklist_incompleta", categoria_entidade: categoriaEntidade, ordem: o++ }
    ));
  }

  return a;
}

// ── Evento: Validação Aprovada → Contadoria, Autuação, Distribuição, Análise ──
function gerarAtividadesValidacaoAprovada(processoId: string, categoriaEntidade: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 100;

  // ── Chefe da Secretaria-Geral ──
  a.push(act(processoId, 3, "Aprovar e encaminhar para Contadoria Geral",
    "Conformidade documental aprovada. Encaminhar o expediente para a Contadoria Geral.",
    "Chefe da Secretaria-Geral",
    { prazo_dias: 1, acao_esperada: "Encaminhar para Contadoria", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  // ── Técnico da Contadoria Geral ──
  a.push(act(processoId, 4, "Verificar documentos submetidos",
    "Conferir detalhadamente os documentos submetidos e verificar autenticidade.",
    "Técnico da Contadoria Geral",
    { prazo_dias: 5, acao_esperada: "Verificar documentação", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 4, "Confirmar checklist mínima",
    "Confirmar se a checklist mínima da categoria está cumprida.",
    "Técnico da Contadoria Geral",
    { prazo_dias: 3, acao_esperada: "Confirmar checklist", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 4, "Identificar processo novo ou existente",
    "Verificar se é um processo novo ou documento a juntar a processo já em curso.",
    "Técnico da Contadoria Geral",
    { prazo_dias: 2, acao_esperada: "Identificar e classificar", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 4, "Encaminhar para registo e autuação",
    "Documentação verificada. Encaminhar para o Escrivão dos Autos para registo e autuação.",
    "Técnico da Contadoria Geral",
    { prazo_dias: 1, acao_esperada: "Encaminhar para autuação", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  // ── Escrivão dos Autos ──
  a.push(act(processoId, 5, "Registar e autuar processo",
    "Gerar número único do processo, criar capa e preparar termos processuais.",
    "Escrivão dos Autos",
    { prazo_dias: 3, acao_esperada: "Autuar processo e gerar número", documentos_gerados: ["Capa do Processo", "Termo de Autuação"], tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 5, "Confirmar pesquisa de conta já existente",
    "Pesquisar se existe conta anterior para esta entidade e exercício.",
    "Escrivão dos Autos",
    { prazo_dias: 1, acao_esperada: "Confirmar resultado da pesquisa", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 5, "Gerar capa do processo e termos processuais",
    "Preparar a capa oficial do processo e os termos processuais iniciais.",
    "Escrivão dos Autos",
    { prazo_dias: 2, acao_esperada: "Gerar documentos processuais", documentos_gerados: ["Capa do Processo"], tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  // ── Chefe de Divisão ──
  a.push(act(processoId, 6, "Receber e analisar processo autuado",
    "Receber processo autuado, analisar urgência e natureza.",
    "Chefe de Divisão",
    { prazo_dias: 2, acao_esperada: "Analisar e preparar distribuição", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 6, "Distribuir para secção competente",
    "Distribuir o processo para a secção competente ou a si mesmo, se necessário.",
    "Chefe de Divisão",
    { prazo_dias: 2, acao_esperada: "Distribuir para secção ou a si mesmo", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  // ── Chefe de Secção ──
  a.push(act(processoId, 7, "Receber processo da divisão",
    "Receber o processo distribuído pela divisão competente.",
    "Chefe de Secção",
    { prazo_dias: 1, acao_esperada: "Acusar recepção do processo", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 7, "Distribuir a técnico ou equipa de análise",
    "Designar técnico de análise e/ou indicar coordenador de equipa.",
    "Chefe de Secção",
    { prazo_dias: 2, acao_esperada: "Distribuir e indicar coordenador", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  // ── Técnico de Análise ──
  a.push(act(processoId, 8, "Analisar conta e demonstrações financeiras",
    "Analisar demonstrações financeiras, consultar anexos e documentos de suporte.",
    "Técnico de Análise",
    { prazo_dias: 15, acao_esperada: "Concluir análise técnica", tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 8, "Emitir parecer individual",
    "Elaborar parecer técnico individual com base na análise efectuada.",
    "Técnico de Análise",
    { prazo_dias: 15, acao_esperada: "Emitir parecer técnico", documentos_gerados: ["Parecer Individual"], tipo_evento: "validacao_aprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  return a;
}

// ── Evento: Análise identifica falta de elementos ──
function gerarAtividadesFaltaElementos(processoId: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 500;

  a.push(act(processoId, 8, "Identificar elementos em falta",
    "Documentar de forma detalhada os elementos adicionais necessários para a análise.",
    "Técnico de Análise",
    { prioridade: "alta", prazo_dias: 2, acao_esperada: "Listar elementos em falta", tipo_evento: "falta_elementos", ordem: o++ }
  ));

  a.push(act(processoId, 8, "Emitir solicitação de elementos adicionais",
    "Preparar ofício de solicitação de elementos adicionais à entidade.",
    "Técnico de Análise",
    { prioridade: "alta", prazo_dias: 3, acao_esperada: "Redigir solicitação", documentos_gerados: ["Ofício de Solicitação de Elementos"], tipo_evento: "falta_elementos", ordem: o++ }
  ));

  a.push(act(processoId, 11, "Assinar ofício de solicitação de elementos",
    "Rever e assinar ofício de solicitação antes do envio à entidade.",
    "Diretor dos Serviços Técnicos",
    { prioridade: "alta", prazo_dias: 2, acao_esperada: "Assinar ofício", tipo_evento: "falta_elementos", ordem: o++ }
  ));

  a.push(act(processoId, 17, "Notificar entidade sobre solicitação de elementos",
    "Entregar ofício de solicitação de elementos à entidade.",
    "Oficial de Diligências",
    { prioridade: "alta", prazo_dias: 5, acao_esperada: "Notificar entidade", tipo_evento: "falta_elementos", ordem: o++ }
  ));

  a.push(act(processoId, 1, "Responder à solicitação de elementos",
    "Enviar documentos complementares solicitados pelo Tribunal.",
    "Representante da Entidade",
    { prioridade: "alta", prazo_dias: 15, acao_esperada: "Enviar documentos complementares", tipo_evento: "falta_elementos", ordem: o++ }
  ));

  a.push(act(processoId, 1, "Enviar comprovativo de pagamento adicional",
    "Se aplicável, enviar comprovativo de pagamento adicional.",
    "Representante da Entidade",
    { prioridade: "normal", prazo_dias: 15, acao_esperada: "Enviar comprovativo", tipo_evento: "falta_elementos", ordem: o++ }
  ));

  return a;
}

// ── Evento: Análise concluída → Consolidação, Validações, Controle de Qualidade ──
function gerarAtividadesAnaliseConcluida(processoId: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 200;

  // ── Coordenador de Equipa ──
  a.push(act(processoId, 9, "Consolidar pareceres individuais",
    "Reunir e consolidar todos os pareceres individuais dos técnicos.",
    "Coordenador de Equipa",
    { prazo_dias: 5, acao_esperada: "Consolidar pareceres", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  a.push(act(processoId, 9, "Validar coerência técnica dos pareceres",
    "Verificar coerência e consistência entre os pareceres individuais.",
    "Coordenador de Equipa",
    { prazo_dias: 3, acao_esperada: "Validar coerência", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  a.push(act(processoId, 9, "Emitir relatório síntese consolidado",
    "Produzir relatório síntese consolidado com base nos pareceres validados.",
    "Coordenador de Equipa",
    { prazo_dias: 5, acao_esperada: "Emitir relatório síntese consolidado", documentos_gerados: ["Relatório Síntese"], tipo_evento: "analise_concluida", ordem: o++ }
  ));

  a.push(act(processoId, 9, "Submeter relatório para validação da secção",
    "Submeter relatório consolidado ao Chefe de Secção para validação.",
    "Coordenador de Equipa",
    { prazo_dias: 1, acao_esperada: "Submeter para validação", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  // ── Chefe de Secção ──
  a.push(act(processoId, 9, "Validar relatório síntese da equipa",
    "Rever o relatório síntese consolidado e validar ou devolver para melhoria.",
    "Chefe de Secção",
    { prazo_dias: 3, acao_esperada: "Validar ou devolver relatório", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  // ── Chefe de Divisão ──
  a.push(act(processoId, 10, "Validar relatório consolidado da secção",
    "Rever relatório síntese vindo da secção e validar ou devolver para aperfeiçoamento.",
    "Chefe de Divisão",
    { prazo_dias: 3, acao_esperada: "Validar ou devolver relatório", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  // ── Diretor dos Serviços Técnicos ──
  a.push(act(processoId, 11, "Controlar qualidade do processo",
    "Rever a qualidade global do processo e do relatório síntese.",
    "Diretor dos Serviços Técnicos",
    { prioridade: "alta", prazo_dias: 5, acao_esperada: "Verificar qualidade", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  a.push(act(processoId, 11, "Rever relatório síntese final",
    "Rever relatório síntese antes da submissão ao Juiz Relator.",
    "Diretor dos Serviços Técnicos",
    { prioridade: "alta", prazo_dias: 3, acao_esperada: "Rever e aprovar relatório", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  a.push(act(processoId, 11, "Articular aperfeiçoamentos com chefias",
    "Se necessário, coordenar aperfeiçoamentos ao relatório com Chefes de Divisão e Secção.",
    "Diretor dos Serviços Técnicos",
    { prazo_dias: 3, acao_esperada: "Coordenar melhorias", tipo_evento: "analise_concluida", ordem: o++ }
  ));

  a.push(act(processoId, 11, "Submeter processo ao Juiz Relator e Juiz Adjunto",
    "Assinar ofício de remessa e submeter processo ao Juiz Relator.",
    "Diretor dos Serviços Técnicos",
    { prioridade: "alta", prazo_dias: 2, acao_esperada: "Assinar ofício de remessa e submeter", documentos_gerados: ["Ofício de Remessa"], tipo_evento: "analise_concluida", ordem: o++ }
  ));

  return a;
}

// ── Evento: Submissão ao Juiz / Decisão do Juiz ──
function gerarAtividadesDecisaoJuiz(processoId: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 300;

  // ── Juiz Relator ──
  a.push(act(processoId, 12, "Analisar processo e relatório síntese",
    "Analisar processo completo, rever relatório síntese dos serviços técnicos.",
    "Juiz Relator",
    { prioridade: "alta", prazo_dias: 15, acao_esperada: "Analisar processo", tipo_evento: "submissao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 12, "Solicitar diligências, se necessário",
    "Se necessário, solicitar diligências adicionais ou esclarecimentos.",
    "Juiz Relator",
    { prazo_dias: 10, acao_esperada: "Solicitar diligências ou prosseguir", tipo_evento: "submissao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 12, "Ordenar contraditório, se aplicável",
    "Se necessário, ordenar exercício de contraditório com a entidade.",
    "Juiz Relator",
    { prazo_dias: 10, acao_esperada: "Ordenar contraditório ou prosseguir", tipo_evento: "submissao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 12, "Decidir: Conta em Termos ou Não em Termos",
    "Proferir decisão fundamentada sobre a conta.",
    "Juiz Relator",
    { prioridade: "alta", prazo_dias: 15, acao_esperada: "Decidir e fundamentar decisão", documentos_gerados: ["Decisão/Acórdão"], tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 13, "Ordenar cobrança de emolumentos",
    "Determinar cálculo e cobrança dos emolumentos devidos.",
    "Juiz Relator",
    { prazo_dias: 3, acao_esperada: "Ordenar cobrança", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 14, "Remeter processo ao Ministério Público",
    "Remeter o processo com a decisão para vista do Ministério Público.",
    "Juiz Relator",
    { prazo_dias: 3, acao_esperada: "Remeter ao MP", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  // ── Juiz Adjunto ──
  a.push(act(processoId, 12, "Acompanhar análise do processo",
    "Consultar documentação e relatório, apoiar apreciação com o Juiz Relator.",
    "Juiz Adjunto",
    { prazo_dias: 15, acao_esperada: "Consultar e apoiar apreciação", tipo_evento: "submissao_juiz", ordem: o++ }
  ));

  // ── Técnico da Secção de Custas e Emolumentos ──
  a.push(act(processoId, 13, "Calcular emolumentos devidos",
    "Calcular valor dos emolumentos devidos pela entidade.",
    "Técnico da Secção de Custas e Emolumentos",
    { prazo_dias: 3, acao_esperada: "Calcular emolumentos", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 13, "Emitir guia de cobrança",
    "Emitir guia de cobrança e associar ao processo.",
    "Técnico da Secção de Custas e Emolumentos",
    { prazo_dias: 3, acao_esperada: "Emitir guia de cobrança", documentos_gerados: ["Guia de Cobrança"], tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 13, "Remeter guia para continuidade do fluxo",
    "Enviar a guia de cobrança para dar continuidade ao fluxo processual.",
    "Técnico da Secção de Custas e Emolumentos",
    { prazo_dias: 1, acao_esperada: "Remeter guia", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  // ── Ministério Público ──
  a.push(act(processoId, 14, "Consultar dossiê e decisão do processo",
    "Receber processo com decisão e guia, consultar todo o dossiê.",
    "Ministério Público",
    { prazo_dias: 10, acao_esperada: "Consultar dossiê", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 14, "Emitir despacho de promoção",
    "Emitir despacho de promoção e devolver processo ao fluxo.",
    "Ministério Público",
    { prazo_dias: 10, acao_esperada: "Emitir despacho", documentos_gerados: ["Despacho de Promoção"], tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  // ── Escrivão dos Autos ──
  a.push(act(processoId, 15, "Cumprir despachos posteriores",
    "Executar os despachos emitidos pelo Juiz Relator e pelo MP.",
    "Escrivão dos Autos",
    { prazo_dias: 5, acao_esperada: "Cumprir despachos", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 15, "Preparar notificação da entidade",
    "Preparar ofício de notificação com a decisão e guia de cobrança.",
    "Escrivão dos Autos",
    { prazo_dias: 3, acao_esperada: "Preparar e remeter notificação", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  // ── Oficial de Diligências ──
  a.push(act(processoId, 17, "Entregar notificação à entidade",
    "Entregar ofício, decisão e guia de cobrança à entidade notificada.",
    "Oficial de Diligências",
    { prioridade: "alta", prazo_dias: 5, acao_esperada: "Entregar e registar diligência", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 17, "Registar diligência no sistema",
    "Registar a realização da diligência e anexar certidão assinada.",
    "Oficial de Diligências",
    { prazo_dias: 2, acao_esperada: "Registar e anexar certidão", documentos_gerados: ["Certidão de Notificação"], tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  a.push(act(processoId, 17, "Confirmar notificação no sistema",
    "Confirmar no sistema que a notificação foi entregue com sucesso.",
    "Oficial de Diligências",
    { prazo_dias: 1, acao_esperada: "Confirmar notificação", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  // ── Representante da Entidade ──
  a.push(act(processoId, 16, "Receber decisão e efetuar pagamento",
    "Tomar conhecimento da decisão do Tribunal e efetuar pagamento dos emolumentos.",
    "Representante da Entidade",
    { prioridade: "alta", prazo_dias: 30, acao_esperada: "Pagar emolumentos e submeter comprovativo", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  // ── DST: Acompanhar fase final ──
  a.push(act(processoId, 11, "Acompanhar fase final de notificação",
    "Acompanhar o progresso da notificação e o cumprimento das obrigações pela entidade.",
    "Diretor dos Serviços Técnicos",
    { prazo_dias: 30, acao_esperada: "Acompanhar notificação", tipo_evento: "decisao_juiz", ordem: o++ }
  ));

  return a;
}

// ── Evento: Pagamento recebido → Confirmação, Juntada, Arquivamento ──
function gerarAtividadesPagamento(processoId: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 400;

  a.push(act(processoId, 15, "Confirmar comprovativo de pagamento",
    "Verificar e confirmar comprovativo de pagamento dos emolumentos.",
    "Escrivão dos Autos",
    { prioridade: "alta", prazo_dias: 2, acao_esperada: "Confirmar comprovativo", tipo_evento: "pagamento_recebido", ordem: o++ }
  ));

  a.push(act(processoId, 15, "Juntar comprovativo aos autos",
    "Anexar o comprovativo de pagamento ao processo.",
    "Escrivão dos Autos",
    { prazo_dias: 1, acao_esperada: "Juntar aos autos", tipo_evento: "pagamento_recebido", ordem: o++ }
  ));

  a.push(act(processoId, 15, "Acusar recepção do comprovativo",
    "Registar a recepção do comprovativo no sistema.",
    "Escrivão dos Autos",
    { prazo_dias: 1, acao_esperada: "Acusar recepção", tipo_evento: "pagamento_recebido", ordem: o++ }
  ));

  a.push(act(processoId, 18, "Remeter para Juiz Relator para arquivamento",
    "Remeter processo ao Juiz Relator para decisão de arquivamento.",
    "Escrivão dos Autos",
    { prazo_dias: 3, acao_esperada: "Remeter para arquivamento", tipo_evento: "pagamento_recebido", ordem: o++ }
  ));

  a.push(act(processoId, 18, "Decidir arquivamento final",
    "Confirmar o cumprimento de todas as obrigações e ordenar arquivamento definitivo.",
    "Juiz Relator",
    { prazo_dias: 5, acao_esperada: "Ordenar arquivamento", documentos_gerados: ["Despacho de Arquivamento"], tipo_evento: "pagamento_recebido", ordem: o++ }
  ));

  a.push(act(processoId, 18, "Remeter para arquivamento definitivo",
    "Após cumprimento final, proceder ao arquivamento definitivo do processo.",
    "Escrivão dos Autos",
    { prazo_dias: 5, acao_esperada: "Arquivar processo", tipo_evento: "pagamento_recebido", ordem: o++ }
  ));

  return a;
}

// ── Evento: Contraditório ordenado ──
function gerarAtividadesContraditorio(processoId: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 600;

  a.push(act(processoId, 15, "Preparar notificação de contraditório",
    "Preparar ofício de notificação para exercício de contraditório.",
    "Escrivão dos Autos",
    { prioridade: "alta", prazo_dias: 3, acao_esperada: "Preparar notificação", documentos_gerados: ["Notificação de Contraditório"], tipo_evento: "contraditorio_ordenado", ordem: o++ }
  ));

  a.push(act(processoId, 17, "Notificar entidade para contraditório",
    "Entregar notificação de contraditório à entidade.",
    "Oficial de Diligências",
    { prioridade: "alta", prazo_dias: 5, acao_esperada: "Entregar notificação", tipo_evento: "contraditorio_ordenado", ordem: o++ }
  ));

  a.push(act(processoId, 1, "Responder ao contraditório",
    "Exercer o direito de contraditório, apresentando defesa e documentos de suporte.",
    "Representante da Entidade",
    { prioridade: "alta", prazo_dias: 20, acao_esperada: "Apresentar defesa", tipo_evento: "contraditorio_ordenado", ordem: o++ }
  ));

  return a;
}

// ── Evento: Diligência solicitada pelo Juiz ──
function gerarAtividadesDiligencia(processoId: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 650;

  a.push(act(processoId, 15, "Preparar cumprimento de diligência",
    "Preparar documentação e procedimentos para cumprimento da diligência ordenada.",
    "Escrivão dos Autos",
    { prioridade: "alta", prazo_dias: 5, acao_esperada: "Preparar diligência", tipo_evento: "diligencia_solicitada", ordem: o++ }
  ));

  a.push(act(processoId, 17, "Executar diligência junto à entidade",
    "Executar a diligência ordenada pelo Juiz Relator junto da entidade.",
    "Oficial de Diligências",
    { prioridade: "alta", prazo_dias: 10, acao_esperada: "Executar e registar diligência", documentos_gerados: ["Certidão de Diligência"], tipo_evento: "diligencia_solicitada", ordem: o++ }
  ));

  a.push(act(processoId, 1, "Colaborar com diligência solicitada",
    "Prestar toda a colaboração necessária à diligência do Tribunal.",
    "Representante da Entidade",
    { prioridade: "alta", prazo_dias: 10, acao_esperada: "Colaborar com diligência", tipo_evento: "diligencia_solicitada", ordem: o++ }
  ));

  return a;
}

// ── Evento: Validação reprovada → Devolução ──
function gerarAtividadesValidacaoReprovada(processoId: string, categoriaEntidade: string): AtividadeInput[] {
  const a: AtividadeInput[] = [];
  let o = 700;

  a.push(act(processoId, 3, "Devolver expediente ao remetente com observações",
    "Inconformidade detectada. Devolver com indicação detalhada dos problemas encontrados.",
    "Chefe da Secretaria-Geral",
    { prioridade: "alta", prazo_dias: 2, acao_esperada: "Devolver com observações", tipo_evento: "validacao_reprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 1, "Responder a notificação de inconformidade",
    "Corrigir os problemas identificados e resubmeter o expediente.",
    "Representante da Entidade",
    { prioridade: "alta", prazo_dias: 15, acao_esperada: "Corrigir e resubmeter", tipo_evento: "validacao_reprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  a.push(act(processoId, 1, "Enviar documentos complementares",
    "Enviar documentos complementares conforme solicitado na notificação.",
    "Representante da Entidade",
    { prazo_dias: 15, acao_esperada: "Enviar documentos", tipo_evento: "validacao_reprovada", categoria_entidade: categoriaEntidade, ordem: o++ }
  ));

  return a;
}

// ═══════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════

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
      if (canal === "presencial") {
        inputs = gerarAtividadesSubmissaoPresencial(processoId, categoriaEntidade, checklistIncompleta);
      } else {
        inputs = gerarAtividadesSubmissaoPortal(processoId, categoriaEntidade, checklistIncompleta);
      }
      break;
    case "submissao_presencial":
      inputs = gerarAtividadesSubmissaoPresencial(processoId, categoriaEntidade, checklistIncompleta);
      break;
    case "checklist_incompleta":
      // Handled inside submission functions via checklistIncompleta flag
      inputs = gerarAtividadesSubmissaoPortal(processoId, categoriaEntidade, true);
      break;
    case "validacao_aprovada":
      inputs = gerarAtividadesValidacaoAprovada(processoId, categoriaEntidade);
      break;
    case "validacao_reprovada":
      inputs = gerarAtividadesValidacaoReprovada(processoId, categoriaEntidade);
      break;
    case "analise_concluida":
    case "relatorio_sintese_pronto":
    case "validacao_seccao_aprovada":
    case "validacao_divisao_aprovada":
    case "controle_qualidade_aprovado":
      inputs = gerarAtividadesAnaliseConcluida(processoId);
      break;
    case "falta_elementos":
      inputs = gerarAtividadesFaltaElementos(processoId);
      break;
    case "submissao_juiz":
    case "decisao_juiz":
      inputs = gerarAtividadesDecisaoJuiz(processoId);
      break;
    case "contraditorio_ordenado":
      inputs = gerarAtividadesContraditorio(processoId);
      break;
    case "diligencia_solicitada":
      inputs = gerarAtividadesDiligencia(processoId);
      break;
    case "pagamento_recebido":
      inputs = gerarAtividadesPagamento(processoId);
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

// ═══════════════════════════════════════════════════════════════
// GESTÃO DE ESTADO
// ═══════════════════════════════════════════════════════════════

export async function atualizarEstadoAtividade(
  atividadeId: string,
  novoEstado: AtividadeEstado,
  executadoPor: string,
  perfilExecutor?: string,
  observacoes?: string
): Promise<boolean> {
  const { data: atividade } = await supabase
    .from("atividades")
    .select("estado")
    .eq("id", atividadeId)
    .single();

  if (!atividade) return false;

  const estadoAnterior = (atividade as any).estado;

  const updates: Record<string, any> = { estado: novoEstado, updated_at: new Date().toISOString() };
  if (novoEstado === "em_curso") updates.data_inicio = new Date().toISOString();
  if (novoEstado === "concluida") updates.data_conclusao = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("atividades")
    .update(updates)
    .eq("id", atividadeId);

  if (updateError) {
    console.error("Erro ao atualizar atividade:", updateError);
    return false;
  }

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

// ═══════════════════════════════════════════════════════════════
// CONSULTAS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// LABELS E CONSTANTES UI
// ═══════════════════════════════════════════════════════════════

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

export const EVENTO_LABELS: Record<string, string> = {
  expediente_submetido: "Expediente Submetido",
  submissao_presencial: "Submissão Presencial",
  checklist_incompleta: "Checklist Incompleta",
  validacao_aprovada: "Validação Aprovada",
  validacao_reprovada: "Validação Reprovada",
  analise_concluida: "Análise Concluída",
  falta_elementos: "Falta de Elementos",
  relatorio_sintese_pronto: "Relatório Síntese Pronto",
  validacao_seccao_aprovada: "Validação da Secção Aprovada",
  validacao_divisao_aprovada: "Validação da Divisão Aprovada",
  controle_qualidade_aprovado: "Controle de Qualidade Aprovado",
  submissao_juiz: "Submissão ao Juiz",
  decisao_juiz: "Decisão do Juiz",
  contraditorio_ordenado: "Contraditório Ordenado",
  diligencia_solicitada: "Diligência Solicitada",
  pagamento_recebido: "Pagamento Recebido",
  notificacao_expedida: "Notificação Expedida",
  arquivamento: "Arquivamento",
};
