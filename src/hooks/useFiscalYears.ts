import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FiscalYear } from "@/types";
import { useEntities } from "./useEntities";

let cachedFiscalYears: FiscalYear[] | null = null;

export function useFiscalYears(entityId?: string) {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(cachedFiscalYears || []);
  const [loading, setLoading] = useState(!cachedFiscalYears);
  const { entities } = useEntities();

  const loadFiscalYears = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fiscal_years")
      .select("*")
      .order("year", { ascending: false });

    if (!error && data) {
      const mapped: FiscalYear[] = data.map((fy: any) => {
        const entity = entities.find(e => e.id === fy.entity_id);
        const shortName = entity
          ? (entity.name.split(" - ")[1]?.trim() || entity.name)
          : "Desconhecida";
        return {
          id: fy.id,
          entityId: fy.entity_id,
          entityName: shortName,
          year: fy.year,
          startDate: `${fy.year}-01-01`,
          endDate: `${fy.year}-12-31`,
          status: mapStatus(fy.status),
          totalDebito: Number(fy.total_receita || 0),
          totalCredito: Number(fy.total_despesa || 0),
          errorsCount: 0,
          warningsCount: 0,
          checklistProgress: Number(fy.completude || 0),
          deadline: fy.deadline
            ? new Date(fy.deadline).toISOString().split("T")[0]
            : `${fy.year + 1}-06-30`,
          submittedAt: fy.submitted_at
            ? new Date(fy.submitted_at).toISOString().split("T")[0]
            : undefined,
        };
      });
      cachedFiscalYears = mapped;
      setFiscalYears(mapped);
    }
    setLoading(false);
  }, [entities]);

  useEffect(() => {
    if (entities.length === 0) return;
    if (cachedFiscalYears) {
      setFiscalYears(cachedFiscalYears);
      setLoading(false);
      return;
    }
    loadFiscalYears();
  }, [entities, loadFiscalYears]);

  const refresh = useCallback(async () => {
    cachedFiscalYears = null;
    await loadFiscalYears();
  }, [loadFiscalYears]);

  const filtered = entityId
    ? fiscalYears.filter(fy => fy.entityId === entityId)
    : fiscalYears;

  return { fiscalYears: filtered, allFiscalYears: fiscalYears, loading, refresh };
}

function mapStatus(dbStatus: string): FiscalYear["status"] {
  const map: Record<string, FiscalYear["status"]> = {
    rascunho: "rascunho",
    pendente: "rascunho",
    em_validacao: "em_validacao",
    submetido: "submetido",
    recepcionado: "submetido",
    em_analise: "em_analise",
    com_pedidos: "com_pedidos",
    conforme: "conforme",
    nao_conforme: "nao_conforme",
  };
  return map[dbStatus] || "rascunho";
}
