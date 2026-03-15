import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableBorders,
  ShadingType,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import brasaoImg from "@/assets/brasao-angola.jpg";

interface ParecerData {
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
  tipoParecerIndex: number; // 0=regular, 1=com reservas, 2=irregularidades
  parecerFinal: "favorável" | "favorável com reservas" | "desfavorável";
  tecnicoNome: string;
}

const formatKz = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA" }).replace("AOA", "Kz");

async function loadImageAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}

export async function generateParecerDocx(data: ParecerData) {
  const brasaoBuffer = await loadImageAsArrayBuffer(brasaoImg);

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const processNumber = `${Math.floor(Math.random() * 900) + 100}/FP/${today.getFullYear()}`;
  const relatorioNumber = `${Math.floor(Math.random() * 90) + 10}`;

  const conclusaoOptions = [
    "Regularidade e conformidade com as normas aplicáveis.",
    "Algumas irregularidades que não comprometem globalmente a fiabilidade das contas.",
    "Irregularidades relevantes que comprometem a regularidade da prestação de contas.",
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
          },
        },
        children: [
          // Brasão
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: brasaoBuffer,
                transformation: { width: 100, height: 100 },
                type: "jpg",
              }),
            ],
            spacing: { after: 200 },
          }),

          // REPÚBLICA DE ANGOLA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "REPÚBLICA DE ANGOLA",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          // Separator line
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "________________________",
                size: 20,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 100 },
          }),

          // TRIBUNAL DE CONTAS
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "TRIBUNAL DE CONTAS",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 80 },
          }),

          // DIRECÇÃO DOS SERVIÇOS TÉCNICOS
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "DIRECÇÃO DOS SERVIÇOS TÉCNICOS",
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 80 },
          }),

          // RELATÓRIO SUMÁRIO
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `RELATÓRIO SUMÁRIO N.º ${relatorioNumber}/1.ª DIV/FP/${today.getFullYear()}`,
                bold: true,
                size: 22,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Title with border
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            children: [
              new TextRun({
                text: "MODELO DE PARECER SOBRE PRESTAÇÃO DE CONTAS DE EMPRESA PÚBLICA",
                size: 22,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 300 },
          }),

          // Entity info
          ...createInfoLine("Entidade", data.entityName),
          ...createInfoLine("Exercício Económico", data.exercicio),
          ...createInfoLine("Processo n.º", processNumber),
          ...createInfoLine("Entidade Fiscalizadora", "Tribunal de Contas"),

          spacer(),

          // 1. Introdução
          heading("1. Introdução"),
          bodyText(
            `Em cumprimento das disposições legais aplicáveis à fiscalização das empresas públicas, foi submetida ao Tribunal de Contas a prestação de contas da ${data.entityName}, relativa ao exercício económico findo em 31 de Dezembro de ${data.exercicio}. O presente parecer tem por objetivo proceder à análise da conformidade, regularidade e transparência da gestão financeira e patrimonial da entidade, com base nos documentos apresentados e na legislação vigente.`
          ),

          spacer(),

          // 2. Documentos Analisados
          heading("2. Documentos Analisados"),
          bulletItem("Relatório de Gestão do exercício;"),
          bulletItem("Demonstrações Financeiras (Balanço, Demonstração de Resultados, Fluxos de Caixa);"),
          bulletItem("Notas explicativas às demonstrações financeiras;"),
          bulletItem("Parecer do Conselho Fiscal ou órgão equivalente;"),
          bulletItem("Relatório do Auditor Externo (quando aplicável);"),
          bulletItem("Plano de Atividades e Orçamento;"),
          bulletItem("Outros documentos relevantes."),

          spacer(),

          // 3. Análise
          heading("3. Análise da Prestação de Contas"),

          subHeading("3.1 Conformidade Legal"),
          bodyText(
            `Verificou-se que a prestação de contas foi apresentada dentro do prazo legal, nos termos da legislação aplicável às empresas públicas e à fiscalização do Tribunal de Contas. Quanto à estrutura e conteúdo dos documentos apresentados, observa-se que estão em conformidade com as normas contabilísticas e legais vigentes.`
          ),

          spacer(),

          subHeading("3.2 Situação Económica e Financeira"),

          // Financial table
          createFinancialTable([
            ["Total do Ativo:", formatKz(data.totalActivo)],
            ["Total do Passivo:", formatKz(data.totalPassivo)],
            ["Capital Próprio:", formatKz(data.totalCapProprio)],
            [
              "Resultado Líquido do Exercício:",
              `${data.resultadoExercicio >= 0 ? "Lucro" : "Prejuízo"} — ${formatKz(Math.abs(data.resultadoExercicio))}`,
            ],
          ]),

          spacer(),

          bodyText(
            data.resultadoExercicio >= 0
              ? `Constata-se que a empresa apresentou situação financeira equilibrada com um resultado líquido positivo de ${formatKz(data.resultadoExercicio)}, demonstrando capacidade de geração de receitas acima dos custos operacionais.`
              : `Constata-se que a empresa apresentou desequilíbrios financeiros com um resultado líquido negativo de ${formatKz(Math.abs(data.resultadoExercicio))}, sugerindo a necessidade de revisão da estrutura de custos e receitas.`
          ),

          spacer(),

          subHeading("3.3 Gestão e Execução Orçamental"),

          createFinancialTable([
            ["Total de Proveitos e Ganhos:", formatKz(data.totalProveitos)],
            ["Total de Custos e Perdas:", formatKz(data.totalCustos)],
            ["Resultado do Exercício:", formatKz(data.resultadoExercicio)],
          ]),

          spacer(),

          subHeading("3.4 Observações e Irregularidades"),
          bodyText(
            data.comentarios && data.comentarios.trim()
              ? data.comentarios
              : "Não foram identificadas irregularidades relevantes no âmbito da presente análise."
          ),

          spacer(),

          // 4. Conclusão
          heading("4. Conclusão"),
          bodyText(
            `Face ao exposto e considerando os elementos analisados, conclui-se que a prestação de contas da ${data.entityName}, relativa ao exercício económico de ${data.exercicio}, apresenta:`
          ),

          spacer(),

          ...conclusaoOptions.map((opt, idx) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: idx === data.tipoParecerIndex ? "☑ " : "☐ ",
                  size: 22,
                  font: "Times New Roman",
                }),
                new TextRun({
                  text: opt,
                  size: 22,
                  font: "Times New Roman",
                  bold: idx === data.tipoParecerIndex,
                }),
              ],
              spacing: { after: 80 },
              indent: { left: 360 },
            })
          ),

          spacer(),
          spacer(),

          // Parecer
          heading("Parecer"),
          bodyText(
            `Assim, emite-se parecer ${data.parecerFinal} à aprovação da prestação de contas da ${data.entityName}, referente ao exercício económico de ${data.exercicio}, submetida ao Tribunal de Contas.`
          ),

          spacer(),
          spacer(),

          // Signature block
          new Paragraph({
            children: [
              new TextRun({ text: "Local: ", size: 22, font: "Times New Roman" }),
              new TextRun({ text: "Luanda", size: 22, font: "Times New Roman" }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Data: ", size: 22, font: "Times New Roman" }),
              new TextRun({ text: dateStr, size: 22, font: "Times New Roman" }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "O Técnico / Relator",
                size: 22,
                font: "Times New Roman",
                bold: true,
              }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "________________________",
                size: 22,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 80 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: data.tecnicoNome,
                size: 22,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 40 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Técnico Validador — Tribunal de Contas de Angola",
                size: 20,
                font: "Times New Roman",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    `Parecer_${data.entityName.replace(/\s+/g, "_")}_${data.exercicio}.docx`
  );
}

// ─── Helpers ───

function createInfoLine(label: string, value: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, size: 22, font: "Times New Roman" }),
        new TextRun({ text: value, size: 22, font: "Times New Roman" }),
      ],
      spacing: { after: 40 },
    }),
  ];
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
        font: "Times New Roman",
        color: "1F4E79",
      }),
    ],
    spacing: { before: 240, after: 120 },
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        font: "Times New Roman",
        color: "2E75B6",
      }),
    ],
    spacing: { before: 200, after: 100 },
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        font: "Times New Roman",
      }),
    ],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "• ", size: 22, font: "Times New Roman" }),
      new TextRun({ text, size: 22, font: "Times New Roman" }),
    ],
    spacing: { after: 40 },
    indent: { left: 360 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

function createFinancialTable(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      size: 22,
                      font: "Times New Roman",
                    }),
                  ],
                  spacing: { before: 40, after: 40 },
                }),
              ],
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: value,
                      bold: true,
                      size: 22,
                      font: "Times New Roman",
                    }),
                  ],
                  spacing: { before: 40, after: 40 },
                }),
              ],
            }),
          ],
        })
    ),
  });
}
