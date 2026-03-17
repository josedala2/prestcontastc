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
import PortalSolicitacaoVisto from "./pages/portal/PortalSolicitacaoVisto";
import TecnicoDashboard from "./pages/tecnico/TecnicoDashboard";
import TecnicoPrestacaoContas from "./pages/tecnico/TecnicoPrestacaoContas";
import ProcessosVisto from "./pages/ProcessosVisto";
import GestaoProcessos from "./pages/GestaoProcessos";
import ProcessoDetalhePage from "./pages/ProcessoDetalhe";
import ActasRecepcao from "./pages/ActasRecepcao";
import Secretaria from "./pages/Secretaria";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          
          {/* Admin + Auditor routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/entidades" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><Entidades /></ProtectedRoute>} />
          <Route path="/exercicios" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><Exercicios /></ProtectedRoute>} />
          <Route path="/exercicios/:id" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><ExercicioDetalhe /></ProtectedRoute>} />
          <Route path="/importacao" element={<ProtectedRoute allowedRoles={["Administrador"]}><Importacao /></ProtectedRoute>} />
          <Route path="/plano-contas" element={<ProtectedRoute allowedRoles={["Administrador"]}><PlanoContas /></ProtectedRoute>} />
          <Route path="/validacoes" element={<ProtectedRoute allowedRoles={["Administrador"]}><Validacoes /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><Relatorios /></ProtectedRoute>} />
          <Route path="/mapas" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><Mapas /></ProtectedRoute>} />
          <Route path="/anexos" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><Anexos /></ProtectedRoute>} />
          <Route path="/actas-recepcao" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><ActasRecepcao /></ProtectedRoute>} />
          <Route path="/documentos-obrigatorios" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><DocumentosObrigatorios /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><Auditoria /></ProtectedRoute>} />
          <Route path="/esclarecimentos" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><Esclarecimentos /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={["Administrador"]}><Configuracoes /></ProtectedRoute>} />
          <Route path="/submissoes" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><Submissoes /></ProtectedRoute>} />
          <Route path="/submissoes/manual" element={<ProtectedRoute allowedRoles={["Administrador"]}><SubmissaoManual /></ProtectedRoute>} />
          <Route path="/submissoes/:id" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><SubmissaoDetalhe /></ProtectedRoute>} />
          <Route path="/processos-visto" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA"]}><ProcessosVisto /></ProtectedRoute>} />
          <Route path="/gestao-processos" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><GestaoProcessos /></ProtectedRoute>} />
          <Route path="/gestao-processos/:id" element={<ProtectedRoute allowedRoles={["Administrador", "Auditor / Fiscal TCA", "Secretaria"]}><ProcessoDetalhePage /></ProtectedRoute>} />
          
          {/* Secretaria */}
          <Route path="/secretaria" element={<ProtectedRoute allowedRoles={["Administrador", "Secretaria"]}><Secretaria /></ProtectedRoute>} />

          {/* Portal Entidade */}
          <Route path="/portal/*" element={
            <ProtectedRoute allowedRoles={["Administrador", "Preparador / Contabilista"]}>
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
            <ProtectedRoute allowedRoles={["Administrador", "Técnico Validador"]}>
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
