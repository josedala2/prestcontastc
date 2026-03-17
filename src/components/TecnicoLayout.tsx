import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileBarChart,
  Paperclip,
  MessageSquare,
  ShieldCheck,
  Map,
  Menu,
  X,
  LogOut,
  Building2,
  ChevronDown,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useEntities } from "@/hooks/useEntities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TecnicoLayoutProps {
  children: ReactNode;
}

const buildNav = (prefix: string) => {
  const base = [
    { title: "Painel", icon: LayoutDashboard, path: prefix },
    { title: "Prestação de Contas", icon: FileBarChart, path: `${prefix}/prestacao-contas` },
  ];
  if (prefix === "/contadoria") {
    base.push({ title: "Verificação Documental", icon: ClipboardCheck, path: `${prefix}/verificacao` });
  }
  return [
    ...base,
    { title: "Exercícios", icon: FileBarChart, path: `${prefix}/exercicios` },
    { title: "Documentos", icon: Paperclip, path: `${prefix}/documentos` },
    { title: "Mapas/Modelos", icon: Map, path: `${prefix}/mapas` },
    { title: "Esclarecimentos", icon: MessageSquare, path: `${prefix}/esclarecimentos` },
    { title: "Validações", icon: ShieldCheck, path: `${prefix}/validacoes` },
  ];
};

const buildRouteTitles = (prefix: string): Record<string, string> => ({
  [prefix]: prefix === "/contadoria" ? "Painel da Contadoria Geral" : "Painel do Técnico",
  [`${prefix}/prestacao-contas`]: "Prestação de Contas — Modelo CC-2",
  [`${prefix}/verificacao`]: "Verificação Documental",
  [`${prefix}/exercicios`]: "Exercícios Fiscais",
  [`${prefix}/documentos`]: "Documentos & Anexos",
  [`${prefix}/mapas`]: "Mapas e Modelos",
  [`${prefix}/esclarecimentos`]: "Pedidos de Esclarecimento",
  [`${prefix}/validacoes`]: "Estado das Validações",
});

export function TecnicoLayout({ children }: TecnicoLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefix = location.pathname.startsWith("/contadoria") ? "/contadoria" : "/tecnico";
  const isContadoria = prefix === "/contadoria";
  const tecnicoNav = buildNav(prefix);
  const routeTitles = buildRouteTitles(prefix);
  const pageTitle = routeTitles[location.pathname] || (isContadoria ? "Contadoria Geral" : "Técnico");
  const { entity, setEntityId } = usePortalEntity();
  const { entities: allEntities } = useEntities();
  const { user, logout } = useAuth();

  const shortName = entity.name.split(" - ")[1] || entity.name.split(" — ")[0] || entity.name;

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
          <span className="text-[12px] text-header-foreground/80 hidden sm:inline">
            {isContadoria ? "Contadoria Geral" : "Técnico Validador"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Entity selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1 rounded bg-header-foreground/10 hover:bg-header-foreground/20 transition-colors">
                <Building2 className="h-3.5 w-3.5 text-header-foreground/70" />
                <span className="text-[11px] text-header-foreground/90 font-medium max-w-[200px] truncate">
                  {shortName}
                </span>
                <ChevronDown className="h-3 w-3 text-header-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-auto">
              {mockEntities.map((e) => {
                const eName = e.name.split(" - ")[1] || e.name;
                return (
                  <DropdownMenuItem
                    key={e.id}
                    onClick={() => setEntityId(e.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 py-2",
                      e.id === entity.id && "bg-primary/10"
                    )}
                  >
                    <span className="text-sm font-medium">{eName}</span>
                    <span className="text-[10px] text-muted-foreground">NIF: {e.nif} · {e.provincia}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
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
          {tecnicoNav.map((item) => {
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
            <span className="text-xs text-muted-foreground">Ana Ferreira</span>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-2 space-y-1 border-t border-border animate-fade-in">
            {tecnicoNav.map((item) => {
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
          {isContadoria ? "Contadoria" : "Técnico"} &nbsp;/&nbsp; <span className="text-foreground font-medium">{pageTitle}</span>
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
