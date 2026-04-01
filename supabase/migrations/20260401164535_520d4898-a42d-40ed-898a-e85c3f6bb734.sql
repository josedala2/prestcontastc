
-- Tabela de parametrização do salário mínimo
CREATE TABLE public.salario_minimo_vigencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor numeric NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  criado_por text NOT NULL DEFAULT 'sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salario_minimo_vigencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_sal_min" ON public.salario_minimo_vigencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sal_min" ON public.salario_minimo_vigencia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sal_min" ON public.salario_minimo_vigencia FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_sal_min" ON public.salario_minimo_vigencia FOR DELETE TO authenticated USING (true);

-- Tabela principal de emolumentos
CREATE TABLE public.emolumentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE RESTRICT,
  entity_id text NOT NULL,
  entity_name text NOT NULL,
  numero_processo text NOT NULL,
  tipo_processo text NOT NULL,
  subtipo_processo text,
  base_legal text,
  base_calculo numeric NOT NULL DEFAULT 0,
  taxa_aplicada numeric NOT NULL DEFAULT 0,
  salario_minimo_ref numeric NOT NULL DEFAULT 0,
  valor_minimo numeric NOT NULL DEFAULT 0,
  valor_antecipado numeric NOT NULL DEFAULT 0,
  valor_final numeric NOT NULL DEFAULT 0,
  valor_pago numeric NOT NULL DEFAULT 0,
  valor_divida numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'rascunho',
  responsavel_pagamento text,
  decisao_associada text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emolumentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_emolumentos" ON public.emolumentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_emolumentos" ON public.emolumentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_emolumentos" ON public.emolumentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_emolumentos" ON public.emolumentos FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_emolumentos_updated_at BEFORE UPDATE ON public.emolumentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guias de cobrança
CREATE TABLE public.emolumento_guias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emolumento_id uuid NOT NULL REFERENCES public.emolumentos(id) ON DELETE RESTRICT,
  numero_guia text NOT NULL,
  valor numeric NOT NULL,
  data_emissao timestamptz NOT NULL DEFAULT now(),
  data_limite timestamptz,
  estado text NOT NULL DEFAULT 'emitida',
  anulado_motivo text,
  anulado_at timestamptz,
  emitido_por text NOT NULL DEFAULT 'sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emolumento_guias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_guias" ON public.emolumento_guias FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_guias" ON public.emolumento_guias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_guias" ON public.emolumento_guias FOR UPDATE TO authenticated USING (true);

-- Pagamentos
CREATE TABLE public.emolumento_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emolumento_id uuid NOT NULL REFERENCES public.emolumentos(id) ON DELETE RESTRICT,
  guia_id uuid REFERENCES public.emolumento_guias(id),
  valor_pago numeric NOT NULL,
  data_pagamento timestamptz NOT NULL DEFAULT now(),
  meio_pagamento text NOT NULL DEFAULT 'deposito_bancario',
  referencia_comprovativo text,
  caminho_comprovativo text,
  registado_por text NOT NULL DEFAULT 'sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emolumento_pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_pagamentos" ON public.emolumento_pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_pagamentos" ON public.emolumento_pagamentos FOR INSERT TO authenticated WITH CHECK (true);

-- Reclamações / Reduções / Isenções
CREATE TABLE public.emolumento_reclamacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emolumento_id uuid NOT NULL REFERENCES public.emolumentos(id) ON DELETE RESTRICT,
  tipo text NOT NULL DEFAULT 'reclamacao',
  fundamentacao text NOT NULL,
  anexo_path text,
  decisao text,
  decidido_por text,
  decidido_at timestamptz,
  valor_original numeric NOT NULL DEFAULT 0,
  valor_reduzido numeric,
  estado text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emolumento_reclamacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_reclamacoes" ON public.emolumento_reclamacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_reclamacoes" ON public.emolumento_reclamacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_reclamacoes" ON public.emolumento_reclamacoes FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_reclamacoes_updated_at BEFORE UPDATE ON public.emolumento_reclamacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico / Auditoria
CREATE TABLE public.emolumento_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emolumento_id uuid NOT NULL REFERENCES public.emolumentos(id) ON DELETE RESTRICT,
  acao text NOT NULL,
  estado_anterior text,
  estado_novo text,
  executado_por text NOT NULL DEFAULT 'sistema',
  perfil_executor text,
  observacoes text,
  detalhes_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emolumento_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select_emol_hist" ON public.emolumento_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_emol_hist" ON public.emolumento_historico FOR INSERT TO authenticated WITH CHECK (true);

-- Seed salário mínimo actual
INSERT INTO public.salario_minimo_vigencia (valor, data_inicio, criado_por)
VALUES (100000, '2024-01-01', 'sistema');
