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
  ChevronDown,
  FileText,
  History,
  MessageSquare,
  ExternalLink,
  Settings,
  Send,
  Inbox,
  FilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  icon: typeof LayoutDashboard;
  path: string;
};

type NavItemWithChildren = {
  title: string;
  icon: typeof LayoutDashboard;
  path?: string;
  children: NavItem[];
};

type NavEntry = NavItem | NavItemWithChildren;

function hasChildren(item: NavEntry): item is NavItemWithChildren {
  return "children" in item && Array.isArray(item.children);
}

const navSections: { label: string; items: NavEntry[] }[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { title: "Entidades", icon: Building2, path: "/entidades" },
      { title: "Exercícios", icon: Calendar, path: "/exercicios" },
      {
        title: "Submissões",
        icon: Send,
        children: [
          { title: "Recepção", icon: Inbox, path: "/submissoes" },
          { title: "Submeter por Entidade", icon: FilePlus, path: "/submissoes/manual" },
        ],
      },
    ],
  },
  {
    label: "Dados",
    items: [
      { title: "Plano de Contas", icon: FileText, path: "/plano-contas" },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { title: "Mapas/Modelos", icon: Map, path: "/mapas" },
    ],
  },
  {
    label: "Dossiê",
    items: [
      { title: "Anexos & Dossiê", icon: Paperclip, path: "/anexos" },
      { title: "Docs. Obrigatórios", icon: FileText, path: "/documentos-obrigatorios" },
      { title: "Esclarecimentos", icon: MessageSquare, path: "/esclarecimentos" },
      { title: "Auditoria", icon: History, path: "/auditoria" },
    ],
  },
  {
    label: "Acesso Externo",
    items: [
      { title: "Portal da Entidade", icon: ExternalLink, path: "/portal" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", icon: Settings, path: "/configuracoes" },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => location.pathname === path;

  const isChildActive = (item: NavItemWithChildren) =>
    item.children.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"));

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isMenuOpen = (item: NavItemWithChildren) =>
    openMenus[item.title] ?? isChildActive(item);

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
          <img src="/logo-tca.png" alt="TCA" className="w-9 h-9 shrink-0" />
          {!collapsed && (
            <div className="animate-fade-in min-w-0">
              <h1 className="text-sm font-bold text-sidebar-primary tracking-wide leading-tight font-serif">TCA</h1>
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
                if (hasChildren(item)) {
                  const open = isMenuOpen(item);
                  const childActive = isChildActive(item);

                  return (
                    <div key={item.title}>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded text-[13px] transition-all duration-150 group relative",
                          childActive
                            ? "bg-sidebar-accent/60 text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        {childActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r gold-gradient" />
                        )}
                        <item.icon className={cn("h-[18px] w-[18px] shrink-0", childActive && "text-sidebar-primary")} />
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1 text-left">{item.title}</span>
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                                open && "rotate-180"
                              )}
                            />
                          </>
                        )}
                      </button>

                      {/* Submenu */}
                      {!collapsed && open && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-2">
                          {item.children.map((child) => {
                            const active = isActive(child.path);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={cn(
                                  "flex items-center gap-2 px-2.5 py-1.5 rounded text-[12px] transition-all duration-150",
                                  active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                    : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                                )}
                              >
                                <child.icon className={cn("h-[15px] w-[15px] shrink-0", active && "text-sidebar-primary")} />
                                <span className="truncate">{child.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded text-[13px] transition-all duration-150 group relative",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r gold-gradient" />
                    )}
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
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
            CM
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-sidebar-foreground truncate">Carlos Mendes</p>
              <p className="text-[10px] text-sidebar-foreground/40">Administrador TCA</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
