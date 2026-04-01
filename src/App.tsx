import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PortalEntityProvider } from "@/contexts/PortalEntityContext";
import { SubmissionProvider } from "@/contexts/SubmissionContext";
import { FinancialDataProvider } from "@/contexts/FinancialDataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Entidades from "./pages/Entidades";
import Exercicios from "./pages/Exercicios";
import ExercicioDetalhe from "./pages/ExercicioDetalhe";
import Importacao from "./pages/Importacao";
import PlanoContas from "./pages/PlanoContas";
import Validacoes from "./pages/Validacoes";
import Relatorios from "./pages/Relatorios";
import Mapas from "./pages/Mapas";
import Anexos from "./pages/Anexos";
import DocumentosObrigatorios from "./pages/DocumentosObrigatorios";
import Auditoria from "./pages/Auditoria";
import Esclarecimentos from "./pages/Esclarecimentos";
import Configuracoes from "./pages/Configuracoes";
import Submissoes from "./pages/Submissoes";
import SubmissaoDetalhe from "./pages/SubmissaoDetalhe";
import SubmissaoManual from "./pages/SubmissaoManual";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalExercicios from "./pages/portal/PortalExercicios";
import PortalExercicioDetalhe from "./pages/portal/PortalExercicioDetalhe";
import PortalDocumentos from "./pages/portal/PortalDocumentos";
import PortalEsclarecimentos from "./pages/portal/PortalEsclarecimentos";
import PortalValidacoes from "./pages/portal/PortalValidacoes";
import PortalMapas from "./pages/portal/PortalMapas";
import PortalPrestacaoContas from "./pages/portal/PortalPrestacaoContas";
import PortalSolicitacoes from "./pages/portal/PortalSolicitacoes";
import PortalEmolumentos from "./pages/portal/PortalEmolumentos";
import PortalSolicitacaoVisto from "./pages/portal/PortalSolicitacaoVisto";
import TecnicoDashboard from "./pages/tecnico/TecnicoDashboard";
import TecnicoPrestacaoContas from "./pages/tecnico/TecnicoPrestacaoContas";
import ProcessosVisto from "./pages/ProcessosVisto";
import GestaoProcessos from "./pages/GestaoProcessos";
import ProcessoDetalhePage from "./pages/ProcessoDetalhe";
import ActasRecepcao from "./pages/ActasRecepcao";
import Secretaria from "./pages/Secretaria";
import Atividades from "./pages/Atividades";
import ContadoriaVerificacao from "./pages/contadoria/ContadoriaVerificacao";
import ContadoriaTriagem from "./pages/contadoria-geral/ContadoriaTriagem";
import EscrivaoRegistoAutuacao from "./pages/escrivao/EscrivaoRegistoAutuacao";
import ChefeDivisaoProcessos from "./pages/chefe-divisao/ChefeDivisaoProcessos";
import ValidacaoChefeDivisao from "./pages/chefe-divisao/ValidacaoChefeDivisao";
import ChefeSeccaoDistribuicao from "./pages/chefe-seccao/ChefeSeccaoDistribuicao";
import ValidacaoChefeSeccao from "./pages/chefe-seccao/ValidacaoChefeSeccao";
import AnaliseTecnicaPage from "./pages/tecnico-analise/AnaliseTecnicaPage";
import AmbienteAnalisePage from "./pages/tecnico-analise/AmbienteAnalisePage";
import ControleQualidadeDST from "./pages/dst/ControleQualidadeDST";
import DecisaoJuizRelator from "./pages/juiz/DecisaoJuizRelator";
import Arquivamento from "./pages/juiz/Arquivamento";
import CobrancaEmolumentos from "./pages/custas/CobrancaEmolumentos";
import EmolumentosDashboard from "./pages/emolumentos/EmolumentosDashboard";
import EmolumentosLista from "./pages/emolumentos/EmolumentosLista";
import NovoEmolumento from "./pages/emolumentos/NovoEmolumento";
import EmolumentoDetalhe from "./pages/emolumentos/EmolumentoDetalhe";
import ReclamacoesEmolumentos from "./pages/emolumentos/ReclamacoesEmolumentos";
import CobrancaCoercivaPage from "./pages/emolumentos/CobrancaCoercivaPage";
import ReconciliacaoFinanceira from "./pages/emolumentos/ReconciliacaoFinanceira";
import RelatoriosEmolumentos from "./pages/emolumentos/RelatoriosEmolumentos";
import DespachoMinisterioPublico from "./pages/ministerio-publico/DespachoMinisterioPublico";
import CumprimentoDespachos from "./pages/escrivao/CumprimentoDespachos";
import OficioRemessa from "./pages/secretaria/OficioRemessa";
import ExpedienteSaida from "./pages/diligencias/ExpedienteSaida";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Roles that access the main dashboard layout
const DASHBOARD_ROLES = [
  "Administrador do Sistema",
  "Chefe da Secretaria-Geral",
  "Técnico da Contadoria Geral",
  "Escrivão dos Autos",
  "Contadoria Geral",
  "Chefe de Divisão",
  "Chefe de Secção",
  "Coordenador de Equipa",
  "Diretor dos Serviços Técnicos",
  "Juiz Relator",
  "Juiz Adjunto",
  "Ministério Público",
  "Técnico da Secção de Custas e Emolumentos",
  "Oficial de Diligências",
  "Presidente da Câmara",
  "Presidente do Tribunal de Contas",
];

const ALL_INTERNAL = [...DASHBOARD_ROLES, "Técnico da Secretaria-Geral"];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <SubmissionProvider>
    <FinancialDataProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={DASHBOARD_ROLES}><Dashboard /></ProtectedRoute>} />
          <Route path="/entidades" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><Entidades /></ProtectedRoute>} />
          <Route path="/exercicios" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Diretor dos Serviços Técnicos", "Juiz Relator", "Presidente da Câmara", "Presidente do Tribunal de Contas"]}><Exercicios /></ProtectedRoute>} />
          <Route path="/exercicios/:id" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Diretor dos Serviços Técnicos", "Juiz Relator", "Presidente da Câmara", "Presidente do Tribunal de Contas"]}><ExercicioDetalhe /></ProtectedRoute>} />
          <Route path="/importacao" element={<ProtectedRoute allowedRoles={["Administrador do Sistema"]}><Importacao /></ProtectedRoute>} />
          <Route path="/plano-contas" element={<ProtectedRoute allowedRoles={["Administrador do Sistema"]}><PlanoContas /></ProtectedRoute>} />
          <Route path="/validacoes" element={<ProtectedRoute allowedRoles={["Administrador do Sistema"]}><Validacoes /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><Relatorios /></ProtectedRoute>} />
          <Route path="/mapas" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><Mapas /></ProtectedRoute>} />
          <Route path="/anexos" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><Anexos /></ProtectedRoute>} />
          <Route path="/actas-recepcao" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secretaria-Geral", "Chefe da Secretaria-Geral", "Escrivão dos Autos", "Presidente da Câmara", "Presidente do Tribunal de Contas"]}><ActasRecepcao /></ProtectedRoute>} />
          <Route path="/documentos-obrigatorios" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><DocumentosObrigatorios /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Coordenador de Equipa", "Diretor dos Serviços Técnicos", "Juiz Relator", "Ministério Público", "Presidente da Câmara", "Presidente do Tribunal de Contas"]}><Auditoria /></ProtectedRoute>} />
          <Route path="/esclarecimentos" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Contadoria Geral", "Coordenador de Equipa", "Diretor dos Serviços Técnicos", "Presidente do Tribunal de Contas"]}><Esclarecimentos /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Presidente do Tribunal de Contas"]}><Configuracoes /></ProtectedRoute>} />
          <Route path="/submissoes" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><Submissoes /></ProtectedRoute>} />
          <Route path="/submissoes/manual" element={<ProtectedRoute allowedRoles={["Administrador do Sistema"]}><SubmissaoManual /></ProtectedRoute>} />
          <Route path="/submissoes/:id" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><SubmissaoDetalhe /></ProtectedRoute>} />
          <Route path="/processos-visto" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Juiz Relator", "Presidente da Câmara", "Presidente do Tribunal de Contas"]}><ProcessosVisto /></ProtectedRoute>} />
          <Route path="/gestao-processos" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><GestaoProcessos /></ProtectedRoute>} />
          <Route path="/gestao-processos/:id" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><ProcessoDetalhePage /></ProtectedRoute>} />
          <Route path="/atividades" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><Atividades /></ProtectedRoute>} />
          
          {/* Secretaria */}
          <Route path="/secretaria" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secretaria-Geral", "Chefe da Secretaria-Geral"]}><Secretaria /></ProtectedRoute>} />

          {/* Portal Entidade */}
          <Route path="/portal/*" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Representante da Entidade"]}>
              <PortalEntityProvider>
                <Routes>
                  <Route index element={<PortalDashboard />} />
                  <Route path="exercicios" element={<PortalExercicios />} />
                  <Route path="exercicios/:id" element={<PortalExercicioDetalhe />} />
                  <Route path="documentos" element={<PortalDocumentos />} />
                  <Route path="esclarecimentos" element={<PortalEsclarecimentos />} />
                  <Route path="validacoes" element={<PortalValidacoes />} />
                  <Route path="mapas" element={<PortalMapas />} />
                  <Route path="prestacao-contas" element={<PortalPrestacaoContas />} />
                  <Route path="solicitacao-visto" element={<PortalSolicitacaoVisto />} />
                  <Route path="solicitacoes" element={<PortalSolicitacoes />} />
                </Routes>
              </PortalEntityProvider>
            </ProtectedRoute>
          } />
          
          {/* Técnico */}
          <Route path="/tecnico/*" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico de Análise"]}>
              <PortalEntityProvider>
                <Routes>
                  <Route index element={<TecnicoDashboard />} />
                  <Route path="prestacao-contas" element={<TecnicoPrestacaoContas />} />
                  <Route path="exercicios" element={<PortalExercicios />} />
                  <Route path="exercicios/:id" element={<PortalExercicioDetalhe />} />
                  <Route path="documentos" element={<PortalDocumentos />} />
                  <Route path="esclarecimentos" element={<PortalEsclarecimentos />} />
                  <Route path="validacoes" element={<PortalValidacoes />} />
                  <Route path="mapas" element={<PortalMapas />} />
                </Routes>
              </PortalEntityProvider>
            </ProtectedRoute>
          } />

          {/* Contadoria Geral — mirrors Técnico routes */}
          <Route path="/contadoria/*" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Contadoria Geral", "Contadoria Geral"]}>
              <PortalEntityProvider>
                <Routes>
                  <Route index element={<TecnicoDashboard />} />
                  <Route path="verificacao" element={<ContadoriaVerificacao />} />
                  <Route path="prestacao-contas" element={<TecnicoPrestacaoContas />} />
                  <Route path="exercicios" element={<PortalExercicios />} />
                  <Route path="exercicios/:id" element={<PortalExercicioDetalhe />} />
                  <Route path="documentos" element={<PortalDocumentos />} />
                  <Route path="esclarecimentos" element={<PortalEsclarecimentos />} />
                  <Route path="validacoes" element={<PortalValidacoes />} />
                  <Route path="mapas" element={<PortalMapas />} />
                </Routes>
              </PortalEntityProvider>
            </ProtectedRoute>
          } />

          {/* Escrivão dos Autos */}
          <Route path="/escrivao/registo-autuacao" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Escrivão dos Autos"]}>
              <EscrivaoRegistoAutuacao />
            </ProtectedRoute>
          } />

          {/* Contadoria Geral — Triagem */}
          <Route path="/contadoria-geral/triagem" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Contadoria Geral"]}>
              <ContadoriaTriagem />
            </ProtectedRoute>
          } />

          {/* Chefe de Divisão */}
          <Route path="/chefe-divisao/processos" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Chefe de Divisão"]}>
              <ChefeDivisaoProcessos />
            </ProtectedRoute>
          } />
          <Route path="/chefe-divisao/validacao" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Chefe de Divisão"]}>
              <ValidacaoChefeDivisao />
            </ProtectedRoute>
          } />

          {/* Chefe de Secção */}
          <Route path="/chefe-seccao/distribuicao" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Chefe de Secção"]}>
              <ChefeSeccaoDistribuicao />
            </ProtectedRoute>
          } />
          <Route path="/chefe-seccao/validacao" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Chefe de Secção"]}>
              <ValidacaoChefeSeccao />
            </ProtectedRoute>
          } />

          {/* Análise Técnica */}
          <Route path="/analise-tecnica" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico de Análise", "Coordenador de Equipa"]}>
              <AnaliseTecnicaPage />
            </ProtectedRoute>
          } />
          <Route path="/analise-tecnica/:id" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico de Análise", "Coordenador de Equipa", "Chefe de Divisão", "Chefe de Secção"]}>
              <AmbienteAnalisePage />
            </ProtectedRoute>
          } />

          {/* DST - Controle Qualidade */}
          <Route path="/dst/controle-qualidade" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Diretor dos Serviços Técnicos"]}>
              <ControleQualidadeDST />
            </ProtectedRoute>
          } />

          {/* Juiz Relator */}
          <Route path="/juiz/decisao" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Juiz Relator", "Juiz Adjunto", "Presidente da Câmara"]}>
              <DecisaoJuizRelator />
            </ProtectedRoute>
          } />
          <Route path="/juiz/arquivamento" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Juiz Relator", "Presidente da Câmara"]}>
              <Arquivamento />
            </ProtectedRoute>
          } />

          {/* Custas e Emolumentos (workflow stage) */}
          <Route path="/custas/emolumentos" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secção de Custas e Emolumentos"]}>
              <CobrancaEmolumentos />
            </ProtectedRoute>
          } />

          {/* Módulo Gestão de Emolumentos */}
          <Route path="/emolumentos" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><EmolumentosDashboard /></ProtectedRoute>} />
          <Route path="/emolumentos/lista" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><EmolumentosLista /></ProtectedRoute>} />
          <Route path="/emolumentos/novo" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secção de Custas e Emolumentos", "Contadoria Geral", "Escrivão dos Autos"]}><NovoEmolumento /></ProtectedRoute>} />
          <Route path="/emolumentos/:id" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><EmolumentoDetalhe /></ProtectedRoute>} />
          <Route path="/emolumentos/reclamacoes" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><ReclamacoesEmolumentos /></ProtectedRoute>} />
          <Route path="/emolumentos/cobranca-coerciva" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secção de Custas e Emolumentos", "Contadoria Geral", "Oficial de Diligências"]}><CobrancaCoercivaPage /></ProtectedRoute>} />
          <Route path="/emolumentos/reconciliacao" element={<ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secção de Custas e Emolumentos", "Contadoria Geral"]}><ReconciliacaoFinanceira /></ProtectedRoute>} />
          <Route path="/emolumentos/relatorios" element={<ProtectedRoute allowedRoles={ALL_INTERNAL}><RelatoriosEmolumentos /></ProtectedRoute>} />

          {/* Ministério Público */}
          <Route path="/ministerio-publico/despacho" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Ministério Público"]}>
              <DespachoMinisterioPublico />
            </ProtectedRoute>
          } />

          {/* Escrivão - Cumprimento */}
          <Route path="/escrivao/cumprimento-despachos" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Escrivão dos Autos"]}>
              <CumprimentoDespachos />
            </ProtectedRoute>
          } />

          {/* Ofício de Remessa */}
          <Route path="/secretaria/oficio-remessa" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Técnico da Secretaria-Geral", "Chefe da Secretaria-Geral"]}>
              <OficioRemessa />
            </ProtectedRoute>
          } />

          {/* Oficial de Diligências */}
          <Route path="/diligencias/expediente-saida" element={
            <ProtectedRoute allowedRoles={["Administrador do Sistema", "Oficial de Diligências"]}>
              <ExpedienteSaida />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </FinancialDataProvider>
    </SubmissionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
