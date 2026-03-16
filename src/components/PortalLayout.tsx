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
  
  Bell,
  CheckCircle,
  XCircle,
  FileQuestion,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { mockEntities } from "@/data/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface PortalLayoutProps {
  children: ReactNode;
}

const portalNav = [
  { title: "Painel", icon: LayoutDashboard, path: "/portal" },
  { title: "Exercícios", icon: FileBarChart, path: "/portal/exercicios" },
  { title: "Prestação de Contas", icon: FileBarChart, path: "/portal/prestacao-contas" },
  { title: "Solicitação de Visto", icon: ShieldCheck, path: "/portal/solicitacao-visto" },
  { title: "Solicitações", icon: MessageSquare, path: "/portal/solicitacoes" },
  { title: "Mapas/Modelos", icon: Map, path: "/portal/mapas" },
  { title: "Esclarecimentos", icon: MessageSquare, path: "/portal/esclarecimentos" },
  { title: "Validações", icon: ShieldCheck, path: "/portal/validacoes" },
];

const routeTitles: Record<string, string> = {
  "/portal": "Painel da Entidade",
  "/portal/exercicios": "Exercícios Fiscais",
  "/portal/prestacao-contas": "Prestação de Contas",
  "/portal/solicitacao-visto": "Solicitação de Visto",
  "/portal/solicitacoes": "Solicitações de Elementos",
  "/portal/mapas": "Mapas e Modelos",
  "/portal/esclarecimentos": "Pedidos de Esclarecimento",
  "/portal/validacoes": "Estado das Validações",
};

export function PortalLayout({ children }: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageTitle = routeTitles[location.pathname] || "Portal";
  const { entity, setEntityId } = usePortalEntity();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSubmissions();
  const entityNotifications = notifications.filter((n) => n.entityId === entity.id);
  const entityUnread = unreadCount(entity.id);
  // Short name for display
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
          <span className="text-[12px] text-header-foreground/80 hidden sm:inline">Portal da Entidade</span>
        </div>
        <div className="flex items-center gap-3">
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
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-header-foreground/10 transition-colors">
                <Bell className="h-4 w-4 text-header-foreground/70" />
                {entityUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {entityUnread}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-[420px] overflow-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-sm font-semibold">Notificações</span>
                {entityUnread > 0 && (
                  <button
                    onClick={() => markAllAsRead(entity.id)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {entityNotifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Sem notificações</p>
                </div>
              ) : (
                entityNotifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 py-3 px-3 cursor-pointer",
                      !notif.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={cn(
                      "mt-0.5 shrink-0 rounded-full p-1",
                      notif.type === "recepcionado" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : notif.type === "em_analise" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : notif.type === "solicitacao_elementos" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {notif.type === "recepcionado" ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : notif.type === "em_analise" ? (
                        <FileSearch className="h-3.5 w-3.5" />
                      ) : notif.type === "solicitacao_elementos" ? (
                        <FileQuestion className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs", !notif.read && "font-semibold")}>{notif.message}</p>
                      {notif.detail && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.detail}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
              onClick={() => navigate("/login")}
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
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 px-5 h-10">
          {portalNav.map((item) => {
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
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground">
              MC
            </div>
            <span className="text-xs text-muted-foreground">Maria Costa</span>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-2 space-y-1 border-t border-border animate-fade-in">
            {portalNav.map((item) => {
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
          Portal &nbsp;/&nbsp; <span className="text-foreground font-medium">{pageTitle}</span>
        </span>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1200px] mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="h-8 bg-card border-t border-border flex items-center justify-center px-5 shrink-0">
        <span className="text-[10px] text-muted-foreground">
          © Tribunal de Contas de Angola — Portal de Prestação de Contas — Resolução nº 1/17
        </span>
      </footer>
    </div>
  );
}
