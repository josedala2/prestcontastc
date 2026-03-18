/**
 * Hooks para carregar dados financeiros do backend
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrialBalanceLine, Account, AuditLogEntry, FinancialIndicators, ComplianceQuestion, DocumentoTribunal } from "@/types";

// ─── Trial Balance ───
let cachedTrialBalance: TrialBalanceLine[] | null = null;

export function useTrialBalance(entityId?: string, fiscalYearId?: string) {
  const [data, setData] = useState<TrialBalanceLine[]>(cachedTrialBalance || []);
  const [loading, setLoading] = useState(!cachedTrialBalance);

  useEffect(() => {
    if (cachedTrialBalance && !entityId) {
      setData(cachedTrialBalance);
      return;
    }
    loadData();
  }, [entityId, fiscalYearId]);

  const loadData = async () => {
    setLoading(true);
    let query = supabase.from("trial_balance").select("*").order("account_code");
    if (entityId) query = query.eq("entity_id", entityId);
    if (fiscalYearId) query = query.eq("fiscal_year_id", fiscalYearId);

    const { data: rows, error } = await query;
    if (!error && rows) {
      const mapped: TrialBalanceLine[] = rows.map((r: any) => ({
        id: r.id,
        accountCode: r.account_code,
        description: r.description,
        debit: Number(r.debit),
        credit: Number(r.credit),
        balance: Number(r.balance),
      }));
      if (!entityId) cachedTrialBalance = mapped;
      setData(mapped);
    }
    setLoading(false);
  };

  return { trialBalance: data, loading, refresh: loadData };
}

// ─── Accounts (Plano de Contas) ───
let cachedAccounts: Account[] | null = null;

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(cachedAccounts || []);
  const [loading, setLoading] = useState(!cachedAccounts);

  useEffect(() => {
    if (cachedAccounts) return;
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("accounts").select("*").order("code");
    if (!error && data) {
      const mapped: Account[] = data.map((a: any) => ({
        code: a.code,
        description: a.description,
        nature: a.nature as Account["nature"],
        level: a.level,
        parentCode: a.parent_code || undefined,
      }));
      cachedAccounts = mapped;
      setAccounts(mapped);
    }
    setLoading(false);
  };

  const refresh = async () => {
    cachedAccounts = null;
    await loadAccounts();
  };

  return { accounts, loading, refresh };
}

// ─── Audit Log ───
export function useAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("timestamp", { ascending: false });
    if (!error && data) {
      setLogs(data.map((l: any) => ({
        id: l.id,
        action: l.action,
        user: l.username,
        timestamp: new Date(l.timestamp).toLocaleString("pt-AO", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        }),
        detail: l.detail || "",
        actionType: l.action_type as AuditLogEntry["actionType"],
      })));
    }
    setLoading(false);
  };

  const addLog = async (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    await supabase.from("audit_log").insert({
      action: entry.action,
      username: entry.user,
      detail: entry.detail,
      action_type: entry.actionType,
    } as any);
    await loadLogs();
  };

  return { logs, loading, addLog, refresh: loadLogs };
}

// ─── Financial Indicators ───
export function useFinancialIndicators(entityId?: string) {
  const [indicators, setIndicators] = useState<FinancialIndicators[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIndicators();
  }, [entityId]);

  const loadIndicators = async () => {
    setLoading(true);
    let query = supabase.from("financial_indicators").select("*").order("year", { ascending: false });
    if (entityId) query = query.eq("entity_id", entityId);

    const { data, error } = await query;
    if (!error && data) {
      setIndicators(data.map((fi: any) => ({
        entityId: fi.entity_id,
        fiscalYearId: fi.fiscal_year_id,
        year: fi.year,
        activoNaoCorrentes: Number(fi.activo_nao_correntes),
        activoCorrentes: Number(fi.activo_correntes),
        activoTotal: Number(fi.activo_total),
        capitalProprio: Number(fi.capital_proprio),
        passivoNaoCorrente: Number(fi.passivo_nao_corrente),
        passivoCorrente: Number(fi.passivo_corrente),
        passivoTotal: Number(fi.passivo_total),
        proveitosOperacionais: Number(fi.proveitos_operacionais),
        custosOperacionais: Number(fi.custos_operacionais),
        resultadoOperacional: Number(fi.resultado_operacional),
        resultadoFinanceiro: Number(fi.resultado_financeiro),
        resultadoNaoOperacional: Number(fi.resultado_nao_operacional),
        resultadoAntesImpostos: Number(fi.resultado_antes_impostos),
        impostoRendimento: Number(fi.imposto_rendimento),
        resultadoLiquido: Number(fi.resultado_liquido),
        liquidezCorrente: Number(fi.liquidez_corrente),
        liquidezSeca: Number(fi.liquidez_seca),
        liquidezGeral: Number(fi.liquidez_geral),
        roe: Number(fi.roe),
        roa: Number(fi.roa),
        margemLiquida: Number(fi.margem_liquida),
        giroActivo: Number(fi.giro_activo),
        prazoMedioRecebimento: Number(fi.prazo_medio_recebimento),
        prazoMedioRenovacaoEstoque: Number(fi.prazo_medio_renovacao_estoque),
        prazoMedioPagamento: Number(fi.prazo_medio_pagamento),
        cicloFinanceiro: Number(fi.ciclo_financeiro),
        cicloOperacional: Number(fi.ciclo_operacional),
        endividamentoGeral: Number(fi.endividamento_geral),
        composicaoEndividamento: Number(fi.composicao_endividamento),
      })));
    }
    setLoading(false);
  };

  return { indicators, loading, refresh: loadIndicators };
}

// ─── Compliance Questions ───
let cachedQuestions: ComplianceQuestion[] | null = null;

export function useComplianceQuestions() {
  const [questions, setQuestions] = useState<ComplianceQuestion[]>(cachedQuestions || []);
  const [loading, setLoading] = useState(!cachedQuestions);

  useEffect(() => {
    if (cachedQuestions) return;
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("compliance_questions").select("*").order("id");
    if (!error && data) {
      const mapped: ComplianceQuestion[] = data.map((q: any) => ({
        id: q.id,
        question: q.question,
        norma: q.norma,
        classification: q.classification as ComplianceQuestion["classification"],
        score: q.score as ComplianceQuestion["score"],
        responsabilidade: q.responsabilidade || undefined,
      }));
      cachedQuestions = mapped;
      setQuestions(mapped);
    }
    setLoading(false);
  };

  return { questions, loading };
}

// ─── Documentos do Tribunal ───
export function useDocumentosTribunal(exercicioId?: string, entidadeId?: string) {
  const [documentos, setDocumentos] = useState<DocumentoTribunal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocs();
  }, [exercicioId, entidadeId]);

  const loadDocs = async () => {
    setLoading(true);
    let query = supabase.from("documentos_tribunal").select("*").order("created_at", { ascending: false });
    if (exercicioId) query = query.eq("exercicio_id", exercicioId);
    if (entidadeId) query = query.eq("entidade_id", entidadeId);

    const { data, error } = await query;
    if (!error && data) {
      setDocumentos(data.map((d: any) => ({
        id: d.id,
        processoId: d.processo_id || "",
        exercicioId: d.exercicio_id || "",
        entidadeId: d.entidade_id || "",
        tipo: d.tipo as any,
        numeroDocumento: d.numero_documento,
        assunto: d.assunto,
        conteudo: d.conteudo,
        estado: d.estado as any,
        versao: d.versao,
        imutavel: d.imutavel,
        hashSha256: d.hash_sha256 || undefined,
        seloTemporal: d.selo_temporal || undefined,
        criadoPor: d.criado_por,
        aprovadoPor: d.aprovado_por || undefined,
        emitidoAt: d.emitido_at || undefined,
        prazoResposta: d.prazo_resposta || undefined,
        resultadoAcordao: d.resultado_acordao as any || undefined,
        juizRelator: d.juiz_relator || undefined,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        historico: [],
      })));
    }
    setLoading(false);
  };

  const addDocumento = async (doc: Partial<DocumentoTribunal>) => {
    const { error } = await supabase.from("documentos_tribunal").insert({
      processo_id: doc.processoId,
      exercicio_id: doc.exercicioId,
      entidade_id: doc.entidadeId,
      tipo: doc.tipo,
      numero_documento: doc.numeroDocumento,
      assunto: doc.assunto,
      conteudo: doc.conteudo,
      estado: doc.estado || "rascunho",
      versao: doc.versao || 1,
      imutavel: doc.imutavel || false,
      criado_por: doc.criadoPor,
      emitido_at: doc.emitidoAt,
      prazo_resposta: doc.prazoResposta,
      resultado_acordao: doc.resultadoAcordao,
      juiz_relator: doc.juizRelator,
    } as any);
    if (error) throw error;
    await loadDocs();
  };

  const updateDocumento = async (id: string, updates: Partial<DocumentoTribunal>) => {
    const mapped: any = {};
    if (updates.estado) mapped.estado = updates.estado;
    if (updates.conteudo) mapped.conteudo = updates.conteudo;
    if (updates.assunto) mapped.assunto = updates.assunto;
    if (updates.versao) mapped.versao = updates.versao;
    if (updates.aprovadoPor) mapped.aprovado_por = updates.aprovadoPor;
    if (updates.emitidoAt) mapped.emitido_at = updates.emitidoAt;
    if (updates.hashSha256) mapped.hash_sha256 = updates.hashSha256;
    if (updates.imutavel !== undefined) mapped.imutavel = updates.imutavel;
    mapped.updated_at = new Date().toISOString();

    const { error } = await supabase.from("documentos_tribunal").update(mapped).eq("id", id);
    if (error) throw error;
    await loadDocs();
  };

  return { documentos, loading, refresh: loadDocs, addDocumento, updateDocumento, setDocumentos };
}
