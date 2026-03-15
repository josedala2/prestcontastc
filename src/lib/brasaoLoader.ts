import brasaoUrl from "@/assets/brasao-angola.jpg";

let cachedBrasao: string | null = null;

export async function loadBrasaoBase64(): Promise<string> {
  if (cachedBrasao) return cachedBrasao;

  const response = await fetch(brasaoUrl);
  const blob = await response.blob();
  cachedBrasao = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  return cachedBrasao;
}

/**
 * Draws the official TCA header on a jsPDF document:
 * Brasão + TRIBUNAL DE CONTAS + DIRECÇÃO DOS SERVIÇOS ADMINISTRATIVOS + SECRETARIA GERAL
 * Returns the Y position after the header.
 */
export function drawOfficialHeader(
  doc: any,
  brasaoBase64: string,
  pageWidth: number,
  actaTitle: string,
): number {
  const centerX = pageWidth / 2;

  // ── Brasão ──
  const brasaoSize = 22;
  doc.addImage(brasaoBase64, "JPEG", centerX - brasaoSize / 2, 8, brasaoSize, brasaoSize);

  // ── Header text ──
  let y = 36;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TRIBUNAL DE CONTAS", centerX, y, { align: "center" });

  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DIREC\u00C7\u00C3O DOS SERVI\u00C7OS ADMINISTRATIVOS", centerX, y, { align: "center" });

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("SECRETARIA GERAL", centerX, y, { align: "center" });

  // ── Acta title ──
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(actaTitle, centerX, y, { align: "center" });

  // ── Separator line ──
  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, y, pageWidth - 20, y);

  return y + 8;
}
