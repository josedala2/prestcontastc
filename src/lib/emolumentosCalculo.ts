// Regras de cálculo de emolumentos do Tribunal de Contas de Angola

export type TipoProcesso = 
  | "visto_pessoal" 
  | "visto_contratos" 
  | "visto_prestacao_periodica"
  | "contas" 
  | "contas_empresa_publica"
  | "multas" 
  | "responsabilidade_financeira"
  | "recurso_nao_admitido" 
  | "recurso_admitido"
  | "certidao"
  | "reclamacao_reducao"
  | "outros";

export const TIPO_PROCESSO_LABELS: Record<TipoProcesso, string> = {
  visto_pessoal: "Visto — Actos relativos a pessoal",
  visto_contratos: "Visto — Restantes actos e contratos",
  visto_prestacao_periodica: "Visto — Contratos de prestação periódica",
  contas: "Processo de Contas",
  contas_empresa_publica: "Contas — Empresa Pública / afins",
  multas: "Multas",
  responsabilidade_financeira: "Responsabilidade Financeira",
  recurso_nao_admitido: "Recurso não admitido",
  recurso_admitido: "Recurso admitido",
  certidao: "Certidão",
  reclamacao_reducao: "Reclamação / Pedido de redução",
  outros: "Outros processos",
};

export const ESTADOS_EMOLUMENTO = [
  "rascunho", "calculado", "guia_emitida", "aguardando_pagamento",
  "pagamento_parcial", "pago", "pago_a_menor", "pago_em_excesso",
  "em_divida", "em_reclamacao", "em_pedido_reducao", "isento",
  "em_cobranca_coerciva", "encerrado", "anulado",
] as const;

export type EstadoEmolumento = typeof ESTADOS_EMOLUMENTO[number];

export const ESTADO_LABELS: Record<EstadoEmolumento, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  calculado: { label: "Calculado", color: "bg-blue-100 text-blue-800" },
  guia_emitida: { label: "Guia Emitida", color: "bg-indigo-100 text-indigo-800" },
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-800" },
  pagamento_parcial: { label: "Pagamento Parcial", color: "bg-orange-100 text-orange-800" },
  pago: { label: "Pago", color: "bg-green-100 text-green-800" },
  pago_a_menor: { label: "Pago a Menor", color: "bg-amber-100 text-amber-800" },
  pago_em_excesso: { label: "Pago em Excesso", color: "bg-teal-100 text-teal-800" },
  em_divida: { label: "Em Dívida", color: "bg-red-100 text-red-800" },
  em_reclamacao: { label: "Em Reclamação", color: "bg-purple-100 text-purple-800" },
  em_pedido_reducao: { label: "Em Pedido de Redução", color: "bg-violet-100 text-violet-800" },
  isento: { label: "Isento", color: "bg-gray-100 text-gray-600" },
  em_cobranca_coerciva: { label: "Em Cobrança Coerciva", color: "bg-red-200 text-red-900" },
  encerrado: { label: "Encerrado", color: "bg-slate-100 text-slate-700" },
  anulado: { label: "Anulado", color: "bg-gray-200 text-gray-500" },
};

export interface CalculoResult {
  taxa: number;
  valorMinimo: number;
  valorCalculado: number;
  valorFinal: number;
  baseLegal: string;
}

export function calcularEmolumento(
  tipo: TipoProcesso,
  baseCalculo: number,
  salarioMinimo: number,
  emolumentosProcessoAnterior?: number,
): CalculoResult {
  switch (tipo) {
    case "visto_pessoal": {
      const taxa = 0.03;
      const minimo = salarioMinimo / 5;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "3% da remuneração ilíquida mensal, mín. 1/5 do salário mínimo",
      };
    }
    case "visto_contratos": {
      const taxa = 0.01;
      const minimo = salarioMinimo / 2;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "1% do valor do contrato, mín. 1/2 do salário mínimo",
      };
    }
    case "visto_prestacao_periodica": {
      const taxa = 0.01;
      const minimo = salarioMinimo / 2;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "1% do valor do contrato (ou anual se >= 1 ano), mín. 1/2 do salário mínimo",
      };
    }
    case "contas": {
      const taxa = 0.01;
      const minimo = salarioMinimo * 5;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "1% da receita cobrada, mín. 5 salários mínimos",
      };
    }
    case "contas_empresa_publica": {
      const taxa = 0.01;
      const minimo = salarioMinimo * 5;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "1% dos lucros do exercício, mín. 5 salários mínimos",
      };
    }
    case "multas": {
      const taxa = 0.10;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: 0,
        valorCalculado: calc,
        valorFinal: calc,
        baseLegal: "10% da multa aplicada",
      };
    }
    case "responsabilidade_financeira": {
      const taxa = 0.03;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: 0,
        valorCalculado: calc,
        valorFinal: calc,
        baseLegal: "1% a 5% do valor da responsabilidade financeira",
      };
    }
    case "recurso_nao_admitido": {
      const minimo = salarioMinimo / 4;
      return {
        taxa: 0,
        valorMinimo: minimo,
        valorCalculado: minimo,
        valorFinal: minimo,
        baseLegal: "1/4 do salário mínimo",
      };
    }
    case "recurso_admitido": {
      const minimo = salarioMinimo / 4;
      const calc = (emolumentosProcessoAnterior || 0) / 4;
      return {
        taxa: 0.25,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "1/4 dos emolumentos contados no processo até à interposição, mín. 1/4 do salário mínimo",
      };
    }
    case "certidao": {
      return {
        taxa: 0,
        valorMinimo: 0,
        valorCalculado: baseCalculo,
        valorFinal: baseCalculo,
        baseLegal: "Tabela aplicável",
      };
    }
    case "reclamacao_reducao": {
      const valor = salarioMinimo / 5;
      return {
        taxa: 0,
        valorMinimo: valor,
        valorCalculado: valor,
        valorFinal: valor,
        baseLegal: "1/5 do salário mínimo; se atendida, não cobrar",
      };
    }
    case "outros":
    default: {
      const taxa = 0.01;
      const minimo = salarioMinimo * 5;
      const calc = baseCalculo * taxa;
      return {
        taxa,
        valorMinimo: minimo,
        valorCalculado: calc,
        valorFinal: Math.max(calc, minimo),
        baseLegal: "Segue lógica dos processos de contas",
      };
    }
  }
}

export function formatKz(value: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 2 }).format(value);
}
