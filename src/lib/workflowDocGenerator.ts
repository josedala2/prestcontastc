import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import brasaoImg from "@/assets/brasao-angola.jpg";

export interface ProcessoDocData {
  numeroProcesso: string;
  entityName: string;
  anoGerencia: number;
  categoriaEntidade: string;
  canalEntrada: string;
  dataSubmissao: string;
  responsavelAtual: string;
  submetidoPor: string;
  juizRelator?: string;
  juizAdjunto?: string;
  tecnicoAnalise?: string;
  portadorNome?: string;
  portadorDocumento?: string;
  portadorContacto?: string;
  observacoes?: string;
  etapaAtual: number;
  estado: string;
  tipoProcesso?: string;
  naturezaProcesso?: string;
  tipoEntidade?: string;
  resolucaoAplicavel?: string;
  periodoGerencia?: string;
  responsaveisGerencia?: { nome: string; cargo: string }[];
  actaRecebimentoNumero?: string;
  divisaoCompetente?: string;
  seccaoCompetente?: string;
  checklistCompleta?: boolean;
  totalDocumentos?: number;
  totalPaginas?: number;
  dataAutuacao?: string;
  escrivaoAutos?: string;
}

async function loadImage(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function addHeader(doc: jsPDF, brasao: string, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // ── Brasão centrado (mesmo modelo das actas) ──
  const brasaoSize = 22;
  doc.addImage(brasao, "JPEG", centerX - brasaoSize / 2, 8, brasaoSize, brasaoSize, undefined, "FAST");

  // ── Header text ──
  let y = 36;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TRIBUNAL DE CONTAS", centerX, y, { align: "center" });

  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DIRECÇÃO DOS SERVIÇOS ADMINISTRATIVOS", centerX, y, { align: "center" });

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("SECRETARIA GERAL", centerX, y, { align: "center" });

  // ── Título do documento ──
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, centerX, y, { align: "center" });

  // ── Linha separadora ──
  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(20, y, pageWidth - 20, y);

  return y + 8;
}

function addField(doc: jsPDF, label: string, value: string, y: number, x = 25): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${label}:`, x, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, x + doc.getTextWidth(`${label}: `) + 2, y);
  return y + 7;
}

function addFooter(doc: jsPDF, executadoPor: string) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(180, 160, 100);
  doc.setLineWidth(0.3);
  doc.line(25, pageHeight - 30, 185, pageHeight - 30);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Gerado automaticamente pelo Sistema de Prestação de Contas — ${new Date().toLocaleString("pt-AO")}`, 105, pageHeight - 24, { align: "center" });
  doc.text(`Executado por: ${executadoPor}`, 105, pageHeight - 19, { align: "center" });
  doc.setTextColor(0);
}

// ==================== CAPA DO PROCESSO ====================
export async function generateCapaProcesso(data: ProcessoDocData, executadoPor: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);
  const pageWidth = 210;
  const centerX = pageWidth / 2;
  const leftMargin = 30;
  const rightEdge = 180;
  const fieldGap = 6.5;

  // Helper: section header with subtle background band
  const sectionTitle = (title: string, y: number): number => {
    doc.setFillColor(245, 243, 237);
    doc.roundedRect(leftMargin - 2, y - 4.5, rightEdge - leftMargin + 4, 7, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 80, 40);
    doc.text(title, leftMargin, y);
    doc.setTextColor(0);
    return y + 9;
  };

  // Helper: field row
  const field = (label: string, value: string, y: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, leftMargin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.text(value || "—", leftMargin + labelWidth + 1, y);
    doc.setTextColor(0);
    return y + fieldGap;
  };

  // ===== PAGE 1 =====
  // Centered header block
  const logoSize = 22;
  doc.addImage(brasao, "JPEG", centerX - logoSize / 2, 12, logoSize, logoSize, undefined, "FAST");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("REPÚBLICA DE ANGOLA", centerX, 40, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 100, 150);
  doc.text("TRIBUNAL DE CONTAS", centerX, 46, { align: "center" });
  doc.setTextColor(0);

  // Title block with accent background
  doc.setFillColor(50, 100, 150);
  doc.roundedRect(leftMargin - 2, 52, rightEdge - leftMargin + 4, 10, 1.5, 1.5, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CAPA DO PROCESSO DE PRESTAÇÃO DE CONTAS", centerX, 59, { align: "center" });
  doc.setTextColor(0);

  let y = 72;

  // Secção 1: Dados do processo
  y = field("N.º DO PROCESSO", data.numeroProcesso, y);
  y = field("TIPO DE PROCESSO", data.tipoProcesso || "Prestação de Contas", y);
  y = field("NATUREZA DO PROCESSO", data.naturezaProcesso || "Ordinário", y);
  y += 3;

  // Secção 2: Identificação da Entidade
  y = sectionTitle("IDENTIFICAÇÃO DA ENTIDADE", y);
  y = field("Nome da Entidade", data.entityName, y);
  y = field("Tipo/Natureza da Entidade", data.tipoEntidade || "Empresa Pública", y);
  y = field("Categoria da Entidade", data.categoriaEntidade, y);
  y = field("Base Legal (Resolução Aplicável)", data.resolucaoAplicavel || "Resolução n.º 1/17 de 5 de Janeiro", y);
  y += 3;

  // Secção 3: Dados da Conta de Gerência
  y = sectionTitle("DADOS DA CONTA DE GERÊNCIA", y);
  y = field("Ano da Conta de Gerência", String(data.anoGerencia), y);
  y = field("Período (Início/Fim)", data.periodoGerencia || `01/01/${data.anoGerencia} a 31/12/${data.anoGerencia}`, y);
  y += 3;

  // Secção 4: Responsáveis pela Gerência
  y = sectionTitle("RESPONSÁVEIS PELA GERÊNCIA", y);
  if (data.responsaveisGerencia && data.responsaveisGerencia.length > 0) {
    data.responsaveisGerencia.forEach((r, i) => {
      y = field(`${i + 1}. Nome / Cargo`, `${r.nome} / ${r.cargo}`, y);
    });
  } else {
    y = field("1. Nome / Cargo", "—", y);
    y = field("2. Nome / Cargo", "—", y);
  }
  y += 3;

  // Secção 5: Dados do Expediente
  y = sectionTitle("DADOS DO EXPEDIENTE", y);
  y = field("Canal de Entrada (Portal / Presencial)", data.canalEntrada === "portal" ? "Portal Electrónico" : "Presencial", y);
  y = field("Data de Submissão", new Date(data.dataSubmissao).toLocaleDateString("pt-AO"), y);
  y = field("Portador do Expediente", data.portadorNome || data.submetidoPor || "—", y);

  addFooter(doc, executadoPor);

  // ===== PAGE 2 =====
  doc.addPage();
  let y2 = 20;

  // Acta de Recebimento
  y2 = field("N.º Acta de Recebimento", data.actaRecebimentoNumero || "—", y2);
  y2 += 3;

  // Tramitação Processual
  y2 = sectionTitle("TRAMITAÇÃO PROCESSUAL", y2);
  y2 = field("Juiz Relator", data.juizRelator || "—", y2);
  y2 = field("Juiz Adjunto", data.juizAdjunto || "—", y2);
  y2 = field("Divisão Competente", data.divisaoCompetente || "—", y2);
  y2 = field("Secção Competente", data.seccaoCompetente || "—", y2);
  y2 += 3;

  // Situação do Processo
  y2 = sectionTitle("SITUAÇÃO DO PROCESSO", y2);
  y2 = field("Estado Atual", data.estado, y2);
  y2 = field("Etapa Atual", `Etapa ${data.etapaAtual}`, y2);
  y2 += 3;

  // Documentação
  y2 = sectionTitle("DOCUMENTAÇÃO", y2);
  y2 = field("Checklist (Completa/Incompleta)", data.checklistCompleta !== undefined ? (data.checklistCompleta ? "Completa" : "Incompleta") : "—", y2);
  if (data.totalDocumentos !== undefined) {
    y2 = field("Total de Documentos", String(data.totalDocumentos), y2);
  }
  if (data.totalPaginas !== undefined) {
    y2 = field("Total de Páginas do Processo", String(data.totalPaginas), y2);
  }
  y2 = field("Observações", data.observacoes || "—", y2);
  y2 += 3;

  // Registo
  y2 = sectionTitle("REGISTO", y2);
  y2 = field("Data de Autuação", data.dataAutuacao || new Date().toLocaleDateString("pt-AO"), y2);
  y2 = field("Escrivão dos Autos", data.escrivaoAutos || executadoPor, y2);
  y2 += 3;

  // Observações Gerais
  y2 = sectionTitle("OBSERVAÇÕES GERAIS", y2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("—", leftMargin, y2);
  y2 += 14;

  // Signature area
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("O Escrivão dos Autos", 55, y2 + 20, { align: "center" });
  doc.text("O Chefe da Secretaria", 155, y2 + 20, { align: "center" });

  // Signature dots instead of lines
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([1, 1.5], 0);
  doc.line(25, y2 + 35, 85, y2 + 35);
  doc.line(125, y2 + 35, 185, y2 + 35);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text("(assinatura e carimbo)", 55, y2 + 40, { align: "center" });
  doc.text("(assinatura e carimbo)", 155, y2 + 40, { align: "center" });
  doc.setTextColor(0);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== GUIA DE COBRANÇA ====================
export async function generateGuiaCobranca(data: ProcessoDocData, executadoPor: string, valorEmolumentos?: number): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "GUIA DE COBRANÇA DE EMOLUMENTOS");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Processo: ${data.numeroProcesso}`, 105, y, { align: "center" });
  y += 10;

  y = addField(doc, "Entidade", data.entityName, y);
  y = addField(doc, "Exercício", String(data.anoGerencia), y);
  y = addField(doc, "Categoria", data.categoriaEntidade, y);
  y += 5;

  const valor = valorEmolumentos || 50000;
  const formatKz = (v: number) => v.toLocaleString("pt-AO", { minimumFractionDigits: 2 }) + " Kz";

  autoTable(doc, {
    startY: y,
    head: [["Descrição", "Qtd.", "Valor Unit.", "Total"]],
    body: [
      ["Emolumentos de Prestação de Contas", "1", formatKz(valor), formatKz(valor)],
      ["Taxa de processamento", "1", formatKz(valor * 0.1), formatKz(valor * 0.1)],
    ],
    foot: [["", "", "Total a Pagar:", formatKz(valor * 1.1)]],
    theme: "grid",
    headStyles: { fillColor: [60, 60, 80], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 10 },
    margin: { left: 25, right: 25 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Prazo de pagamento: 15 dias úteis após notificação.", 25, y);
  y += 5;
  doc.text("Forma de pagamento: Transferência bancária para a conta do Tribunal de Contas.", 25, y);
  y += 5;
  doc.text("IBAN: AO06.0000.0000.0000.0000.0000.1", 25, y);
  y += 15;

  doc.setFont("helvetica", "normal");
  doc.text("O Técnico da Secção de Custas", 55, y, { align: "center" });
  doc.text("Conferido por", 155, y, { align: "center" });
  doc.line(20, y + 15, 90, y + 15);
  doc.line(120, y + 15, 190, y + 15);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== OFÍCIO DE REMESSA ====================
export async function generateOficioRemessa(data: ProcessoDocData, executadoPor: string, destinatario?: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "OFÍCIO DE REMESSA");

  y += 5;
  const refNum = `OF/TCA/${new Date().getFullYear()}/${data.numeroProcesso.replace("PC-", "")}`;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Ref.: ${refNum}`, 25, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Luanda, ${new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "long", year: "numeric" })}`, 25, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Exmo(a) Sr(a)", 25, y);
  y += 6;
  doc.text(destinatario || `Representante Legal — ${data.entityName}`, 25, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const body = [
    `Assunto: Remessa de Decisão — Processo ${data.numeroProcesso}`,
    "",
    `Serve o presente ofício para comunicar a V. Exa. que o Tribunal de Contas de Angola concluiu a apreciação das contas da entidade ${data.entityName}, referentes ao exercício de ${data.anoGerencia}.`,
    "",
    "Junto se remete cópia autenticada da decisão proferida, nos termos do artigo 68.º da Lei n.º 13/10, de 9 de Julho (Lei Orgânica e do Processo do Tribunal de Contas).",
    "",
    "Do despacho proferido cabe recurso para o Plenário do Tribunal de Contas, no prazo de 30 dias a contar da data de recepção do presente ofício.",
    "",
    "Sem outro assunto de momento, apresentamos os melhores cumprimentos.",
  ];

  const lines = doc.splitTextToSize(body.join("\n"), 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 15;

  doc.setFont("helvetica", "normal");
  doc.text("O Técnico da Secretaria-Geral", 105, y, { align: "center" });
  doc.line(55, y + 15, 155, y + 15);
  doc.text("(assinatura e carimbo)", 105, y + 20, { align: "center" });

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== ACTA DE RECEBIMENTO ====================
export async function generateActaRecebimento(data: ProcessoDocData, executadoPor: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "ACTA DE RECEBIMENTO");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const text = `Aos ${new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "long", year: "numeric" })}, nesta cidade de Luanda, na Secretaria-Geral do Tribunal de Contas de Angola, foi recebido o expediente de prestação de contas da entidade ${data.entityName}, referente ao exercício de ${data.anoGerencia}, entregue ${data.canalEntrada === "portal" ? "através do Portal Electrónico" : `presencialmente${data.portadorNome ? ` pelo(a) Sr(a). ${data.portadorNome}` : ""}`}.`;

  const lines = doc.splitTextToSize(text, 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 8;

  y = addField(doc, "Número Provisório", data.numeroProcesso, y);
  y = addField(doc, "Canal de Entrada", data.canalEntrada === "portal" ? "Portal Electrónico" : "Presencial", y);
  y = addField(doc, "Data/Hora de Recepção", new Date().toLocaleString("pt-AO"), y);
  y += 10;

  const text2 = "Do que, para constar, se lavrou a presente acta, que vai ser assinada por mim e pelo entregador, depois de lida e achada conforme.";
  doc.text(doc.splitTextToSize(text2, 160), 25, y);
  y += 20;

  doc.text("O Recepcionista", 55, y, { align: "center" });
  doc.text("O Entregador", 155, y, { align: "center" });
  doc.line(20, y + 15, 90, y + 15);
  doc.line(120, y + 15, 190, y + 15);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== DESPACHO DO JUIZ ====================
export async function generateDespachoJuiz(data: ProcessoDocData, executadoPor: string, decisao?: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "DESPACHO");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Processo: ${data.numeroProcesso}`, 25, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Entidade: ${data.entityName}`, 25, y);
  y += 7;
  doc.text(`Exercício: ${data.anoGerencia}`, 25, y);
  y += 12;

  const despachoText = decisao || `Vistos os autos do processo de prestação de contas n.º ${data.numeroProcesso}, da entidade ${data.entityName}, referente ao exercício de ${data.anoGerencia}, e analisado o parecer técnico emitido pela Direcção dos Serviços Técnicos, determino que as contas sejam julgadas em conformidade com a legislação aplicável.`;

  const lines = doc.splitTextToSize(despachoText, 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 20;

  doc.setFont("helvetica", "bold");
  doc.text(data.juizRelator || "O Juiz Relator", 105, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.line(55, y + 12, 155, y + 12);
  y += 17;
  doc.setFontSize(9);
  doc.text(`Luanda, ${new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "long", year: "numeric" })}`, 105, y, { align: "center" });

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== DESPACHO DE PROMOÇÃO (MP) ====================
export async function generateDespachoPromocao(data: ProcessoDocData, executadoPor: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "DESPACHO DE PROMOÇÃO DO MINISTÉRIO PÚBLICO");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Processo: ${data.numeroProcesso}`, 25, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  const text = `O Ministério Público, nos termos do artigo 26.º da Lei n.º 13/10, de 9 de Julho, analisou o processo de prestação de contas n.º ${data.numeroProcesso} da entidade ${data.entityName}, referente ao exercício de ${data.anoGerencia}, e promove que o mesmo siga os ulteriores termos.`;

  const lines = doc.splitTextToSize(text, 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 25;

  doc.text("O Representante do Ministério Público", 105, y, { align: "center" });
  doc.line(45, y + 15, 165, y + 15);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== TERMO DE NOTIFICAÇÃO ====================
export async function generateTermoNotificacao(data: ProcessoDocData, executadoPor: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "TERMO DE NOTIFICAÇÃO");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const text = `Certifico que, nesta data, notifiquei pessoalmente o(a) representante da entidade ${data.entityName}, acerca da decisão proferida no Processo n.º ${data.numeroProcesso}, referente ao exercício de ${data.anoGerencia}, entregando-lhe cópia integral do despacho, do que dou fé.`;

  const lines = doc.splitTextToSize(text, 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 10;

  y = addField(doc, "Local", "Luanda", y);
  y = addField(doc, "Data", new Date().toLocaleDateString("pt-AO"), y);
  y = addField(doc, "Hora", new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }), y);
  y += 15;

  doc.text("O Oficial de Diligências", 55, y, { align: "center" });
  doc.text("O Notificado", 155, y, { align: "center" });
  doc.line(20, y + 15, 90, y + 15);
  doc.line(120, y + 15, 190, y + 15);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== DESPACHO DE ARQUIVAMENTO ====================
export async function generateDespachoArquivamento(data: ProcessoDocData, executadoPor: string): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "DESPACHO DE ARQUIVAMENTO");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Processo: ${data.numeroProcesso}`, 25, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  const text = `Tendo sido concluídos todos os trâmites legais e processuais relativos ao processo de prestação de contas n.º ${data.numeroProcesso}, da entidade ${data.entityName}, exercício de ${data.anoGerencia}, e não havendo mais diligências a efectuar, determino o arquivamento definitivo dos presentes autos.`;

  const lines = doc.splitTextToSize(text, 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 25;

  doc.setFont("helvetica", "bold");
  doc.text(data.juizRelator || "O Juiz Relator", 105, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.line(55, y + 12, 155, y + 12);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== OFÍCIO DE SOLICITAÇÃO DE ELEMENTOS ====================
export async function generateOficioSolicitacaoElementos(data: ProcessoDocData, executadoPor: string, elementosSolicitados?: string[]): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "OFÍCIO DE SOLICITAÇÃO DE ELEMENTOS");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref.: ${data.numeroProcesso}`, 25, y);
  y += 5;
  doc.text(`Luanda, ${new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "long", year: "numeric" })}`, 25, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text(`A/C: ${data.entityName}`, 25, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  const intro = `Na sequência da análise do processo de prestação de contas n.º ${data.numeroProcesso}, referente ao exercício de ${data.anoGerencia}, verificou-se a necessidade de solicitar os seguintes elementos adicionais:`;
  const introLines = doc.splitTextToSize(intro, 160);
  doc.text(introLines, 25, y);
  y += introLines.length * 5 + 8;

  const items = elementosSolicitados || ["Documentos em falta conforme checklist"];
  items.forEach((item, i) => {
    doc.text(`${i + 1}. ${item}`, 30, y);
    y += 6;
  });
  y += 5;

  doc.text("Prazo de resposta: 15 dias úteis a contar da recepção do presente ofício.", 25, y);
  y += 15;

  doc.text("O Técnico da Contadoria Geral", 105, y, { align: "center" });
  doc.line(45, y + 15, 165, y + 15);

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== NOTA DE REMESSA (Secretaria → Contadoria) ====================
export async function generateNotaRemessa(
  data: ProcessoDocData,
  executadoPor: string,
  destinatario: string = "Contadoria Geral"
): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "NOTA DE REMESSA");

  y += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`N.º de Referência: NR-${data.numeroProcesso}`, 25, y);
  y += 7;
  doc.text(`Data: ${new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "long", year: "numeric" })}`, 25, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.text("De: Secretaria-Geral do Tribunal de Contas", 25, y);
  y += 6;
  doc.text(`Para: ${destinatario}`, 25, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Assunto: Remessa de Processo para Verificação Documental", 25, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  const body = [
    `Nos termos do fluxo de tramitação de Prestação de Contas do Tribunal de Contas de Angola, a Secretaria-Geral vem, por este meio, remeter à ${destinatario} o processo abaixo identificado, para efeitos de verificação e conferência documental detalhada.`,
    "",
    "Após validação da conformidade documental, o presente processo foi considerado apto a prosseguir para a etapa de verificação técnica.",
  ];

  const lines = doc.splitTextToSize(body.join("\n"), 160);
  doc.text(lines, 25, y);
  y += lines.length * 5 + 10;

  // Process details table
  autoTable(doc, {
    startY: y,
    head: [["Campo", "Valor"]],
    body: [
      ["Número do Processo", data.numeroProcesso],
      ["Entidade", data.entityName],
      ["Exercício / Gerência", String(data.anoGerencia)],
      ["Categoria", data.categoriaEntidade],
      ["Canal de Entrada", data.canalEntrada === "portal" ? "Portal Electrónico" : "Presencial"],
      ["Data de Submissão", data.dataSubmissao],
      ["Etapa Actual", `Etapa ${data.etapaAtual} — Verificação de Documento`],
      ["Responsável Anterior", "Chefe da Secretaria-Geral"],
      ["Responsável Seguinte", "Técnico da Contadoria Geral"],
    ],
    theme: "grid",
    headStyles: { fillColor: [45, 55, 72], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 25, right: 25 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const closing = "Solicita-se que a verificação seja efectuada com a devida celeridade, de acordo com os prazos regulamentares estabelecidos.";
  doc.text(doc.splitTextToSize(closing, 160), 25, y);
  y += 15;

  doc.text("A Chefe da Secretaria-Geral", 105, y, { align: "center" });
  doc.line(55, y + 15, 155, y + 15);
  doc.text("(assinatura e carimbo)", 105, y + 20, { align: "center" });

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== RELATÓRIO DE VERIFICAÇÃO DOCUMENTAL ====================
export interface ChecklistItem {
  label: string;
  obrigatorio: boolean;
  verificado: boolean;
  observacao?: string;
}

export async function generateRelatorioVerificacao(
  data: ProcessoDocData,
  executadoPor: string,
  checklist: ChecklistItem[],
  documentosAnexos?: { tipo: string; ficheiro: string; estado: string }[]
): Promise<Blob> {
  const doc = new jsPDF();
  const brasao = await loadImage(brasaoImg);

  let y = addHeader(doc, brasao, "RELATÓRIO DE VERIFICAÇÃO DOCUMENTAL");

  y += 3;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref.: RVD-${data.numeroProcesso.replace("PC-", "")}`, 25, y);
  y += 5;
  doc.text(`Data: ${new Date().toLocaleDateString("pt-AO", { day: "numeric", month: "long", year: "numeric" })}`, 25, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Campo", "Valor"]],
    body: [
      ["Número do Processo", data.numeroProcesso],
      ["Entidade", data.entityName],
      ["Exercício / Gerência", String(data.anoGerencia)],
      ["Categoria", data.categoriaEntidade],
      ["Canal de Entrada", data.canalEntrada === "portal" ? "Portal Electrónico" : "Presencial"],
      ["Data de Submissão", new Date(data.dataSubmissao).toLocaleDateString("pt-AO")],
      ["Técnico Responsável", executadoPor],
    ],
    theme: "grid",
    headStyles: { fillColor: [45, 55, 72], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { left: 25, right: 25 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (documentosAnexos && documentosAnexos.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Documentos Anexos ao Processo", 25, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Tipo de Documento", "Ficheiro", "Estado"]],
      body: documentosAnexos.map((d) => [d.tipo, d.ficheiro, d.estado === "validado" ? "Validado ✓" : "Pendente"]),
      theme: "grid",
      headStyles: { fillColor: [60, 80, 60], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 25, right: 25 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(documentosAnexos ? "2. Checklist de Conformidade — Resolução nº 1/17" : "1. Checklist de Conformidade — Resolução nº 1/17", 25, y);
  y += 5;

  const verificados = checklist.filter((c) => c.verificado).length;
  const obrigatorios = checklist.filter((c) => c.obrigatorio);
  const obrigatoriosVerificados = obrigatorios.filter((c) => c.verificado).length;

  autoTable(doc, {
    startY: y,
    head: [["#", "Documento", "Obrig.", "Verif.", "Observações"]],
    body: checklist.map((item, i) => [
      String(i + 1), item.label, item.obrigatorio ? "Sim" : "Não", item.verificado ? "✓" : "✗", item.observacao || "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [45, 55, 72], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 18, halign: "center" as const }, 3: { cellWidth: 16, halign: "center" as const } },
    didParseCell: (hookData: any) => {
      if (hookData.section === "body" && hookData.column.index === 3) {
        if (hookData.cell.raw === "✓") hookData.cell.styles.textColor = [0, 120, 0];
        else hookData.cell.styles.textColor = [200, 0, 0];
      }
    },
    margin: { left: 25, right: 25 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo da Verificação", 25, y); y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total de itens: ${checklist.length}`, 30, y); y += 5;
  doc.text(`Itens verificados: ${verificados} de ${checklist.length}`, 30, y); y += 5;
  doc.text(`Obrigatórios verificados: ${obrigatoriosVerificados} de ${obrigatorios.length}`, 30, y); y += 5;
  const completude = Math.round((verificados / checklist.length) * 100);
  doc.text(`Completude documental: ${completude}%`, 30, y); y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const conclusao = obrigatoriosVerificados === obrigatorios.length
    ? "PARECER FAVORÁVEL — Todos os documentos obrigatórios foram verificados. O processo encontra-se em condições de prosseguir para a etapa de Registo e Autuação."
    : "PARECER COM RESERVAS — Nem todos os documentos obrigatórios foram verificados. Recomenda-se a solicitação dos elementos em falta.";
  const conclusaoLines = doc.splitTextToSize(conclusao, 160);
  doc.text(conclusaoLines, 25, y);
  y += conclusaoLines.length * 5 + 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("O Técnico da Contadoria Geral", 55, y, { align: "center" });
  doc.text("O Chefe da Contadoria", 155, y, { align: "center" });
  doc.line(20, y + 15, 90, y + 15);
  doc.line(120, y + 15, 190, y + 15);
  doc.text("(assinatura e carimbo)", 55, y + 20, { align: "center" });
  doc.text("(assinatura e carimbo)", 155, y + 20, { align: "center" });

  addFooter(doc, executadoPor);
  return doc.output("blob");
}

// ==================== FACTORY: get generator by document name ====================
export type DocumentType =
  | "Acta de Recebimento"
  | "Capa do Processo"
  | "Ofício de Solicitação de Elementos"
  | "Parecer Técnico"
  | "Relatório Síntese"
  | "Despacho do Juiz"
  | "Guia de Cobrança"
  | "Despacho de Promoção"
  | "Termo de Juntada"
  | "Termo de Recebimento"
  | "Termo de Conclusão"
  | "Ofício de Remessa"
  | "Termo de Notificação"
  | "Certidão de Diligência"
  | "Despacho de Arquivamento"
  | "Nota de Remessa";

export async function generateWorkflowDocument(
  docType: string,
  data: ProcessoDocData,
  executadoPor: string
): Promise<{ blob: Blob; fileName: string } | null> {
  const sanitized = data.numeroProcesso.replace(/[^a-zA-Z0-9-]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);

  switch (docType) {
    case "Acta de Recebimento":
      return { blob: await generateActaRecebimento(data, executadoPor), fileName: `Acta_Recebimento_${sanitized}_${timestamp}.pdf` };
    case "Capa do Processo":
      return { blob: await generateCapaProcesso(data, executadoPor), fileName: `Capa_Processo_${sanitized}_${timestamp}.pdf` };
    case "Ofício de Solicitação de Elementos":
      return { blob: await generateOficioSolicitacaoElementos(data, executadoPor), fileName: `Oficio_Solicitacao_${sanitized}_${timestamp}.pdf` };
    case "Guia de Cobrança":
      return { blob: await generateGuiaCobranca(data, executadoPor), fileName: `Guia_Cobranca_${sanitized}_${timestamp}.pdf` };
    case "Despacho do Juiz":
      return { blob: await generateDespachoJuiz(data, executadoPor), fileName: `Despacho_Juiz_${sanitized}_${timestamp}.pdf` };
    case "Despacho de Promoção":
      return { blob: await generateDespachoPromocao(data, executadoPor), fileName: `Despacho_Promocao_${sanitized}_${timestamp}.pdf` };
    case "Ofício de Remessa":
      return { blob: await generateOficioRemessa(data, executadoPor), fileName: `Oficio_Remessa_${sanitized}_${timestamp}.pdf` };
    case "Nota de Remessa":
      return { blob: await generateNotaRemessa(data, executadoPor), fileName: `Nota_Remessa_${sanitized}_${timestamp}.pdf` };
    case "Termo de Notificação":
    case "Certidão de Diligência":
      return { blob: await generateTermoNotificacao(data, executadoPor), fileName: `Termo_Notificacao_${sanitized}_${timestamp}.pdf` };
    case "Despacho de Arquivamento":
      return { blob: await generateDespachoArquivamento(data, executadoPor), fileName: `Despacho_Arquivamento_${sanitized}_${timestamp}.pdf` };
    // Generic fallback for simple terms
    case "Termo de Juntada":
    case "Termo de Recebimento":
    case "Termo de Conclusão":
      return { blob: await generateActaRecebimento(data, executadoPor), fileName: `${docType.replace(/ /g, "_")}_${sanitized}_${timestamp}.pdf` };
    default:
      return null;
  }
}
