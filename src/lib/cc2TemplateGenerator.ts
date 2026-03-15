/**
 * Downloads the official CC-3 Balancete template.
 * The template file is a copy of the official PGC model with all formulas,
 * structure (Plano de Contas, Balanço Patrimonial, DRE, Indicadores) and
 * sample values intact.
 */
export function generateCC2Template(): void {
  const link = document.createElement("a");
  link.href = "/templates/Prestacao_Contas_CC3_Template.xlsx";
  link.download = "Prestacao_Contas_CC3_Template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
