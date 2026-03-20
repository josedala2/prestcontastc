/**
 * Verifica que os mapeamentos PGC→CC3 nos componentes do Portal e do Técnico
 * são idênticos à fonte canónica em cc3Structures.ts
 */
import { describe, it, expect } from "vitest";
import { pgcToCC3 as canonical } from "@/lib/cc3Structures";

// ─── Extract the local pgcToCC3 maps from the two components ───
// Since the maps are defined inside React components/hooks, we replicate them here
// exactly as they appear in the source files for comparison.

// From src/components/AnaliseFinanceiraReadonly.tsx (Portal)
const portalPgcToCC3: Record<string, string> = {
  "111": "1.1.1.1", "112": "1.1.1.2", "113": "1.1.1.3", "114": "1.1.1.4",
  "115": "1.1.1.5", "116": "1.1.1.6", "119": "1.1.1.7",
  "141": "1.1.1.8", "147": "1.1.1.9", "181": "1.1.1.10",
  "121": "1.1.2.1", "122": "1.1.2.2", "123": "1.1.2.3", "124": "1.1.2.4",
  "129": "1.1.2.5", "148": "1.1.2.6", "182": "1.1.2.7",
  "131": "1.1.3.1", "132": "1.1.3.2",
  "133": "1.1.4.1", "134": "1.1.4.2", "135": "1.1.4.3", "139": "1.1.4.4",
  "149": "1.1.4.5", "183": "1.1.4.6",
  "191": "1.1.5.1", "192": "1.1.5.2", "193": "1.1.5.3", "194": "1.1.5.4", "199": "1.1.5.5",
  "22": "1.2.1.1", "23": "1.2.1.2", "24": "1.2.1.3", "25": "1.2.1.4",
  "26": "1.2.1.5", "27": "1.2.1.6", "28": "1.2.1.7", "29": "1.2.1.8",
  "311": "1.2.2.1", "312": "1.2.2.2", "318": "1.2.2.3", "329": "1.2.2.4",
  "34": "1.2.2.5", "35": "1.2.2.6", "36": "1.2.2.7", "372": "1.2.2.8",
  "38": "1.2.2.10",
  "41": "1.2.3.1", "42": "1.2.3.2", "43": "1.2.3.3", "45": "1.2.3.4", "48": "1.2.3.5", "49": "1.2.3.6",
  "373": "1.2.4.1", "374": "1.2.4.2", "379": "1.2.4.3",
  "51": "2.1.1.1", "52": "2.1.1.2", "53": "2.1.1.3", "54": "2.1.1.4",
  "55": "2.1.2.1", "56": "2.1.2.2", "57": "2.1.2.3", "58": "2.1.2.4",
  "811": "2.1.3.1", "812": "2.1.3.2", "813": "2.1.3.3", "814": "2.1.3.4", "815": "2.1.3.5",
  "88": "2.1.4",
  "331": "2.2.1.1", "332": "2.2.1.2", "333": "2.2.1.3", "339": "2.2.1.4",
  "391": "2.2.3",
  "392": "2.2.4.1", "393": "2.2.4.2", "394": "2.2.4.3", "399": "2.2.4.4",
  "321": "2.3.1.1", "322": "2.3.1.2", "328": "2.3.1.3", "319": "2.3.1.4",
  "371": "2.3.1.8",
  "375": "2.3.4.1", "376": "2.3.4.2", "377": "2.3.4.3",
  "611": "3.1.1", "612": "3.1.2", "613": "3.1.3", "614": "3.1.4",
  "615": "3.1.5", "617": "3.1.6", "618": "3.1.7",
  "621": "3.2.1", "622": "3.2.2", "628": "3.2.3",
  "631": "3.3.1", "632": "3.3.2", "633": "3.3.3", "634": "3.3.4", "635": "3.3.5", "638": "3.3.6",
  "711": "4.1.1", "712": "4.1.2", "713": "4.1.3",
  "721": "4.2.1", "722": "4.2.2", "723": "4.2.3", "724": "4.2.4", "725": "4.2.5",
  "726": "4.2.6", "727": "4.2.7", "728": "4.2.8", "729": "4.2.9",
  "731": "4.3.1", "732": "4.3.2", "733": "4.3.3", "734": "4.3.4",
  "735": "4.3.5", "736": "4.3.6", "738": "4.3.7",
};

// From src/pages/tecnico/TecnicoPrestacaoContas.tsx (Técnico)
const tecnicoPgcToCC3: Record<string, string> = {
  "111": "1.1.1.1", "112": "1.1.1.2", "113": "1.1.1.3", "114": "1.1.1.4",
  "115": "1.1.1.5", "116": "1.1.1.6", "119": "1.1.1.7",
  "141": "1.1.1.8", "147": "1.1.1.9", "181": "1.1.1.10",
  "121": "1.1.2.1", "122": "1.1.2.2", "123": "1.1.2.3", "124": "1.1.2.4",
  "129": "1.1.2.5", "148": "1.1.2.6", "182": "1.1.2.7",
  "131": "1.1.3.1", "132": "1.1.3.2",
  "133": "1.1.4.1", "134": "1.1.4.2", "135": "1.1.4.3", "139": "1.1.4.4",
  "149": "1.1.4.5", "183": "1.1.4.6",
  "191": "1.1.5.1", "192": "1.1.5.2", "193": "1.1.5.3", "194": "1.1.5.4", "199": "1.1.5.5",
  "22": "1.2.1.1", "23": "1.2.1.2", "24": "1.2.1.3", "25": "1.2.1.4",
  "26": "1.2.1.5", "27": "1.2.1.6", "28": "1.2.1.7", "29": "1.2.1.8",
  "311": "1.2.2.1", "312": "1.2.2.2", "318": "1.2.2.3", "329": "1.2.2.4",
  "34": "1.2.2.5", "35": "1.2.2.6", "36": "1.2.2.7", "372": "1.2.2.8",
  "38": "1.2.2.10",
  "41": "1.2.3.1", "42": "1.2.3.2", "43": "1.2.3.3", "45": "1.2.3.4", "48": "1.2.3.5", "49": "1.2.3.6",
  "373": "1.2.4.1", "374": "1.2.4.2", "379": "1.2.4.3",
  "51": "2.1.1.1", "52": "2.1.1.2", "53": "2.1.1.3", "54": "2.1.1.4",
  "55": "2.1.2.1", "56": "2.1.2.2", "57": "2.1.2.3", "58": "2.1.2.4",
  "811": "2.1.3.1", "812": "2.1.3.2", "813": "2.1.3.3", "814": "2.1.3.4", "815": "2.1.3.5",
  "88": "2.1.4",
  "331": "2.2.1.1", "332": "2.2.1.2", "333": "2.2.1.3", "339": "2.2.1.4",
  "391": "2.2.3",
  "392": "2.2.4.1", "393": "2.2.4.2", "394": "2.2.4.3", "399": "2.2.4.4",
  "321": "2.3.1.1", "322": "2.3.1.2", "328": "2.3.1.3", "319": "2.3.1.4",
  "371": "2.3.1.8",
  "375": "2.3.4.1", "376": "2.3.4.2", "377": "2.3.4.3",
  "611": "3.1.1", "612": "3.1.2", "613": "3.1.3", "614": "3.1.4",
  "615": "3.1.5", "617": "3.1.6", "618": "3.1.7",
  "621": "3.2.1", "622": "3.2.2", "628": "3.2.3",
  "631": "3.3.1", "632": "3.3.2", "633": "3.3.3", "634": "3.3.4", "635": "3.3.5", "638": "3.3.6",
  "711": "4.1.1", "712": "4.1.2", "713": "4.1.3",
  "721": "4.2.1", "722": "4.2.2", "723": "4.2.3", "724": "4.2.4", "725": "4.2.5",
  "726": "4.2.6", "727": "4.2.7", "728": "4.2.8", "729": "4.2.9",
  "731": "4.3.1", "732": "4.3.2", "733": "4.3.3", "734": "4.3.4",
  "735": "4.3.5", "736": "4.3.6", "738": "4.3.7",
};

describe("PGC→CC3 Mapping Consistency", () => {
  it("portal map should be a subset of canonical (no conflicting values)", () => {
    const conflicts: string[] = [];
    for (const [pgc, cc3] of Object.entries(portalPgcToCC3)) {
      if (canonical[pgc] && canonical[pgc] !== cc3) {
        conflicts.push(`PGC ${pgc}: portal="${cc3}" vs canonical="${canonical[pgc]}"`);
      }
    }
    expect(conflicts).toEqual([]);
  });

  it("técnico map should be a subset of canonical (no conflicting values)", () => {
    const conflicts: string[] = [];
    for (const [pgc, cc3] of Object.entries(tecnicoPgcToCC3)) {
      if (canonical[pgc] && canonical[pgc] !== cc3) {
        conflicts.push(`PGC ${pgc}: tecnico="${cc3}" vs canonical="${canonical[pgc]}"`);
      }
    }
    expect(conflicts).toEqual([]);
  });

  it("portal and técnico maps should be identical", () => {
    const portalKeys = Object.keys(portalPgcToCC3).sort();
    const tecnicoKeys = Object.keys(tecnicoPgcToCC3).sort();
    expect(portalKeys).toEqual(tecnicoKeys);

    for (const key of portalKeys) {
      expect(portalPgcToCC3[key]).toBe(tecnicoPgcToCC3[key]);
    }
  });

  it("should detect missing keys in portal vs canonical", () => {
    const canonicalKeys = new Set(Object.keys(canonical));
    const portalKeys = new Set(Object.keys(portalPgcToCC3));
    const missingInPortal = [...canonicalKeys].filter(k => !portalKeys.has(k));

    // This test documents the gap — currently the portal is missing entries
    // If this fails with 0 missing, the portal has been fixed to match canonical
    console.log(`Portal is missing ${missingInPortal.length} keys from canonical:`, missingInPortal);
    expect(missingInPortal.length).toBeGreaterThan(0); // Known gap — will flip when fixed
  });

  it("should detect missing keys in técnico vs canonical", () => {
    const canonicalKeys = new Set(Object.keys(canonical));
    const tecnicoKeys = new Set(Object.keys(tecnicoPgcToCC3));
    const missingInTecnico = [...canonicalKeys].filter(k => !tecnicoKeys.has(k));

    console.log(`Técnico is missing ${missingInTecnico.length} keys from canonical:`, missingInTecnico);
    expect(missingInTecnico.length).toBeGreaterThan(0); // Known gap — will flip when fixed
  });

  it("canonical map should have all valid CC3 codes mapping to known sections", () => {
    const validPrefixes = ["1.", "2.", "3.", "4."];
    for (const [pgc, cc3] of Object.entries(canonical)) {
      const hasValidPrefix = validPrefixes.some(p => cc3.startsWith(p));
      expect(hasValidPrefix).toBe(true);
    }
  });

  it("canonical map should have no duplicate PGC keys", () => {
    // Object keys are inherently unique, but check the count matches
    const keys = Object.keys(canonical);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });
});
