/**
 * Verifica que o mapeamento PGC→CC3 é consistente em todo o sistema.
 * Após a refatoração, portal e técnico importam de cc3Structures.ts.
 * Este teste valida a integridade da fonte canónica.
 */
import { describe, it, expect } from "vitest";
import { pgcToCC3, allCC3Sections } from "@/lib/cc3Structures";

describe("PGC→CC3 Mapping Integrity", () => {
  it("canonical map should have entries", () => {
    expect(Object.keys(pgcToCC3).length).toBeGreaterThan(100);
  });

  it("all CC3 codes should have valid section prefixes (1.x, 2.x, 3.x, 4.x)", () => {
    const validPrefixes = ["1.", "2.", "3.", "4."];
    for (const [pgc, cc3] of Object.entries(pgcToCC3)) {
      const hasValidPrefix = validPrefixes.some(p => cc3.startsWith(p));
      expect(hasValidPrefix, `PGC ${pgc} maps to invalid CC3 code "${cc3}"`).toBe(true);
    }
  });

  it("should have no duplicate PGC keys (inherent but good to verify count)", () => {
    const keys = Object.keys(pgcToCC3);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it("every CC3 target code should exist in at least one section line definition", () => {
    const allEditableCodes = new Set<string>();
    for (const section of allCC3Sections) {
      for (const line of section.lines) {
        if (line.editable) allEditableCodes.add(line.code);
      }
    }

    const orphanMappings: string[] = [];
    for (const [pgc, cc3] of Object.entries(pgcToCC3)) {
      if (!allEditableCodes.has(cc3)) {
        orphanMappings.push(`PGC ${pgc} → CC3 ${cc3} (no matching editable line)`);
      }
    }
    expect(orphanMappings).toEqual([]);
  });

  it("should cover all PGC classes (1-8)", () => {
    const classesFound = new Set<string>();
    for (const pgc of Object.keys(pgcToCC3)) {
      classesFound.add(pgc[0]);
    }
    // Classes 1 (imobilizado), 2 (existências), 3 (terceiros), 4 (meios monetários),
    // 5 (capital próprio), 6 (proveitos), 7 (custos), 8 (resultados)
    for (const cls of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
      expect(classesFound.has(cls), `Missing PGC class ${cls}`).toBe(true);
    }
  });

  it("should have balance sheet codes (sections 1.x, 2.x) and DRE codes (3.x, 4.x)", () => {
    const cc3Values = Object.values(pgcToCC3);
    expect(cc3Values.some(v => v.startsWith("1."))).toBe(true); // Activo
    expect(cc3Values.some(v => v.startsWith("2."))).toBe(true); // Capital + Passivo
    expect(cc3Values.some(v => v.startsWith("3."))).toBe(true); // Proveitos
    expect(cc3Values.some(v => v.startsWith("4."))).toBe(true); // Custos
  });
});
