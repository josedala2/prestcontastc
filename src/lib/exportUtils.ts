import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { TrialBalanceLine, ValidationResult } from "@/types";
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

  (doc as any).autoTable({
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

  (doc as any).autoTable({
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

  (doc as any).autoTable({
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
  (balancetePdf as any).autoTable({
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
  (validPdf as any).autoTable({
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
  (auditPdf as any).autoTable({
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
  (indexPdf as any).autoTable({
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
  (indexPdf as any).autoTable({
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
