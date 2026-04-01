import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Emolumento {
  id: string;
  processo_id: string;
  entity_id: string;
  entity_name: string;
  numero_processo: string;
  tipo_processo: string;
  subtipo_processo?: string;
  base_legal?: string;
  base_calculo: number;
  taxa_aplicada: number;
  salario_minimo_ref: number;
  valor_minimo: number;
  valor_antecipado: number;
  valor_final: number;
  valor_pago: number;
  valor_divida: number;
  estado: string;
  responsavel_pagamento?: string;
  decisao_associada?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmolumentoGuia {
  id: string;
  emolumento_id: string;
  numero_guia: string;
  valor: number;
  data_emissao: string;
  data_limite?: string;
  estado: string;
  anulado_motivo?: string;
  anulado_at?: string;
  emitido_por: string;
  created_at: string;
}

export interface EmolumentoPagamento {
  id: string;
  emolumento_id: string;
  guia_id?: string;
  valor_pago: number;
  data_pagamento: string;
  meio_pagamento: string;
  referencia_comprovativo?: string;
  caminho_comprovativo?: string;
  registado_por: string;
  created_at: string;
}

export interface EmolumentoReclamacao {
  id: string;
  emolumento_id: string;
  tipo: string;
  fundamentacao: string;
  anexo_path?: string;
  decisao?: string;
  decidido_por?: string;
  decidido_at?: string;
  valor_original: number;
  valor_reduzido?: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface EmolumentoHistorico {
  id: string;
  emolumento_id: string;
  acao: string;
  estado_anterior?: string;
  estado_novo?: string;
  executado_por: string;
  perfil_executor?: string;
  observacoes?: string;
  detalhes_json?: Record<string, unknown>;
  created_at: string;
}

export function useEmolumentos() {
  const [emolumentos, setEmolumentos] = useState<Emolumento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("emolumentos").select("*").order("created_at", { ascending: false });
    setEmolumentos((data as unknown as Emolumento[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { emolumentos, loading, refresh: load };
}

export function useEmolumentoDetalhe(id?: string) {
  const [emolumento, setEmolumento] = useState<Emolumento | null>(null);
  const [guias, setGuias] = useState<EmolumentoGuia[]>([]);
  const [pagamentos, setPagamentos] = useState<EmolumentoPagamento[]>([]);
  const [reclamacoes, setReclamacoes] = useState<EmolumentoReclamacao[]>([]);
  const [historico, setHistorico] = useState<EmolumentoHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [emRes, guiRes, pagRes, recRes, hisRes] = await Promise.all([
      supabase.from("emolumentos").select("*").eq("id", id).single(),
      supabase.from("emolumento_guias").select("*").eq("emolumento_id", id).order("created_at", { ascending: false }),
      supabase.from("emolumento_pagamentos").select("*").eq("emolumento_id", id).order("created_at", { ascending: false }),
      supabase.from("emolumento_reclamacoes").select("*").eq("emolumento_id", id).order("created_at", { ascending: false }),
      supabase.from("emolumento_historico").select("*").eq("emolumento_id", id).order("created_at", { ascending: false }),
    ]);
    setEmolumento(emRes.data as unknown as Emolumento);
    setGuias((guiRes.data as unknown as EmolumentoGuia[]) || []);
    setPagamentos((pagRes.data as unknown as EmolumentoPagamento[]) || []);
    setReclamacoes((recRes.data as unknown as EmolumentoReclamacao[]) || []);
    setHistorico((hisRes.data as unknown as EmolumentoHistorico[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  return { emolumento, guias, pagamentos, reclamacoes, historico, loading, refresh: load };
}

export function useSalarioMinimo() {
  const [valor, setValor] = useState(100000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("salario_minimo_vigencia")
        .select("*")
        .order("data_inicio", { ascending: false })
        .limit(1);
      if (data && data.length > 0) setValor(Number((data[0] as any).valor));
      setLoading(false);
    })();
  }, []);

  return { salarioMinimo: valor, loading };
}
