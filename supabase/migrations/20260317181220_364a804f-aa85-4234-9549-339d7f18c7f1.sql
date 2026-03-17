
-- ============================================
-- 1. ENUM: Papéis da aplicação
-- ============================================
CREATE TYPE public.app_role AS ENUM ('secretaria', 'tecnico', 'chefe_seccao', 'chefe_divisao', 'juiz', 'admin');

-- ============================================
-- 2. TABELA: user_roles (papéis dos utilizadores)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on user_roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow all insert on user_roles" ON public.user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on user_roles" ON public.user_roles FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on user_roles" ON public.user_roles FOR DELETE USING (true);

-- ============================================
-- 3. TABELA: profiles (perfis dos utilizadores)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL DEFAULT '',
  email TEXT,
  cargo TEXT,
  departamento TEXT,
  divisao TEXT,
  seccao TEXT,
  telefone TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on profiles" ON public.profiles FOR UPDATE USING (true);

-- ============================================
-- 4. FUNÇÃO: updated_at trigger genérico
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers updated_at em todas as tabelas relevantes
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_processos_updated_at
  BEFORE UPDATE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_element_request_responses_updated_at
  BEFORE UPDATE ON public.element_request_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. FUNÇÃO: has_role (verificação de papel - security definer)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- 6. FUNÇÃO: gerar_numero_processo (geração sequencial)
-- ============================================
CREATE OR REPLACE FUNCTION public.gerar_numero_processo(p_ano INTEGER)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq INTEGER;
  v_numero TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.processos
  WHERE ano_gerencia = p_ano;

  v_numero := 'PC-' || p_ano || '/' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_numero;
END;
$$;

-- ============================================
-- 7. FUNÇÃO: avancar_etapa_processo (avanço atómico de etapa)
-- ============================================
CREATE OR REPLACE FUNCTION public.avancar_etapa_processo(
  p_processo_id UUID,
  p_nova_etapa INTEGER,
  p_novo_estado TEXT,
  p_executado_por TEXT,
  p_perfil_executor TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_documentos_gerados TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processo RECORD;
  v_result JSONB;
BEGIN
  -- Lock the row
  SELECT id, etapa_atual, estado INTO v_processo
  FROM public.processos
  WHERE id = p_processo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Processo não encontrado');
  END IF;

  -- Insert history record
  INSERT INTO public.processo_historico (
    processo_id, etapa_anterior, etapa_seguinte,
    estado_anterior, estado_seguinte, acao,
    executado_por, perfil_executor, observacoes, documentos_gerados
  ) VALUES (
    p_processo_id, v_processo.etapa_atual, p_nova_etapa,
    v_processo.estado, p_novo_estado,
    'Avanço da etapa ' || v_processo.etapa_atual || ' para etapa ' || p_nova_etapa,
    p_executado_por, p_perfil_executor, p_observacoes, p_documentos_gerados
  );

  -- Update processo
  UPDATE public.processos SET
    etapa_atual = p_nova_etapa,
    estado = p_novo_estado,
    updated_at = now()
  WHERE id = p_processo_id;

  v_result := jsonb_build_object(
    'success', true,
    'etapa_anterior', v_processo.etapa_atual,
    'nova_etapa', p_nova_etapa,
    'estado', p_novo_estado
  );

  RETURN v_result;
END;
$$;

-- ============================================
-- 8. FUNÇÃO: estatisticas_dashboard
-- ============================================
CREATE OR REPLACE FUNCTION public.estatisticas_dashboard()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_processos', (SELECT COUNT(*) FROM public.processos),
    'processos_por_estado', (
      SELECT jsonb_object_agg(estado, cnt)
      FROM (SELECT estado, COUNT(*) AS cnt FROM public.processos GROUP BY estado) sub
    ),
    'processos_por_etapa', (
      SELECT jsonb_object_agg(etapa_atual::TEXT, cnt)
      FROM (SELECT etapa_atual, COUNT(*) AS cnt FROM public.processos GROUP BY etapa_atual) sub
    ),
    'total_atividades', (SELECT COUNT(*) FROM public.atividades),
    'atividades_pendentes', (SELECT COUNT(*) FROM public.atividades WHERE estado = 'pendente'),
    'atividades_em_curso', (SELECT COUNT(*) FROM public.atividades WHERE estado = 'em_curso'),
    'atividades_concluidas', (SELECT COUNT(*) FROM public.atividades WHERE estado = 'concluida'),
    'atividades_atrasadas', (
      SELECT COUNT(*) FROM public.atividades
      WHERE prazo < now() AND estado NOT IN ('concluida', 'cancelada')
    ),
    'total_pareceres', (SELECT COUNT(*) FROM public.pareceres),
    'total_actas', (SELECT COUNT(*) FROM public.actas_recepcao),
    'submissions_pendentes', (SELECT COUNT(*) FROM public.submissions WHERE status NOT IN ('recepcionado', 'rejeitado'))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================
-- 9. FUNÇÃO: estatisticas_por_perfil (atividades por perfil)
-- ============================================
CREATE OR REPLACE FUNCTION public.estatisticas_por_perfil(p_perfil TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM public.atividades WHERE perfil_responsavel = p_perfil),
    'pendentes', (SELECT COUNT(*) FROM public.atividades WHERE perfil_responsavel = p_perfil AND estado = 'pendente'),
    'em_curso', (SELECT COUNT(*) FROM public.atividades WHERE perfil_responsavel = p_perfil AND estado = 'em_curso'),
    'concluidas', (SELECT COUNT(*) FROM public.atividades WHERE perfil_responsavel = p_perfil AND estado = 'concluida'),
    'atrasadas', (
      SELECT COUNT(*) FROM public.atividades
      WHERE perfil_responsavel = p_perfil AND prazo < now() AND estado NOT IN ('concluida', 'cancelada')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================
-- 10. TRIGGER: Auditoria automática de processos
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_processo_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.etapa_atual IS DISTINCT FROM NEW.etapa_atual OR OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.processo_historico (
      processo_id, etapa_anterior, etapa_seguinte,
      estado_anterior, estado_seguinte, acao, executado_por
    ) VALUES (
      NEW.id, OLD.etapa_atual, NEW.etapa_atual,
      OLD.estado, NEW.estado,
      'Alteração automática: etapa ' || OLD.etapa_atual || '→' || NEW.etapa_atual || ', estado ' || OLD.estado || '→' || NEW.estado,
      'sistema'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_audit_processos
  AFTER UPDATE ON public.processos
  FOR EACH ROW
  WHEN (OLD.etapa_atual IS DISTINCT FROM NEW.etapa_atual OR OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.audit_processo_changes();

-- ============================================
-- 11. ÍNDICES para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_processos_estado ON public.processos(estado);
CREATE INDEX IF NOT EXISTS idx_processos_etapa ON public.processos(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_processos_entity ON public.processos(entity_id);
CREATE INDEX IF NOT EXISTS idx_processos_ano ON public.processos(ano_gerencia);
CREATE INDEX IF NOT EXISTS idx_atividades_processo ON public.atividades(processo_id);
CREATE INDEX IF NOT EXISTS idx_atividades_estado ON public.atividades(estado);
CREATE INDEX IF NOT EXISTS idx_atividades_perfil ON public.atividades(perfil_responsavel);
CREATE INDEX IF NOT EXISTS idx_atividades_prazo ON public.atividades(prazo) WHERE estado NOT IN ('concluida', 'cancelada');
CREATE INDEX IF NOT EXISTS idx_processo_historico_processo ON public.processo_historico(processo_id);
CREATE INDEX IF NOT EXISTS idx_submissions_entity ON public.submissions(entity_id);
CREATE INDEX IF NOT EXISTS idx_submission_docs_entity ON public.submission_documents(entity_id, fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);

-- ============================================
-- 12. Seed: perfis mock iniciais
-- ============================================
INSERT INTO public.profiles (user_id, nome_completo, email, cargo, departamento) VALUES
  ('secretaria-user', 'Maria Silva', 'maria.silva@tca.ao', 'Técnica da Secretaria-Geral', 'Secretaria-Geral'),
  ('tecnico-user', 'João Santos', 'joao.santos@tca.ao', 'Técnico de Análise', 'Contadoria Geral'),
  ('chefe-seccao-user', 'Ana Ferreira', 'ana.ferreira@tca.ao', 'Chefe de Secção', 'Secção de Contas'),
  ('chefe-divisao-user', 'Carlos Neto', 'carlos.neto@tca.ao', 'Chefe de Divisão', 'Divisão de Fiscalização'),
  ('juiz-user', 'Dr. Pedro Mendes', 'pedro.mendes@tca.ao', 'Juiz Conselheiro Relator', 'Gabinete do Juiz');

INSERT INTO public.user_roles (user_id, role) VALUES
  ('secretaria-user', 'secretaria'),
  ('tecnico-user', 'tecnico'),
  ('chefe-seccao-user', 'chefe_seccao'),
  ('chefe-divisao-user', 'chefe_divisao'),
  ('juiz-user', 'juiz'),
  ('secretaria-user', 'admin');
