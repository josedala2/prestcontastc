import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  Save,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Calendar,
  Building2,
  AlertTriangle,
  Scale,
  LayoutGrid,
  GitBranch,
  UserPlus,
  DatabaseZap,
  Loader2,
} from "lucide-react";
import { MenuPerfilMatrix } from "@/components/configuracoes/MenuPerfilMatrix";
import { WorkflowDesigner } from "@/components/configuracoes/WorkflowDesigner";
import { GestaoUtilizadores } from "@/components/configuracoes/GestaoUtilizadores";
import { cn } from "@/lib/utils";

interface ValidationRule {
  id: string;
  code: string;
  name: string;
  level: "completude" | "consistencia" | "regras_tribunal";
  severity: "error" | "warning";
  enabled: boolean;
  description: string;
  formula?: string;
  threshold?: number;
  tipologias: string[];
}

const defaultRules: ValidationRule[] = [
  { id: "r1", code: "CMP-001", name: "Relatório de Gestão obrigatório", level: "completude", severity: "error", enabled: true, description: "Verifica se o Relatório de Gestão foi carregado", tipologias: ["todos"] },
  { id: "r2", code: "CMP-002", name: "Balanço Patrimonial obrigatório", level: "completude", severity: "error", enabled: true, description: "Verifica se o Balanço foi carregado", tipologias: ["todos"] },
  { id: "r3", code: "CMP-003", name: "Demonstração de Resultados obrigatória", level: "completude", severity: "error", enabled: true, description: "Verifica se a DRE foi carregada", tipologias: ["todos"] },
  { id: "r4", code: "CMP-004", name: "Parecer do Conselho Fiscal", level: "completude", severity: "error", enabled: true, description: "Verifica se o Parecer do CF está presente", tipologias: ["empresa_publica", "instituto_publico"] },
  { id: "r5", code: "CMP-005", name: "Modelos 1 a 10 completos", level: "completude", severity: "error", enabled: true, description: "Todos os modelos da Resolução 1/17 devem estar preenchidos", tipologias: ["todos"] },
  { id: "r6", code: "CON-001", name: "Balancete equilibrado (Débito = Crédito)", level: "consistencia", severity: "error", enabled: true, description: "Total de débitos deve igualar total de créditos", formula: "SUM(debito) = SUM(credito)", tipologias: ["todos"] },
  { id: "r7", code: "CON-002", name: "Equação fundamental do Balanço", level: "consistencia", severity: "error", enabled: true, description: "Activo = Passivo + Capital Próprio", formula: "Activo = Passivo + CP", tipologias: ["todos"] },
  { id: "r8", code: "CON-003", name: "Saldo final = Saldo inicial + Entradas - Saídas", level: "consistencia", severity: "error", enabled: true, description: "Consistência de saldos entre exercícios", formula: "SF = SI + E - S", tipologias: ["todos"] },
  { id: "r9", code: "CON-004", name: "Totais dos mapas consistentes", level: "consistencia", severity: "warning", enabled: true, description: "Total do mapa de receitas = soma das linhas", tipologias: ["todos"] },
  { id: "r10", code: "TCA-001", name: "Variação custos com pessoal > 25%", level: "regras_tribunal", severity: "warning", enabled: true, description: "Alerta se custos com pessoal variarem mais de 25% vs ano anterior", threshold: 25, tipologias: ["todos"] },
  { id: "r11", code: "TCA-002", name: "Variação despesas totais > 30%", level: "regras_tribunal", severity: "warning", enabled: true, description: "Alerta se despesas totais variarem mais de 30%", threshold: 30, tipologias: ["todos"] },
  { id: "r12", code: "TCA-003", name: "Endividamento > 80%", level: "regras_tribunal", severity: "error", enabled: true, description: "Risco elevado se rácio de endividamento superior a 80%", threshold: 80, tipologias: ["empresa_publica"] },
  { id: "r13", code: "TCA-004", name: "Liquidez geral < 1.0", level: "regras_tribunal", severity: "warning", enabled: true, description: "Alerta se liquidez geral inferior a 1.0", threshold: 1.0, tipologias: ["empresa_publica", "fundo_autonomo"] },
];

const Configuracoes = () => {
  const [rules, setRules] = useState<ValidationRule[]>(defaultRules);
  const [deadlineDay, setDeadlineDay] = useState("30");
  const [deadlineMonth, setDeadlineMonth] = useState("4");
  const [mfaRequired, setMfaRequired] = useState(true);
  const [autoValidation, setAutoValidation] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState("30");
  const [retentionYears, setRetentionYears] = useState("10");
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState<Partial<ValidationRule>>({});
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupVistosOpen, setCleanupVistosOpen] = useState(false);
  const [cleaningVistos, setCleaningVistos] = useState(false);

  const handleLimparExercicios = async () => {
    setCleaningUp(true);
    try {
      // Delete in order: notifications, submissions, trial_balance, financial_indicators, fiscal_years
      const { error: e1 } = await supabase.from("submission_notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: e2 } = await supabase.from("submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: e3 } = await supabase.from("trial_balance").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: e4 } = await supabase.from("financial_indicators").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: e5 } = await supabase.from("submission_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: e6 } = await supabase.from("actas_recepcao").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: e7 } = await supabase.from("fiscal_years").delete().neq("id", "placeholder");

      const errors = [e1, e2, e3, e4, e5, e6, e7].filter(Boolean);
      if (errors.length > 0) {
        console.error("Erros ao limpar:", errors);
        toast.error(`Limpeza parcial — ${errors.length} erro(s). Verifique a consola.`);
      } else {
        toast.success("Todos os exercícios, submissões e dados associados foram eliminados.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao limpar exercícios.");
    } finally {
      setCleaningUp(false);
      setCleanupDialogOpen(false);
    }
  };

  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({
      code: "",
      name: "",
      level: "regras_tribunal",
      severity: "warning",
      enabled: true,
      description: "",
      threshold: undefined,
      tipologias: ["todos"],
    });
    setRuleDialogOpen(true);
  };

  const openEditRule = (rule: ValidationRule) => {
    setEditingRule(rule);
    setRuleForm({ ...rule });
    setRuleDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!ruleForm.code || !ruleForm.name) {
      toast.error("Preencha o código e o nome da regra.");
      return;
    }
    if (editingRule) {
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...editingRule, ...ruleForm } as ValidationRule : r)));
      toast.success("Regra actualizada.");
    } else {
      const newRule: ValidationRule = {
        id: `r_${Date.now()}`,
        code: ruleForm.code!,
        name: ruleForm.name!,
        level: ruleForm.level as ValidationRule["level"],
        severity: ruleForm.severity as ValidationRule["severity"],
        enabled: ruleForm.enabled ?? true,
        description: ruleForm.description || "",
        threshold: ruleForm.threshold,
        formula: ruleForm.formula,
        tipologias: ruleForm.tipologias || ["todos"],
      };
      setRules((prev) => [...prev, newRule]);
      toast.success("Regra adicionada.");
    }
    setRuleDialogOpen(false);
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Regra removida.");
  };

  const levelLabels = {
    completude: "Completude",
    consistencia: "Consistência",
    regras_tribunal: "Regras TCA",
  };

  return (
    <AppLayout>
      <PageHeader title="Configurações" description="Parametrização do sistema de prestação de contas">
        <Button className="gap-2" onClick={() => toast.success("Configurações guardadas.")}>
          <Save className="h-4 w-4" /> Guardar Tudo
        </Button>
      </PageHeader>

      <Tabs defaultValue="regras" className="animate-fade-in">
        <TabsList className="mb-4">
          <TabsTrigger value="regras">Regras de Validação</TabsTrigger>
          <TabsTrigger value="prazos">Prazos & Notificações</TabsTrigger>
          <TabsTrigger value="workflow">
            <GitBranch className="h-3.5 w-3.5 mr-1" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="menus">Menus & Perfis</TabsTrigger>
          <TabsTrigger value="utilizadores">
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Utilizadores
          </TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        {/* Validation Rules */}
        <TabsContent value="regras">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" /> Motor de Validação — Regras Parametrizáveis
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure regras sem necessidade de alteração de código. Activo: {rules.filter((r) => r.enabled).length}/{rules.length}
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={openNewRule}>
              <Plus className="h-4 w-4" /> Nova Regra
            </Button>
          </div>

          <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs w-10">On</TableHead>
                  <TableHead className="text-xs w-24">Código</TableHead>
                  <TableHead className="text-xs">Regra</TableHead>
                  <TableHead className="text-xs w-28">Nível</TableHead>
                  <TableHead className="text-xs w-20">Sev.</TableHead>
                  <TableHead className="text-xs w-24">Limiar</TableHead>
                  <TableHead className="text-xs w-20">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className={cn(!rule.enabled && "opacity-50")}>
                    <TableCell>
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{rule.code}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{rule.name}</p>
                      <p className="text-[10px] text-muted-foreground">{rule.description}</p>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        rule.level === "completude" && "bg-primary/10 text-primary",
                        rule.level === "consistencia" && "bg-info/10 text-info",
                        rule.level === "regras_tribunal" && "bg-warning/10 text-warning",
                      )}>
                        {levelLabels[rule.level]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-semibold",
                        rule.severity === "error" ? "text-destructive" : "text-warning"
                      )}>
                        {rule.severity === "error" ? "Erro" : "Aviso"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {rule.threshold !== undefined ? `${rule.threshold}%` : rule.formula || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRule(rule)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Deadlines & Notifications */}
        <TabsContent value="prazos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" /> Prazo Legal de Submissão
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Conforme a Resolução nº 1/17, a prestação de contas deve ser entregue até ao dia configurado do ano seguinte.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dia</Label>
                  <Input type="number" min={1} max={31} value={deadlineDay} onChange={(e) => setDeadlineDay(e.target.value)} />
                </div>
                <div>
                  <Label>Mês</Label>
                  <Select value={deadlineMonth} onValueChange={setDeadlineMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Prazo actual: <span className="font-semibold text-foreground">{deadlineDay} de {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][parseInt(deadlineMonth) - 1]}</span> do ano seguinte
              </p>
            </div>

            <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-warning" /> Notificações
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Alertar antes do prazo</p>
                    <p className="text-xs text-muted-foreground">Notificar entidades antes do prazo expirar</p>
                  </div>
                  <Switch checked={notifyDeadline} onCheckedChange={setNotifyDeadline} />
                </div>
                {notifyDeadline && (
                  <div>
                    <Label>Dias antes do prazo</Label>
                    <Input type="number" value={notifyDaysBefore} onChange={(e) => setNotifyDaysBefore(e.target.value)} className="max-w-[120px]" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Validação automática</p>
                    <p className="text-xs text-muted-foreground">Executar validações ao importar ou alterar dados</p>
                  </div>
                  <Switch checked={autoValidation} onCheckedChange={setAutoValidation} />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Workflow Designer */}
        <TabsContent value="workflow">
          <WorkflowDesigner />
        </TabsContent>

        {/* Menu ↔ Perfil Matrix */}
        <TabsContent value="menus">
          <MenuPerfilMatrix />
        </TabsContent>

        {/* Gestão de Utilizadores */}
        <TabsContent value="utilizadores">
          <GestaoUtilizadores />
        </TabsContent>

        {/* System */}
        <TabsContent value="sistema">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-primary" /> Segurança
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">MFA obrigatório</p>
                    <p className="text-xs text-muted-foreground">Exigir autenticação multi-factor para aprovadores e TCA</p>
                  </div>
                  <Switch checked={mfaRequired} onCheckedChange={setMfaRequired} />
                </div>
                <div>
                  <Label>Retenção de dados (anos)</Label>
                  <Input type="number" value={retentionYears} onChange={(e) => setRetentionYears(e.target.value)} className="max-w-[120px]" />
                  <p className="text-xs text-muted-foreground mt-1">Exercícios anteriores a este período são arquivados</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-primary" /> Tipologias de Entidade
              </h3>
              <div className="space-y-2">
                {["Órgão Autónomo", "Instituto Público", "Fundo Autónomo", "Serviço Autónomo", "Empresa Pública"].map((t) => (
                  <div key={t} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm text-foreground">{t}</span>
                    <Switch checked={true} />
                  </div>
                ))}
              </div>
            </div>


            <div className="bg-card rounded-lg border border-destructive/30 card-shadow p-6 animate-fade-in lg:col-span-2">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
                <DatabaseZap className="h-4 w-4" /> Limpeza de Dados
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Remove todos os exercícios fiscais, submissões, notificações, balancetes, indicadores financeiros e actas de recepção. Esta acção é irreversível.
              </p>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setCleanupDialogOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Limpar Todos os Exercícios
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Validação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input value={ruleForm.code || ""} onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value })} placeholder="TCA-005" />
              </div>
              <div>
                <Label>Nível</Label>
                <Select value={ruleForm.level} onValueChange={(v) => setRuleForm({ ...ruleForm, level: v as ValidationRule["level"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completude">Completude</SelectItem>
                    <SelectItem value="consistencia">Consistência</SelectItem>
                    <SelectItem value="regras_tribunal">Regras TCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nome</Label>
              <Input value={ruleForm.name || ""} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="Nome da regra" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={ruleForm.description || ""} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Severidade</Label>
                <Select value={ruleForm.severity} onValueChange={(v) => setRuleForm({ ...ruleForm, severity: v as "error" | "warning" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Erro (bloqueante)</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Limiar (%)</Label>
                <Input type="number" value={ruleForm.threshold ?? ""} onChange={(e) => setRuleForm({ ...ruleForm, threshold: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="Ex: 25" />
              </div>
            </div>
            <div>
              <Label>Fórmula (opcional)</Label>
              <Input value={ruleForm.formula || ""} onChange={(e) => setRuleForm({ ...ruleForm, formula: e.target.value })} placeholder="Ex: SUM(debito) = SUM(credito)" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveRule}>Guardar Regra</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirmar Limpeza Total
            </DialogTitle>
            <DialogDescription>
              Esta acção vai eliminar <strong>todos</strong> os exercícios fiscais, submissões, notificações, balancetes, indicadores financeiros, documentos de submissão e actas de recepção. Esta operação é <strong>irreversível</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupDialogOpen(false)} disabled={cleaningUp}>Cancelar</Button>
            <Button variant="destructive" onClick={handleLimparExercicios} disabled={cleaningUp} className="gap-1.5">
              {cleaningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {cleaningUp ? "A limpar..." : "Confirmar Eliminação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Configuracoes;
