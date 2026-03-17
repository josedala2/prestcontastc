import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";
import { BookOpen, FileText, CheckCircle2, Loader2, Lock, Files } from "lucide-react";
import { generateCapaProcesso, type ProcessoDocData } from "@/lib/workflowDocGenerator";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";

interface Processo {
  id: string;
  numero_processo: string;
  entity_name: string;
  entity_id: string;
  ano_gerencia: number;
  categoria_entidade: string;
  data_submissao: string;
  estado: string;
  etapa_atual: number;
  completude_documental: number;
  responsavel_atual: string | null;
  juiz_relator?: string | null;
  juiz_adjunto?: string | null;
  divisao_competente?: string | null;
  seccao_competente?: string | null;
  resolucao_aplicavel?: string | null;
  periodo_gerencia?: string | null;
  portador_nome?: string | null;
  portador_documento?: string | null;
  canal_entrada?: string;
}

export default function EscrivaoRegistoAutuacao() {
  const { user } = useAuth();
  const executadoPor = user?.displayName || "Escrivão dos Autos";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [autuarDialogOpen, setAutuarDialogOpen] = useState(false);
  const [autuado, setAutuado] = useState(false);
  const [autuacaoResult, setAutuacaoResult] = useState<{ numero: string; totalDocs: number; totalPaginas: number } | null>(null);

  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("processos")
      .select("*")
      .eq("etapa_atual", 5)
      .order("created_at", { ascending: false });
    setProcessos((data as any[]) || []);
    setLoading(false);
  };

  /** Download a PDF from storage and return as ArrayBuffer */
  const downloadDocFromStorage = async (filePath: string): Promise<ArrayBuffer | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("processo-documentos")
        .download(filePath);
      if (error || !data) return null;
      return await data.arrayBuffer();
    } catch {
      return null;
    }
  };

  /** Also try submission-documents bucket */
  const downloadFromSubmissions = async (filePath: string): Promise<ArrayBuffer | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("submission-documents")
        .download(filePath);
      if (error || !data) return null;
      return await data.arrayBuffer();
    } catch {
      return null;
    }
  };

  // ——— Autuar: generates cover, merges all docs, sends to Chefe de Divisão ———
  const handleAutuar = async () => {
    if (!selectedProcesso) return;
    setActing(true);
    try {
      // 1. Gerar Número Único
      const { data: novoNumero, error: numError } = await supabase.rpc("gerar_numero_processo", {
        p_ano: selectedProcesso.ano_gerencia,
      });
      if (numError) throw numError;
      const numero = novoNumero as string;

      // 2. Fetch existing documents attached to process
      const { data: existingDocs } = await supabase
        .from("processo_documentos")
        .select("*")
        .eq("processo_id", selectedProcesso.id)
        .order("created_at", { ascending: true });

      const docsList = (existingDocs as any[]) || [];

      // 3. Download all existing PDFs from storage
      const pdfBuffers: ArrayBuffer[] = [];
      for (const d of docsList) {
        if (d.caminho_ficheiro) {
          const buf = await downloadDocFromStorage(d.caminho_ficheiro)
            || await downloadFromSubmissions(d.caminho_ficheiro);
          if (buf) pdfBuffers.push(buf);
        }
      }

      // 4. Generate Cover Page (2 pages) with all metadata
      const docData: ProcessoDocData = {
        numeroProcesso: numero,
        entityName: selectedProcesso.entity_name,
        anoGerencia: selectedProcesso.ano_gerencia,
        categoriaEntidade: selectedProcesso.categoria_entidade,
        canalEntrada: selectedProcesso.canal_entrada || "portal",
        dataSubmissao: selectedProcesso.data_submissao,
        responsavelAtual: executadoPor,
        submetidoPor: "sistema",
        etapaAtual: 5,
        estado: "em_autuacao",
        juizRelator: selectedProcesso.juiz_relator || undefined,
        juizAdjunto: selectedProcesso.juiz_adjunto || undefined,
        divisaoCompetente: selectedProcesso.divisao_competente || undefined,
        seccaoCompetente: selectedProcesso.seccao_competente || undefined,
        resolucaoAplicavel: selectedProcesso.resolucao_aplicavel || undefined,
        periodoGerencia: selectedProcesso.periodo_gerencia || undefined,
        portadorNome: selectedProcesso.portador_nome || undefined,
        portadorDocumento: selectedProcesso.portador_documento || undefined,
        checklistCompleta: selectedProcesso.completude_documental >= 100,
        totalDocumentos: docsList.length + 1, // +1 for the cover itself
        dataAutuacao: new Date().toLocaleDateString("pt-AO"),
        escrivaoAutos: executadoPor,
      };

      const capaBlob = await generateCapaProcesso(docData, executadoPor);
      const capaBuffer = await capaBlob.arrayBuffer();

      // 5. Merge: Cover first, then all existing documents
      const mergedPdf = await PDFDocument.create();

      // Add cover
      try {
        const capaPdf = await PDFDocument.load(capaBuffer);
        const capaPages = await mergedPdf.copyPages(capaPdf, capaPdf.getPageIndices());
        capaPages.forEach((p) => mergedPdf.addPage(p));
      } catch (err) {
        console.error("Erro ao adicionar capa:", err);
      }

      // Add all other documents
      for (const buf of pdfBuffers) {
        try {
          const existingPdf = await PDFDocument.load(buf, { ignoreEncryption: true });
          const pages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
          pages.forEach((p) => mergedPdf.addPage(p));
        } catch (err) {
          console.error("Erro ao juntar documento:", err);
        }
      }

      const totalPaginas = mergedPdf.getPageCount();
      const totalDocumentos = docsList.length + 1;

      // Update cover page with final page count — regenerate with totalPaginas
      // (We regenerate the cover now that we know the total pages)
      docData.totalPaginas = totalPaginas;
      docData.totalDocumentos = totalDocumentos;
      const capaFinalBlob = await generateCapaProcesso(docData, executadoPor);
      const capaFinalBuffer = await capaFinalBlob.arrayBuffer();

      // Rebuild merged PDF with updated cover
      const finalPdf = await PDFDocument.create();
      try {
        const capaFinalPdf = await PDFDocument.load(capaFinalBuffer);
        const cp = await finalPdf.copyPages(capaFinalPdf, capaFinalPdf.getPageIndices());
        cp.forEach((p) => finalPdf.addPage(p));
      } catch (err) {
        console.error("Erro ao adicionar capa final:", err);
      }
      for (const buf of pdfBuffers) {
        try {
          const ep = await PDFDocument.load(buf, { ignoreEncryption: true });
          const pages = await finalPdf.copyPages(ep, ep.getPageIndices());
          pages.forEach((p) => finalPdf.addPage(p));
        } catch (err) {
          console.error("Erro ao juntar documento:", err);
        }
      }

      const mergedBytes = await finalPdf.save();
      const mergedBlob = new Blob([mergedBytes], { type: "application/pdf" });

      // 6. Upload merged PDF and cover
      const sanitized = numero.replace(/[^a-zA-Z0-9-]/g, "_");
      const mergedFileName = `Processo_Completo_${sanitized}.pdf`;
      const mergedFilePath = `${selectedProcesso.id}/${mergedFileName}`;
      const capaFileName = `Capa_Processo_${sanitized}.pdf`;
      const capaFilePath = `${selectedProcesso.id}/${capaFileName}`;

      await Promise.all([
        supabase.storage.from("processo-documentos").upload(mergedFilePath, mergedBlob, {
          contentType: "application/pdf",
          upsert: true,
        }),
        supabase.storage.from("processo-documentos").upload(capaFilePath, capaFinalBlob, {
          contentType: "application/pdf",
          upsert: true,
        }),
      ]);

      // 7. Register documents in DB
      await supabase.from("processo_documentos").insert([
        {
          processo_id: selectedProcesso.id,
          tipo_documento: "Capa do Processo",
          nome_ficheiro: capaFileName,
          caminho_ficheiro: capaFilePath,
          estado: "validado",
          obrigatorio: true,
          validado_por: executadoPor,
          validado_em: new Date().toISOString(),
        },
        {
          processo_id: selectedProcesso.id,
          tipo_documento: "Processo Completo (Compilado)",
          nome_ficheiro: mergedFileName,
          caminho_ficheiro: mergedFilePath,
          estado: "validado",
          obrigatorio: true,
          validado_por: executadoPor,
          validado_em: new Date().toISOString(),
          observacoes: `${totalDocumentos} documento(s), ${totalPaginas} página(s)`,
        },
      ] as any);

      // 8. Update processo
      await supabase.from("processos").update({
        numero_processo: numero,
        estado: "em_autuacao",
      } as any).eq("id", selectedProcesso.id);

      // 9. Registar histórico
      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 5,
        etapa_seguinte: 5,
        estado_anterior: selectedProcesso.estado,
        estado_seguinte: "em_autuacao",
        acao: `Processo autuado: número ${numero}, capa gerada, ${totalDocumentos} doc(s) compilados em ${totalPaginas} página(s)`,
        executado_por: executadoPor,
        perfil_executor: "Escrivão dos Autos",
        observacoes: `Autuação completa — processo compilado num único documento`,
        documentos_gerados: ["Capa do Processo", "Processo Completo (Compilado)"],
      } as any);

      // 10. Avançar para Etapa 6
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 6,
        novoEstado: "em_analise",
        executadoPor,
        perfilExecutor: "Escrivão dos Autos",
        observacoes: `Processo autuado e remetido ao Chefe de Divisão — ${totalPaginas} páginas`,
        documentosGerados: ["Capa do Processo", "Processo Completo (Compilado)"],
      });

      await supabase.from("processos").update({
        responsavel_atual: "Chefe de Divisão",
      } as any).eq("id", selectedProcesso.id);

      // 11. Gerar atividades
      try {
        await gerarAtividadesParaEvento("autuacao_concluida", selectedProcesso.id, {
          categoriaEntidade: selectedProcesso.categoria_entidade,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      // 12. Download merged PDF
      saveAs(mergedBlob, mergedFileName);

      setSelectedProcesso({ ...selectedProcesso, numero_processo: numero, estado: "em_analise", etapa_atual: 6 });
      setAutuacaoResult({ numero, totalDocs: totalDocumentos, totalPaginas });
      setAutuado(true);
      setAutuarDialogOpen(false);
      toast.success(`Processo ${numero} autuado — ${totalDocumentos} documento(s), ${totalPaginas} página(s)`);
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro na autuação: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const isLocked = autuado || (selectedProcesso && selectedProcesso.etapa_atual > 5);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Registo e Autuação</h1>
          <p className="text-sm text-muted-foreground">Autuação dos processos verificados pela Contadoria (Etapa 5)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Process list */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Processos Pendentes ({processos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[550px]">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
                ) : processos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem processos na etapa 5</p>
                ) : (
                  <div className="divide-y divide-border">
                    {processos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProcesso(p); setAutuado(false); setAutuacaoResult(null); }}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                          selectedProcesso?.id === p.id ? "bg-primary/5 border-l-2 border-primary" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{p.numero_processo}</span>
                          <Badge variant="secondary" className="text-[10px]">Etapa 5</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.entity_name}</p>
                        <p className="text-[10px] text-muted-foreground">Exercício: {p.ano_gerencia}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detail panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedProcesso ? (
              <Card className="flex items-center justify-center h-[550px]">
                <p className="text-muted-foreground text-sm">Seleccione um processo para iniciar a autuação</p>
              </Card>
            ) : (
              <>
                {/* Process info */}
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Processo</p>
                        <p className="font-semibold text-foreground">{selectedProcesso.numero_processo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entidade</p>
                        <p className="font-medium text-foreground truncate">{selectedProcesso.entity_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exercício</p>
                        <p className="font-medium text-foreground">{selectedProcesso.ano_gerencia}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Estado</p>
                        <Badge variant="outline" className="text-[10px]">{selectedProcesso.estado}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Autuar action or locked state */}
                <Card>
                  <CardContent className="py-8">
                    {isLocked ? (
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Processo Autuado</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Este processo foi autuado e enviado ao Chefe de Divisão.
                          </p>
                          {autuacaoResult && (
                            <div className="mt-3 inline-flex items-center gap-4 px-4 py-2 rounded-lg bg-muted/50">
                              <div className="text-center">
                                <p className="text-lg font-bold text-foreground">{autuacaoResult.numero}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">N.º Processo</p>
                              </div>
                              <div className="h-8 w-px bg-border" />
                              <div className="text-center">
                                <p className="text-lg font-bold text-foreground">{autuacaoResult.totalDocs}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Documentos</p>
                              </div>
                              <div className="h-8 w-px bg-border" />
                              <div className="text-center">
                                <p className="text-lg font-bold text-foreground">{autuacaoResult.totalPaginas}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">Páginas</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
                          <Lock className="h-3.5 w-3.5" />
                          Processo bloqueado — apenas o Chefe de Divisão pode dar seguimento
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-5 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Autuação do Processo</h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-md">
                            Ao autuar, o sistema irá automaticamente:
                          </p>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1 text-left inline-block">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              Atribuir um número único ao processo
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              Gerar a capa oficial do processo (2 páginas)
                            </li>
                            <li className="flex items-center gap-2">
                              <Files className="h-3.5 w-3.5 text-primary shrink-0" />
                              Compilar todos os documentos num único PDF
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              Contar o total de páginas do processo
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              Enviar para o Chefe de Divisão (Etapa 6)
                            </li>
                          </ul>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => setAutuarDialogOpen(true)}
                          disabled={acting}
                          className="mt-2 px-8"
                        >
                          {acting ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A autuar...</>
                          ) : (
                            <><FileText className="h-4 w-4 mr-2" /> Autuar</>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={autuarDialogOpen} onOpenChange={setAutuarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Autuação</AlertDialogTitle>
            <AlertDialogDescription>
              O processo <strong>{selectedProcesso?.numero_processo}</strong> da entidade{" "}
              <strong>{selectedProcesso?.entity_name}</strong> será autuado.
              <br /><br />
              Será gerada a capa oficial, todos os documentos serão compilados num único PDF
              com contagem total de páginas, e o processo será encaminhado ao Chefe de Divisão.
              <br /><br />
              Após a autuação, o processo ficará <strong>bloqueado</strong> para o Escrivão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutuar} disabled={acting}>
              {acting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A processar...</>
              ) : (
                "Confirmar e Autuar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
