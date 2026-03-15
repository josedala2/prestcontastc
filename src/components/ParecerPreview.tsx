import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Download, CheckCircle } from "lucide-react";
import brasaoImg from "@/assets/brasao-angola.jpg";

interface ParecerPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
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
  };
  onConfirm: () => void;
}

const formatKz = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA" }).replace("AOA", "Kz");

export function ParecerPreview({ open, onOpenChange, data, onConfirm }: ParecerPreviewProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });

  const conclusaoOptions = [
    "Regularidade e conformidade com as normas aplicáveis.",
    "Algumas irregularidades que não comprometem globalmente a fiabilidade das contas.",
    "Irregularidades relevantes que comprometem a regularidade da prestação de contas.",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Pré-visualização do Parecer
          </DialogTitle>
          <DialogDescription>Revise o conteúdo antes de emitir o parecer oficial.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
          <div className="px-6 pb-6">
            {/* Watermark container */}
            <div className="relative bg-white text-black rounded-lg border border-border shadow-sm p-8 font-serif" style={{ fontFamily: "'Times New Roman', serif" }}>
              {/* RASCUNHO watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-red-500/15 text-[80px] font-bold rotate-[-30deg] select-none uppercase tracking-[0.2em]">
                  Rascunho
                </span>
              </div>

              <div className="relative z-20 space-y-4">
                {/* Header */}
                <div className="text-center space-y-2">
                  <img src={brasaoImg} alt="Brasão de Angola" className="mx-auto h-20 w-20 object-contain" />
                  <p className="font-bold text-sm tracking-wide">REPÚBLICA DE ANGOLA</p>
                  <hr className="w-48 mx-auto border-black/30" />
                  <p className="font-bold text-sm">TRIBUNAL DE CONTAS</p>
                  <p className="font-bold text-xs">DIRECÇÃO DOS SERVIÇOS TÉCNICOS</p>
                  <p className="font-bold text-xs mt-3">
                    RELATÓRIO SUMÁRIO N.º XX/1.ª DIV/FP/{today.getFullYear()}
                  </p>
                </div>

                <div className="text-center border-b border-black/30 pb-2 mt-4">
                  <p className="text-xs">MODELO DE PARECER SOBRE PRESTAÇÃO DE CONTAS DE EMPRESA PÚBLICA</p>
                </div>

                {/* Entity info */}
                <div className="text-xs space-y-0.5 mt-4">
                  <p><strong>Entidade:</strong> {data.entityName}</p>
                  <p><strong>Exercício Económico:</strong> {data.exercicio}</p>
                  <p><strong>Entidade Fiscalizadora:</strong> Tribunal de Contas</p>
                </div>

                {/* 1. Introdução */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#1F4E79] mb-1">1. Introdução</h3>
                  <p className="text-xs text-justify leading-relaxed">
                    Em cumprimento das disposições legais aplicáveis à fiscalização das empresas públicas, foi submetida ao Tribunal de Contas a prestação de contas da {data.entityName}, relativa ao exercício económico findo em 31 de Dezembro de {data.exercicio}. O presente parecer tem por objetivo proceder à análise da conformidade, regularidade e transparência da gestão financeira e patrimonial da entidade, com base nos documentos apresentados e na legislação vigente.
                  </p>
                </div>

                {/* 2. Documentos */}
                <div>
                  <h3 className="text-sm font-bold text-[#1F4E79] mb-1">2. Documentos Analisados</h3>
                  <ul className="text-xs space-y-0.5 ml-4">
                    <li>• Relatório de Gestão do exercício;</li>
                    <li>• Demonstrações Financeiras (Balanço, Demonstração de Resultados, Fluxos de Caixa);</li>
                    <li>• Notas explicativas às demonstrações financeiras;</li>
                    <li>• Parecer do Conselho Fiscal ou órgão equivalente;</li>
                    <li>• Relatório do Auditor Externo (quando aplicável);</li>
                    <li>• Plano de Atividades e Orçamento;</li>
                    <li>• Outros documentos relevantes.</li>
                  </ul>
                </div>

                {/* 3. Análise */}
                <div>
                  <h3 className="text-sm font-bold text-[#1F4E79] mb-1">3. Análise da Prestação de Contas</h3>

                  <h4 className="text-xs font-bold text-[#2E75B6] mb-1">3.1 Conformidade Legal</h4>
                  <p className="text-xs text-justify leading-relaxed mb-3">
                    Verificou-se que a prestação de contas foi apresentada dentro do prazo legal, nos termos da legislação aplicável às empresas públicas e à fiscalização do Tribunal de Contas.
                  </p>

                  <h4 className="text-xs font-bold text-[#2E75B6] mb-1">3.2 Situação Económica e Financeira</h4>
                  <table className="w-full text-xs mb-3">
                    <tbody>
                      {[
                        ["Total do Ativo:", formatKz(data.totalActivo)],
                        ["Total do Passivo:", formatKz(data.totalPassivo)],
                        ["Capital Próprio:", formatKz(data.totalCapProprio)],
                        ["Resultado Líquido:", `${data.resultadoExercicio >= 0 ? "Lucro" : "Prejuízo"} — ${formatKz(Math.abs(data.resultadoExercicio))}`],
                      ].map(([l, v], i) => (
                        <tr key={i} className="border-b border-gray-200">
                          <td className="py-1">{l}</td>
                          <td className="py-1 text-right font-bold">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4 className="text-xs font-bold text-[#2E75B6] mb-1">3.3 Gestão e Execução Orçamental</h4>
                  <table className="w-full text-xs mb-3">
                    <tbody>
                      {[
                        ["Total de Proveitos e Ganhos:", formatKz(data.totalProveitos)],
                        ["Total de Custos e Perdas:", formatKz(data.totalCustos)],
                        ["Resultado do Exercício:", formatKz(data.resultadoExercicio)],
                      ].map(([l, v], i) => (
                        <tr key={i} className="border-b border-gray-200">
                          <td className="py-1">{l}</td>
                          <td className="py-1 text-right font-bold">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4 className="text-xs font-bold text-[#2E75B6] mb-1">3.4 Observações e Irregularidades</h4>
                  <p className="text-xs text-justify leading-relaxed">
                    {data.comentarios?.trim() || "Não foram identificadas irregularidades relevantes no âmbito da presente análise."}
                  </p>
                </div>

                {/* 4. Conclusão */}
                <div>
                  <h3 className="text-sm font-bold text-[#1F4E79] mb-1">4. Conclusão</h3>
                  <p className="text-xs text-justify leading-relaxed mb-2">
                    Face ao exposto e considerando os elementos analisados, conclui-se que a prestação de contas da {data.entityName}, relativa ao exercício económico de {data.exercicio}, apresenta:
                  </p>
                  <div className="space-y-1 ml-4">
                    {conclusaoOptions.map((opt, idx) => (
                      <p key={idx} className={`text-xs ${idx === data.tipoParecerIndex ? "font-bold" : ""}`}>
                        {idx === data.tipoParecerIndex ? "☑" : "☐"} {opt}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Parecer */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-[#1F4E79] mb-1">Parecer</h3>
                  <p className="text-xs text-justify leading-relaxed">
                    Assim, emite-se parecer <strong>{data.parecerFinal}</strong> à aprovação da prestação de contas da {data.entityName}, referente ao exercício económico de {data.exercicio}, submetida ao Tribunal de Contas.
                  </p>
                </div>

                {/* Signature */}
                <div className="mt-6 text-xs space-y-0.5">
                  <p>Local: Luanda</p>
                  <p>Data: {dateStr}</p>
                </div>
                <div className="text-center mt-6 text-xs space-y-1">
                  <p className="font-bold">O Técnico / Relator</p>
                  <p className="mt-6">________________________</p>
                  <p>{data.tecnicoNome}</p>
                  <p className="italic text-[10px]">Técnico Validador — Tribunal de Contas de Angola</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={() => { onConfirm(); onOpenChange(false); }} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Emitir Parecer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
