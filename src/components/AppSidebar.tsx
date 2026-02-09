import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  Calendar,
  Upload,
  ShieldCheck,
  FileBarChart,
  Map,
  Paperclip,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Entidades", icon: Building2, path: "/entidades" },
  { title: "Exercícios", icon: Calendar, path: "/exercicios" },
  { title: "Importação", icon: Upload, path: "/importacao" },
  { title: "Plano de Contas", icon: FileText, path: "/plano-contas" },
  { title: "Validações", icon: ShieldCheck, path: "/validacoes" },
  { title: "Relatórios", icon: FileBarChart, path: "/relatorios" },
  { title: "Mapas/Modelos", icon: Map, path: "/mapas" },
  { title: "Anexos & Dossiê", icon: Paperclip, path: "/anexos" },
  { title: "Auditoria", icon: History, path: "/auditoria" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "gradient-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 min-h-screen",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-sidebar-primary tracking-wide">PGC</h1>
            <p className="text-[10px] text-sidebar-foreground/60 mt-0.5">Prestação de Contas</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-xs font-bold text-accent-foreground shrink-0">
            JS
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-sidebar-foreground truncate">João Silva</p>
              <p className="text-[10px] text-sidebar-foreground/50">Técnico</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
