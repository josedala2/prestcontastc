import { useState, useRef, useCallback } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { Save, FileSpreadsheet, Calculator, TrendingUp, BarChart3, CheckCircle, Upload, FileUp, X, Download, AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { generateCC2Template } from "@/lib/cc2TemplateGenerator";

// ─── Helpers ───
const formatKz = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA" }).replace("AOA", "Kz");

const pct = (v: number, total: number) =>
  total === 0 ? "0.00%" : ((v / total) * 100).toFixed(2) + "%";

// ─── Balanço Patrimonial Data Structure ───
interface BalancoLine {
  code: string;
  label: string;
  level: number; // 0=section, 1=group, 2=subgroup, 3=item
  isHeader?: boolean;
  editable?: boolean;
}

const activoNaoCorrente: BalancoLine[] = [
  { code: "1.1", label: "Activos Não Correntes", level: 0, isHeader: true },
  { code: "1.1.1", label: "Imobilizações corpóreas", level: 1, isHeader: true },
  { code: "1.1.1.1", label: "Terrenos e recursos naturais", level: 2, editable: true },
  { code: "1.1.1.2", label: "Edifícios e outras construções", level: 2, editable: true },
  { code: "1.1.1.3", label: "Equipamento básico", level: 2, editable: true },
  { code: "1.1.1.4", label: "Equipamento de transporte", level: 2, editable: true },
  { code: "1.1.1.5", label: "Equipamento administrativo", level: 2, editable: true },
  { code: "1.1.1.6", label: "Taras e vasilhames", level: 2, editable: true },
  { code: "1.1.1.7", label: "Outras imobilizações corpóreas", level: 2, editable: true },
  { code: "1.1.1.8", label: "Imobilizado em curso", level: 2, editable: true },
  { code: "1.1.1.9", label: "Adiantamentos por conta de imobilizações corpóreas", level: 2, editable: true },
  { code: "1.1.1.10", label: "Amortizações acumuladas - Imob. corpóreas", level: 2, editable: true },
  { code: "1.1.2", label: "Imobilizações incorpóreas", level: 1, isHeader: true },
  { code: "1.1.2.1", label: "Trespasses", level: 2, editable: true },
  { code: "1.1.2.2", label: "Despesas de desenvolvimento", level: 2, editable: true },
  { code: "1.1.2.3", label: "Propriedade industrial e outros direitos", level: 2, editable: true },
  { code: "1.1.2.4", label: "Despesas de constituição", level: 2, editable: true },
  { code: "1.1.2.5", label: "Outras imobilizações incorpóreas", level: 2, editable: true },
  { code: "1.1.2.6", label: "Adiantamentos por conta de imob. incorpóreas", level: 2, editable: true },
  { code: "1.1.2.7", label: "Amortizações acumuladas - Imob. incorpóreas", level: 2, editable: true },
  { code: "1.1.3", label: "Investimentos em subsidiárias e associadas", level: 1, isHeader: true },
  { code: "1.1.3.1", label: "Empresas subsidiárias", level: 2, editable: true },
  { code: "1.1.3.2", label: "Empresas associadas", level: 2, editable: true },
  { code: "1.1.4", label: "Outros activos financeiros", level: 1, isHeader: true },
  { code: "1.1.4.1", label: "Investimentos em outras empresas", level: 2, editable: true },
  { code: "1.1.4.2", label: "Investimentos em imóveis", level: 2, editable: true },
  { code: "1.1.4.3", label: "Fundos", level: 2, editable: true },
  { code: "1.1.4.4", label: "Outros investimentos financeiros", level: 2, editable: true },
  { code: "1.1.4.5", label: "Adiantamentos por conta de inv. financeiros", level: 2, editable: true },
  { code: "1.1.4.6", label: "Amortizações acumuladas - Inv. em imóveis", level: 2, editable: true },
  { code: "1.1.5", label: "Provisões para investimentos financeiros", level: 1, isHeader: true },
  { code: "1.1.5.1", label: "Empresas subsidiárias", level: 2, editable: true },
  { code: "1.1.5.2", label: "Empresas associadas", level: 2, editable: true },
  { code: "1.1.5.3", label: "Outras empresas", level: 2, editable: true },
  { code: "1.1.5.4", label: "Fundos", level: 2, editable: true },
  { code: "1.1.5.5", label: "Outros investimentos financeiros", level: 2, editable: true },
  { code: "1.1.6", label: "Outros activos não correntes", level: 1, editable: true },
];

const activoCorrentes: BalancoLine[] = [
  { code: "1.2", label: "Activos Correntes", level: 0, isHeader: true },
  { code: "1.2.1", label: "Existências", level: 1, isHeader: true },
  { code: "1.2.1.1", label: "Matérias-primas, subsidiárias e de consumo", level: 2, editable: true },
  { code: "1.2.1.2", label: "Produtos e trabalhos em curso", level: 2, editable: true },
  { code: "1.2.1.3", label: "Produtos acabados e intermédios", level: 2, editable: true },
  { code: "1.2.1.4", label: "Subprodutos, desperdícios, resíduos e refugos", level: 2, editable: true },
  { code: "1.2.1.5", label: "Mercadorias", level: 2, editable: true },
  { code: "1.2.1.6", label: "Matérias em trânsito", level: 2, editable: true },
  { code: "1.2.1.7", label: "Adiantamentos por conta de compras", level: 2, editable: true },
  { code: "1.2.1.8", label: "Provisões para depreciação de existências", level: 2, editable: true },
  { code: "1.2.2", label: "Contas a receber", level: 1, isHeader: true },
  { code: "1.2.2.1", label: "Clientes - correntes", level: 2, editable: true },
  { code: "1.2.2.2", label: "Clientes - títulos a receber", level: 2, editable: true },
  { code: "1.2.2.3", label: "Clientes de cobrança duvidosa", level: 2, editable: true },
  { code: "1.2.2.4", label: "Fornecedores - saldos devedores", level: 2, editable: true },
  { code: "1.2.2.5", label: "Estado", level: 2, editable: true },
  { code: "1.2.2.6", label: "Participantes e participadas", level: 2, editable: true },
  { code: "1.2.2.7", label: "Pessoal", level: 2, editable: true },
  { code: "1.2.2.8", label: "Devedores - vendas de imobilizado", level: 2, editable: true },
  { code: "1.2.2.9", label: "Outros devedores", level: 2, editable: true },
  { code: "1.2.2.10", label: "Provisões para cobrança duvidosa", level: 2, editable: true },
  { code: "1.2.3", label: "Disponibilidades", level: 1, isHeader: true },
  { code: "1.2.3.1", label: "Títulos negociáveis", level: 2, editable: true },
  { code: "1.2.3.2", label: "Depósitos a prazo", level: 2, editable: true },
  { code: "1.2.3.3", label: "Depósitos à ordem", level: 2, editable: true },
  { code: "1.2.3.4", label: "Caixa", level: 2, editable: true },
  { code: "1.2.3.5", label: "Conta transitória", level: 2, editable: true },
  { code: "1.2.3.6", label: "Provisões", level: 2, editable: true },
  { code: "1.2.4", label: "Outros activos correntes", level: 1, isHeader: true },
  { code: "1.2.4.1", label: "Proveitos a faturar - Contratos plurianuais", level: 2, editable: true },
  { code: "1.2.4.2", label: "Encargos a repartir por exercícios futuros", level: 2, editable: true },
  { code: "1.2.4.3", label: "Outros valores a receber", level: 2, editable: true },
];

const capitalProprio: BalancoLine[] = [
  { code: "2.1", label: "Capital Próprio", level: 0, isHeader: true },
  { code: "2.1.1", label: "Capital", level: 1, isHeader: true },
  { code: "2.1.1.1", label: "Capital", level: 2, editable: true },
  { code: "2.1.1.2", label: "Acções/quotas próprias", level: 2, editable: true },
  { code: "2.1.1.3", label: "Prémios de emissão", level: 2, editable: true },
  { code: "2.1.1.4", label: "Prestações suplementares", level: 2, editable: true },
  { code: "2.1.2", label: "Reservas", level: 1, isHeader: true },
  { code: "2.1.2.1", label: "Reserva legal", level: 2, editable: true },
  { code: "2.1.2.2", label: "Reservas de reavaliação", level: 2, editable: true },
  { code: "2.1.2.3", label: "Reservas com fins especiais", level: 2, editable: true },
  { code: "2.1.2.4", label: "Reservas livres", level: 2, editable: true },
  { code: "2.1.3", label: "Resultados transitados", level: 1, isHeader: true },
  { code: "2.1.3.1", label: "Transferência dos resultados do exercício anterior", level: 2, editable: true },
  { code: "2.1.3.2", label: "Aplicações de resultados", level: 2, editable: true },
  { code: "2.1.3.3", label: "Erros fundamentais", level: 2, editable: true },
  { code: "2.1.3.4", label: "Alterações de políticas contabilísticas", level: 2, editable: true },
  { code: "2.1.3.5", label: "Efeito de impostos", level: 2, editable: true },
  { code: "2.1.3.6", label: "Outros movimentos", level: 2, editable: true },
  { code: "2.1.4", label: "Resultados do exercício", level: 1, editable: true },
];

const passivoNaoCorrente: BalancoLine[] = [
  { code: "2.2", label: "Passivo Não Corrente", level: 0, isHeader: true },
  { code: "2.2.1", label: "Empréstimos de médio e longo prazos", level: 1, isHeader: true },
  { code: "2.2.1.1", label: "Empréstimos bancários", level: 2, editable: true },
  { code: "2.2.1.2", label: "Empréstimos por obrigações", level: 2, editable: true },
  { code: "2.2.1.3", label: "Empréstimos por título de participação", level: 2, editable: true },
  { code: "2.2.1.4", label: "Outros empréstimos", level: 2, editable: true },
  { code: "2.2.2", label: "Impostos diferidos", level: 1, editable: true },
  { code: "2.2.3", label: "Provisões para pensões", level: 1, editable: true },
  { code: "2.2.4", label: "Provisões para outros riscos e encargos", level: 1, isHeader: true },
  { code: "2.2.4.1", label: "Provisões para processos judiciais em curso", level: 2, editable: true },
  { code: "2.2.4.2", label: "Provisões para acidentes de trabalho", level: 2, editable: true },
  { code: "2.2.4.3", label: "Provisões para garantias dadas a clientes", level: 2, editable: true },
  { code: "2.2.4.4", label: "Provisões para outros riscos e encargos", level: 2, editable: true },
  { code: "2.2.5", label: "Outros passivos não correntes", level: 1, editable: true },
];

const passivoCorrente: BalancoLine[] = [
  { code: "2.3", label: "Passivo Corrente", level: 0, isHeader: true },
  { code: "2.3.1", label: "Contas a pagar", level: 1, isHeader: true },
  { code: "2.3.1.1", label: "Fornecedores - correntes", level: 2, editable: true },
  { code: "2.3.1.2", label: "Fornecedores - títulos a pagar", level: 2, editable: true },
  { code: "2.3.1.3", label: "Fornecedores - facturas em recepção e conferência", level: 2, editable: true },
  { code: "2.3.1.4", label: "Clientes - saldos credores", level: 2, editable: true },
  { code: "2.3.1.5", label: "Estado", level: 2, editable: true },
  { code: "2.3.1.6", label: "Participantes e participadas", level: 2, editable: true },
  { code: "2.3.1.7", label: "Pessoal", level: 2, editable: true },
  { code: "2.3.1.8", label: "Credores - compra de imobilizado", level: 2, editable: true },
  { code: "2.3.1.9", label: "Outros credores", level: 2, editable: true },
  { code: "2.3.2", label: "Empréstimos de curto prazo", level: 1, isHeader: true },
  { code: "2.3.2.1", label: "Empréstimos bancários", level: 2, editable: true },
  { code: "2.3.2.2", label: "Empréstimos por obrigações", level: 2, editable: true },
  { code: "2.3.2.3", label: "Empréstimos por título de participação", level: 2, editable: true },
  { code: "2.3.2.4", label: "Outros empréstimos", level: 2, editable: true },
  { code: "2.3.3", label: "Parte correspondente dos empréstimos a M/L prazo", level: 1, editable: true },
  { code: "2.3.4", label: "Outros passivos correntes", level: 1, isHeader: true },
  { code: "2.3.4.1", label: "Encargos a pagar", level: 2, editable: true },
  { code: "2.3.4.2", label: "Proveitos a pagar por exercícios futuros", level: 2, editable: true },
  { code: "2.3.4.3", label: "Contas transitórias", level: 2, editable: true },
  { code: "2.3.4.4", label: "Outros valores a pagar", level: 2, editable: true },
];

// ─── DRE Lines ───
const proveitosLines: BalancoLine[] = [
  { code: "3", label: "Proveitos e Ganhos por Natureza", level: 0, isHeader: true },
  { code: "3.1", label: "Vendas", level: 1, isHeader: true },
  { code: "3.1.1", label: "Produtos acabados e intermédios", level: 2, editable: true },
  { code: "3.1.2", label: "Subprodutos, desperdícios, resíduos e refugos", level: 2, editable: true },
  { code: "3.1.3", label: "Mercadorias", level: 2, editable: true },
  { code: "3.1.4", label: "Embalagens de consumo", level: 2, editable: true },
  { code: "3.1.5", label: "Subsídios a preços", level: 2, editable: true },
  { code: "3.1.6", label: "Devoluções", level: 2, editable: true },
  { code: "3.1.7", label: "Descontos e abatimentos", level: 2, editable: true },
  { code: "3.2", label: "Prestações de serviço", level: 1, isHeader: true },
  { code: "3.2.1", label: "Serviços principais", level: 2, editable: true },
  { code: "3.2.2", label: "Serviços secundários", level: 2, editable: true },
  { code: "3.2.3", label: "Descontos e abatimentos", level: 2, editable: true },
  { code: "3.3", label: "Outros proveitos operacionais", level: 1, isHeader: true },
  { code: "3.3.1", label: "Serviços suplementares", level: 2, editable: true },
  { code: "3.3.2", label: "Royalties", level: 2, editable: true },
  { code: "3.3.3", label: "Subsídios à exploração", level: 2, editable: true },
  { code: "3.3.4", label: "Subsídios a investimentos", level: 2, editable: true },
  { code: "3.3.5", label: "IVA", level: 2, editable: true },
  { code: "3.3.6", label: "Outros proveitos e ganhos operacionais", level: 2, editable: true },
  { code: "3.4", label: "Variação nos produtos acabados e em curso", level: 1, isHeader: true },
  { code: "3.4.1", label: "Produtos e trabalhos em curso", level: 2, editable: true },
  { code: "3.4.2", label: "Produtos acabados e intermédios", level: 2, editable: true },
  { code: "3.4.3", label: "Produtos intermédios", level: 2, editable: true },
  { code: "3.5", label: "Trabalhos para a própria empresa", level: 1, isHeader: true },
  { code: "3.5.1", label: "Para imobilizado", level: 2, editable: true },
  { code: "3.5.2", label: "Para encargos a repartir por exercícios futuros", level: 2, editable: true },
  { code: "3.6", label: "Proveitos e ganhos financeiros gerais", level: 1, isHeader: true },
  { code: "3.6.1", label: "Juros", level: 2, editable: true },
  { code: "3.6.2", label: "Diferenças de câmbio favoráveis", level: 2, editable: true },
  { code: "3.6.3", label: "Descontos de pronto pagamento obtidos", level: 2, editable: true },
  { code: "3.6.4", label: "Rendimentos de investimentos em imóveis", level: 2, editable: true },
  { code: "3.6.5", label: "Rendimentos de participações de capital", level: 2, editable: true },
  { code: "3.6.6", label: "Ganhos na alienação de aplicações financeiras", level: 2, editable: true },
  { code: "3.6.7", label: "Redução de provisões", level: 2, editable: true },
  { code: "3.7", label: "Proveitos e ganhos financeiros em subsidiárias/associadas", level: 1, isHeader: true },
  { code: "3.7.1", label: "Rendimento de participações de capital", level: 2, editable: true },
  { code: "3.8", label: "Outros proveitos e ganhos não operacionais", level: 1, isHeader: true },
  { code: "3.8.1", label: "Redução de provisões", level: 2, editable: true },
  { code: "3.8.2", label: "Anulação de amortizações extraordinárias", level: 2, editable: true },
  { code: "3.8.3", label: "Ganhos em imobilizações", level: 2, editable: true },
  { code: "3.8.4", label: "Ganhos em existências", level: 2, editable: true },
  { code: "3.8.5", label: "Recuperação de dívidas", level: 2, editable: true },
  { code: "3.8.6", label: "Benefícios de penalidades contratuais", level: 2, editable: true },
  { code: "3.8.7", label: "Descontinuidade de operações", level: 2, editable: true },
  { code: "3.8.8", label: "Alterações de políticas contabilísticas", level: 2, editable: true },
  { code: "3.8.9", label: "Correcções relativas a períodos anteriores", level: 2, editable: true },
  { code: "3.8.10", label: "Outros ganhos e perdas não operacionais", level: 2, editable: true },
  { code: "3.9", label: "Proveitos e ganhos extraordinários", level: 1, isHeader: true },
  { code: "3.9.1", label: "Ganhos resultantes de catástrofes naturais", level: 2, editable: true },
  { code: "3.9.2", label: "Ganhos resultantes de convulsões políticas", level: 2, editable: true },
  { code: "3.9.3", label: "Ganhos resultantes de expropriações", level: 2, editable: true },
  { code: "3.9.4", label: "Ganhos resultantes de sinistros", level: 2, editable: true },
  { code: "3.9.5", label: "Subsídios", level: 2, editable: true },
  { code: "3.9.6", label: "Anulação de passivos não exigíveis", level: 2, editable: true },
];

const custosLines: BalancoLine[] = [
  { code: "4", label: "Custos e Perdas por Natureza", level: 0, isHeader: true },
  { code: "4.1", label: "Custo das mercadorias vendidas e matérias consumidas", level: 1, isHeader: true },
  { code: "4.1.1", label: "Matérias-primas", level: 2, editable: true },
  { code: "4.1.2", label: "Matérias subsidiárias", level: 2, editable: true },
  { code: "4.1.3", label: "Materiais diversos", level: 2, editable: true },
  { code: "4.1.4", label: "Embalagens de consumo", level: 2, editable: true },
  { code: "4.1.5", label: "Outros materiais", level: 2, editable: true },
  { code: "4.2", label: "Custos com o pessoal", level: 1, isHeader: true },
  { code: "4.2.1", label: "Remunerações - órgãos sociais", level: 2, editable: true },
  { code: "4.2.2", label: "Remunerações - pessoal", level: 2, editable: true },
  { code: "4.2.3", label: "Pensões", level: 2, editable: true },
  { code: "4.2.4", label: "Prémios para pensões", level: 2, editable: true },
  { code: "4.2.5", label: "Encargos com pessoal", level: 2, editable: true },
  { code: "4.3", label: "Amortizações do exercício", level: 1, isHeader: true },
  { code: "4.3.1", label: "Imobilizações corpóreas", level: 2, editable: true },
  { code: "4.3.2", label: "Imobilizações incorpóreas", level: 2, editable: true },
  { code: "4.4", label: "Outros custos e perdas operacionais", level: 1, isHeader: true },
  { code: "4.4.1", label: "Subcontratos", level: 2, editable: true },
  { code: "4.4.2", label: "Fornecimentos e serviços de terceiros", level: 2, editable: true },
  { code: "4.4.3", label: "Impostos", level: 2, editable: true },
  { code: "4.4.4", label: "Despesas confidenciais", level: 2, editable: true },
  { code: "4.4.5", label: "Quotizações", level: 2, editable: true },
  { code: "4.4.6", label: "Ofertas e amostras de existências", level: 2, editable: true },
  { code: "4.4.7", label: "Outros custos e perdas operacionais", level: 2, editable: true },
  { code: "4.5", label: "Custos e perdas financeiras gerais", level: 1, isHeader: true },
  { code: "4.5.1", label: "Juros", level: 2, editable: true },
  { code: "4.5.2", label: "Diferenças de câmbio desfavoráveis", level: 2, editable: true },
  { code: "4.5.3", label: "Descontos de pronto pagamento concedidos", level: 2, editable: true },
  { code: "4.5.4", label: "Amortizações de investimentos em imóveis", level: 2, editable: true },
  { code: "4.5.5", label: "Provisões para aplicações financeiras", level: 2, editable: true },
  { code: "4.5.6", label: "Perdas na alienação de aplicações financeiras", level: 2, editable: true },
  { code: "4.5.7", label: "Serviços bancários", level: 2, editable: true },
  { code: "4.6", label: "Custos e perdas financeiras em filiais/associadas", level: 1, isHeader: true },
  { code: "4.6.1", label: "Custos e perdas financeiras em filiais", level: 2, editable: true },
  { code: "4.6.2", label: "Custos e perdas financeiras em associadas", level: 2, editable: true },
  { code: "4.7", label: "Outros custos e perdas não operacionais", level: 1, isHeader: true },
  { code: "4.7.1", label: "Provisões do exercício", level: 2, editable: true },
  { code: "4.7.2", label: "Amortizações extraordinárias", level: 2, editable: true },
  { code: "4.7.3", label: "Perdas em imobilizações", level: 2, editable: true },
  { code: "4.7.4", label: "Perdas em existências", level: 2, editable: true },
  { code: "4.7.5", label: "Dívidas incobráveis", level: 2, editable: true },
  { code: "4.7.6", label: "Multas e penalidades contratuais", level: 2, editable: true },
  { code: "4.7.7", label: "Custos de reestruturação", level: 2, editable: true },
  { code: "4.7.8", label: "Descontinuidade de operações", level: 2, editable: true },
  { code: "4.7.9", label: "Alteração de políticas contabilísticas", level: 2, editable: true },
  { code: "4.7.10", label: "Correcções relativas a períodos anteriores", level: 2, editable: true },
  { code: "4.7.11", label: "Outros custos e perdas não operacionais", level: 2, editable: true },
  { code: "4.8", label: "Custos e perdas extraordinários", level: 1, isHeader: true },
  { code: "4.8.1", label: "Perdas resultantes de catástrofes naturais", level: 2, editable: true },
  { code: "4.8.2", label: "Perdas resultantes de convulsões políticas", level: 2, editable: true },
  { code: "4.8.3", label: "Perdas resultantes de expropriações", level: 2, editable: true },
  { code: "4.8.4", label: "Perdas resultantes de sinistros", level: 2, editable: true },
];

// ─── Reusable Table Component ───
function FinancialTable({
  lines,
  values,
  priorValues,
  onChange,
  sectionTitle,
}: {
  lines: BalancoLine[];
  values: Record<string, number>;
  priorValues: Record<string, number>;
  onChange: (code: string, val: number) => void;
  sectionTitle?: string;
}) {
  // Sum editable children for a header
  const getSubtotal = (parentCode: string) => {
    return lines
      .filter((l) => l.code.startsWith(parentCode + ".") && l.editable)
      .reduce((sum, l) => sum + (values[l.code] || 0), 0);
  };

  const getSubtotalPrior = (parentCode: string) => {
    return lines
      .filter((l) => l.code.startsWith(parentCode + ".") && l.editable)
      .reduce((sum, l) => sum + (priorValues[l.code] || 0), 0);
  };

  const totalCurrent = lines
    .filter((l) => l.editable)
    .reduce((sum, l) => sum + (values[l.code] || 0), 0);

  const totalPrior = lines
    .filter((l) => l.editable)
    .reduce((sum, l) => sum + (priorValues[l.code] || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-2 py-1.5 font-semibold border border-border w-20">Código</th>
            <th className="text-left px-2 py-1.5 font-semibold border border-border">Descrição</th>
            <th className="text-right px-2 py-1.5 font-semibold border border-border w-40">Ano Corrente</th>
            <th className="text-right px-2 py-1.5 font-semibold border border-border w-20">%</th>
            <th className="text-right px-2 py-1.5 font-semibold border border-border w-40">Ano Anterior</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const isHeader = line.isHeader;
            const subtotal = isHeader ? getSubtotal(line.code) : 0;
            const subtotalPrior = isHeader ? getSubtotalPrior(line.code) : 0;
            const currentVal = line.editable ? (values[line.code] || 0) : subtotal;
            const priorVal = line.editable ? (priorValues[line.code] || 0) : subtotalPrior;

            return (
              <tr
                key={line.code}
                className={`${isHeader ? "bg-muted/30 font-medium" : "hover:bg-muted/10"} ${line.level === 0 ? "bg-primary/10 font-semibold" : ""}`}
              >
                <td className="px-2 py-1 border border-border font-mono text-muted-foreground">
                  {line.code}
                </td>
                <td
                  className="px-2 py-1 border border-border"
                  style={{ paddingLeft: `${(line.level) * 12 + 8}px` }}
                >
                  {line.label}
                </td>
                <td className="px-1 py-0.5 border border-border text-right">
                  {line.editable ? (
                    <Input
                      type="number"
                      value={values[line.code] || ""}
                      onChange={(e) => onChange(line.code, parseFloat(e.target.value) || 0)}
                      className="h-6 text-xs text-right border-0 bg-background/50 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                  ) : (
                    <span className="text-xs font-medium px-1">{formatKz(currentVal)}</span>
                  )}
                </td>
                <td className="px-2 py-1 border border-border text-right text-muted-foreground">
                  {totalCurrent > 0 && currentVal !== 0 ? pct(currentVal, totalCurrent) : ""}
                </td>
                <td className="px-1 py-0.5 border border-border text-right">
                  {line.editable ? (
                    <Input
                      type="number"
                      value={priorValues[line.code] || ""}
                      onChange={() => {}}
                      className="h-6 text-xs text-right border-0 bg-muted/30 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                      disabled
                    />
                  ) : (
                    <span className="text-xs px-1">{formatKz(priorVal)}</span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr className="bg-primary/10 font-semibold">
            <td className="px-2 py-1.5 border border-border" colSpan={2}>
              Total {sectionTitle}
            </td>
            <td className="px-2 py-1.5 border border-border text-right">{formatKz(totalCurrent)}</td>
            <td className="px-2 py-1.5 border border-border text-right">100%</td>
            <td className="px-2 py-1.5 border border-border text-right">{formatKz(totalPrior)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───
const PortalPrestacaoContas = () => {
  const { entity, userRole } = usePortalEntity();
  const [periodo, setPeriodo] = useState("2024");
  const [activeTab, setActiveTab] = useState("balancete");

  // Values state for all sections
  const [ativNaoCorr, setAtivNaoCorr] = useState<Record<string, number>>({});
  const [ativCorr, setAtivCorr] = useState<Record<string, number>>({});
  const [capProprio, setCapProprio] = useState<Record<string, number>>({});
  const [passNaoCorr, setPassNaoCorr] = useState<Record<string, number>>({});
  const [passCorr, setPassCorr] = useState<Record<string, number>>({});
  const [proveitos, setProveitos] = useState<Record<string, number>>({});
  const [custos, setCustos] = useState<Record<string, number>>({});
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prior year (empty/disabled for now)
  const emptyPrior: Record<string, number> = {};

  // ─── Excel parsing ───
  const parseKzValue = (val: unknown): number => {
    if (typeof val === "number") return val;
    if (typeof val !== "string") return 0;
    const cleaned = val.replace(/[Kz\s,R\$]/g, "").replace(/\(/g, "-").replace(/\)/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const mapExcelToForm = useCallback((workbook: XLSX.WorkBook) => {
    // Map from all form line definitions
    const allSections = [
      { lines: activoNaoCorrente, setter: setAtivNaoCorr },
      { lines: activoCorrentes, setter: setAtivCorr },
      { lines: capitalProprio, setter: setCapProprio },
      { lines: passivoNaoCorrente, setter: setPassNaoCorr },
      { lines: passivoCorrente, setter: setPassCorr },
      { lines: proveitosLines, setter: setProveitos },
      { lines: custosLines, setter: setCustos },
    ];

    // Build a label-to-code map for fuzzy matching
    const labelMap = new Map<string, { code: string; section: number }>();
    allSections.forEach((sec, idx) => {
      sec.lines.filter((l) => l.editable).forEach((l) => {
        labelMap.set(l.label.toLowerCase().trim(), { code: l.code, section: idx });
      });
    });

    // Parse all sheets looking for financial data
    const sectionValues: Record<string, number>[] = allSections.map(() => ({}));
    let matchCount = 0;

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });

      data.forEach((row: unknown) => {
        if (!Array.isArray(row) || row.length < 3) return;

        // Try to find a label cell and a value cell
        for (let i = 0; i < row.length - 1; i++) {
          const cellText = String(row[i] || "").toLowerCase().trim();
          if (cellText.length < 3) continue;

          // Try exact match
          const match = labelMap.get(cellText);
          if (match) {
            // Find the next numeric value in the row
            for (let j = i + 1; j < row.length; j++) {
              const val = parseKzValue(row[j]);
              if (val !== 0 || String(row[j]).includes("0")) {
                sectionValues[match.section][match.code] = val;
                matchCount++;
                break;
              }
            }
          }
        }
      });
    });

    // Also try matching by code patterns (e.g. "1.1.1.1" in first column)
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });

      data.forEach((row: unknown) => {
        if (!Array.isArray(row) || row.length < 3) return;
        const codeCell = String(row[0] || "").trim();
        // Also check second column for code
        const codeCell2 = String(row[1] || "").trim();

        [codeCell, codeCell2].forEach((code) => {
          allSections.forEach((sec, idx) => {
            const line = sec.lines.find((l) => l.editable && l.code === code);
            if (line && !sectionValues[idx][line.code]) {
              // Find value in remaining columns
              for (let j = 2; j < (row as unknown[]).length; j++) {
                const val = parseKzValue((row as unknown[])[j]);
                if (val !== 0) {
                  sectionValues[idx][line.code] = val;
                  matchCount++;
                  break;
                }
              }
            }
          });
        });
      });
    });

    // Apply values
    allSections.forEach((sec, idx) => {
      if (Object.keys(sectionValues[idx]).length > 0) {
        sec.setter((prev) => ({ ...prev, ...sectionValues[idx] }));
      }
    });

    return matchCount;
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const matchCount = mapExcelToForm(workbook);
        setUploadedFile(file.name);

        if (matchCount > 0) {
          toast.success(`Ficheiro carregado com sucesso! ${matchCount} campo(s) preenchido(s) automaticamente.`);
        } else {
          toast.warning("Ficheiro carregado, mas não foi possível mapear valores automaticamente. Verifique o formato.");
        }
      } catch {
        toast.error("Erro ao processar o ficheiro. Verifique se é um ficheiro Excel válido.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [mapExcelToForm]);

  const handleClearData = () => {
    setAtivNaoCorr({});
    setAtivCorr({});
    setCapProprio({});
    setPassNaoCorr({});
    setPassCorr({});
    setProveitos({});
    setCustos({});
    setUploadedFile(null);
    toast.info("Todos os campos foram limpos.");
  };

  // Computed totals
  const sumEditable = (lines: BalancoLine[], vals: Record<string, number>) =>
    lines.filter((l) => l.editable).reduce((s, l) => s + (vals[l.code] || 0), 0);

  const totalAtivoNaoCorrente = sumEditable(activoNaoCorrente, ativNaoCorr);
  const totalAtivoCorrentes = sumEditable(activoCorrentes, ativCorr);
  const totalActivo = totalAtivoNaoCorrente + totalAtivoCorrentes;
  const totalCapProprio = sumEditable(capitalProprio, capProprio);
  const totalPassNaoCorrente = sumEditable(passivoNaoCorrente, passNaoCorr);
  const totalPassCorrente = sumEditable(passivoCorrente, passCorr);
  const totalPassivo = totalPassNaoCorrente + totalPassCorrente;
  const totalCapPassivo = totalCapProprio + totalPassivo;
  const totalProveitos = sumEditable(proveitosLines, proveitos);
  const totalCustos = sumEditable(custosLines, custos);
  const resultadoExercicio = totalProveitos - totalCustos;

  // Indicadores
  const liquidezCorrente = totalPassCorrente > 0 ? totalAtivoCorrentes / totalPassCorrente : 0;
  const liquidezGeral = (totalPassCorrente + totalPassNaoCorrente) > 0 ? (totalAtivoCorrentes + totalAtivoNaoCorrente) / (totalPassCorrente + totalPassNaoCorrente) : 0;
  const roe = totalCapProprio > 0 ? (resultadoExercicio / totalCapProprio) * 100 : 0;
  const roa = totalActivo > 0 ? (resultadoExercicio / totalActivo) * 100 : 0;
  const margemLiquida = totalProveitos > 0 ? (resultadoExercicio / totalProveitos) * 100 : 0;
  const giroActivo = totalActivo > 0 ? totalProveitos / totalActivo : 0;
  const endividamentoGeral = totalCapProprio > 0 ? totalPassivo / totalCapProprio : 0;
  const composicaoEndividamento = totalPassivo > 0 ? (totalPassCorrente / totalPassivo) * 100 : 0;

  const handleSave = () => {
    toast.success("Prestação de contas guardada com sucesso!");
  };

  return (
    <PortalLayout>
      <PageHeader
        title="Prestação de Contas — Modelo CC-2"
        description="Resolução Nº 1/17 — PGC (Decreto nº 82/2001)"
      />

      {/* Header Info */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Entidade</Label>
              <p className="text-sm font-medium">{entity.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">NIF</Label>
              <p className="text-sm font-medium">{entity.nif}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Ex: 2024"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="mb-6 border-dashed border-2 border-primary/30">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Carregar Ficheiro Excel
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Carregue o ficheiro Excel do Modelo CC-2 para preenchimento automático, ou preencha manualmente abaixo.
                Pode <button type="button" onClick={generateCC2Template} className="text-primary underline hover:text-primary/80 font-medium">descarregar o template</button> para preencher offline.
              </p>
              {uploadedFile && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <FileUp className="h-3 w-3" />
                    {uploadedFile}
                  </Badge>
                  <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={generateCC2Template}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descarregar Template
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Carregar Ficheiro
              </Button>
              {(Object.keys(ativNaoCorr).length > 0 || Object.keys(proveitos).length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearData}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="balanco" className="text-xs gap-1">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Balanço</span>
            <span className="sm:hidden">BP</span>
          </TabsTrigger>
          <TabsTrigger value="dre" className="text-xs gap-1">
            <Calculator className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dem. Resultados</span>
            <span className="sm:hidden">DRE</span>
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="text-xs gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Indicadores</span>
            <span className="sm:hidden">Ind.</span>
          </TabsTrigger>
          <TabsTrigger value="resumo" className="text-xs gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Resumo</span>
            <span className="sm:hidden">Res.</span>
          </TabsTrigger>
          <TabsTrigger value="submissao" className="text-xs gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submissão</span>
            <span className="sm:hidden">Sub.</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── BALANÇO PATRIMONIAL ─── */}
        <TabsContent value="balanco" className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-primary">Balanço Patrimonial</h3>
            <p className="text-xs text-muted-foreground">Registar os valores conforme o PGC (Decreto nº 82/2001).</p>
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">1.1 — Activos Não Correntes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={activoNaoCorrente}
                values={ativNaoCorr}
                priorValues={emptyPrior}
                onChange={(code, val) => setAtivNaoCorr((p) => ({ ...p, [code]: val }))}
                sectionTitle="Activos Não Correntes"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">1.2 — Activos Correntes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={activoCorrentes}
                values={ativCorr}
                priorValues={emptyPrior}
                onChange={(code, val) => setAtivCorr((p) => ({ ...p, [code]: val }))}
                sectionTitle="Activos Correntes"
              />
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total do Activo</span>
                <span className="text-lg">{formatKz(totalActivo)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">2.1 — Capital Próprio</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={capitalProprio}
                values={capProprio}
                priorValues={emptyPrior}
                onChange={(code, val) => setCapProprio((p) => ({ ...p, [code]: val }))}
                sectionTitle="Capital Próprio"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">2.2 — Passivo Não Corrente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={passivoNaoCorrente}
                values={passNaoCorr}
                priorValues={emptyPrior}
                onChange={(code, val) => setPassNaoCorr((p) => ({ ...p, [code]: val }))}
                sectionTitle="Passivo Não Corrente"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">2.3 — Passivo Corrente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={passivoCorrente}
                values={passCorr}
                priorValues={emptyPrior}
                onChange={(code, val) => setPassCorr((p) => ({ ...p, [code]: val }))}
                sectionTitle="Passivo Corrente"
              />
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Total Capital Próprio</span>
                <span className="font-semibold">{formatKz(totalCapProprio)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Total Passivo</span>
                <span className="font-semibold">{formatKz(totalPassivo)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm font-semibold">
                <span>Capital Próprio + Passivo</span>
                <span className="text-lg">{formatKz(totalCapPassivo)}</span>
              </div>
              {Math.abs(totalActivo - totalCapPassivo) > 0.01 && totalActivo > 0 && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <Badge variant="destructive" className="text-[10px]">Divergência</Badge>
                  Activo ({formatKz(totalActivo)}) ≠ Capital Próprio + Passivo ({formatKz(totalCapPassivo)})
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── DEMONSTRAÇÃO DE RESULTADOS ─── */}
        <TabsContent value="dre" className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-primary">Demonstração do Resultado do Exercício</h3>
            <p className="text-xs text-muted-foreground">Registar proveitos (receitas) e custos (despesas).</p>
          </div>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">3 — Proveitos e Ganhos por Natureza</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={proveitosLines}
                values={proveitos}
                priorValues={emptyPrior}
                onChange={(code, val) => setProveitos((p) => ({ ...p, [code]: val }))}
                sectionTitle="Proveitos e Ganhos"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">4 — Custos e Perdas por Natureza</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FinancialTable
                lines={custosLines}
                values={custos}
                priorValues={emptyPrior}
                onChange={(code, val) => setCustos((p) => ({ ...p, [code]: val }))}
                sectionTitle="Custos e Perdas"
              />
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Total Proveitos</span>
                <span className="font-semibold text-green-600">{formatKz(totalProveitos)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Total Custos</span>
                <span className="font-semibold text-red-600">{formatKz(totalCustos)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center text-sm font-semibold">
                <span>Resultado Líquido do Exercício</span>
                <span className={`text-lg ${resultadoExercicio >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatKz(resultadoExercicio)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── INDICADORES FINANCEIROS ─── */}
        <TabsContent value="indicadores" className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-primary">Indicadores Financeiros</h3>
            <p className="text-xs text-muted-foreground">Cálculo automático com base nos dados do Balanço e DRE.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Liquidez</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <IndicadorRow label="Liquidez Corrente" value={liquidezCorrente.toFixed(2)} desc="Activo Corrente / Passivo Corrente" />
                <IndicadorRow label="Liquidez Geral" value={liquidezGeral.toFixed(2)} desc="Activo Total / Passivo Total" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Rentabilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <IndicadorRow label="ROE" value={roe.toFixed(2) + "%"} desc="Resultado Líquido / Capital Próprio" />
                <IndicadorRow label="ROA" value={roa.toFixed(2) + "%"} desc="Resultado Líquido / Activo Total" />
                <IndicadorRow label="Margem Líquida" value={margemLiquida.toFixed(2) + "%"} desc="Resultado Líquido / Receita" />
                <IndicadorRow label="Giro do Activo" value={giroActivo.toFixed(2)} desc="Receita / Activo Total" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Endividamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <IndicadorRow label="Endividamento Geral" value={endividamentoGeral.toFixed(2)} desc="Passivo / Capital Próprio" />
                <IndicadorRow label="Composição do Endividamento" value={composicaoEndividamento.toFixed(2) + "%"} desc="Passivo Corrente / Passivo Total" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Estrutura Patrimonial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <IndicadorRow label="Activo Total" value={formatKz(totalActivo)} />
                <IndicadorRow label="Capital Próprio" value={formatKz(totalCapProprio)} />
                <IndicadorRow label="Passivo Total" value={formatKz(totalPassivo)} />
                <IndicadorRow label="Resultado do Exercício" value={formatKz(resultadoExercicio)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── RESUMO ─── */}
        <TabsContent value="resumo" className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-primary">Resumo das Demonstrações Financeiras</h3>
            <p className="text-xs text-muted-foreground">Visão consolidada do Balanço e DRE.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Balanço Patrimonial</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <tbody>
                    <ResumoRow label="Activos Não Correntes" value={totalAtivoNaoCorrente} />
                    <ResumoRow label="Activos Correntes" value={totalAtivoCorrentes} />
                    <ResumoRow label="Total do Activo" value={totalActivo} bold />
                    <tr><td colSpan={2} className="py-2"><div className="border-t" /></td></tr>
                    <ResumoRow label="Capital Próprio" value={totalCapProprio} />
                    <ResumoRow label="Passivo Não Corrente" value={totalPassNaoCorrente} />
                    <ResumoRow label="Passivo Corrente" value={totalPassCorrente} />
                    <ResumoRow label="Cap. Próprio + Passivo" value={totalCapPassivo} bold />
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Demonstração de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-xs">
                  <tbody>
                    <ResumoRow label="Total Proveitos" value={totalProveitos} color="text-green-600" />
                    <ResumoRow label="Total Custos" value={totalCustos} color="text-red-600" />
                    <tr><td colSpan={2} className="py-2"><div className="border-t" /></td></tr>
                    <ResumoRow
                      label="Resultado Líquido"
                      value={resultadoExercicio}
                      bold
                      color={resultadoExercicio >= 0 ? "text-green-600" : "text-red-600"}
                    />
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── SUBMISSÃO ─── */}
        <TabsContent value="submissao" className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-primary">Submissão da Prestação de Contas</h3>
            <p className="text-xs text-muted-foreground">Revise os dados antes de submeter ao Tribunal de Contas.</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Entidade</span>
                  <span className="font-medium">{entity.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">NIF</span>
                  <span className="font-medium">{entity.nif}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Período</span>
                  <span className="font-medium">{periodo}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Equação Patrimonial</span>
                  <Badge variant={Math.abs(totalActivo - totalCapPassivo) < 0.01 || totalActivo === 0 ? "default" : "destructive"}>
                    {Math.abs(totalActivo - totalCapPassivo) < 0.01 || totalActivo === 0 ? "Equilibrada" : "Divergente"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                <SummaryCard label="Activo Total" value={formatKz(totalActivo)} />
                <SummaryCard label="Capital Próprio" value={formatKz(totalCapProprio)} />
                <SummaryCard label="Passivo Total" value={formatKz(totalPassivo)} />
                <SummaryCard label="Resultado" value={formatKz(resultadoExercicio)} color={resultadoExercicio >= 0 ? "text-green-600" : "text-red-600"} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Rascunho
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={(e) => {
                        if (Math.abs(totalActivo - totalCapPassivo) > 0.01 && totalActivo > 0) {
                          e.preventDefault();
                          toast.error("A equação patrimonial não está equilibrada. Corrija antes de submeter.");
                        }
                      }}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Submeter ao Tribunal
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        Confirmar Submissão
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-4">
                          <p>
                            Está prestes a submeter a prestação de contas ao Tribunal de Contas de Angola.
                            Esta acção é <strong className="text-foreground">irreversível</strong>.
                          </p>
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Entidade</span>
                              <span className="font-medium text-foreground">{entity.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Período</span>
                              <span className="font-medium text-foreground">{periodo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Activo Total</span>
                              <span className="font-medium text-foreground">{formatKz(totalActivo)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Resultado</span>
                              <span className={`font-medium ${resultadoExercicio >= 0 ? "text-green-600" : "text-red-600"}`}>{formatKz(resultadoExercicio)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Ao confirmar, declara que todos os dados apresentados são verdadeiros e completos,
                            nos termos da Resolução nº 1/17 do Tribunal de Contas.
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          toast.success("Prestação de contas submetida com sucesso ao Tribunal de Contas!");
                        }}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Confirmar Submissão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PortalLayout>
  );
};

// ─── Small sub-components ───
function IndicadorRow({ label, value, desc }: { label: string; value: string; desc?: string }) {
  return (
    <div className="flex justify-between items-start border-b border-border/50 pb-2">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ResumoRow({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  return (
    <tr>
      <td className={`py-1 ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td className={`py-1 text-right tabular-nums ${bold ? "font-semibold" : ""} ${color || ""}`}>{formatKz(value)}</td>
    </tr>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold mt-1 ${color || ""}`}>{value}</p>
    </div>
  );
}

export default PortalPrestacaoContas;
