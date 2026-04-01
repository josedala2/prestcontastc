import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSalarioMinimo } from "@/hooks/useEmolumentos";
import { calcularEmolumento, formatKz, TIPO_PROCESSO_LABELS, TipoProcesso } from "@/lib/emolumentosCalculo";
import { toast } from "sonner";
import { Calculator, Save, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProcessoOption {
  id: string;
  numero_processo: string;
  entity_name: string;
  entity_id: string;
}

export default function NovoEmolumento() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { salarioMinimo } = useSalarioMinimo();
  const [processos, setProcessos] = useState<ProcessoOption[]>([]);
  const [processoId, setProcessoId] = useState("");
  const [tipo, setTipo] = useState<TipoProcesso>("contas");
  const [baseCalculo, setBaseCalculo] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [calculo, setCalculo] = useState<ReturnType<typeof calcularEmolumento> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("processos").select("id, numero_processo, entity_name, entity_id").order("created_at", { ascending: false }).limit(200);
      setProcessos((data as unknown as ProcessoOption[]) || []);
    })();
  }, []);

  const processoSelecionado = processos.find((p) => p.id === processoId);

  const handleCalc = () => {
    const result = calcularEmolumento(tipo, baseCalculo, salarioMinimo);
    setCalculo(result);
  };

  const handleSave = async () => {
    if (!processoId || !calculo) {
      toast.error("Selecione um processo e calcule o emolumento");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("emolumentos").insert({
      processo_id: processoId,
      entity_id: processoSelecionado?.entity_id || "",
      entity_name: processoSelecionado?.entity_name || "",
      numero_processo: processoSelecionado?.numero_processo || "",
      tipo_processo: tipo,
      base_legal: calculo.baseLegal,
      base_calculo: baseCalculo,
      taxa_aplicada: calculo.taxa,
      salario_minimo_ref: salarioMinimo,
      valor_minimo: calculo.valorMinimo,
      valor_antecipado: 0,
      valor_final: calculo.valorFinal,
      valor_pago: 0,
      valor_divida: calculo.valorFinal,
      estado: "calculado",
      responsavel_pagamento: processoSelecionado?.entity_name || "",
      observacoes,
    } as any).select().single();

    if (error) {
      toast.error("Erro ao criar emolumento: " + error.message);
      setSaving(false);
      return;
    }

    // Log history
    await supabase.from("emolumento_historico").insert({
      emolumento_id: (data as any).id,
      acao: "Emolumento criado e calculado",
      estado_anterior: null,
      estado_novo: "calculado",
      executado_por: user?.displayName || "sistema",
      perfil_executor: user?.role || "",
      observacoes: `Tipo: ${TIPO_PROCESSO_LABELS[tipo]}, Base: ${formatKz(baseCalculo)}, Valor: ${formatKz(calculo.valorFinal)}`,
    } as any);

    toast.success("Emolumento criado com sucesso");
    navigate(`/emolumentos/${(data as any).id}`);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif">Novo Emolumento</h1>
            <p className="text-sm text-muted-foreground">Criar emolumento vinculado a um processo existente</p>
          </div>
          <AjudaCalculoDialog />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Emolumento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Processo */}
            <div>
              <Label>Processo *</Label>
              <Select value={processoId} onValueChange={setProcessoId}>
                <SelectTrigger><SelectValue placeholder="Selecionar processo..." /></SelectTrigger>
                <SelectContent>
                  {processos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.numero_processo} — {p.entity_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div>
              <Label>Tipo de Processo *</Label>
              <Select value={tipo} onValueChange={(v) => { setTipo(v as TipoProcesso); setCalculo(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_PROCESSO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base de cálculo */}
            <div>
              <Label>Base de Cálculo (Kz) *</Label>
              <Input type="number" value={baseCalculo || ""} onChange={(e) => { setBaseCalculo(Number(e.target.value)); setCalculo(null); }} placeholder="0,00" />
              <p className="text-[10px] text-muted-foreground mt-1">Salário mínimo de referência: {formatKz(salarioMinimo)}</p>
            </div>

            <Button onClick={handleCalc} variant="outline" className="w-full">
              <Calculator className="h-4 w-4 mr-2" /> Calcular Emolumento
            </Button>

            {/* Resultado do cálculo */}
            {calculo && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <h3 className="font-semibold text-sm">Resultado do Cálculo</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Taxa:</span> {(calculo.taxa * 100).toFixed(1)}%</div>
                  <div><span className="text-muted-foreground">Valor Mínimo:</span> {formatKz(calculo.valorMinimo)}</div>
                  <div><span className="text-muted-foreground">Valor Calculado:</span> {formatKz(calculo.valorCalculado)}</div>
                  <div><span className="text-muted-foreground font-semibold">Valor Final:</span> <strong>{formatKz(calculo.valorFinal)}</strong></div>
                </div>
                <p className="text-xs text-muted-foreground italic">{calculo.baseLegal}</p>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações adicionais..." />
            </div>

            <Button onClick={handleSave} disabled={!calculo || !processoId || saving} className="w-full">
              <Save className="h-4 w-4 mr-2" /> {saving ? "A guardar..." : "Criar Emolumento"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

/* ---------- Ajuda de Cálculo ---------- */
function AjudaCalculoDialog() {
  const regras = [
    { tipo: "Visto — Actos relativos a pessoal", regra: "3% da remuneração ilíquida mensal", minimo: "1/5 do salário mínimo" },
    { tipo: "Visto — Restantes actos e contratos", regra: "1% do valor do contrato", minimo: "1/2 do salário mínimo" },
    { tipo: "Visto — Contratos de prestação periódica", regra: "1% do valor do contrato (ou valor anual se ≥ 1 ano)", minimo: "1/2 do salário mínimo" },
    { tipo: "Processo de Contas", regra: "1% da receita cobrada", minimo: "5 salários mínimos" },
    { tipo: "Contas — Empresa Pública / afins", regra: "1% dos lucros do exercício", minimo: "5 salários mínimos" },
    { tipo: "Multas", regra: "10% da multa aplicada", minimo: "—" },
    { tipo: "Responsabilidade Financeira", regra: "1% a 5% do valor da responsabilidade", minimo: "—" },
    { tipo: "Recurso não admitido", regra: "Valor fixo", minimo: "1/4 do salário mínimo" },
    { tipo: "Recurso admitido", regra: "1/4 dos emolumentos contados no processo até à interposição", minimo: "1/4 do salário mínimo" },
    { tipo: "Certidão", regra: "Tabela aplicável (valor inserido manualmente)", minimo: "—" },
    { tipo: "Reclamação / Pedido de redução", regra: "Valor fixo de 1/5 do salário mínimo; se atendida, não cobrar", minimo: "1/5 do salário mínimo" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <HelpCircle className="h-4 w-4" /> Ajuda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Regras de Cálculo de Emolumentos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            O cálculo de emolumentos segue as regras definidas pelo Tribunal de Contas de Angola. 
            O valor final é sempre o <strong>maior</strong> entre o valor calculado (taxa × base) e o valor mínimo legal.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-2.5 text-left font-medium text-muted-foreground text-xs">Tipo de Processo</th>
                  <th className="p-2.5 text-left font-medium text-muted-foreground text-xs">Regra de Cálculo</th>
                  <th className="p-2.5 text-left font-medium text-muted-foreground text-xs">Mínimo Legal</th>
                </tr>
              </thead>
              <tbody>
                {regras.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-2.5 font-medium text-xs">{r.tipo}</td>
                    <td className="p-2.5 text-xs">{r.regra}</td>
                    <td className="p-2.5 text-xs text-muted-foreground">{r.minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <p className="font-semibold text-xs">Fórmula Geral:</p>
            <p className="text-xs font-mono bg-background rounded px-2 py-1.5">
              Valor Final = MAX( Base de Cálculo × Taxa , Valor Mínimo Legal )
            </p>
            <p className="text-[11px] text-muted-foreground">
              O salário mínimo de referência é actualizado conforme tabela de vigência configurada no sistema.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
