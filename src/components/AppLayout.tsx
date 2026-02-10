import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { useLocation } from "react-router-dom";


interface AppLayoutProps {
  children: ReactNode;
}

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/entidades": "Entidades",
  "/exercicios": "Exercícios Fiscais",
  "/importacao": "Importação de Balancete",
  "/plano-contas": "Plano de Contas",
  "/validacoes": "Validações",
  "/relatorios": "Relatórios e Demonstrações",
  "/mapas": "Mapas e Modelos",
  "/anexos": "Anexos e Dossiê",
  "/auditoria": "Trilha de Auditoria",
  "/esclarecimentos": "Pedidos de Esclarecimento",
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || "PGC";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header — Republic red band */}
        <header className="header-gradient h-11 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo-tca.png" alt="TCA" className="h-7 w-7 shrink-0" />
            <span className="text-[13px] font-semibold text-header-foreground tracking-wide">
              TRIBUNAL DE CONTAS DE ANGOLA
            </span>
            <span className="text-header-foreground/40">|</span>
            <span className="text-[12px] text-header-foreground/80">
              Sistema de Prestação de Contas
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-header-foreground/60">
              Resolução nº 1/17
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-header-accent" />
          </div>
        </header>

        {/* Subtle breadcrumb bar */}
        <div className="h-9 bg-card border-b border-border flex items-center px-5">
          <span className="text-[11px] text-muted-foreground">
            PGC &nbsp;/&nbsp; <span className="text-foreground font-medium">{pageTitle}</span>
          </span>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
        </main>

        {/* Footer */}
        <footer className="h-8 bg-card border-t border-border flex items-center justify-center px-5 shrink-0">
          <span className="text-[10px] text-muted-foreground">
            © Tribunal de Contas de Angola — Prestação de Contas PGC (Decreto nº 82/2001) — Resolução nº 1/17
          </span>
        </footer>
      </div>
    </div>
  );
}
