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
import { BookOpen, FileText, CheckCircle2, Loader2, Lock } from "lucide-react";
import { generateCapaProcesso, type ProcessoDocData } from "@/lib/workflowDocGenerator";
import { gerarAtividadesParaEvento } from "@/lib/atividadeEngine";
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

  // ——— Autuar: faz tudo de uma vez ———
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

      await supabase.from("processos").update({
        numero_processo: numero,
        estado: "em_autuacao",
      } as any).eq("id", selectedProcesso.id);

      // 2. Gerar Capa do Processo
      const docData: ProcessoDocData = {
        numeroProcesso: numero,
        entityName: selectedProcesso.entity_name,
        anoGerencia: selectedProcesso.ano_gerencia,
        categoriaEntidade: selectedProcesso.categoria_entidade,
        canalEntrada: "portal",
        dataSubmissao: selectedProcesso.data_submissao,
        responsavelAtual: executadoPor,
        submetidoPor: "sistema",
        etapaAtual: 5,
        estado: "em_autuacao",
      };

      const capaBlob = await generateCapaProcesso(docData, executadoPor);
      const sanitized = numero.replace(/[^a-zA-Z0-9-]/g, "_");
      const fileName = `Capa_Processo_${sanitized}.pdf`;
      const filePath = `${selectedProcesso.id}/${fileName}`;

      await supabase.storage.from("processo-documentos").upload(filePath, capaBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

      await supabase.from("processo_documentos").insert({
        processo_id: selectedProcesso.id,
        tipo_documento: "Capa do Processo",
        nome_ficheiro: fileName,
        caminho_ficheiro: filePath,
        estado: "validado",
        obrigatorio: true,
        validado_por: executadoPor,
        validado_em: new Date().toISOString(),
      } as any);

      saveAs(capaBlob, fileName);

      // 3. Registar histórico de autuação
      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 5,
        etapa_seguinte: 5,
        estado_anterior: selectedProcesso.estado,
        estado_seguinte: "em_autuacao",
        acao: `Processo autuado: número ${numero} atribuído, capa gerada`,
        executado_por: executadoPor,
        perfil_executor: "Escrivão dos Autos",
        observacoes: "Autuação completa — número único, capa do processo e nota de remessa gerados",
      } as any);

      // 4. Avançar para Etapa 6 — Chefe de Divisão
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 6,
        novoEstado: "em_analise",
        executadoPor,
        perfilExecutor: "Escrivão dos Autos",
        observacoes: "Processo autuado e remetido ao Chefe de Divisão competente",
        documentosGerados: ["Capa do Processo", "Nota de Remessa"],
      });

      await supabase.from("processos").update({
        responsavel_atual: "Chefe de Divisão",
      } as any).eq("id", selectedProcesso.id);

      // 5. Gerar atividades
      try {
        await gerarAtividadesParaEvento("autuacao_concluida", selectedProcesso.id, {
          categoriaEntidade: selectedProcesso.categoria_entidade,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      setSelectedProcesso({ ...selectedProcesso, numero_processo: numero, estado: "em_analise", etapa_atual: 6 });
      setAutuado(true);
      setAutuarDialogOpen(false);
      toast.success(`Processo ${numero} autuado e enviado ao Chefe de Divisão`);
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
                        onClick={() => { setSelectedProcesso(p); setAutuado(false); }}
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
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Processo Autuado</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Este processo foi autuado e enviado ao Chefe de Divisão.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Número atribuído: <strong>{selectedProcesso.numero_processo}</strong>
                          </p>
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
                              Gerar a capa oficial do processo (PDF)
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
              <strong>{selectedProcesso?.entity_name}</strong> será autuado, receberá um número único,
              será gerada a capa oficial e encaminhado ao Chefe de Divisão.
              <br /><br />
              Após a autuação, o processo ficará <strong>bloqueado</strong> para o Escrivão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutuar} disabled={acting}>
              {acting ? "A processar..." : "Confirmar e Autuar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
