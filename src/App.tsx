import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Entidades from "./pages/Entidades";
import Exercicios from "./pages/Exercicios";
import Importacao from "./pages/Importacao";
import PlanoContas from "./pages/PlanoContas";
import Validacoes from "./pages/Validacoes";
import Relatorios from "./pages/Relatorios";
import Mapas from "./pages/Mapas";
import Anexos from "./pages/Anexos";
import Auditoria from "./pages/Auditoria";
import Esclarecimentos from "./pages/Esclarecimentos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entidades" element={<Entidades />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/importacao" element={<Importacao />} />
          <Route path="/plano-contas" element={<PlanoContas />} />
          <Route path="/validacoes" element={<Validacoes />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/mapas" element={<Mapas />} />
          <Route path="/anexos" element={<Anexos />} />
          <Route path="/auditoria" element={<Auditoria />} />
          <Route path="/esclarecimentos" element={<Esclarecimentos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
