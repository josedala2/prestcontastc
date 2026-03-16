import { ReactNode, useState, useRef, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Bell, Send, CheckCircle, XCircle, FileQuestion, FileSearch } from "lucide-react";
import { useSubmissions, PortalNotification } from "@/contexts/SubmissionContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AppLayoutProps {
  children: ReactNode;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
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
  "/configuracoes": "Configurações",
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = routeTitles[location.pathname] || "PGC";
  const { notifications, markAsRead } = useSubmissions();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Only show "submissao" type notifications for Secretaria
  const secretariaNotifs = notifications.filter((n) => n.type === "submissao");
  const unreadCount = secretariaNotifs.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "submissao": return <Send className="h-3.5 w-3.5" />;
      case "recepcionado": return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejeitado": return <XCircle className="h-3.5 w-3.5" />;
      case "solicitacao_elementos": return <FileQuestion className="h-3.5 w-3.5" />;
      case "em_analise": return <FileSearch className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

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

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs((v) => !v)}
                className="relative flex items-center justify-center w-7 h-7 rounded hover:bg-header-foreground/10 transition-colors"
                title="Notificações"
              >
                <Bell className="h-4 w-4 text-header-foreground/80" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-9 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Notificações</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {secretariaNotifs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Sem notificações
                      </div>
                    ) : (
                      secretariaNotifs.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            navigate("/submissoes");
                            setShowNotifs(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors flex items-start gap-2.5",
                            !n.read && "bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "mt-0.5 p-1 rounded-full shrink-0",
                            !n.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs leading-snug", !n.read ? "font-medium text-foreground" : "text-muted-foreground")}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-1.5 h-1.5 rounded-full bg-header-accent" />
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-header-foreground/70 hover:text-header-foreground hover:bg-header-foreground/10 transition-colors"
              title="Terminar Sessão"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
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
