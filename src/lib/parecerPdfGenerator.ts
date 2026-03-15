import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import brasaoImg from "@/assets/brasao-angola.jpg";

export interface ParecerPdfData {
  entityName: string;
  exercicio: string;
  nif: string;
  totalActivo: number;
  totalPassivo: number;
  totalCapProprio: number;
  resultadoExercicio: number;
  totalProveitos: number;
  totalCustos: number;
  comentarios: string;
  tipoParecerIndex: number;
  parecerFinal: "favorável" | "favorável com reservas" | "desfavorável";
  tecnicoNome: string;
  integrityHash?: string;
  version?: number;
}

const formatKz = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA" }).replace("AOA", "Kz");

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// TCA colours
const TCA_BLUE = [40, 38, 72] as const;
const TCA_GOLD = [202, 148, 62] as const;
const TCA_LIGHT = [236, 236, 236] as const;

export async function generateParecerPdf(data: ParecerPdfData): Promise<{ blob: Blob; fileName: string }> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  const brasaoBase64 = await loadImageAsBase64(brasaoImg);

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });

  const conclusaoOptions = [
    "Regularidade e conformidade com as normas aplicáveis.",
    "Algumas irregularidades que não comprometem globalmente a fiabilidade das contas.",
    "Irregularidades relevantes que comprometem a regularidade da prestação de contas.",
  ];

  // ─── Helper functions ───
  const checkPage = (needed: number) => {
    if (y + needed > pageH - 30) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionTitle = (text: string) => {
    checkPage(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TCA_BLUE);
    doc.text(text, margin, y);
    y += 2;
    // Underline
    doc.setDrawColor(...TCA_GOLD);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + doc.getTextWidth(text), y);
    y += 6;
  };

  const subSection = (text: string) => {
    checkPage(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(46, 117, 182);
    doc.text(text, margin, y);
    y += 5;
  };

  const bodyText = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentW);
    checkPage(lines.length * 4.5);
    doc.text(lines, margin, y, { align: "justify", maxWidth: contentW });
    y += lines.length * 4.5;
  };

  const bulletItem = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentW - 8);
    checkPage(lines.length * 4.5);
    doc.text("•", margin + 2, y);
    doc.text(lines, margin + 6, y, { maxWidth: contentW - 8 });
    y += lines.length * 4.5;
  };

  // ─── HEADER ───
  // Top institutional bar
  doc.setFillColor(...TCA_BLUE);
  doc.rect(0, 0, pageW, 12, "F");
  doc.setFillColor(...TCA_GOLD);
  doc.rect(0, 12, pageW, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TRIBUNAL DE CONTAS DE ANGOLA", margin, 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Sistema de Análise de Contas — Resolução nº 1/17", margin, 10.5);

  y = 20;

  // Brasão centred
  try {
    const imgSize = 22;
    doc.addImage(brasaoBase64, "JPEG", (pageW - imgSize) / 2, y, imgSize, imgSize);
    y += imgSize + 4;
  } catch {
    y += 4;
  }

  // REPÚBLICA DE ANGOLA
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TCA_BLUE);
  doc.text("REPÚBLICA DE ANGOLA", pageW / 2, y, { align: "center" });
  y += 5;

  // Decorative line
  doc.setDrawColor(...TCA_GOLD);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - 30, y, pageW / 2 + 30, y);
  y += 5;

  doc.setFontSize(12);
  doc.text("TRIBUNAL DE CONTAS", pageW / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(10);
  doc.text("DIRECÇÃO DOS SERVIÇOS TÉCNICOS", pageW / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(9);
  const relNum = `${Math.floor(Math.random() * 90) + 10}`;
  doc.text(`RELATÓRIO SUMÁRIO N.º ${relNum}/1.ª DIV/FP/${today.getFullYear()}`, pageW / 2, y, { align: "center" });
  y += 8;

  // Title box
  doc.setFillColor(...TCA_LIGHT);
  doc.roundedRect(margin, y, contentW, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TCA_BLUE);
  doc.text("MODELO DE PARECER SOBRE PRESTAÇÃO DE CONTAS DE EMPRESA PÚBLICA", pageW / 2, y + 6.5, { align: "center" });
  y += 16;

  // ─── Entity info ───
  const infoData = [
    ["Entidade:", data.entityName],
    ["NIF:", data.nif],
    ["Exercício Económico:", data.exercicio],
    ["Entidade Fiscalizadora:", "Tribunal de Contas"],
  ];
  doc.setFontSize(9.5);
  infoData.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TCA_BLUE);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(value, margin + 38, y);
    y += 5;
  });
  y += 4;

  // ─── 1. Introdução ───
  sectionTitle("1. Introdução");
  bodyText(
    `Em cumprimento das disposições legais aplicáveis à fiscalização das empresas públicas, foi submetida ao Tribunal de Contas a prestação de contas da ${data.entityName}, relativa ao exercício económico findo em 31 de Dezembro de ${data.exercicio}. O presente parecer tem por objetivo proceder à análise da conformidade, regularidade e transparência da gestão financeira e patrimonial da entidade, com base nos documentos apresentados e na legislação vigente.`
  );
  y += 3;

  // ─── 2. Documentos Analisados ───
  sectionTitle("2. Documentos Analisados");
  [
    "Relatório de Gestão do exercício;",
    "Demonstrações Financeiras (Balanço, Demonstração de Resultados, Fluxos de Caixa);",
    "Notas explicativas às demonstrações financeiras;",
    "Parecer do Conselho Fiscal ou órgão equivalente;",
    "Relatório do Auditor Externo (quando aplicável);",
    "Plano de Atividades e Orçamento;",
    "Outros documentos relevantes.",
  ].forEach(bulletItem);
  y += 3;

  // ─── 3. Análise ───
  sectionTitle("3. Análise da Prestação de Contas");

  subSection("3.1 Conformidade Legal");
  bodyText(
    "Verificou-se que a prestação de contas foi apresentada dentro do prazo legal, nos termos da legislação aplicável às empresas públicas e à fiscalização do Tribunal de Contas. Quanto à estrutura e conteúdo dos documentos apresentados, observa-se que estão em conformidade com as normas contabilísticas e legais vigentes."
  );
  y += 3;

  subSection("3.2 Situação Económica e Financeira");
  checkPage(30);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Indicador", "Valor"]],
    body: [
      ["Total do Ativo", formatKz(data.totalActivo)],
      ["Total do Passivo", formatKz(data.totalPassivo)],
      ["Capital Próprio", formatKz(data.totalCapProprio)],
      [
        "Resultado Líquido do Exercício",
        `${data.resultadoExercicio >= 0 ? "Lucro" : "Prejuízo"} — ${formatKz(Math.abs(data.resultadoExercicio))}`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: TCA_BLUE as any, textColor: [255, 255, 255], fontSize: 9, font: "helvetica", fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 0: { cellWidth: contentW * 0.6 }, 1: { halign: "right", fontStyle: "bold" } },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  bodyText(
    data.resultadoExercicio >= 0
      ? `Constata-se que a empresa apresentou situação financeira equilibrada com um resultado líquido positivo de ${formatKz(data.resultadoExercicio)}, demonstrando capacidade de geração de receitas acima dos custos operacionais.`
      : `Constata-se que a empresa apresentou desequilíbrios financeiros com um resultado líquido negativo de ${formatKz(Math.abs(data.resultadoExercicio))}, sugerindo a necessidade de revisão da estrutura de custos e receitas.`
  );
  y += 3;

  subSection("3.3 Gestão e Execução Orçamental");
  checkPage(25);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Rubrica", "Valor"]],
    body: [
      ["Total de Proveitos e Ganhos", formatKz(data.totalProveitos)],
      ["Total de Custos e Perdas", formatKz(data.totalCustos)],
      ["Resultado do Exercício", formatKz(data.resultadoExercicio)],
    ],
    theme: "grid",
    headStyles: { fillColor: TCA_BLUE as any, textColor: [255, 255, 255], fontSize: 9, font: "helvetica", fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 0: { cellWidth: contentW * 0.6 }, 1: { halign: "right", fontStyle: "bold" } },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  subSection("3.4 Observações e Irregularidades");
  bodyText(
    data.comentarios?.trim() || "Não foram identificadas irregularidades relevantes no âmbito da presente análise."
  );
  y += 4;

  // ─── 4. Conclusão ───
  sectionTitle("4. Conclusão");
  bodyText(
    `Face ao exposto e considerando os elementos analisados, conclui-se que a prestação de contas da ${data.entityName}, relativa ao exercício económico de ${data.exercicio}, apresenta:`
  );
  y += 2;

  conclusaoOptions.forEach((opt, idx) => {
    checkPage(7);
    const isSelected = idx === data.tipoParecerIndex;
    const marker = isSelected ? "☑" : "☐";
    doc.setFont("helvetica", isSelected ? "bold" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    if (isSelected) {
      doc.setFillColor(245, 250, 245);
      doc.roundedRect(margin + 2, y - 3.5, contentW - 4, 6, 1, 1, "F");
    }
    doc.text(`${marker}  ${opt}`, margin + 4, y);
    y += 7;
  });
  y += 4;

  // ─── Parecer ───
  sectionTitle("Parecer");
  bodyText(
    `Assim, emite-se parecer ${data.parecerFinal} à aprovação da prestação de contas da ${data.entityName}, referente ao exercício económico de ${data.exercicio}, submetida ao Tribunal de Contas.`
  );
  y += 8;

  // ─── Signature block ───
  checkPage(40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text("Local: Luanda", margin, y);
  y += 5;
  doc.text(`Data: ${dateStr}`, margin, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TCA_BLUE);
  doc.text("O Técnico / Relator", pageW / 2, y, { align: "center" });
  y += 16;

  doc.setDrawColor(...TCA_GOLD);
  doc.setLineWidth(0.4);
  doc.line(pageW / 2 - 25, y, pageW / 2 + 25, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(data.tecnicoNome, pageW / 2, y, { align: "center" });
  y += 4;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Técnico Validador — Tribunal de Contas de Angola", pageW / 2, y, { align: "center" });

  // ─── Footer on all pages ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom gold bar
    doc.setFillColor(...TCA_GOLD);
    doc.rect(0, pageH - 14, pageW, 0.8, "F");

    // Footer text
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(
      `© Tribunal de Contas de Angola — Parecer de Prestação de Contas — Pág. ${i}/${pageCount}`,
      pageW / 2,
      pageH - 10,
      { align: "center" }
    );
    doc.text(
      `Gerado em: ${today.toLocaleDateString("pt-AO")} ${today.toLocaleTimeString("pt-AO")}`,
      pageW - margin,
      pageH - 10,
      { align: "right" }
    );

    // SHA-256 hash line
    if (data.integrityHash) {
      doc.setFontSize(5.5);
      doc.setFont("courier", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Integridade SHA-256: ${data.integrityHash}`,
        pageW / 2,
        pageH - 6,
        { align: "center" }
      );
    }

    if (data.version) {
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(`v${data.version}`, margin, pageH - 6);
    }
  }

  const fileName = `Parecer_${data.entityName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50)}_${data.exercicio}.pdf`;
  const blob = doc.output("blob");
  saveAs(blob, fileName);
  return { blob, fileName };
}
