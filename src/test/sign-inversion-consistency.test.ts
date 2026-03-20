/**
 * Verifica que a inversão de sinal para contas de natureza credora é
 * simétrica entre portal (persistência) e ambiente técnico (leitura).
 *
 * Portal:  balance_stored = isCreditNature ? -displayValue : displayValue
 * Técnico: displayValue   = isCreditNature ? -balance_stored : balance_stored
 *
 * Resultado: displayValue_técnico === displayValue_portal (round-trip)
 */
import { describe, it, expect } from "vitest";
import { mapBalanceteToCC3, allCC3Sections } from "@/lib/cc3Structures";

// The same credit-nature list used in both portal and cc3Structures
const CREDIT_NATURE_SECTIONS = ["capProprio", "passNaoCorr", "passCorr", "proveitos"];
const DEBIT_NATURE_SECTIONS = ["ativNaoCorr", "ativCorr", "custos"];

/**
 * Simulates the portal's persist logic:
 * Given a display value and section, returns the balance stored in trial_balance.
 */
function portalPersist(displayValue: number, sectionKey: string): number {
  const isCreditNature = CREDIT_NATURE_SECTIONS.includes(sectionKey);
  return isCreditNature ? -displayValue : displayValue;
}

/**
 * Simulates the technical retrieval logic (mapBalanceteToCC3):
 * Given a stored balance and section, returns the display value.
 */
function tecnicoRetrieve(storedBalance: number, sectionKey: string): number {
  const isCreditNature = CREDIT_NATURE_SECTIONS.includes(sectionKey);
  return isCreditNature ? -storedBalance : storedBalance;
}

describe("Sign Inversion Consistency (Portal ↔ Técnico)", () => {
  const testValues = [1000, -500, 0, 123456.78, -0.01];

  for (const sectionKey of [...CREDIT_NATURE_SECTIONS, ...DEBIT_NATURE_SECTIONS]) {
    it(`round-trip preserves display value for section "${sectionKey}"`, () => {
      for (const displayValue of testValues) {
        const stored = portalPersist(displayValue, sectionKey);
        const recovered = tecnicoRetrieve(stored, sectionKey);
        expect(recovered).toBe(displayValue);
      }
    });
  }

  it("credit-nature sections should negate on persist", () => {
    for (const section of CREDIT_NATURE_SECTIONS) {
      expect(portalPersist(1000, section)).toBe(-1000);
      expect(portalPersist(-500, section)).toBe(500);
    }
  });

  it("debit-nature sections should NOT negate on persist", () => {
    for (const section of DEBIT_NATURE_SECTIONS) {
      expect(portalPersist(1000, section)).toBe(1000);
      expect(portalPersist(-500, section)).toBe(-500);
    }
  });

  it("credit-nature sections should negate on retrieve", () => {
    for (const section of CREDIT_NATURE_SECTIONS) {
      expect(tecnicoRetrieve(-1000, section)).toBe(1000);
      expect(tecnicoRetrieve(500, section)).toBe(-500);
    }
  });

  it("debit-nature sections should NOT negate on retrieve", () => {
    for (const section of DEBIT_NATURE_SECTIONS) {
      expect(tecnicoRetrieve(1000, section)).toBe(1000);
      expect(tecnicoRetrieve(-500, section)).toBe(-500);
    }
  });

  it("all CC3 sections are classified as either credit or debit nature", () => {
    const allKeys = allCC3Sections.map(s => s.key);
    const classified = new Set([...CREDIT_NATURE_SECTIONS, ...DEBIT_NATURE_SECTIONS]);
    for (const key of allKeys) {
      expect(classified.has(key), `Section "${key}" is not classified`).toBe(true);
    }
  });

  it("mapBalanceteToCC3 applies correct sign for credit-nature account", () => {
    // PGC 51 → CC3 2.1.1.1 (Capital Social → capProprio section, credit nature)
    const rows = [{ account_code: "51", balance: -5000 }];
    const result = mapBalanceteToCC3(rows);
    // Credit nature: display = -balance = -(-5000) = 5000
    expect(result["capProprio"]["2.1.1.1"]).toBe(5000);
  });

  it("mapBalanceteToCC3 applies correct sign for debit-nature account", () => {
    // PGC 111 → CC3 1.1.1.1 (Terrenos → ativNaoCorr section, debit nature)
    const rows = [{ account_code: "111", balance: 3000 }];
    const result = mapBalanceteToCC3(rows);
    // Debit nature: display = balance = 3000
    expect(result["ativNaoCorr"]["1.1.1.1"]).toBe(3000);
  });

  it("mapBalanceteToCC3 handles revenue (proveitos) sign correctly", () => {
    // PGC 611 → CC3 3.1.1 (proveitos section, credit nature)
    const rows = [{ account_code: "611", balance: -80000 }];
    const result = mapBalanceteToCC3(rows);
    expect(result["proveitos"]["3.1.1"]).toBe(80000);
  });

  it("mapBalanceteToCC3 handles costs (custos) sign correctly", () => {
    // PGC 711 → CC3 4.1.1 (custos section, debit nature)
    const rows = [{ account_code: "711", balance: 45000 }];
    const result = mapBalanceteToCC3(rows);
    expect(result["custos"]["4.1.1"]).toBe(45000);
  });
});
