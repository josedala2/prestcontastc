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
import { BrasaoAngola } from "./BrasaoAngola";

const navSections = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/" },
      { title: "Entidades", icon: Building2, path: "/entidades" },
      { title: "Exercícios", icon: Calendar, path: "/exercicios" },
    ],
  },
  {
    label: "Dados",
    items: [
      { title: "Importação", icon: Upload, path: "/importacao" },
      { title: "Plano de Contas", icon: FileText, path: "/plano-contas" },
      { title: "Validações", icon: ShieldCheck, path: "/validacoes" },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { title: "Demonstrações", icon: FileBarChart, path: "/relatorios" },
      { title: "Mapas/Modelos", icon: Map, path: "/mapas" },
    ],
  },
  {
    label: "Dossiê",
    items: [
      { title: "Anexos & Dossiê", icon: Paperclip, path: "/anexos" },
      { title: "Auditoria", icon: History, path: "/auditoria" },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "sidebar-gradient flex flex-col border-r border-sidebar-border transition-all duration-300 min-h-screen shrink-0",
        collapsed ? "w-[60px]" : "w-[250px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <BrasaoAngola size="md" className="shrink-0" />
          {!collapsed && (
            <div className="animate-fade-in min-w-0">
              <h1 className="text-sm font-bold text-sidebar-primary tracking-wide leading-tight">PGC</h1>
              <p className="text-[10px] text-sidebar-foreground/50 leading-tight">Prestação de Contas</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-sidebar-muted uppercase tracking-[0.08em]">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded text-[13px] transition-all duration-150 group relative",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r gold-gradient" />
                    )}
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-sidebar-primary")} />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[12px] text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-secondary-foreground shrink-0">
            JS
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-sidebar-foreground truncate">João Silva</p>
              <p className="text-[10px] text-sidebar-foreground/40">Técnico</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
