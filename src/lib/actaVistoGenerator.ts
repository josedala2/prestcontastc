import jsPDF from "jspdf";
import { loadBrasaoBase64, drawOfficialHeader } from "./brasaoLoader";

// ── Interface for Visto Acta data ──
export interface ActaRecepcaoVistoData {
  actaNumero: string;
  representanteNome: string;
  representanteTelefone: string;
  representanteCargo: string;
  entidadeNome: string;
  oficioNumero: string;
  oficioData: string;
  objecto: string;
  entidadeContratada: string;
  tipoFiscalizacao: string;
  dataActa: Date;
  documentosAcompanham: string[];
  documentosHabilitacao: string[];
}

function numberToPortuguese(n: number): string {
  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? tens[t] : `${tens[t]} e ${units[u]}`;
  }
  return String(n);
}

function monthName(m: number): string {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return months[m];
}

function yearToPortuguese(y: number): string {
  const thousands = Math.floor(y / 1000);
  const remainder = y % 1000;
  const hundreds = Math.floor(remainder / 100);
  const rest = remainder % 100;

  let result = "";
  if (thousands === 2) result = "dois mil";
  else if (thousands === 1) result = "mil";

  if (hundreds > 0) {
    const h = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    if (rest === 0 && hundreds === 1) {
      result += " e cem";
    } else {
      result += ` ${h[hundreds]}`;
    }
  }

  if (rest > 0) {
    result += ` e ${numberToPortuguese(rest)}`;
  }

  return result.trim();
}

function hoursToPortuguese(h: number, m: number): string {
  let result = `${numberToPortuguese(h)} hora${h !== 1 ? "s" : ""}`;
  if (m > 0) {
    result += ` e ${numberToPortuguese(m)} minuto${m !== 1 ? "s" : ""}`;
  }
  return result;
}

/**
 * Renders mixed bold/normal text segments with word wrapping using jsPDF.
 */
function renderMixedText(
  doc: jsPDF,
  segments: { text: string; bold: boolean }[],
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const fontSize = 10;
  doc.setFontSize(fontSize);

  // Build full text and bold ranges
  let fullText = "";
  const boldRanges: { start: number; end: number }[] = [];
  for (const seg of segments) {
    const start = fullText.length;
    fullText += seg.text;
    if (seg.bold) {
      boldRanges.push({ start, end: fullText.length });
    }
  }

  // Split into words with positions
  const words: { word: string; start: number; end: number }[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fullText)) !== null) {
    words.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }

  let currentX = x;
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const isBold = boldRanges.some((r) => w.start >= r.start && w.end <= r.end);
    const font = isBold ? "bold" : "normal";
    doc.setFont("helvetica", font);

    const wordText = w.word + (i < words.length - 1 ? " " : "");
    const wordWidth = doc.getTextWidth(wordText);

    if (currentX + wordWidth > x + maxWidth && currentX > x) {
      currentX = x;
      currentY += lineHeight;
    }

    doc.text(wordText, currentX, currentY);
    currentX += wordWidth;
  }

  return currentY + lineHeight;
}

export async function exportActaRecepcaoVistoPdf(data: ActaRecepcaoVistoData, preview?: false): Promise<{ blob: Blob; fileName: string }>;
export async function exportActaRecepcaoVistoPdf(data: ActaRecepcaoVistoData, preview: true): Promise<string>;
export async function exportActaRecepcaoVistoPdf(data: ActaRecepcaoVistoData, preview = false): Promise<string | { blob: Blob; fileName: string }> {
  const brasaoBase64 = await loadBrasaoBase64();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const textWidth = pageWidth - marginLeft - marginRight;

  // ── Official header with brasão ──
  let y = drawOfficialHeader(doc, brasaoBase64, pageWidth, `ACTA DE RECEP\u00C7\u00C3O N.\u00BA ${data.actaNumero}`);

  // ── Narrative paragraph with bold segments ──
  const d = data.dataActa;
  const dia = numberToPortuguese(d.getDate());
  const mes = monthName(d.getMonth());
  const ano = yearToPortuguese(d.getFullYear());
  const horas = hoursToPortuguese(d.getHours(), d.getMinutes());

  const segments: { text: string; bold: boolean }[] = [
    { text: `Aos ${dia} dias do m\u00EAs de ${mes} do ano de ${ano}, pelas ${horas}, compareceu nesta Secretaria do Tribunal de Contas, o Senhor `, bold: false },
    { text: data.representanteNome, bold: true },
    { text: `, cujo contacto telef\u00F3nico \u00E9 o n.\u00BA `, bold: false },
    { text: data.representanteTelefone, bold: true },
    { text: `, na qualidade de ${data.representanteCargo} do `, bold: false },
    { text: data.entidadeNome, bold: true },
    { text: `, a fim de dar entrada do Of\u00EDcio n.\u00BA ${data.oficioNumero}, datado de ${data.oficioData}, que remete o `, bold: false },
    { text: data.objecto, bold: true },
    { text: `, celebrado entre a Rep\u00FAblica de Angola, representada pelo Minist\u00E9rio Supracitado, e a `, bold: false },
    { text: data.entidadeContratada, bold: true },
    { text: `, em sede de ${data.tipoFiscalizacao}.`, bold: false },
  ];

  doc.setTextColor(0, 0, 0);
  y = renderMixedText(doc, segments, marginLeft, y, textWidth, 5);

  // ── Documentos que acompanham ──
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Fez-se Acompanhar dos Seguintes elementos:", marginLeft, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.documentosAcompanham.forEach((docItem) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
    doc.circle(marginLeft + 4, y - 1, 1, "F");
    const itemLines = doc.splitTextToSize(docItem + ";", textWidth - 12);
    doc.text(itemLines, marginLeft + 10, y);
    y += itemLines.length * 4.5 + 1.5;
  });

  // ── Documentos de Habilitação ──
  if (data.documentosHabilitacao.length > 0) {
    y += 4;
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Documentos de Habilita\u00E7\u00E3o:", marginLeft, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    data.documentosHabilitacao.forEach((docItem) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      doc.circle(marginLeft + 4, y - 1, 1, "F");
      const itemLines = doc.splitTextToSize(docItem + ";", textWidth - 12);
      doc.text(itemLines, marginLeft + 10, y);
      y += itemLines.length * 4.5 + 1.5;
    });
  }

  // ── Assinaturas ──
  y += 16;
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 30;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  const sig1x = marginLeft;
  const sig2x = pageWidth / 2 + 10;
  const sigWidth = pageWidth / 2 - marginRight - 10;

  doc.line(sig1x, y, sig1x + sigWidth, y);
  doc.line(sig2x, y, sig2x + sigWidth, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Funcion\u00E1rio da Secretaria", sig1x + sigWidth / 2, y, { align: "center" });
  doc.text("Representante da Entidade", sig2x + sigWidth / 2, y, { align: "center" });

  // ── Footer ──
  const currentPageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento gerado automaticamente em ${new Date().toLocaleDateString("pt-AO")} ${new Date().toLocaleTimeString("pt-AO")}`,
    pageWidth / 2,
    currentPageHeight - 8,
    { align: "center" }
  );

  // ── Watermark for preview ──
  if (preview) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setTextColor(220, 50, 50);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      try {
        doc.saveGraphicsState();
        // @ts-ignore
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.text("RASCUNHO", pageWidth / 2, ph / 2, { align: "center", angle: 45 });
        doc.restoreGraphicsState();
      } catch {
        doc.setTextColor(245, 220, 220);
        doc.text("RASCUNHO", pageWidth / 2, ph / 2, { align: "center", angle: 45 });
      }
    }

    return doc.output("datauristring");
  } else {
    const blob = doc.output("blob");
    const fileName = `Acta_Recepcao_Visto_${data.actaNumero.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    return { blob, fileName };
  }
}
