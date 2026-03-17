import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { avancarEtapaProcesso } from "@/hooks/useBackendFunctions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TecnicoLayout } from "@/components/TecnicoLayout";
import { toast } from "sonner";
import { BookOpen, Hash, FileText, Send, CheckCircle2, Loader2, ArrowRight, ClipboardCheck, Eye, Download } from "lucide-react";
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

interface Step {
  id: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
  action: () => Promise<void>;
}

export default function EscrivaoRegistoAutuacao() {
  const { user } = useAuth();
  const executadoPor = user?.displayName || "Escrivão dos Autos";

  const [processos, setProcessos] = useState<Processo[]>([]);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [remeterDialogOpen, setRemeterDialogOpen] = useState(false);

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

  const resetSteps = () => {
    setCompletedSteps({});
    setCurrentStep(null);
  };

  // ——— Step 1: Registar e Autuar Processo ———
  const handleRegistarAutuar = async () => {
    if (!selectedProcesso) return;
    setCurrentStep("registar");
    setActing(true);
    try {
      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 5,
        etapa_seguinte: 5,
        estado_anterior: selectedProcesso.estado,
        estado_seguinte: "em_autuacao",
        acao: "Registo e autuação do processo iniciado",
        executado_por: executadoPor,
        perfil_executor: "Escrivão dos Autos",
        observacoes: "Processo registado e em fase de autuação",
      } as any);

      await supabase.from("processos").update({
        estado: "em_autuacao",
      } as any).eq("id", selectedProcesso.id);

      setSelectedProcesso({ ...selectedProcesso, estado: "em_autuacao" });
      setCompletedSteps((prev) => ({ ...prev, registar: true }));
      toast.success("Processo registado e em autuação");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setCurrentStep(null);
    }
  };

  // ——— Step 2: Gerar Número Único ———
  const handleGerarNumero = async () => {
    if (!selectedProcesso) return;
    setCurrentStep("numero");
    setActing(true);
    try {
      const { data: novoNumero, error } = await supabase.rpc("gerar_numero_processo", {
        p_ano: selectedProcesso.ano_gerencia,
      });
      if (error) throw error;

      const numero = novoNumero as string;

      await supabase.from("processos").update({
        numero_processo: numero,
      } as any).eq("id", selectedProcesso.id);

      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 5,
        etapa_seguinte: 5,
        estado_anterior: "em_autuacao",
        estado_seguinte: "em_autuacao",
        acao: `Número único do processo gerado: ${numero}`,
        executado_por: executadoPor,
        perfil_executor: "Escrivão dos Autos",
      } as any);

      setSelectedProcesso({ ...selectedProcesso, numero_processo: numero });
      setCompletedSteps((prev) => ({ ...prev, numero: true }));
      toast.success(`Número do processo gerado: ${numero}`);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setCurrentStep(null);
    }
  };

  // ——— Step 2: Validar Documentação ———
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const fetchDocumentos = async (processoId: string) => {
    setDocsLoading(true);
    const { data } = await supabase
      .from("processo_documentos")
      .select("*")
      .eq("processo_id", processoId)
      .order("created_at", { ascending: true });
    setDocumentos((data as any[]) || []);
    setDocsLoading(false);
  };

  const handleValidarDocumentos = async () => {
    if (!selectedProcesso) return;
    setCurrentStep("validar");
    setActing(true);
    try {
      await fetchDocumentos(selectedProcesso.id);

      await supabase.from("processo_historico").insert({
        processo_id: selectedProcesso.id,
        etapa_anterior: 5,
        etapa_seguinte: 5,
        estado_anterior: selectedProcesso.estado,
        estado_seguinte: "em_autuacao",
        acao: "Documentação do processo verificada e validada pelo Escrivão",
        executado_por: executadoPor,
        perfil_executor: "Escrivão dos Autos",
        observacoes: `${documentos.length || 0} documento(s) anexo(s) verificados`,
      } as any);

      setCompletedSteps((prev) => ({ ...prev, validar: true }));
      toast.success("Documentação validada com sucesso");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
      setCurrentStep(null);
    }
  };

  // ——— Step 6: Remeter para o Chefe da Divisão ———
  const handleRemeter = async () => {
    if (!selectedProcesso) return;
    setActing(true);
    try {
      await avancarEtapaProcesso({
        processoId: selectedProcesso.id,
        novaEtapa: 6,
        novoEstado: "em_analise",
        executadoPor,
        perfilExecutor: "Escrivão dos Autos",
        observacoes: "Processo autuado e remetido ao Chefe de Divisão competente",
        documentosGerados: ["Capa do Processo", "Termo de Abertura", "Termo de Autuação"],
      });

      await supabase.from("processos").update({
        responsavel_atual: "Chefe de Divisão",
      } as any).eq("id", selectedProcesso.id);

      try {
        await gerarAtividadesParaEvento("autuacao_concluida", selectedProcesso.id, {
          categoriaEntidade: selectedProcesso.categoria_entidade,
        });
      } catch (err) {
        console.error("Erro ao gerar atividades:", err);
      }

      toast.success(`Processo ${selectedProcesso.numero_processo} remetido ao Chefe de Divisão`);
      setRemeterDialogOpen(false);
      setSelectedProcesso(null);
      resetSteps();
      fetchProcessos();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const steps: Step[] = [
    { id: "registar", label: "Registar e Autuar Processo", description: "Iniciar o registo formal e autuação", icon: BookOpen, action: handleRegistarAutuar },
    { id: "numero", label: "Gerar Número Único", description: "Atribuir número definitivo ao processo", icon: Hash, action: handleGerarNumero },
    { id: "pesquisa", label: "Confirmar Pesquisa de Conta", description: "Verificar existência de contas anteriores", icon: Search, action: handlePesquisaConta },
    { id: "capa", label: "Gerar Capa do Processo", description: "Criar documento de capa oficial", icon: FileText, action: handleGerarCapa },
    { id: "termos", label: "Preparar Termos Processuais", description: "Gerar Termo de Abertura e Autuação", icon: ScrollText, action: handleTermos },
  ];

  const allStepsDone = steps.every((s) => completedSteps[s.id]);

  return (
    <TecnicoLayout>
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
                        onClick={() => { setSelectedProcesso(p); resetSteps(); }}
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

                {/* Steps */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-primary" />
                      Atividades de Autuação
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {Object.values(completedSteps).filter(Boolean).length}/{steps.length} concluídas
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {steps.map((step, idx) => {
                      const done = completedSteps[step.id];
                      const isActive = currentStep === step.id;
                      const prevDone = idx === 0 || completedSteps[steps[idx - 1].id];
                      const canExecute = !done && prevDone && !acting;
                      const Icon = step.icon;

                      return (
                        <div key={step.id}>
                          <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            done ? "bg-primary/5" : isActive ? "bg-muted" : ""
                          }`}>
                            <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
                              done
                                ? "bg-primary text-primary-foreground"
                                : isActive
                                ? "bg-muted-foreground/20 text-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {done ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : isActive ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${done ? "text-primary" : "text-foreground"}`}>
                                {idx + 1}. {step.label}
                              </p>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={done ? "ghost" : "default"}
                              disabled={!canExecute}
                              onClick={step.action}
                              className="shrink-0"
                            >
                              {done ? (
                                <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Concluído</>
                              ) : isActive ? (
                                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> A executar...</>
                              ) : (
                                <><ArrowRight className="h-3.5 w-3.5 mr-1" /> Executar</>
                              )}
                            </Button>
                          </div>
                          {idx < steps.length - 1 && <Separator className="my-1" />}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Final action: Remeter */}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setRemeterDialogOpen(true)}
                    disabled={!allStepsDone || acting}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Remeter para o Chefe de Divisão
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Remeter dialog */}
      <AlertDialog open={remeterDialogOpen} onOpenChange={setRemeterDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remeter Processo</AlertDialogTitle>
            <AlertDialogDescription>
              O processo <strong>{selectedProcesso?.numero_processo}</strong> será encaminhado ao Chefe de Divisão competente para distribuição.
              Todas as {steps.length} atividades foram concluídas com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemeter} disabled={acting}>
              {acting ? "A processar..." : "Confirmar Remessa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TecnicoLayout>
  );
}
