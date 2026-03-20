/**
 * Validação automática: compara totais do portal com totais do CC-2 técnico.
 * Garante que mapBalanceteToCC3 + sumEditable produzem os mesmos agregados
 * independentemente do ponto de entrada (portal ou ambiente técnico).
 */
import { describe, it, expect } from "vitest";
import {
  mapBalanceteToCC3,
  sumEditable,
  allCC3Sections,
  pgcToCC3,
} from "@/lib/cc3Structures";

// ─── Fixtures ───
const SAMPLE_BALANCETE: { account_code: string; balance: number }[] = [
  // Classe 1 – Meios Fixos (debit nature → positive balance)
  { account_code: "111", balance: 500000 },
  { account_code: "121", balance: 1200000 },
  { account_code: "133", balance: 80000 },
  // Classe 3 – Existências (debit)
  { account_code: "311", balance: 150000 },
  { account_code: "351", balance: 45000 },
  // Classe 4 – Terceiros (debit: clientes)
  { account_code: "411", balance: 320000 },
  // Classe 1 – Amortizações (credit nature → stored negative)
  { account_code: "182", balance: -200000 },
  // Classe 5 – Capital Próprio (credit nature → stored negative)
  { account_code: "51", balance: -800000 },
  { account_code: "541", balance: -120000 },
  { account_code: "58", balance: -95000 },
  // Classe 6 – Proveitos (credit nature → stored negative)
  { account_code: "611", balance: -2500000 },
  { account_code: "621", balance: -300000 },
  // Classe 7 – Custos (debit nature → positive)
  { account_code: "711", balance: 900000 },
  { account_code: "721", balance: 600000 },
  { account_code: "731", balance: 150000 },
  { account_code: "751", balance: 50000 },
];

const CREDIT_SECTIONS = new Set(["capProprio", "passNaoCorr", "passCorr", "proveitos"]);

function computeTotals(rows: typeof SAMPLE_BALANCETE) {
  const mapped = mapBalanceteToCC3(rows);
  const sectionSums: Record<string, number> = {};
  for (const section of allCC3Sections) {
    sectionSums[section.key] = sumEditable(section.lines, mapped[section.key] || {});
  }
  return {
    sectionSums,
    totalAtivo: sectionSums["ativNaoCorr"] + sectionSums["ativCorr"],
    totalCapProprio: sectionSums["capProprio"],
    totalPassivo: sectionSums["passNaoCorr"] + sectionSums["passCorr"],
    totalProveitos: sectionSums["proveitos"],
    totalCustos: sectionSums["custos"],
    mapped,
  };
}

describe("Portal ↔ Técnico: Comparação de Totais CC-2", () => {
  const totals = computeTotals(SAMPLE_BALANCETE);

  it("totalAtivo > 0 para entidade saudável", () => {
    expect(totals.totalAtivo).toBeGreaterThan(0);
  });

  it("totalCapitalPróprio > 0", () => {
    expect(totals.totalCapProprio).toBeGreaterThan(0);
  });

  it("totalProveitos > 0 (inversão de sinal aplicada)", () => {
    expect(totals.totalProveitos).toBeGreaterThan(0);
  });

  it("totalCustos > 0 (natureza devedora mantida)", () => {
    expect(totals.totalCustos).toBeGreaterThan(0);
  });

  it("round-trip: portal persist → técnico retrieve produz somas idênticas", () => {
    const persistedRows: { account_code: string; balance: number }[] = [];
    for (const section of allCC3Sections) {
      const vals = totals.mapped[section.key] || {};
      const isCreditNature = CREDIT_SECTIONS.has(section.key);
      for (const [cc3Code, displayValue] of Object.entries(vals)) {
        if (displayValue === 0) continue;
        const pgcCode = Object.entries(pgcToCC3).find(([, cc3]) => cc3 === cc3Code)?.[0];
        if (!pgcCode) continue;
        const storedBalance = isCreditNature ? -displayValue : displayValue;
        persistedRows.push({ account_code: pgcCode, balance: storedBalance });
      }
    }

    const tecnicoTotals = computeTotals(persistedRows);

    for (const section of allCC3Sections) {
      expect(
        tecnicoTotals.sectionSums[section.key],
        `Divergência na secção "${section.key}": portal=${totals.sectionSums[section.key]}, técnico=${tecnicoTotals.sectionSums[section.key]}`
      ).toBeCloseTo(totals.sectionSums[section.key], 2);
    }
  });

  it("todos os PGC codes do fixture mapeiam para uma secção CC3", () => {
    const unmapped: string[] = [];
    for (const row of SAMPLE_BALANCETE) {
      const direct = pgcToCC3[row.account_code];
      if (!direct) {
        const prefixes = Object.keys(pgcToCC3)
          .filter(k => row.account_code.startsWith(k))
          .sort((a, b) => b.length - a.length);
        if (prefixes.length === 0) unmapped.push(row.account_code);
      }
    }
    expect(unmapped, `PGC não mapeados: ${unmapped.join(", ")}`).toHaveLength(0);
  });

  it("sumEditable é consistente com soma manual das linhas editáveis", () => {
    for (const section of allCC3Sections) {
      const vals = totals.mapped[section.key] || {};
      const manualSum = section.lines.filter(l => l.editable).reduce((acc, l) => acc + (vals[l.code] || 0), 0);
      expect(sumEditable(section.lines, vals), `Inconsistência em "${section.key}"`).toBeCloseTo(manualSum, 2);
    }
  });

  it("balancete vazio produz totais zero", () => {
    const empty = computeTotals([]);
    for (const section of allCC3Sections) {
      expect(empty.sectionSums[section.key]).toBe(0);
    }
  });

  it("PGC codes duplicados acumulam (não sobrescrevem)", () => {
    const rows = [
      { account_code: "111", balance: 1000 },
      { account_code: "111", balance: 2000 },
    ];
    const mapped = mapBalanceteToCC3(rows);
    const cc3Code = pgcToCC3["111"];
    expect(mapped["ativNaoCorr"][cc3Code]).toBe(3000);
  });
});
