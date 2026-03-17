
-- Tabela principal de atividades/tarefas do workflow
CREATE TABLE public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
  etapa_fluxo INTEGER NOT NULL DEFAULT 1,
  titulo TEXT NOT NULL,
  descricao TEXT,
  perfil_responsavel TEXT NOT NULL,
  utilizador_responsavel TEXT,
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa','normal','alta','urgente')),
  prazo TIMESTAMP WITH TIME ZONE,
  data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'pendente' CHECK (estado IN (
    'pendente','em_curso','concluida','devolvida','bloqueada',
    'cancelada','aguardando_resposta','aguardando_documentos','aguardando_validacao'
  )),
  dependencia_atividade_id UUID REFERENCES public.atividades(id),
  acao_esperada TEXT,
  documentos_necessarios TEXT[],
  documentos_gerados TEXT[],
  observacoes TEXT,
  canal_submissao TEXT DEFAULT 'portal' CHECK (canal_submissao IN ('portal','presencial')),
  tipo_evento TEXT,
  categoria_entidade TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de atividades
CREATE TABLE public.atividade_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_novo TEXT NOT NULL,
  executado_por TEXT NOT NULL,
  perfil_executor TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_atividades_processo ON public.atividades(processo_id);
CREATE INDEX idx_atividades_perfil ON public.atividades(perfil_responsavel);
CREATE INDEX idx_atividades_estado ON public.atividades(estado);
CREATE INDEX idx_atividades_etapa ON public.atividades(etapa_fluxo);
CREATE INDEX idx_atividade_historico_atividade ON public.atividade_historico(atividade_id);

-- RLS
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividade_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on atividades" ON public.atividades FOR SELECT USING (true);
CREATE POLICY "Allow all insert on atividades" ON public.atividades FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on atividades" ON public.atividades FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on atividades" ON public.atividades FOR DELETE USING (true);

CREATE POLICY "Allow all read on atividade_historico" ON public.atividade_historico FOR SELECT USING (true);
CREATE POLICY "Allow all insert on atividade_historico" ON public.atividade_historico FOR INSERT WITH CHECK (true);

-- Enable realtime for atividades
ALTER PUBLICATION supabase_realtime ADD TABLE public.atividades;
