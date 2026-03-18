
-- 1. Plano de Contas (Accounts)
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL,
  nature text NOT NULL DEFAULT 'Devedora',
  level integer NOT NULL DEFAULT 1,
  parent_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on accounts" ON public.accounts FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on accounts" ON public.accounts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on accounts" ON public.accounts FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete on accounts" ON public.accounts FOR DELETE TO public USING (true);

-- 2. Balancete Analítico (Trial Balance)
CREATE TABLE public.trial_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  fiscal_year_id text NOT NULL,
  account_code text NOT NULL,
  description text NOT NULL,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trial_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on trial_balance" ON public.trial_balance FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on trial_balance" ON public.trial_balance FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on trial_balance" ON public.trial_balance FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete on trial_balance" ON public.trial_balance FOR DELETE TO public USING (true);

-- 3. Indicadores Financeiros
CREATE TABLE public.financial_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL,
  fiscal_year_id text NOT NULL,
  year integer NOT NULL,
  activo_nao_correntes numeric DEFAULT 0,
  activo_correntes numeric DEFAULT 0,
  activo_total numeric DEFAULT 0,
  capital_proprio numeric DEFAULT 0,
  passivo_nao_corrente numeric DEFAULT 0,
  passivo_corrente numeric DEFAULT 0,
  passivo_total numeric DEFAULT 0,
  proveitos_operacionais numeric DEFAULT 0,
  custos_operacionais numeric DEFAULT 0,
  resultado_operacional numeric DEFAULT 0,
  resultado_financeiro numeric DEFAULT 0,
  resultado_nao_operacional numeric DEFAULT 0,
  resultado_antes_impostos numeric DEFAULT 0,
  imposto_rendimento numeric DEFAULT 0,
  resultado_liquido numeric DEFAULT 0,
  liquidez_corrente numeric DEFAULT 0,
  liquidez_seca numeric DEFAULT 0,
  liquidez_geral numeric DEFAULT 0,
  roe numeric DEFAULT 0,
  roa numeric DEFAULT 0,
  margem_liquida numeric DEFAULT 0,
  giro_activo numeric DEFAULT 0,
  prazo_medio_recebimento numeric DEFAULT 0,
  prazo_medio_renovacao_estoque numeric DEFAULT 0,
  prazo_medio_pagamento numeric DEFAULT 0,
  ciclo_financeiro numeric DEFAULT 0,
  ciclo_operacional numeric DEFAULT 0,
  endividamento_geral numeric DEFAULT 0,
  composicao_endividamento numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, fiscal_year_id)
);
ALTER TABLE public.financial_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on financial_indicators" ON public.financial_indicators FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on financial_indicators" ON public.financial_indicators FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on financial_indicators" ON public.financial_indicators FOR UPDATE TO public USING (true);

-- 4. Audit Log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  username text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  detail text,
  action_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on audit_log" ON public.audit_log FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on audit_log" ON public.audit_log FOR INSERT TO public WITH CHECK (true);

-- 5. Compliance Questions (static reference data)
CREATE TABLE public.compliance_questions (
  id text PRIMARY KEY,
  question text NOT NULL,
  norma text NOT NULL,
  classification text NOT NULL DEFAULT 'sem_gravidade',
  score integer NOT NULL DEFAULT 1,
  responsabilidade text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on compliance_questions" ON public.compliance_questions FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on compliance_questions" ON public.compliance_questions FOR INSERT TO public WITH CHECK (true);

-- 6. Documentos do Tribunal
CREATE TABLE public.documentos_tribunal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id text,
  exercicio_id text,
  entidade_id text,
  tipo text NOT NULL,
  numero_documento text NOT NULL,
  assunto text NOT NULL,
  conteudo text NOT NULL,
  estado text NOT NULL DEFAULT 'rascunho',
  versao integer NOT NULL DEFAULT 1,
  imutavel boolean NOT NULL DEFAULT false,
  hash_sha256 text,
  selo_temporal text,
  criado_por text NOT NULL,
  aprovado_por text,
  emitido_at text,
  prazo_resposta text,
  resultado_acordao text,
  juiz_relator text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos_tribunal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read on documentos_tribunal" ON public.documentos_tribunal FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert on documentos_tribunal" ON public.documentos_tribunal FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update on documentos_tribunal" ON public.documentos_tribunal FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete on documentos_tribunal" ON public.documentos_tribunal FOR DELETE TO public USING (true);

-- ═══ SEED DATA ═══

-- Seed Compliance Questions (27 questions)
INSERT INTO public.compliance_questions (id, question, norma, classification, score, responsabilidade) VALUES
('q1', 'Envio da prestação de contas fora do prazo legalmente estabelecido', 'Nº 1 do artigo 73º da Lei nº 13/10 de 9 de Julho', 'grave', 2, 'Sancionatória - Multa nos termos do artigo 29º, nº 1, alínea g) da Lei nº 13/10'),
('q2', 'Não envio da prestação de contas', 'Nº 1 do artigo 73º da Lei nº 13/10 de 9 de Julho', 'sem_gravidade', 1, NULL),
('q3', 'Não remessa dos documentos requeridos nos instrutivos da Resolução', 'Nº 1 do artigo 3º da Resolução 1/17', 'grave', 2, 'Sancionatória - Multa nos termos do artigo 29º, nº 1, alínea g) da Lei nº 13/10'),
('q4', 'Falta de ordenação documental da prestação de contas mantendo inalterada a designação de cada modelo', 'Nº 2 das Instruções Gerais de Preenchimento da Resolução 1/17', 'grave', 2, 'Sancionatória - Multa'),
('q5', 'Falta de submissão de determinados modelos de prestação de contas', 'Instruções específicas da Resolução 1/17', 'sem_gravidade', 1, NULL),
('q6', 'Não envio de todos os contratos celebrados ou mapas financeiros relativos aos contratos de locação financeira', 'Instruções específicas da Resolução 1/17', 'grave', 2, 'Sancionatória - Multa'),
('q7', 'Falta de inclusão dos dados de cada responsável pela gestão', 'Nº 3 das Instruções Específicas da Resolução 1/17', 'grave', 2, 'Sancionatória - Multa'),
('q8', 'Falta de envio dos mapas constitutivos das Demonstrações Financeiras', 'Nº 4 das Instruções específicas da Resolução 1/17', 'sem_gravidade', 1, NULL),
('q9', 'Não observância das instruções de preenchimento dos modelos, com falta de consistência dos dados', 'Instruções específicas de preenchimento de cada modelo', 'grave', 2, 'Sancionatória - Multa'),
('q10', 'Falta de detalhamento e organização do Balanço Patrimonial de acordo com a estrutura prevista', 'Normas técnicas de estruturação e apresentação das Demonstrações Financeiras', 'sem_gravidade', 1, NULL),
('q11', 'Ausência de assinatura do técnico e do responsável da área, falta de homologação do responsável máximo', 'Nº 3, 4 e 5 das Instruções Gerais da Resolução 1/17', 'grave', 2, 'Sancionatória - Multa'),
('q12', 'Falta de detalhamento da Demonstração de Resultados, não reflectindo a estrutura por classes de contas', 'Normas Técnicas do PGC', 'sem_gravidade', 1, NULL),
('q13', 'Falta de elaboração adequada da Demonstração dos Fluxos de Caixa', 'Normas Técnicas do PGC', 'grave', 2, 'Sancionatória - Multa'),
('q14', 'Falta de envio de documentos adicionais', 'Instruções específicas da Resolução 1/17', 'sem_gravidade', 1, NULL),
('q15', 'Situações que possam alterar o resultado financeiro do exercício', 'Normas Técnicas do PGC', 'grave', 2, 'Sancionatória - Multa'),
('q16', 'Execução de contratos sem concessão do visto do Tribunal de Contas', 'Nº 3 do artigo 8º da Lei nº 13/10', 'sem_gravidade', 1, NULL),
('q17', 'Execução de contratos devolvidos pelo Tribunal para melhor instrução', 'Nº 2 do artigo 66º da Lei nº 13/10', 'grave', 2, 'Sancionatória - Multa'),
('q18', 'Pagamentos ou adiantamentos iniciais não respeitando normas', 'Norma anual de execução do Orçamento', 'sem_gravidade', 1, NULL),
('q19', 'Falta de redução a escrito de contratos obrigatórios', 'Artigo 107º da Lei nº 41/20 (Lei dos Contratos Públicos)', 'sem_gravidade', 1, NULL),
('q20', 'Realização de despesas não autorizadas', 'Artigos 30º-33º da Lei nº 15/10 (Lei do OGE)', 'grave', 2, 'Sancionatória - Multa'),
('q21', 'Falta do envio do relatório e parecer do auditor externo', 'Artigo 25º da Lei nº 11/13 (Sector Empresarial Público)', 'sem_gravidade', 1, NULL),
('q22', 'Demonstrações financeiras elaboradas por softwares não certificados pela AGT', 'Artigo 25º da Lei nº 11/13', 'sem_gravidade', 1, NULL),
('q23', 'Violação de normas financeiras e contabilísticas', 'Artigo 25º da Lei nº 11/13', 'grave', 2, 'Sancionatória - Multa'),
('q24', 'Falta de efectivação dos descontos obrigatórios por lei', 'Norma aplicável', 'grave', 2, 'Sancionatória - Multa'),
('q25', 'Retenção indevida dos descontos obrigatórios por lei', 'Norma aplicável', 'muito_grave', 3, 'Sancionatória - Multa'),
('q26', 'Falta de prestação de informações pedidas, remessa de documentos ou comparência', 'Artigo 18º da Lei nº 13/10', 'grave', 2, 'Sancionatória - Multa'),
('q27', 'Demonstração Numérica irregular', 'Resolução 1/17', 'grave', 2, 'Sancionatória - Multa');

-- Seed Audit Log
INSERT INTO public.audit_log (action, username, timestamp, detail, action_type) VALUES
('Importação de Balancete', 'Carlos Mendes', '2025-03-15 10:30:00+00', '37 linhas importadas — Modelo CC-2', 'importacao'),
('Validação executada', 'Carlos Mendes', '2025-03-15 10:35:00+00', '5 erros, 3 avisos encontrados (3 níveis)', 'validacao'),
('Upload de Anexo', 'Maria Costa', '2025-03-18 14:20:00+00', 'Reconciliação Bancária - BFA.xlsx (v1)', 'upload'),
('Edição de Entidade', 'Carlos Mendes', '2025-03-20 09:00:00+00', 'Atualização de contacto e tipologia', 'edicao'),
('Submissão de Exercício', 'Maria Costa', '2025-04-15 16:00:00+00', 'Exercício 2024 — Submetido ao Tribunal de Contas', 'submissao'),
('Aprovação de Exercício', 'Ana Ferreira (Técnico Validador)', '2025-04-20 09:30:00+00', 'Exercício 2023 — Marcado como Conforme', 'aprovacao'),
('Pedido de Esclarecimento', 'Ana Ferreira (Técnico Validador)', '2025-04-22 11:00:00+00', 'Solicitada justificação de variação em custos', 'validacao'),
('Exportação de Dossiê', 'Maria Costa', '2025-04-25 15:45:00+00', 'Pacote ZIP — 12 ficheiros', 'exportacao'),
('Importação de Balancete', 'Carlos Mendes', '2025-03-22 09:15:00+00', '42 linhas importadas — Modelo CC-3', 'importacao'),
('Submissão de Exercício', 'Maria Costa', '2025-04-10 14:30:00+00', 'Exercício 2024 — Submetido ao Tribunal de Contas', 'submissao'),
('Validação executada', 'Sistema', '2025-03-25 08:00:00+00', '0 erros, 1 aviso encontrado', 'validacao'),
('Upload de Anexo', 'Maria Costa', '2025-04-01 11:00:00+00', 'Relatório de Gestão 2024 (v1)', 'upload');

-- Seed Financial Indicators (entity_id 1 = Presidente da República in DB)
INSERT INTO public.financial_indicators (entity_id, fiscal_year_id, year, activo_nao_correntes, activo_correntes, activo_total, capital_proprio, passivo_nao_corrente, passivo_corrente, passivo_total, proveitos_operacionais, custos_operacionais, resultado_operacional, resultado_financeiro, resultado_nao_operacional, resultado_antes_impostos, imposto_rendimento, resultado_liquido, liquidez_corrente, liquidez_seca, liquidez_geral, roe, roa, margem_liquida, giro_activo, prazo_medio_recebimento, prazo_medio_renovacao_estoque, prazo_medio_pagamento, ciclo_financeiro, ciclo_operacional, endividamento_geral, composicao_endividamento) VALUES
('1', 'fy1', 2024, 3444950457.10, 1565093126.43, 5010043583.53, 3181566010.09, 0, 1938036280.86, 1938036280.86, 4832131205.92, 5506116713.71, -673985507.79, -5788889.03, -994425796.13, -1674200192.95, 0, -1674200192.95, 0.81, 0.78, 2.59, -52.62, -33.42, -34.40, 0.97, 100.5, 0, 2045.52, -1945.02, 100.5, 38.68, 100),
('1', 'fy1b', 2023, 3100000000, 1380000000, 4480000000, 2890000000, 150000000, 1440000000, 1590000000, 4250000000, 4780000000, -530000000, -3200000, -320000000, -853200000, 0, -853200000, 0.96, 0.92, 2.82, -29.52, -19.04, -20.08, 0.95, 95.2, 0, 1820.5, -1725.3, 95.2, 35.49, 90.57),
('2', 'fy2', 2024, 5200000000, 2100000000, 7300000000, 4800000000, 800000000, 1700000000, 2500000000, 3500000000, 3200000000, 300000000, -12000000, -45000000, 243000000, 72900000, 170100000, 1.24, 1.18, 2.92, 3.54, 2.33, 4.86, 0.48, 78.3, 12.5, 145.2, -54.4, 90.8, 34.25, 68.0),
('3', 'fy3', 2024, 32000000000, 12500000000, 44500000000, 38200000000, 2800000000, 3500000000, 6300000000, 8200000000, 5900000000, 2300000000, 450000000, -120000000, 2630000000, 789000000, 1841000000, 3.57, 3.45, 7.06, 4.82, 4.14, 22.45, 0.18, 45.2, 0, 85.3, -40.1, 45.2, 14.16, 55.56);

-- Seed sample trial balance for entity 1
INSERT INTO public.trial_balance (entity_id, fiscal_year_id, account_code, description, debit, credit, balance) VALUES
('1', 'fy1', '11', 'Imobilizações Corpóreas', 9292889535.85, 53258116.48, 9239631419.37),
('1', 'fy1', '12', 'Imobilizações Incorpóreas', 281877106.81, 0, 281877106.81),
('1', 'fy1', '13', 'Investimentos Financeiros', 45000000.00, 0, 45000000.00),
('1', 'fy1', '18', 'Amortizações Acumuladas', 53258116.48, 6129816185.56, -6076558069.08),
('1', 'fy1', '31', 'Clientes', 3471819970.33, 2857084817.45, 614735152.88),
('1', 'fy1', '32', 'Fornecedores', 4222392812.11, 4186757668.04, 35635144.07),
('1', 'fy1', '34', 'Estado', 1806326898.42, 1711569602.44, 94757295.98),
('1', 'fy1', '36', 'Pessoal', 2216593950.52, 2160551952.65, 56041997.87),
('1', 'fy1', '43', 'Depósitos à ordem', 6104784710.01, 6055680235.92, 49104474.09),
('1', 'fy1', '45', 'Caixa', 267360591.53, 266207572.97, 1153018.56),
('1', 'fy1', '51', 'Capital', 0, 262500000.00, -262500000.00),
('1', 'fy1', '61', 'Vendas', 45200000.00, 380500000.00, -335300000.00),
('1', 'fy1', '62', 'Prestações de Serviço', 289137792.14, 2058350119.86, -1769212327.72),
('1', 'fy1', '63', 'Outros proveitos operacionais', 0, 3062918878.20, -3062918878.20),
('1', 'fy1', '71', 'Custo das existências vendidas', 180034097.24, 349316.27, 179684780.97),
('1', 'fy1', '72', 'Custos com o pessoal', 3319046110.28, 1194800.00, 3317851310.28),
('1', 'fy1', '73', 'Amortizações do exercício', 508397950.43, 0, 508397950.43),
('1', 'fy1', '75', 'Outros custos e perdas operacionais', 1630174424.96, 129991752.93, 1500182672.03),
('1', 'fy1', '88', 'Resultado líquido do exercício', 6727621290.00, 5276221097.05, 1451400192.95);

-- Seed Accounts (PGC - top level)
INSERT INTO public.accounts (code, description, nature, level, parent_code) VALUES
('1', 'Meios Fixos e Investimentos', 'Devedora', 1, NULL),
('11', 'Imobilizações Corpóreas', 'Devedora', 2, '1'),
('12', 'Imobilizações Incorpóreas', 'Devedora', 2, '1'),
('13', 'Investimentos Financeiros', 'Devedora', 2, '1'),
('14', 'Imobilizações em Curso', 'Devedora', 2, '1'),
('18', 'Amortizações Acumuladas', 'Credora', 2, '1'),
('19', 'Provisões para Investimentos Financeiros', 'Credora', 2, '1'),
('2', 'Existências', 'Devedora', 1, NULL),
('21', 'Compras', 'Devedora', 2, '2'),
('22', 'Matérias-primas, subsidiárias e de consumo', 'Devedora', 2, '2'),
('26', 'Mercadorias', 'Devedora', 2, '2'),
('29', 'Provisões para depreciação de existências', 'Credora', 2, '2'),
('3', 'Terceiros', 'Devedora', 1, NULL),
('31', 'Clientes', 'Devedora', 2, '3'),
('32', 'Fornecedores', 'Credora', 2, '3'),
('33', 'Empréstimos', 'Credora', 2, '3'),
('34', 'Estado', 'Devedora', 2, '3'),
('35', 'Entidades participantes e participadas', 'Devedora', 2, '3'),
('36', 'Pessoal', 'Devedora', 2, '3'),
('37', 'Outros valores a receber e a pagar', 'Devedora', 2, '3'),
('38', 'Provisões para cobrança duvidosa', 'Credora', 2, '3'),
('39', 'Provisões para outros riscos e encargos', 'Credora', 2, '3'),
('4', 'Meios Monetários', 'Devedora', 1, NULL),
('41', 'Títulos negociáveis', 'Devedora', 2, '4'),
('42', 'Depósitos a prazo', 'Devedora', 2, '4'),
('43', 'Depósitos à ordem', 'Devedora', 2, '4'),
('45', 'Caixa', 'Devedora', 2, '4'),
('5', 'Capital e Reservas', 'Credora', 1, NULL),
('51', 'Capital', 'Credora', 2, '5'),
('53', 'Prémios de emissão', 'Credora', 2, '5'),
('55', 'Reservas legais', 'Credora', 2, '5'),
('56', 'Reservas de reavaliação', 'Credora', 2, '5'),
('58', 'Reservas livres', 'Credora', 2, '5'),
('6', 'Proveitos e Ganhos por Natureza', 'Credora', 1, NULL),
('61', 'Vendas', 'Credora', 2, '6'),
('62', 'Prestações de Serviço', 'Credora', 2, '6'),
('63', 'Outros proveitos operacionais', 'Credora', 2, '6'),
('66', 'Proveitos e ganhos financeiros gerais', 'Credora', 2, '6'),
('68', 'Outros proveitos e ganhos não operacionais', 'Credora', 2, '6'),
('7', 'Custos e Perdas por Natureza', 'Devedora', 1, NULL),
('71', 'Custo das existências vendidas', 'Devedora', 2, '7'),
('72', 'Custos com o pessoal', 'Devedora', 2, '7'),
('73', 'Amortizações do exercício', 'Devedora', 2, '7'),
('74', 'Provisões do exercício', 'Devedora', 2, '7'),
('75', 'Outros custos e perdas operacionais', 'Devedora', 2, '7'),
('76', 'Custos e perdas financeiras gerais', 'Devedora', 2, '7'),
('78', 'Outros custos e perdas não operacionais', 'Devedora', 2, '7'),
('8', 'Resultados', 'Devedora', 1, NULL),
('81', 'Resultados transitados', 'Credora', 2, '8'),
('88', 'Resultado líquido do exercício', 'Devedora', 2, '8');

-- Seed Documentos do Tribunal
INSERT INTO public.documentos_tribunal (processo_id, exercicio_id, entidade_id, tipo, numero_documento, assunto, conteudo, estado, versao, imutavel, hash_sha256, criado_por, emitido_at, created_at, updated_at) VALUES
('p1', 'fy1', '1', 'notificacao', 'NOT/TCA/2025/001', 'Notificação de Recepção da Prestação de Contas 2024', 'Serve a presente para notificar V. Exa. de que a prestação de contas relativa ao exercício de 2024 foi recebida e se encontra em fase de triagem.', 'emitido', 1, true, 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5', 'Rosa Tavares (Secretaria TCA)', '2025-04-20', '2025-04-20', '2025-04-20'),
('p1', 'fy1', '1', 'diligencia', 'DIL/TCA/2025/001', 'Pedido de Esclarecimento — Variação de Custos com Pessoal', 'Solicita-se esclarecimento sobre o aumento de 28.5% nos custos com pessoal face ao exercício anterior.', 'emitido', 1, false, NULL, 'Ana Ferreira (Técnico Validador)', '2025-05-02', '2025-05-01', '2025-05-02'),
('p1', 'fy1', '1', 'relatorio_analise', 'REL/TCA/2025/001', 'Relatório de Análise e Verificação 2024', 'Após análise detalhada da prestação de contas relativa ao exercício de 2024, conclui-se que a conta apresenta nível 2 (Em Termos com Recomendações).', 'em_revisao', 2, false, NULL, 'Ana Ferreira (Técnico Validador)', NULL, '2025-05-20', '2025-05-25'),
('p1', 'fy1', '1', 'acordao', 'ACO/TCA/2025/001', 'Acórdão — Prestação de Contas 2024', 'O Tribunal de Contas, reunido em Plenário, delibera que a conta é considerada EM TERMOS COM RECOMENDAÇÕES.', 'rascunho', 1, false, NULL, 'Juiz Conselheiro Dr. António Ramos', NULL, '2025-06-01', '2025-06-01'),
('p2', 'fy2', '2', 'notificacao', 'NOT/TCA/2025/002', 'Notificação de Recepção 2024', 'Notificação de recepção da prestação de contas relativa ao exercício de 2024.', 'emitido', 1, true, 'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0', 'Rosa Tavares (Secretaria TCA)', '2025-04-18', '2025-04-18', '2025-04-18'),
('p3', 'fy3', '3', 'acordao', 'ACO/TCA/2025/002', 'Acórdão — Prestação de Contas 2024', 'O Tribunal de Contas delibera que a conta relativa ao exercício de 2024 é considerada EM TERMOS.', 'emitido', 1, true, 'a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1', 'Juiz Conselheiro Dra. Maria Fernandes', '2025-06-15', '2025-06-10', '2025-06-15');
