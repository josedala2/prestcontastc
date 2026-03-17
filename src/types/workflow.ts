// Workflow stages configuration for the 18-step Prestação de Contas process

export interface WorkflowStage {
  id: number;
  nome: string;
  descricao: string;
  responsavelPerfil: string;
  acoes: string[];
  documentosGerados: string[];
  prazoDefault: number; // days
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 1,
    nome: "Registo de Entrada",
    descricao: "Recepção e registo do expediente no sistema",
    responsavelPerfil: "Técnico da Secretaria-Geral",
    acoes: ["Registar expediente", "Gerar acta de recebimento", "Atribuir número provisório"],
    documentosGerados: ["Acta de Recebimento"],
    prazoDefault: 1,
  },
  {
    id: 2,
    nome: "Digitalização",
    descricao: "Digitalização dos documentos físicos recebidos",
    responsavelPerfil: "Técnico da Secretaria-Geral",
    acoes: ["Digitalizar documentos", "Associar ficheiros ao processo"],
    documentosGerados: [],
    prazoDefault: 2,
  },
  {
    id: 3,
    nome: "Validação da Secretaria",
    descricao: "Verificação da conformidade documental pela Secretaria",
    responsavelPerfil: "Chefe da Secretaria-Geral",
    acoes: ["Validar checklist", "Solicitar correcções", "Aprovar entrada"],
    documentosGerados: [],
    prazoDefault: 3,
  },
  {
    id: 4,
    nome: "Verificação de Documento",
    descricao: "Conferência detalhada dos documentos submetidos",
    responsavelPerfil: "Técnico da Contadoria Geral",
    acoes: ["Verificar autenticidade", "Marcar inconformidades", "Solicitar elementos"],
    documentosGerados: ["Ofício de Solicitação de Elementos"],
    prazoDefault: 5,
  },
  {
    id: 5,
    nome: "Registo e Autuação",
    descricao: "Atribuição do número definitivo e autuação do processo",
    responsavelPerfil: "Escrivão dos Autos",
    acoes: ["Atribuir número definitivo", "Autuar processo", "Gerar capa"],
    documentosGerados: ["Capa do Processo"],
    prazoDefault: 2,
  },
  {
    id: 6,
    nome: "Divisão Competente",
    descricao: "Encaminhamento à divisão competente para análise",
    responsavelPerfil: "Chefe de Divisão",
    acoes: ["Receber processo", "Encaminhar à secção", "Nomear coordenador"],
    documentosGerados: [],
    prazoDefault: 2,
  },
  {
    id: 7,
    nome: "Secção Competente",
    descricao: "Distribuição à secção e técnico responsável",
    responsavelPerfil: "Chefe de Secção",
    acoes: ["Distribuir a técnico", "Definir prioridade", "Monitorar prazos"],
    documentosGerados: [],
    prazoDefault: 2,
  },
  {
    id: 8,
    nome: "Análise Técnica",
    descricao: "Análise detalhada do processo pelo técnico designado",
    responsavelPerfil: "Técnico de Análise",
    acoes: ["Analisar documentos", "Emitir parecer", "Solicitar elementos", "Consolidar relatório"],
    documentosGerados: ["Parecer Técnico", "Relatório Síntese"],
    prazoDefault: 15,
  },
  {
    id: 9,
    nome: "Validação do Chefe de Secção",
    descricao: "Revisão e validação pelo Chefe de Secção",
    responsavelPerfil: "Chefe de Secção",
    acoes: ["Validar parecer", "Devolver para aperfeiçoamento", "Aprovar"],
    documentosGerados: [],
    prazoDefault: 3,
  },
  {
    id: 10,
    nome: "Validação do Chefe de Divisão",
    descricao: "Revisão e validação pelo Chefe de Divisão",
    responsavelPerfil: "Chefe de Divisão",
    acoes: ["Validar relatório", "Devolver para correcção", "Aprovar"],
    documentosGerados: [],
    prazoDefault: 3,
  },
  {
    id: 11,
    nome: "Controle de Qualidade (DST)",
    descricao: "Revisão final pelo Director dos Serviços Técnicos",
    responsavelPerfil: "Diretor dos Serviços Técnicos",
    acoes: ["Verificar qualidade", "Corrigir", "Submeter ao Juiz"],
    documentosGerados: [],
    prazoDefault: 5,
  },
  {
    id: 12,
    nome: "Decisão do Juiz Relator",
    descricao: "Análise e decisão pelo Juiz Relator",
    responsavelPerfil: "Juiz Relator",
    acoes: ["Consultar processo", "Solicitar diligências", "Ordenar contraditório", "Decidir: Conta em Termos / Não em Termos"],
    documentosGerados: ["Despacho do Juiz"],
    prazoDefault: 10,
  },
  {
    id: 13,
    nome: "Cobrança de Emolumentos",
    descricao: "Cálculo e emissão da guia de cobrança",
    responsavelPerfil: "Técnico da Secção de Custas e Emolumentos",
    acoes: ["Calcular valor", "Emitir guia", "Controlar pagamento"],
    documentosGerados: ["Guia de Cobrança"],
    prazoDefault: 5,
  },
  {
    id: 14,
    nome: "Despacho do Ministério Público",
    descricao: "Promoção do Ministério Público sobre o processo",
    responsavelPerfil: "Ministério Público",
    acoes: ["Analisar processo", "Emitir despacho de promoção", "Devolver ao fluxo"],
    documentosGerados: ["Despacho de Promoção"],
    prazoDefault: 10,
  },
  {
    id: 15,
    nome: "Cumprimento de Despachos",
    descricao: "Execução dos despachos emitidos",
    responsavelPerfil: "Escrivão dos Autos",
    acoes: ["Cumprir despachos", "Gerar termos", "Juntar documentos"],
    documentosGerados: ["Termo de Juntada", "Termo de Recebimento", "Termo de Conclusão"],
    prazoDefault: 5,
  },
  {
    id: 16,
    nome: "Ofício de Remessa",
    descricao: "Preparação e envio do ofício de remessa à entidade",
    responsavelPerfil: "Técnico da Secretaria-Geral",
    acoes: ["Gerar ofício", "Enviar electronicamente", "Registar envio"],
    documentosGerados: ["Ofício de Remessa"],
    prazoDefault: 3,
  },
  {
    id: 17,
    nome: "Expediente de Saída",
    descricao: "Notificação presencial e registo de diligência",
    responsavelPerfil: "Oficial de Diligências",
    acoes: ["Notificar presencialmente", "Emitir certidão", "Anexar comprovativo"],
    documentosGerados: ["Termo de Notificação", "Certidão de Diligência"],
    prazoDefault: 5,
  },
  {
    id: 18,
    nome: "Arquivamento",
    descricao: "Confirmação final e arquivamento do processo",
    responsavelPerfil: "Juiz Relator",
    acoes: ["Confirmar conclusão", "Arquivar processo", "Fechar tramitação"],
    documentosGerados: ["Despacho de Arquivamento"],
    prazoDefault: 3,
  },
];

export const WORKFLOW_ESTADOS = [
  { value: "submetido", label: "Submetido", color: "bg-blue-100 text-blue-800" },
  { value: "em_validacao", label: "Em Validação", color: "bg-yellow-100 text-yellow-800" },
  { value: "pendente_correccao", label: "Pendente de Correcção", color: "bg-orange-100 text-orange-800" },
  { value: "em_analise", label: "Em Análise", color: "bg-purple-100 text-purple-800" },
  { value: "em_autuacao", label: "Em Autuação", color: "bg-cyan-100 text-cyan-800" },
  { value: "aguardando_elementos", label: "Aguardando Elementos", color: "bg-amber-100 text-amber-800" },
  { value: "em_decisao", label: "Em Decisão", color: "bg-indigo-100 text-indigo-800" },
  { value: "aguardando_pagamento", label: "Aguardando Pagamento", color: "bg-pink-100 text-pink-800" },
  { value: "notificado", label: "Notificado", color: "bg-teal-100 text-teal-800" },
  { value: "arquivado", label: "Arquivado", color: "bg-gray-100 text-gray-800" },
  { value: "conta_em_termos", label: "Conta em Termos", color: "bg-green-100 text-green-800" },
  { value: "conta_nao_em_termos", label: "Conta Não em Termos", color: "bg-red-100 text-red-800" },
] as const;

export type WorkflowEstado = typeof WORKFLOW_ESTADOS[number]["value"];

export const CATEGORIAS_ENTIDADE = [
  {
    id: "categoria_1",
    nome: "Categoria 1 — Órgãos de Soberania e Afins",
    baseLegal: "Resolução n.º 2/16, de 2 de dezembro",
    documentos: [
      { nome: "Modelos de Prestação de Contas", obrigatorio: true },
      { nome: "Relatório de Gestão", obrigatorio: true },
      { nome: "Extratos Bancários", obrigatorio: false },
      { nome: "Relação das Ordens de Saque / Livro de Ordens de Saque", obrigatorio: true },
      { nome: "Cópia dos Contratos celebrados no período", obrigatorio: false },
      { nome: "Suporte documental das despesas realizadas", obrigatorio: false },
      { nome: "Comprovativo de pagamento dos emolumentos", obrigatorio: true },
    ],
  },
  {
    id: "categoria_2",
    nome: "Categoria 2 — Administração Central e Local, Institutos",
    baseLegal: "Resolução n.º 4/16, de 6 de dezembro",
    documentos: [
      { nome: "Modelos de Prestação de Contas", obrigatorio: true },
      { nome: "Relatório de Gestão", obrigatorio: true },
      { nome: "Extratos Bancários", obrigatorio: false },
      { nome: "Relação das Ordens de Saque / Livro de Ordens de Saque", obrigatorio: true },
      { nome: "Cópia dos Contratos celebrados no período", obrigatorio: false },
      { nome: "Suporte documental das despesas realizadas", obrigatorio: false },
      { nome: "Comprovativo de pagamento dos emolumentos devidos ao TC", obrigatorio: true },
    ],
  },
  {
    id: "categoria_3",
    nome: "Categoria 3 — Serviços Públicos no Estrangeiro",
    baseLegal: "Resolução n.º 5/16, de 8 de dezembro",
    documentos: [
      { nome: "Modelos de Prestação de Contas", obrigatorio: true },
      { nome: "Relatório de Gestão", obrigatorio: false },
      { nome: "Extractos Bancários", obrigatorio: true },
      { nome: "Reconciliações Bancárias", obrigatorio: false },
      { nome: "Folhas de Caixa", obrigatorio: true },
      { nome: "Comprovativos de entrega à Segurança Social", obrigatorio: true },
      { nome: "Relação de recibos emolumentares", obrigatorio: false },
      { nome: "Comprovativo de aquisição de moeda local", obrigatorio: false },
      { nome: "Comprovativo de pagamento dos emolumentos devidos ao TC", obrigatorio: true },
    ],
  },
  {
    id: "categoria_4",
    nome: "Categoria 4 — Sector Empresarial Público (PGC)",
    baseLegal: "Resolução n.º 1/17, de 5 de janeiro",
    documentos: [
      { nome: "Modelos de Prestação de Contas", obrigatorio: true },
      { nome: "Relatório de Gestão", obrigatorio: true },
      { nome: "Balanço", obrigatorio: true },
      { nome: "Demonstração de Resultados", obrigatorio: true },
      { nome: "Demonstração de Fluxo de Caixa", obrigatorio: true },
      { nome: "Balancete Analítico e Sintético", obrigatorio: true },
      { nome: "Parecer do Conselho Fiscal", obrigatorio: true },
      { nome: "Relatório e Parecer do Auditor Externo", obrigatorio: true },
      { nome: "Comprovativos de pagamento dos Impostos", obrigatorio: true },
      { nome: "Comprovativos de Pagamento à Segurança Social", obrigatorio: false },
      { nome: "Acta sobre a Apreciação das Contas", obrigatorio: true },
      { nome: "Extratos Bancários", obrigatorio: true },
      { nome: "Reconciliações Bancárias", obrigatorio: false },
      { nome: "Inventário de Bens Patrimoniais adquiridos", obrigatorio: false },
      { nome: "Relação de Abates e Alienações de Imóveis", obrigatorio: false },
      { nome: "Comprovativo de pagamento dos emolumentos devidos ao TC", obrigatorio: true },
    ],
  },
];

export interface Processo {
  id: string;
  numero_processo: string;
  entity_id: string;
  entity_name: string;
  categoria_entidade: string;
  resolucao_aplicavel: string | null;
  ano_gerencia: number;
  periodo_gerencia: string | null;
  canal_entrada: string;
  urgencia: string;
  etapa_atual: number;
  estado: string;
  responsavel_atual: string | null;
  divisao_competente: string | null;
  seccao_competente: string | null;
  juiz_relator: string | null;
  juiz_adjunto: string | null;
  tecnico_analise: string | null;
  coordenador_equipa: string | null;
  completude_documental: number;
  observacoes: string | null;
  data_submissao: string;
  data_conclusao: string | null;
  portador_nome: string | null;
  portador_documento: string | null;
  portador_contacto: string | null;
  submetido_por: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessoHistorico {
  id: string;
  processo_id: string;
  etapa_anterior: number | null;
  etapa_seguinte: number | null;
  estado_anterior: string | null;
  estado_seguinte: string | null;
  acao: string;
  executado_por: string;
  perfil_executor: string | null;
  observacoes: string | null;
  documentos_gerados: string[] | null;
  documentos_alterados: string[] | null;
  created_at: string;
}
