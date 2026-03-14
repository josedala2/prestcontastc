import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { TrialBalanceLine, ValidationResult, DocumentoTribunal, DOCUMENTO_TIPO_LABELS, DOCUMENTO_ESTADO_LABELS } from "@/types";
import { formatKz, mockTrialBalance, mockValidations, mockAttachments, mockFiscalYears, mockAuditLog } from "@/data/mockData";

// ─── PDF Header helper ───
function addPdfHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top bar
  doc.setFillColor(40, 38, 72); // azul profundo TCA
  doc.rect(0, 0, pageWidth, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TRIBUNAL DE CONTAS DE ANGOLA", 14, 8);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Prestação de Contas — Resolução nº 1/17", 14, 14);

  // Gold accent line
  doc.setFillColor(202, 148, 62); // dourado TCA
  doc.rect(0, 18, pageWidth, 1.5, "F");

  // Title
  doc.setTextColor(40, 38, 72);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 30);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 36);
  }
}

function addPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `© Tribunal de Contas de Angola — Prestação de Contas PGC — Pág. ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-AO")} ${new Date().toLocaleTimeString("pt-AO")}`,
      pageWidth - 14,
      pageHeight - 6,
      { align: "right" }
    );
  }
}

// ─── Export Balancete PDF ───
export function exportBalancetePdf(data: TrialBalanceLine[], entityName = "ENDE, E.P.", year = 2024) {
  const doc = new jsPDF();
  addPdfHeader(doc, `Balancete — ${entityName}`, `Exercício Fiscal ${year}`);

  const tableData = data.map((l) => [
    l.accountCode,
    l.description,
    l.debit > 0 ? formatKz(l.debit) : "—",
    l.credit > 0 ? formatKz(l.credit) : "—",
    formatKz(l.balance),
  ]);

  // Totals row
  tableData.push([
    "",
    "TOTAIS",
    formatKz(data.reduce((s, l) => s + l.debit, 0)),
    formatKz(data.reduce((s, l) => s + l.credit, 0)),
    formatKz(data.reduce((s, l) => s + l.balance, 0)),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [["Conta", "Descrição", "Débito (Kz)", "Crédito (Kz)", "Saldo (Kz)"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [40, 38, 72], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 20, font: "courier" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    didParseCell: (data: any) => {
      // Bold totals row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [230, 230, 240];
      }
    },
  });

  addPdfFooter(doc);
  doc.save(`Balancete_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.pdf`);
}

// ─── Export Balanço PDF ───
export function exportBalancoPdf(
  ativoLines: TrialBalanceLine[],
  passivoLines: TrialBalanceLine[],
  capitalLines: TrialBalanceLine[],
  entityName = "ENDE, E.P.",
  year = 2024
) {
  const doc = new jsPDF();
  addPdfHeader(doc, `Balanço Patrimonial — ${entityName}`, `Exercício Fiscal ${year}`);

  const totalAtivo = ativoLines.reduce((s, l) => s + l.balance, 0);
  const totalPassivo = passivoLines.reduce((s, l) => s + Math.abs(l.balance), 0);
  const totalCapital = capitalLines.reduce((s, l) => s + Math.abs(l.balance), 0);

  const tableData: any[] = [];
  tableData.push([{ content: "ACTIVO", colSpan: 2, styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255] } }, { content: formatKz(totalAtivo), styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255], halign: "right" } }]);
  ativoLines.forEach((l) => tableData.push([l.accountCode, l.description, formatKz(l.balance)]));
  tableData.push([{ content: "PASSIVO", colSpan: 2, styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255] } }, { content: formatKz(totalPassivo), styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255], halign: "right" } }]);
  passivoLines.forEach((l) => tableData.push([l.accountCode, l.description, formatKz(Math.abs(l.balance))]));
  tableData.push([{ content: "CAPITAL PRÓPRIO", colSpan: 2, styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255] } }, { content: formatKz(totalCapital), styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255], halign: "right" } }]);
  capitalLines.forEach((l) => tableData.push([l.accountCode, l.description, formatKz(Math.abs(l.balance))]));

  autoTable(doc, {
    startY: 40,
    head: [["Conta", "Descrição", "Valor (Kz)"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [202, 148, 62], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 20, font: "courier" },
      2: { halign: "right" },
    },
  });

  addPdfFooter(doc);
  doc.save(`Balanco_Patrimonial_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.pdf`);
}

// ─── Export DRE PDF ───
export function exportDrePdf(
  custos: TrialBalanceLine[],
  proveitos: TrialBalanceLine[],
  resultado: number,
  entityName = "ENDE, E.P.",
  year = 2024
) {
  const doc = new jsPDF();
  addPdfHeader(doc, `Demonstração de Resultados — ${entityName}`, `Exercício Fiscal ${year}`);

  const totalCustos = custos.reduce((s, l) => s + l.balance, 0);
  const totalProveitos = proveitos.reduce((s, l) => s + Math.abs(l.balance), 0);

  const tableData: any[] = [];
  tableData.push([{ content: "CUSTOS E PERDAS", colSpan: 2, styles: { fontStyle: "bold", fillColor: [220, 53, 69], textColor: [255, 255, 255] } }, { content: formatKz(totalCustos), styles: { fontStyle: "bold", fillColor: [220, 53, 69], textColor: [255, 255, 255], halign: "right" } }]);
  custos.forEach((l) => tableData.push([l.accountCode, l.description, formatKz(l.balance)]));
  tableData.push([{ content: "PROVEITOS E GANHOS", colSpan: 2, styles: { fontStyle: "bold", fillColor: [40, 167, 69], textColor: [255, 255, 255] } }, { content: formatKz(totalProveitos), styles: { fontStyle: "bold", fillColor: [40, 167, 69], textColor: [255, 255, 255], halign: "right" } }]);
  proveitos.forEach((l) => tableData.push([l.accountCode, l.description, formatKz(Math.abs(l.balance))]));
  tableData.push([{ content: "RESULTADO LÍQUIDO", colSpan: 2, styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255] } }, { content: formatKz(resultado), styles: { fontStyle: "bold", fillColor: [40, 38, 72], textColor: [255, 255, 255], halign: "right" } }]);

  autoTable(doc, {
    startY: 40,
    head: [["Conta", "Descrição", "Valor (Kz)"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [202, 148, 62], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 20, font: "courier" },
      2: { halign: "right" },
    },
  });

  addPdfFooter(doc);
  doc.save(`DRE_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.pdf`);
}

// ─── Export Balancete Excel ───
export function exportBalanceteExcel(data: TrialBalanceLine[], entityName = "ENDE, E.P.", year = 2024) {
  const wsData = [
    ["TRIBUNAL DE CONTAS DE ANGOLA"],
    ["Sistema de Prestação de Contas — Resolução nº 1/17"],
    [`Balancete — ${entityName} — Exercício ${year}`],
    [],
    ["Conta", "Descrição", "Débito (Kz)", "Crédito (Kz)", "Saldo (Kz)"],
    ...data.map((l) => [l.accountCode, l.description, l.debit, l.credit, l.balance]),
    [],
    ["", "TOTAIS", data.reduce((s, l) => s + l.debit, 0), data.reduce((s, l) => s + l.credit, 0), data.reduce((s, l) => s + l.balance, 0)],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [{ wch: 12 }, { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  // Merge header
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Balancete");
  XLSX.writeFile(wb, `Balancete_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.xlsx`);
}

// ─── Export full report Excel (multi-sheet) ───
export function exportFullReportExcel(
  trialBalance: TrialBalanceLine[],
  ativoLines: TrialBalanceLine[],
  passivoLines: TrialBalanceLine[],
  capitalLines: TrialBalanceLine[],
  custos: TrialBalanceLine[],
  proveitos: TrialBalanceLine[],
  entityName = "ENDE, E.P.",
  year = 2024
) {
  const wb = XLSX.utils.book_new();
  const header = [
    ["TRIBUNAL DE CONTAS DE ANGOLA"],
    ["Sistema de Prestação de Contas — Resolução nº 1/17"],
    [`${entityName} — Exercício ${year}`],
    [],
  ];

  // Sheet 1: Balancete
  const balanceteData = [
    ...header,
    ["Conta", "Descrição", "Débito (Kz)", "Crédito (Kz)", "Saldo (Kz)"],
    ...trialBalance.map((l) => [l.accountCode, l.description, l.debit, l.credit, l.balance]),
    [],
    ["", "TOTAIS", trialBalance.reduce((s, l) => s + l.debit, 0), trialBalance.reduce((s, l) => s + l.credit, 0), trialBalance.reduce((s, l) => s + l.balance, 0)],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(balanceteData);
  ws1["!cols"] = [{ wch: 12 }, { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Balancete");

  // Sheet 2: Balanço
  const balancoData = [
    ...header,
    ["Secção", "Conta", "Descrição", "Valor (Kz)"],
    ["ACTIVO", "", "", ativoLines.reduce((s, l) => s + l.balance, 0)],
    ...ativoLines.map((l) => ["", l.accountCode, l.description, l.balance]),
    ["PASSIVO", "", "", passivoLines.reduce((s, l) => s + Math.abs(l.balance), 0)],
    ...passivoLines.map((l) => ["", l.accountCode, l.description, Math.abs(l.balance)]),
    ["CAPITAL PRÓPRIO", "", "", capitalLines.reduce((s, l) => s + Math.abs(l.balance), 0)],
    ...capitalLines.map((l) => ["", l.accountCode, l.description, Math.abs(l.balance)]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(balancoData);
  ws2["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Balanço");

  // Sheet 3: DRE
  const dreData = [
    ...header,
    ["Secção", "Conta", "Descrição", "Valor (Kz)"],
    ["CUSTOS E PERDAS", "", "", custos.reduce((s, l) => s + l.balance, 0)],
    ...custos.map((l) => ["", l.accountCode, l.description, l.balance]),
    ["PROVEITOS E GANHOS", "", "", proveitos.reduce((s, l) => s + Math.abs(l.balance), 0)],
    ...proveitos.map((l) => ["", l.accountCode, l.description, Math.abs(l.balance)]),
    [],
    ["RESULTADO LÍQUIDO", "", "", proveitos.reduce((s, l) => s + Math.abs(l.balance), 0) - custos.reduce((s, l) => s + l.balance, 0)],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(dreData);
  ws3["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, "DRE");

  XLSX.writeFile(wb, `Relatorios_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.xlsx`);
}

// ─── Generate full ZIP dossier ───
export async function generateDossierZip(entityName = "ENDE, E.P.", year = 2024) {
  const zip = new JSZip();
  const folder = zip.folder(`Dossie_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}`)!;

  // 1. Balancete PDF
  const balancetePdf = new jsPDF();
  addPdfHeader(balancetePdf, `Balancete — ${entityName}`, `Exercício Fiscal ${year}`);
  autoTable(balancetePdf, {
    startY: 40,
    head: [["Conta", "Descrição", "Débito (Kz)", "Crédito (Kz)", "Saldo (Kz)"]],
    body: mockTrialBalance.map((l) => [
      l.accountCode, l.description,
      l.debit > 0 ? formatKz(l.debit) : "—",
      l.credit > 0 ? formatKz(l.credit) : "—",
      formatKz(l.balance),
    ]),
    theme: "grid",
    headStyles: { fillColor: [40, 38, 72], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { cellWidth: 20, font: "courier" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });
  addPdfFooter(balancetePdf);
  folder.file("01_Balancete.pdf", balancetePdf.output("blob"));

  // 2. Balancete Excel
  const balanceteWsData = [
    ["TRIBUNAL DE CONTAS DE ANGOLA"],
    [`Balancete — ${entityName} — ${year}`],
    [],
    ["Conta", "Descrição", "Débito (Kz)", "Crédito (Kz)", "Saldo (Kz)"],
    ...mockTrialBalance.map((l) => [l.accountCode, l.description, l.debit, l.credit, l.balance]),
  ];
  const wb1 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb1, XLSX.utils.aoa_to_sheet(balanceteWsData), "Balancete");
  const xlsxBuffer = XLSX.write(wb1, { bookType: "xlsx", type: "array" });
  folder.file("01_Balancete.xlsx", xlsxBuffer);

  // 3. Validações PDF
  const validPdf = new jsPDF();
  addPdfHeader(validPdf, `Relatório de Validações — ${entityName}`, `Exercício Fiscal ${year}`);
  autoTable(validPdf, {
    startY: 40,
    head: [["Código", "Nível", "Tipo", "Mensagem", "Estado"]],
    body: mockValidations.map((v) => [
      v.code,
      v.level === "completude" ? "N1-Completude" : v.level === "consistencia" ? "N2-Consistência" : "N3-Tribunal",
      v.type === "error" ? "Erro" : "Aviso",
      v.message,
      v.resolved ? "Resolvido" : "Pendente",
    ]),
    theme: "grid",
    headStyles: { fillColor: [40, 38, 72], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 24 }, 2: { cellWidth: 14 } },
  });
  addPdfFooter(validPdf);
  folder.file("02_Validacoes.pdf", validPdf.output("blob"));

  // 4. Auditoria PDF
  const auditPdf = new jsPDF();
  addPdfHeader(auditPdf, `Trilha de Auditoria — ${entityName}`, `Exercício Fiscal ${year}`);
  autoTable(auditPdf, {
    startY: 40,
    head: [["Data/Hora", "Acção", "Utilizador", "Detalhes"]],
    body: mockAuditLog.map((l) => [l.timestamp, l.action, l.user, l.detail]),
    theme: "grid",
    headStyles: { fillColor: [40, 38, 72], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
  });
  addPdfFooter(auditPdf);
  folder.file("03_Auditoria.pdf", auditPdf.output("blob"));

  // 5. Index / summary
  const indexPdf = new jsPDF();
  addPdfHeader(indexPdf, `Dossiê de Prestação de Contas`, `${entityName} — Exercício ${year}`);
  const fy = mockFiscalYears.find((f) => f.entityName.includes(entityName.split(",")[0])) || mockFiscalYears[0];
  autoTable(indexPdf, {
    startY: 40,
    head: [["Item", "Valor"]],
    body: [
      ["Entidade", entityName],
      ["Exercício", `${year}`],
      ["Total Débito", `${formatKz(fy.totalDebito)} Kz`],
      ["Total Crédito", `${formatKz(fy.totalCredito)} Kz`],
      ["Estado", fy.status],
      ["Prazo de Entrega", fy.deadline],
      ["Checklist", `${fy.checklistProgress}%`],
      ["Erros", `${fy.errorsCount}`],
      ["Avisos", `${fy.warningsCount}`],
      ["Anexos no dossiê", `${mockAttachments.length} ficheiro(s)`],
      ["Data de geração", new Date().toLocaleDateString("pt-AO")],
    ],
    theme: "grid",
    headStyles: { fillColor: [202, 148, 62], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  // Checklist
  autoTable(indexPdf, {
    startY: (indexPdf as any).lastAutoTable.finalY + 10,
    head: [["Documento", "Estado"]],
    body: [
      ["Relatório de Gestão", "Em falta"],
      ["Balanço Patrimonial", "✓ Carregado"],
      ["Demonstração de Resultados", "✓ Carregado"],
      ["Demonstração do Fluxo de Caixa", "Em falta"],
      ["Balancete", "✓ Carregado"],
      ["Parecer Conselho Fiscal", "✓ Carregado"],
      ["Modelos 1 a 10", "Parcial"],
      ["Inventário Patrimonial", "✓ Carregado"],
    ],
    theme: "grid",
    headStyles: { fillColor: [40, 38, 72], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  });
  addPdfFooter(indexPdf);
  folder.file("00_Indice_Dossie.pdf", indexPdf.output("blob"));

  // Generate and download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `Dossie_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}_${year}.zip`);
}

// ─── Export Documento do Tribunal PDF ───
export function exportDocumentoTribunalPdf(doc: DocumentoTribunal, entityName = "Entidade") {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // ── Header institucional ──
  // Top bar azul profundo
  pdf.setFillColor(40, 38, 72);
  pdf.rect(0, 0, pageWidth, 22, "F");

  // Brasão placeholder (circle with scales icon)
  pdf.setFillColor(202, 148, 62);
  pdf.circle(20, 11, 7, "F");
  pdf.setFillColor(40, 38, 72);
  pdf.circle(20, 11, 5.5, "F");
  pdf.setTextColor(202, 148, 62);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("TCA", 20, 12.5, { align: "center" });

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text("TRIBUNAL DE CONTAS DE ANGOLA", 32, 9);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  pdf.text("REPÚBLICA DE ANGOLA", 32, 14);
  pdf.setFontSize(6.5);
  pdf.text("Sistema de Prestação de Contas — Resolução n.º 1/17", 32, 18.5);

  // Gold accent line
  pdf.setFillColor(202, 148, 62);
  pdf.rect(0, 22, pageWidth, 2, "F");

  // ── Document type title ──
  const tipoLabel = DOCUMENTO_TIPO_LABELS[doc.tipo].label.toUpperCase();
  pdf.setTextColor(40, 38, 72);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(tipoLabel, pageWidth / 2, 36, { align: "center" });

  // Underline decoration
  const textWidth = pdf.getTextWidth(tipoLabel);
  pdf.setDrawColor(202, 148, 62);
  pdf.setLineWidth(0.8);
  pdf.line((pageWidth - textWidth) / 2, 38, (pageWidth + textWidth) / 2, 38);

  // ── Document number ──
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`N.º ${doc.numeroDocumento}`, pageWidth / 2, 44, { align: "center" });

  // ── Metadata table ──
  let y = 52;
  const metaRows: [string, string][] = [
    ["Entidade Fiscalizada", entityName],
    ["Data de Emissão", doc.emitidoAt || doc.createdAt],
    ["Estado", DOCUMENTO_ESTADO_LABELS[doc.estado].label],
    ["Versão", `${doc.versao}`],
    ["Criado por", doc.criadoPor],
  ];

  if (doc.aprovadoPor) metaRows.push(["Aprovado por", doc.aprovadoPor]);
  if (doc.juizRelator) metaRows.push(["Juiz Relator", doc.juizRelator]);
  if (doc.prazoResposta) metaRows.push(["Prazo de Resposta", doc.prazoResposta]);
  if (doc.resultadoAcordao) {
    const resultLabels = { em_termos: "Em Termos", com_recomendacoes: "Em Termos com Recomendações", nao_em_termos: "Não em Termos" };
    metaRows.push(["Resultado / Deliberação", resultLabels[doc.resultadoAcordao]]);
  }

  autoTable(pdf, {
    startY: y,
    body: metaRows.map(([label, value]) => [label, value]),
    theme: "plain",
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [40, 38, 72], fontSize: 8.5 },
      1: { fontSize: 8.5, textColor: [50, 50, 50] },
    },
    styles: { cellPadding: { top: 2, bottom: 2, left: 4, right: 4 } },
    tableWidth: pageWidth - 28,
    margin: { left: 14 },
  });

  y = (metaTable as any).finalY + 6;

  // ── Divider ──
  pdf.setDrawColor(202, 148, 62);
  pdf.setLineWidth(0.4);
  pdf.line(14, y, pageWidth - 14, y);
  y += 8;

  // ── Subject ──
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 38, 72);
  pdf.text("Assunto:", 14, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 30, 30);
  const subjectLines = pdf.splitTextToSize(doc.assunto, pageWidth - 48);
  pdf.text(subjectLines, 40, y);
  y += subjectLines.length * 5 + 6;

  // ── Content ──
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(30, 30, 30);

  const contentLines = pdf.splitTextToSize(doc.conteudo, pageWidth - 28);
  const lineHeight = 4.5;
  const maxY = pageHeight - 40;

  for (let i = 0; i < contentLines.length; i++) {
    if (y + lineHeight > maxY) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(contentLines[i], 14, y);
    y += lineHeight;
  }

  // ── Signature area (for emitted docs) ──
  if (doc.estado === "emitido") {
    if (y + 50 > maxY) {
      pdf.addPage();
      y = 30;
    }
    y += 15;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);

    // Left signature
    pdf.line(30, y + 20, 85, y + 20);
    pdf.setFontSize(7.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(doc.criadoPor, 57.5, y + 25, { align: "center" });
    pdf.text("Elaborado por", 57.5, y + 29, { align: "center" });

    // Right signature
    pdf.line(pageWidth - 85, y + 20, pageWidth - 30, y + 20);
    const approver = doc.aprovadoPor || doc.juizRelator || "Coordenador TCA";
    pdf.text(approver, pageWidth - 57.5, y + 25, { align: "center" });
    pdf.text("Aprovado por", pageWidth - 57.5, y + 29, { align: "center" });
  }

  // ── Footer with hash on every page ──
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // Bottom gold line
    pdf.setFillColor(202, 148, 62);
    pdf.rect(0, pageHeight - 18, pageWidth, 0.8, "F");

    // Footer text
    pdf.setFontSize(6.5);
    pdf.setTextColor(130, 130, 130);
    pdf.text(
      `© Tribunal de Contas de Angola — ${DOCUMENTO_TIPO_LABELS[doc.tipo].label}`,
      14,
      pageHeight - 12
    );
    pdf.text(
      `Pág. ${i}/${pageCount}`,
      pageWidth - 14,
      pageHeight - 12,
      { align: "right" }
    );
    pdf.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-AO")} ${new Date().toLocaleTimeString("pt-AO")}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );

    // Hash integrity bar
    if (doc.hashSha256) {
      pdf.setFillColor(245, 245, 248);
      pdf.rect(0, pageHeight - 8, pageWidth, 8, "F");
      pdf.setFontSize(5.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Verificação de Integridade SHA-256: ${doc.hashSha256}`, 14, pageHeight - 3.5);
      if (doc.imutavel) {
        pdf.setTextColor(220, 53, 69);
        pdf.text("🔒 DOCUMENTO IMUTÁVEL", pageWidth - 14, pageHeight - 3.5, { align: "right" });
      }
    }
  }

  const sanitized = doc.numeroDocumento.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save(`${sanitized}_${DOCUMENTO_TIPO_LABELS[doc.tipo].label.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

// ─── Export Acta de Recepção PDF ───
export interface ActaRecepcaoData {
  actaNumero: string;
  entityName: string;
  entityNif: string;
  entityTutela: string;
  entityMorada: string;
  exercicioYear: number;
  periodoInicio: string;
  periodoFim: string;
  submittedAt: string;
  documentosVerificados: { label: string; required: boolean; checked: boolean }[];
  totalDebito: number;
  totalCredito: number;
}

export function exportActaRecepcaoPdf(data: ActaRecepcaoData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // ── Brasão / Header Oficial ──
  doc.setFillColor(40, 38, 72);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setFillColor(202, 148, 62);
  doc.rect(0, 22, pageWidth, 2, "F");

  // Brasão placeholder (escudo estilizado)
  doc.setFillColor(202, 148, 62);
  doc.circle(centerX, 10, 7, "F");
  doc.setFillColor(40, 38, 72);
  doc.circle(centerX, 10, 5.5, "F");
  doc.setTextColor(202, 148, 62);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TCA", centerX, 12, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("REPÚBLICA DE ANGOLA", centerX, 5, { align: "center" });
  doc.text("TRIBUNAL DE CONTAS", centerX, 18, { align: "center" });

  // ── Título ──
  let y = 34;
  doc.setTextColor(40, 38, 72);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ACTA DE RECEPÇÃO", centerX, y, { align: "center" });
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Nº ${data.actaNumero}`, centerX, y, { align: "center" });
  y += 4;
  doc.setFontSize(8);
  doc.text("Prestação de Contas — Resolução nº 1/17 de 5 de Janeiro", centerX, y, { align: "center" });

  // ── Linha separadora dourada ──
  y += 6;
  doc.setDrawColor(202, 148, 62);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);

  // ── Dados da Entidade ──
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 38, 72);
  doc.text("1. IDENTIFICAÇÃO DA ENTIDADE", 14, y);
  y += 7;

  const addField = (label: string, value: string, yPos: number) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, 18, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 38, 72);
    doc.text(value, 65, yPos);
    return yPos + 6;
  };

  y = addField("Entidade:", data.entityName, y);
  y = addField("NIF:", data.entityNif, y);
  y = addField("Tutela:", data.entityTutela, y);
  y = addField("Morada:", data.entityMorada, y);
  y = addField("Exercício:", String(data.exercicioYear), y);
  y = addField("Período:", `${data.periodoInicio} a ${data.periodoFim}`, y);
  y = addField("Data de Submissão:", data.submittedAt, y);

  // ── Dados Financeiros ──
  y += 4;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 38, 72);
  doc.text("2. DADOS FINANCEIROS", 14, y);
  y += 7;
  y = addField("Total Débito:", `${formatKz(data.totalDebito)} Kz`, y);
  y = addField("Total Crédito:", `${formatKz(data.totalCredito)} Kz`, y);

  // ── Documentos Verificados ──
  y += 4;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 38, 72);
  doc.text("3. DOCUMENTAÇÃO VERIFICADA", 14, y);
  y += 3;

  const docsChecked = data.documentosVerificados.filter(d => d.checked);
  const docsTotal = data.documentosVerificados.length;

  const docsTable = autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["Nº", "Documento", "Obrigatório", "Estado"]],
    body: data.documentosVerificados.map((d, i) => [
      String(i + 1),
      d.label,
      d.required ? "Sim" : "Não",
      d.checked ? "✓ Verificado" : "✗ Em falta",
    ]),
    headStyles: {
      fillColor: [40, 38, 72],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
    },
    didParseCell: (hookData: any) => {
      if (hookData.column.index === 3 && hookData.section === "body") {
        const val = hookData.cell.raw as string;
        if (val.startsWith("✓")) {
          hookData.cell.styles.textColor = [39, 174, 96];
          hookData.cell.styles.fontStyle = "bold";
        } else {
          hookData.cell.styles.textColor = [220, 53, 69];
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = (docsTable as any).finalY + 8;

  // ── Resumo ──
  doc.setFillColor(240, 248, 240);
  doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(39, 174, 96);
  doc.text(`Documentos verificados: ${docsChecked.length}/${docsTotal}`, 20, y + 6);
  doc.setTextColor(40, 38, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Recepção confirmada em ${new Date().toLocaleDateString("pt-AO")} às ${new Date().toLocaleTimeString("pt-AO")}`, 20, y + 11);

  // ── Assinaturas ──
  y += 24;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  const sig1x = 14;
  const sig2x = pageWidth / 2 + 10;
  const sigWidth = pageWidth / 2 - 24;

  doc.line(sig1x, y + 12, sig1x + sigWidth, y + 12);
  doc.line(sig2x, y + 12, sig2x + sigWidth, y + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Funcionário da Secretaria", sig1x + sigWidth / 2, y + 17, { align: "center" });
  doc.text("Representante da Entidade", sig2x + sigWidth / 2, y + 17, { align: "center" });

  // ── Footer oficial ──
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(40, 38, 72);
  doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
  doc.setFillColor(202, 148, 62);
  doc.rect(0, pageHeight - 12, pageWidth, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text(
    "© Tribunal de Contas de Angola — Sistema de Prestação de Contas — Resolução nº 1/17",
    centerX,
    pageHeight - 6,
    { align: "center" }
  );
  doc.setFontSize(5.5);
  doc.text(
    `Documento gerado automaticamente em ${new Date().toLocaleDateString("pt-AO")} ${new Date().toLocaleTimeString("pt-AO")}`,
    centerX,
    pageHeight - 3,
    { align: "center" }
  );

  doc.save(`Acta_Recepcao_${data.actaNumero.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
