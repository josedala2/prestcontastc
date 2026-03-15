import jsPDF from "jspdf";

// ── Interface for Visto Acta data ──
export interface ActaRecepcaoVistoData {
  actaNumero: string;
  // Quem compareceu
  representanteNome: string;
  representanteTelefone: string;
  representanteCargo: string;
  // Entidade requerente
  entidadeNome: string;
  // Ofício
  oficioNumero: string;
  oficioData: string;
  // Objecto do contrato
  objecto: string;
  // Entidade contratada
  entidadeContratada: string;
  // Tipo de fiscalização
  tipoFiscalizacao: string; // "Fiscalização Preventiva" / "Fiscalização Sucessiva"
  // Data da acta
  dataActa: Date;
  // Documentos que acompanham
  documentosAcompanham: string[];
  // Documentos de habilitação
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

export function exportActaRecepcaoVistoPdf(data: ActaRecepcaoVistoData, preview?: false): { blob: Blob; fileName: string };
export function exportActaRecepcaoVistoPdf(data: ActaRecepcaoVistoData, preview: true): string;
export function exportActaRecepcaoVistoPdf(data: ActaRecepcaoVistoData, preview = false): string | { blob: Blob; fileName: string } {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const marginLeft = 20;
  const marginRight = 20;
  const textWidth = pageWidth - marginLeft - marginRight;

  // ── Brasão placeholder ──
  doc.setFillColor(60, 60, 60);
  doc.circle(centerX, 18, 10, "F");
  doc.setFillColor(80, 80, 80);
  doc.circle(centerX, 18, 8, "F");
  doc.setTextColor(200, 170, 80);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("ANGOLA", centerX, 20, { align: "center" });

  // ── Header institucional ──
  let y = 34;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TRIBUNAL DE CONTAS", centerX, y, { align: "center" });

  y += 6;
  doc.setFontSize(11);
  doc.text("DIREC\u00C7\u00C3O DOS SERVI\u00C7OS ADMINISTRATIVOS", centerX, y, { align: "center" });

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("SECRETARIA GERAL", centerX, y, { align: "center" });

  // ── Titulo da Acta ──
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`ACTA DE RECEP\u00C7\u00C3O N.\u00BA ${data.actaNumero}`, centerX, y, { align: "center" });

  // ── Linha separadora ──
  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - marginRight, y);

  // ── Parágrafo narrativo ──
  y += 8;

  const d = data.dataActa;
  const dia = numberToPortuguese(d.getDate());
  const mes = monthName(d.getMonth());
  const ano = yearToPortuguese(d.getFullYear());
  const horas = hoursToPortuguese(d.getHours(), d.getMinutes());

  const narrativa = `Aos ${dia} dias do m\u00EAs de ${mes} do ano de ${ano}, pelas ${horas}, compareceu nesta Secretaria do Tribunal de Contas, o Senhor `;
  const narrativa2 = `${data.representanteNome}`;
  const narrativa3 = `, cujo contacto telef\u00F3nico \u00E9 o n.\u00BA `;
  const narrativa4 = `${data.representanteTelefone}`;
  const narrativa5 = `, na qualidade de ${data.representanteCargo} do `;
  const narrativa6 = `${data.entidadeNome}`;
  const narrativa7 = `, a fim de dar entrada do Of\u00EDcio n.\u00BA ${data.oficioNumero}, datado de ${data.oficioData}, que remete o `;
  const narrativa8 = `${data.objecto}`;
  const narrativa9 = `, celebrado entre a Rep\u00FAblica de Angola, representada pelo Minist\u00E9rio Supracitado, e a `;
  const narrativa10 = `${data.entidadeContratada}`;
  const narrativa11 = `, em sede de ${data.tipoFiscalizacao}.`;

  // Build the full narrative as a single string with bold markers
  const fullText = narrativa + narrativa2 + narrativa3 + narrativa4 + narrativa5 + narrativa6 + narrativa7 + narrativa8 + narrativa9 + narrativa10 + narrativa11;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Use splitTextToSize for word wrapping
  const lines = doc.splitTextToSize(fullText, textWidth);
  doc.text(lines, marginLeft, y, { align: "justify", lineHeightFactor: 1.5 });
  y += lines.length * 5;

  // ── Documentos que acompanham ──
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Fez-se Acompanhar dos Seguintes elementos:", marginLeft, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.documentosAcompanham.forEach((docItem) => {
    // Check page break
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
    // Bullet point
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
    centerX,
    currentPageHeight - 8,
    { align: "center" }
  );

  // ── Marca de água RASCUNHO (preview) ──
  if (preview) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setTextColor(220, 50, 50);
      doc.setFontSize(60);
      doc.setFont("helvetica", "bold");
      // Use low opacity via GState if available
      try {
        doc.saveGraphicsState();
        // @ts-ignore
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.text("RASCUNHO", centerX, ph / 2, { align: "center", angle: 45 });
        doc.restoreGraphicsState();
      } catch {
        // Fallback: just use light color
        doc.setTextColor(245, 220, 220);
        doc.text("RASCUNHO", centerX, ph / 2, { align: "center", angle: 45 });
      }
    }

    return doc.output("datauristring");
  } else {
    const blob = doc.output("blob");
    const fileName = `Acta_Recepcao_Visto_${data.actaNumero.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    return { blob, fileName };
  }
}
