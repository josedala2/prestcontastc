/**
 * Testa que a lógica de parsing Excel (simulada com dados brutos)
 * produz exactamente os mesmos valores CC-3 quando executada com
 * os mesmos inputs — validando consistência portal ↔ técnico.
 *
 * Como ambos os componentes usam lógica idêntica inline, este teste
 * replica essa lógica numa função pura e verifica os resultados.
 */
import { describe, it, expect } from "vitest";
import {
  activoNaoCorrente,
  activoCorrentes as ativoCorrentes,
  capitalProprioLines,
  passivoNaoCorrenteLines,
  passivoCorrenteLines,
  proveitosLines,
  custosLines,
  pgcToCC3,
  sumEditable,
  type BalancoLine,
} from "@/lib/cc3Structures";

// ─── Replicate shared parsing logic (identical in both components) ───
function parseKzValue(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return 0;
  const cleaned = val.replace(/[Kz\s,R\$]/g, "").replace(/\(/g, "-").replace(/\)/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeLabel(s: string): string {
  return s.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

interface SectionDef {
  key: string;
  lines: BalancoLine[];
}

const ALL_SECTIONS: SectionDef[] = [
  { key: "ativNaoCorr", lines: activoNaoCorrente },
  { key: "ativCorr", lines: ativoCorrentes },
  { key: "capProprio", lines: capitalProprioLines },
  { key: "passNaoCorr", lines: passivoNaoCorrenteLines },
  { key: "passCorr", lines: passivoCorrenteLines },
  { key: "proveitos", lines: proveitosLines },
  { key: "custos", lines: custosLines },
];

/**
 * Simulates mapExcelToForm on raw row data (same algorithm as both components).
 * Returns section values keyed by section key.
 */
function simulateExcelParsing(rows: unknown[][]): { sectionValues: Record<string, Record<string, number>>; matchCount: number } {
  const labelMap = new Map<string, { code: string; sectionIdx: number }>();
  const cc3CodeMap = new Map<string, { code: string; sectionIdx: number }>();

  ALL_SECTIONS.forEach((sec, idx) => {
    sec.lines.filter(l => l.editable).forEach(l => {
      labelMap.set(normalizeLabel(l.label), { code: l.code, sectionIdx: idx });
      cc3CodeMap.set(l.code, { code: l.code, sectionIdx: idx });
    });
  });

  const rawSectionValues: Record<string, number>[] = ALL_SECTIONS.map(() => ({}));
  let matchCount = 0;

  const tryMatchValue = (row: unknown[], match: { code: string; sectionIdx: number }) => {
    if (rawSectionValues[match.sectionIdx][match.code]) return;
    const priorityCols = [4, 2, 3, 5];
    for (const j of priorityCols) {
      if (j < row.length) {
        const val = parseKzValue(row[j]);
        if (val !== 0) {
          rawSectionValues[match.sectionIdx][match.code] = val;
          matchCount++;
          return;
        }
      }
    }
    for (let j = 2; j < row.length; j++) {
      if (priorityCols.includes(j)) continue;
      const val = parseKzValue(row[j]);
      if (val !== 0) {
        rawSectionValues[match.sectionIdx][match.code] = val;
        matchCount++;
        return;
      }
    }
  };

  rows.forEach(row => {
    if (!Array.isArray(row) || row.length < 2) return;

    for (let col = 0; col < Math.min(row.length, 4); col++) {
      const cellText = normalizeLabel(String(row[col] || ""));
      if (!cellText || cellText.length < 3) continue;
      const matchByLabel = labelMap.get(cellText);
      if (matchByLabel) { tryMatchValue(row, matchByLabel); return; }
    }

    for (let col = 0; col < Math.min(row.length, 3); col++) {
      const cellCode = String(row[col] || "").trim().replace(/^['"]|['"]$/g, "");
      if (!cellCode) continue;
      const matchByCC3 = cc3CodeMap.get(cellCode);
      if (matchByCC3) { tryMatchValue(row, matchByCC3); return; }
    }

    const pgcCode = String(row[0] || "").trim().replace(/[.\s]/g, "");
    const cc3Code = pgcToCC3[pgcCode];
    if (cc3Code) {
      const matchByPgc = cc3CodeMap.get(cc3Code);
      if (matchByPgc) tryMatchValue(row, matchByPgc);
    }
  });

  const sectionValues: Record<string, Record<string, number>> = {};
  ALL_SECTIONS.forEach((sec, idx) => { sectionValues[sec.key] = rawSectionValues[idx]; });
  return { sectionValues, matchCount };
}

// ─── Test data: simulated Excel rows ───
// Format: [PGC code, description, prior year, blank, current year]
const MOCK_EXCEL_ROWS: unknown[][] = [
  ["1.1.1", "Terrenos e Recursos Naturais", 0, "", 500000],
  ["1.2.1", "Edifícios e Outras Construções", 0, "", 1200000],
  ["1.3.3", "Equipamento Administrativo", 0, "", 80000],
  ["1.8.2", "Amortizações de Edifícios", 0, "", -200000],
  ["3.1.1", "Mercadorias", 0, "", 150000],
  ["3.5.1", "Matérias-Primas", 0, "", 45000],
  ["4.1.1", "Clientes c/c", 0, "", 320000],
  ["5.1", "Capital", 0, "", 800000],
  ["5.4.1", "Reservas Legais", 0, "", 120000],
  ["5.8", "Resultado Líquido do Exercício", 0, "", 95000],
  ["6.1.1", "Vendas", 0, "", 2500000],
  ["6.2.1", "Prestações de Serviços", 0, "", 300000],
  ["7.1.1", "CMVMC", 0, "", 900000],
  ["7.2.1", "Remunerações do Pessoal", 0, "", 600000],
  ["7.3.1", "Amortizações do Exercício", 0, "", 150000],
  ["7.5.1", "Impostos", 0, "", 50000],
];

// Same data but using PGC codes (no dots) — simulating a different Excel format
const MOCK_EXCEL_PGC_ROWS: unknown[][] = [
  ["111", "Terrenos e Recursos Naturais", 0, "", 500000],
  ["121", "Edifícios e Outras Construções", 0, "", 1200000],
  ["133", "Equipamento Administrativo", 0, "", 80000],
  ["182", "Amortizações de Edifícios", 0, "", -200000],
  ["311", "Mercadorias", 0, "", 150000],
  ["351", "Matérias-Primas", 0, "", 45000],
  ["411", "Clientes c/c", 0, "", 320000],
  ["51", "Capital", 0, "", 800000],
  ["541", "Reservas Legais", 0, "", 120000],
  ["58", "Resultado Líquido do Exercício", 0, "", 95000],
  ["611", "Vendas", 0, "", 2500000],
  ["621", "Prestações de Serviços", 0, "", 300000],
  ["711", "CMVMC", 0, "", 900000],
  ["721", "Remunerações do Pessoal", 0, "", 600000],
  ["731", "Amortizações do Exercício", 0, "", 150000],
  ["751", "Impostos", 0, "", 50000],
];

describe("Excel Upload: Portal ↔ Técnico produzem mesmos valores", () => {
  const resultCC3 = simulateExcelParsing(MOCK_EXCEL_ROWS);
  const resultPGC = simulateExcelParsing(MOCK_EXCEL_PGC_ROWS);

  it("ambos os formatos mapeiam o mesmo número de linhas", () => {
    expect(resultCC3.matchCount).toBeGreaterThan(0);
    expect(resultPGC.matchCount).toBeGreaterThan(0);
    expect(resultCC3.matchCount).toBe(resultPGC.matchCount);
  });

  it("somas por secção são idênticas entre CC-3 e PGC input", () => {
    for (const sec of ALL_SECTIONS) {
      const sumCC3 = sumEditable(sec.lines, resultCC3.sectionValues[sec.key] || {});
      const sumPGC = sumEditable(sec.lines, resultPGC.sectionValues[sec.key] || {});
      expect(sumPGC, `Secção "${sec.key}" diverge: CC3=${sumCC3}, PGC=${sumPGC}`).toBeCloseTo(sumCC3, 2);
    }
  });

  it("valores individuais são idênticos linha a linha", () => {
    for (const sec of ALL_SECTIONS) {
      const valsCC3 = resultCC3.sectionValues[sec.key] || {};
      const valsPGC = resultPGC.sectionValues[sec.key] || {};
      const allCodes = new Set([...Object.keys(valsCC3), ...Object.keys(valsPGC)]);
      for (const code of allCodes) {
        expect(
          valsPGC[code] || 0,
          `"${sec.key}.${code}": CC3=${valsCC3[code]}, PGC=${valsPGC[code]}`
        ).toBeCloseTo(valsCC3[code] || 0, 2);
      }
    }
  });

  it("ativo total é consistente", () => {
    const ativoCC3 = sumEditable(activoNaoCorrente, resultCC3.sectionValues["ativNaoCorr"]) +
                     sumEditable(ativoCorrentes, resultCC3.sectionValues["ativCorr"]);
    const ativoPGC = sumEditable(activoNaoCorrente, resultPGC.sectionValues["ativNaoCorr"]) +
                     sumEditable(ativoCorrentes, resultPGC.sectionValues["ativCorr"]);
    expect(ativoPGC).toBeCloseTo(ativoCC3, 2);
    expect(ativoCC3).toBeGreaterThan(0);
  });

  it("resultado exercício é consistente", () => {
    const provCC3 = sumEditable(proveitosLines, resultCC3.sectionValues["proveitos"]);
    const custCC3 = sumEditable(custosLines, resultCC3.sectionValues["custos"]);
    const provPGC = sumEditable(proveitosLines, resultPGC.sectionValues["proveitos"]);
    const custPGC = sumEditable(custosLines, resultPGC.sectionValues["custos"]);
    expect(provPGC - custPGC).toBeCloseTo(provCC3 - custCC3, 2);
  });

  it("parseKzValue trata formatos correctamente", () => {
    expect(parseKzValue("1500000 Kz")).toBe(1500000);
    expect(parseKzValue("(500)")).toBe(-500);
    expect(parseKzValue(42000)).toBe(42000);
    expect(parseKzValue("")).toBe(0);
    expect(parseKzValue(null)).toBe(0);
    expect(parseKzValue("500.50")).toBe(500.5);
  });

  it("linhas vazias ou curtas são ignoradas", () => {
    const result = simulateExcelParsing([[], ["x"], [null, null]]);
    expect(result.matchCount).toBe(0);
  });
});
