import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PortalEntityProvider } from "@/contexts/PortalEntityContext";
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
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalExercicios from "./pages/portal/PortalExercicios";
import PortalExercicioDetalhe from "./pages/portal/PortalExercicioDetalhe";
import PortalDocumentos from "./pages/portal/PortalDocumentos";
import PortalEsclarecimentos from "./pages/portal/PortalEsclarecimentos";
import PortalValidacoes from "./pages/portal/PortalValidacoes";
import PortalMapas from "./pages/portal/PortalMapas";
import PortalPrestacaoContas from "./pages/portal/PortalPrestacaoContas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/entidades" element={<Entidades />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/exercicios/:id" element={<ExercicioDetalhe />} />
          <Route path="/importacao" element={<Importacao />} />
          <Route path="/plano-contas" element={<PlanoContas />} />
          <Route path="/validacoes" element={<Validacoes />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/mapas" element={<Mapas />} />
          <Route path="/anexos" element={<Anexos />} />
          <Route path="/documentos-obrigatorios" element={<DocumentosObrigatorios />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/esclarecimentos" element={<Esclarecimentos />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/portal/*" element={
            <PortalEntityProvider>
              <Routes>
                <Route path="/" element={<PortalDashboard />} />
                <Route path="/exercicios" element={<PortalExercicios />} />
                <Route path="/exercicios/:id" element={<PortalExercicioDetalhe />} />
                <Route path="/documentos" element={<PortalDocumentos />} />
                <Route path="/esclarecimentos" element={<PortalEsclarecimentos />} />
                <Route path="/validacoes" element={<PortalValidacoes />} />
                <Route path="/mapas" element={<PortalMapas />} />
                <Route path="/prestacao-contas" element={<PortalPrestacaoContas />} />
              </Routes>
            </PortalEntityProvider>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
