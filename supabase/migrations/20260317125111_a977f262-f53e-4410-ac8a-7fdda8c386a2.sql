
-- Processos table: main workflow entity
CREATE TABLE public.processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo text NOT NULL,
  entity_id text NOT NULL,
  entity_name text NOT NULL,
  categoria_entidade text NOT NULL DEFAULT 'categoria_1',
  resolucao_aplicavel text,
  ano_gerencia integer NOT NULL,
  periodo_gerencia text,
  canal_entrada text NOT NULL DEFAULT 'portal',
  urgencia text NOT NULL DEFAULT 'normal',
  etapa_atual integer NOT NULL DEFAULT 1,
  estado text NOT NULL DEFAULT 'submetido',
  responsavel_atual text,
  divisao_competente text,
  seccao_competente text,
  juiz_relator text,
  juiz_adjunto text,
  tecnico_analise text,
  coordenador_equipa text,
  completude_documental numeric NOT NULL DEFAULT 0,
  observacoes text,
  data_submissao timestamptz NOT NULL DEFAULT now(),
  data_conclusao timestamptz,
  portador_nome text,
  portador_documento text,
  portador_contacto text,
  submetido_por text NOT NULL DEFAULT 'sistema',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Process history/audit trail
CREATE TABLE public.processo_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  etapa_anterior integer,
  etapa_seguinte integer,
  estado_anterior text,
  estado_seguinte text,
  acao text NOT NULL,
  executado_por text NOT NULL,
  perfil_executor text,
  observacoes text,
  documentos_gerados text[],
  documentos_alterados text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Process documents
CREATE TABLE public.processo_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL,
  nome_ficheiro text NOT NULL,
  caminho_ficheiro text,
  obrigatorio boolean NOT NULL DEFAULT true,
  estado text NOT NULL DEFAULT 'pendente',
  versao integer NOT NULL DEFAULT 1,
  validado_por text,
  validado_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_documentos ENABLE ROW LEVEL SECURITY;

-- Public access policies (will be restricted later with auth)
CREATE POLICY "Allow all select on processos" ON public.processos FOR SELECT USING (true);
CREATE POLICY "Allow all insert on processos" ON public.processos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on processos" ON public.processos FOR UPDATE USING (true);

CREATE POLICY "Allow all select on processo_historico" ON public.processo_historico FOR SELECT USING (true);
CREATE POLICY "Allow all insert on processo_historico" ON public.processo_historico FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all select on processo_documentos" ON public.processo_documentos FOR SELECT USING (true);
CREATE POLICY "Allow all insert on processo_documentos" ON public.processo_documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on processo_documentos" ON public.processo_documentos FOR UPDATE USING (true);
