import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileSearch,
  Paperclip,
  MessageSquare,
  ClipboardCheck,
  Menu,
  X,
  LogOut,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface ContadoriaLayoutProps {
  children: ReactNode;
}

const contadoriaNav = [
  { title: "Painel", icon: LayoutDashboard, path: "/contadoria" },
  { title: "Verificação Documental", icon: FileSearch, path: "/contadoria/verificacao" },
  { title: "Documentos", icon: Paperclip, path: "/contadoria/documentos" },
  { title: "Esclarecimentos", icon: MessageSquare, path: "/contadoria/esclarecimentos" },
  { title: "Processos", icon: ClipboardCheck, path: "/contadoria/processos" },
];

const routeTitles: Record<string, string> = {
  "/contadoria": "Painel da Contadoria Geral",
  "/contadoria/verificacao": "Verificação Documental — Etapa 4",
  "/contadoria/documentos": "Documentos & Anexos",
  "/contadoria/esclarecimentos": "Pedidos de Esclarecimento",
  "/contadoria/processos": "Gestão de Processos",
};

export function ContadoriaLayout({ children }: ContadoriaLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageTitle = routeTitles[location.pathname] || "Contadoria Geral";
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="header-gradient h-12 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo-tca.png" alt="TCA" className="h-7 w-7 shrink-0" />
          <span className="text-[13px] font-semibold text-header-foreground tracking-wide hidden sm:inline">
            TRIBUNAL DE CONTAS DE ANGOLA
          </span>
          <span className="text-header-foreground/40 hidden sm:inline">|</span>
          <span className="text-[12px] text-header-foreground/80 hidden sm:inline">Contadoria Geral</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-header-foreground/70 hover:text-header-foreground hover:bg-header-foreground/10 transition-colors"
            title="Terminar Sessão"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
          <button className="md:hidden text-header-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Navigation bar */}
      <nav className="bg-card border-b border-border shrink-0">
        <div className="hidden md:flex items-center gap-1 px-5 h-10">
          {contadoriaNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent-foreground">
              <UserCheck className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-muted-foreground">{user?.displayName || "Contadoria"}</span>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-2 space-y-1 border-t border-border animate-fade-in">
            {contadoriaNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Breadcrumb */}
      <div className="h-9 bg-muted/30 border-b border-border flex items-center px-5">
        <span className="text-[11px] text-muted-foreground">
          Contadoria &nbsp;/&nbsp; <span className="text-foreground font-medium">{pageTitle}</span>
        </span>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="h-8 bg-card border-t border-border flex items-center justify-center px-5 shrink-0">
        <span className="text-[10px] text-muted-foreground">
          © Tribunal de Contas de Angola — Sistema de Análise de Contas — Resolução nº 1/17
        </span>
      </footer>
    </div>
  );
}
