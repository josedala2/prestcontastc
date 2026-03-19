// CC3 Balance Sheet & Income Statement line structures + PGC→CC3 mapping
// Shared between TecnicoPrestacaoContas and AmbienteAnalisePage

export interface BalancoLine {
  code: string;
  label: string;
  level: number;
  isHeader?: boolean;
  editable?: boolean;
}

export const activoNaoCorrente: BalancoLine[] = [
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

export const activoCorrentes: BalancoLine[] = [
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

export const capitalProprioLines: BalancoLine[] = [
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

export const passivoNaoCorrenteLines: BalancoLine[] = [
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

export const passivoCorrenteLines: BalancoLine[] = [
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

export const proveitosLines: BalancoLine[] = [
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

export const custosLines: BalancoLine[] = [
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
  { code: "4.2.6", label: "Seguro contra acidentes de trabalho", level: 2, editable: true },
  { code: "4.2.7", label: "Formações", level: 2, editable: true },
  { code: "4.2.8", label: "Subsídios e outros custos com pessoal", level: 2, editable: true },
  { code: "4.3", label: "Amortizações do exercício", level: 1, isHeader: true },
  { code: "4.3.1", label: "Imobilizações corpóreas", level: 2, editable: true },
  { code: "4.3.2", label: "Imobilizações incorpóreas", level: 2, editable: true },
  { code: "4.3.3", label: "Investimentos em imóveis", level: 2, editable: true },
  { code: "4.4", label: "Provisões do exercício", level: 1, isHeader: true },
  { code: "4.4.1", label: "Para cobranças duvidosas", level: 2, editable: true },
  { code: "4.4.2", label: "Para depreciação de existências", level: 2, editable: true },
  { code: "4.4.3", label: "Para investimentos financeiros", level: 2, editable: true },
  { code: "4.4.4", label: "Para riscos e encargos", level: 2, editable: true },
  { code: "4.5", label: "Fornecimentos e serviços de terceiros", level: 1, isHeader: true },
  { code: "4.5.1", label: "Subcontratos", level: 2, editable: true },
  { code: "4.5.2", label: "Fornecimentos", level: 2, editable: true },
  { code: "4.5.3", label: "Serviços", level: 2, editable: true },
  { code: "4.6", label: "Impostos e taxas", level: 1, isHeader: true },
  { code: "4.6.1", label: "Impostos directos", level: 2, editable: true },
  { code: "4.6.2", label: "Impostos indirectos", level: 2, editable: true },
  { code: "4.6.3", label: "Taxas", level: 2, editable: true },
  { code: "4.7", label: "Outros custos operacionais", level: 1, isHeader: true },
  { code: "4.7.1", label: "Quotizações", level: 2, editable: true },
  { code: "4.7.2", label: "Donativos", level: 2, editable: true },
  { code: "4.7.3", label: "Outros custos operacionais", level: 2, editable: true },
  { code: "4.8", label: "Custos e perdas financeiros gerais", level: 1, isHeader: true },
  { code: "4.8.1", label: "Juros", level: 2, editable: true },
  { code: "4.8.2", label: "Diferenças de câmbio desfavoráveis", level: 2, editable: true },
  { code: "4.8.3", label: "Descontos de pronto pagamento concedidos", level: 2, editable: true },
  { code: "4.8.4", label: "Perdas na alienação de aplicações financeiras", level: 2, editable: true },
  { code: "4.8.5", label: "Outros custos e perdas financeiros", level: 2, editable: true },
  { code: "4.9", label: "Custos e perdas financeiros em subsidiárias/associadas", level: 1, isHeader: true },
  { code: "4.9.1", label: "Cobertura de prejuízos", level: 2, editable: true },
  { code: "4.10", label: "Outros custos e perdas não operacionais", level: 1, isHeader: true },
  { code: "4.10.1", label: "Provisões para outros riscos e encargos", level: 2, editable: true },
  { code: "4.10.2", label: "Amortizações extraordinárias", level: 2, editable: true },
  { code: "4.10.3", label: "Perdas em imobilizações", level: 2, editable: true },
  { code: "4.10.4", label: "Perdas em existências", level: 2, editable: true },
  { code: "4.10.5", label: "Dívidas incobráveis", level: 2, editable: true },
  { code: "4.10.6", label: "Penalidades contratuais", level: 2, editable: true },
  { code: "4.10.7", label: "Descontinuidade de operações", level: 2, editable: true },
  { code: "4.10.8", label: "Alterações de políticas contabilísticas", level: 2, editable: true },
  { code: "4.10.9", label: "Correcções relativas a períodos anteriores", level: 2, editable: true },
  { code: "4.10.10", label: "Outros custos e perdas não operacionais", level: 2, editable: true },
  { code: "4.11", label: "Custos e perdas extraordinários", level: 1, isHeader: true },
  { code: "4.11.1", label: "Perdas resultantes de catástrofes naturais", level: 2, editable: true },
  { code: "4.11.2", label: "Perdas resultantes de convulsões políticas", level: 2, editable: true },
  { code: "4.11.3", label: "Perdas resultantes de expropriações", level: 2, editable: true },
  { code: "4.11.4", label: "Perdas resultantes de sinistros", level: 2, editable: true },
  { code: "4.12", label: "Imposto sobre o rendimento", level: 1, editable: true },
];

// PGC (Plano Geral de Contabilidade) account codes → CC3 form codes
export const pgcToCC3: Record<string, string> = {
  "111": "1.1.1.1", "112": "1.1.1.2", "113": "1.1.1.3", "114": "1.1.1.4",
  "115": "1.1.1.5", "116": "1.1.1.6", "119": "1.1.1.7",
  "141": "1.1.1.8", "147": "1.1.1.9", "181": "1.1.1.10",
  "121": "1.1.2.1", "122": "1.1.2.2", "123": "1.1.2.3", "124": "1.1.2.4",
  "129": "1.1.2.5", "148": "1.1.2.6", "182": "1.1.2.7",
  "131": "1.1.3.1", "132": "1.1.3.2",
  "133": "1.1.4.1", "134": "1.1.4.2", "135": "1.1.4.3", "139": "1.1.4.4",
  "149": "1.1.4.5", "183": "1.1.4.6",
  "191": "1.1.5.1", "192": "1.1.5.2", "193": "1.1.5.3", "194": "1.1.5.4", "199": "1.1.5.5",
  "22": "1.2.1.1", "23": "1.2.1.2", "24": "1.2.1.3", "25": "1.2.1.4",
  "26": "1.2.1.5", "27": "1.2.1.6", "28": "1.2.1.7", "29": "1.2.1.8",
  "311": "1.2.2.1", "312": "1.2.2.2", "318": "1.2.2.3", "329": "1.2.2.4",
  "34": "1.2.2.5", "35": "1.2.2.6", "36": "1.2.2.7", "372": "1.2.2.8",
  "38": "1.2.2.10",
  "41": "1.2.3.1", "42": "1.2.3.2", "43": "1.2.3.3", "45": "1.2.3.4", "48": "1.2.3.5", "49": "1.2.3.6",
  "373": "1.2.4.1", "374": "1.2.4.2", "379": "1.2.4.3",
  "51": "2.1.1.1", "52": "2.1.1.2", "53": "2.1.1.3", "54": "2.1.1.4",
  "55": "2.1.2.1", "56": "2.1.2.2", "57": "2.1.2.3", "58": "2.1.2.4",
  "811": "2.1.3.1", "812": "2.1.3.2", "813": "2.1.3.3", "814": "2.1.3.4", "815": "2.1.3.5",
  "88": "2.1.4",
  "331": "2.2.1.1", "332": "2.2.1.2", "333": "2.2.1.3", "339": "2.2.1.4",
  "391": "2.2.3",
  "392": "2.2.4.1", "393": "2.2.4.2", "394": "2.2.4.3", "399": "2.2.4.4",
  "321": "2.3.1.1", "322": "2.3.1.2", "328": "2.3.1.3", "319": "2.3.1.4",
  "371": "2.3.1.8",
  "375": "2.3.4.1", "376": "2.3.4.2", "377": "2.3.4.3",
  "611": "3.1.1", "612": "3.1.2", "613": "3.1.3", "614": "3.1.4",
  "615": "3.1.5", "617": "3.1.6", "618": "3.1.7",
  "621": "3.2.1", "622": "3.2.2", "628": "3.2.3",
  "631": "3.3.1", "632": "3.3.2", "633": "3.3.3", "634": "3.3.4", "635": "3.3.5", "638": "3.3.6",
  "711": "4.1.1", "712": "4.1.2", "713": "4.1.3",
  "721": "4.2.1", "722": "4.2.2", "723": "4.2.3", "724": "4.2.4", "725": "4.2.5",
  "726": "4.2.6", "727": "4.2.7", "728": "4.2.8", "729": "4.2.9",
  "731": "4.3.1", "732": "4.3.2", "733": "4.3.3", "734": "4.3.4",
  "735": "4.3.5", "736": "4.3.6", "738": "4.3.7",
};

// All CC3 sections for iteration
export const allCC3Sections = [
  { key: "ativNaoCorr", lines: activoNaoCorrente, title: "Activo Não Corrente" },
  { key: "ativCorr", lines: activoCorrentes, title: "Activo Corrente" },
  { key: "capProprio", lines: capitalProprioLines, title: "Capital Próprio" },
  { key: "passNaoCorr", lines: passivoNaoCorrenteLines, title: "Passivo Não Corrente" },
  { key: "passCorr", lines: passivoCorrenteLines, title: "Passivo Corrente" },
  { key: "proveitos", lines: proveitosLines, title: "Proveitos" },
  { key: "custos", lines: custosLines, title: "Custos" },
] as const;

// Helper: sum editable lines from values map
export function sumEditable(lines: BalancoLine[], vals: Record<string, number>): number {
  return lines.filter(l => l.editable).reduce((s, l) => s + (vals[l.code] || 0), 0);
}

// Sections where credit balances (negative in debit-credit convention) should show as positive
const creditNatureSections = new Set(["capProprio", "passNaoCorr", "passCorr", "proveitos"]);

// Map trial_balance rows (PGC account codes) to CC3 section values
export function mapBalanceteToCC3(balanceteRows: { account_code: string; balance: number }[]): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  allCC3Sections.forEach(s => { result[s.key] = {}; });

  // Build cc3Code → section key lookup
  const cc3ToSection = new Map<string, string>();
  allCC3Sections.forEach(sec => {
    sec.lines.filter(l => l.editable).forEach(l => {
      cc3ToSection.set(l.code, sec.key);
    });
  });

  balanceteRows.forEach(row => {
    const rawCode = row.account_code.replace(/[.\s]/g, "");
    
    const applyMapping = (cc3Code: string, sectionKey: string) => {
      // For credit-nature sections, negate the balance so they display as positive
      const value = creditNatureSections.has(sectionKey) ? -row.balance : row.balance;
      result[sectionKey][cc3Code] = (result[sectionKey][cc3Code] || 0) + value;
    };

    // Try exact PGC mapping first
    const cc3Code = pgcToCC3[rawCode];
    if (cc3Code) {
      const sectionKey = cc3ToSection.get(cc3Code);
      if (sectionKey) {
        applyMapping(cc3Code, sectionKey);
        return;
      }
    }

    // Try progressively shorter prefixes (e.g. "1121" → "112" → "11")
    for (let len = rawCode.length; len >= 2; len--) {
      const prefix = rawCode.substring(0, len);
      const cc3 = pgcToCC3[prefix];
      if (cc3) {
        const sectionKey = cc3ToSection.get(cc3);
        if (sectionKey) {
          applyMapping(cc3, sectionKey);
          return;
        }
      }
    }
  });

  return result;
}
