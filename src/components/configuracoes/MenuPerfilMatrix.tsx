import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Save, Search, Users, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type UserRole,
  rolePermissions,
  roleSidebarSections,
  roleHiddenPaths,
  roleGroups,
} from "@/contexts/AuthContext";

// All menu items extracted from AppSidebar navSections
const ALL_MENU_ITEMS = [
  { section: "Principal", path: "/dashboard", title: "Dashboard" },
  { section: "Principal", path: "/entidades", title: "Entidades" },
  { section: "Principal", path: "/exercicios", title: "Exercícios" },
  { section: "Principal", path: "/submissoes", title: "Recepção (Submissões)" },
  { section: "Principal", path: "/submissoes/manual", title: "Submeter por Entidade" },
  { section: "Principal", path: "/processos-visto", title: "Submissão de Visto" },
  { section: "Principal", path: "/gestao-processos", title: "Gestão de Processos" },
  { section: "Principal", path: "/atividades", title: "Atividades" },
  { section: "Dados", path: "/plano-contas", title: "Plano de Contas" },
  { section: "Dados", path: "/importacao", title: "Importação" },
  { section: "Dados", path: "/validacoes", title: "Validações" },
  { section: "Relatórios", path: "/mapas", title: "Mapas/Modelos" },
  { section: "Relatórios", path: "/relatorios", title: "Relatórios" },
  { section: "Relatórios", path: "/anexos", title: "Anexos" },
  { section: "Dossiê", path: "/actas-recepcao", title: "Actas de Recepção" },
  { section: "Dossiê", path: "/documentos-obrigatorios", title: "Docs. Obrigatórios" },
  { section: "Dossiê", path: "/esclarecimentos", title: "Esclarecimentos" },
  { section: "Dossiê", path: "/auditoria", title: "Auditoria" },
  { section: "Acesso Externo", path: "/portal", title: "Portal da Entidade" },
  { section: "Acesso Externo", path: "/tecnico", title: "Técnico Validador" },
  { section: "Acesso Externo", path: "/secretaria", title: "Secretaria" },
  { section: "Acesso Externo", path: "/contadoria-geral/triagem", title: "Triagem Contadoria" },
  { section: "Acesso Externo", path: "/escrivao/registo-autuacao", title: "Registo e Autuação" },
  { section: "Acesso Externo", path: "/chefe-divisao/processos", title: "Divisão Competente" },
  { section: "Acesso Externo", path: "/chefe-divisao/validacao", title: "Validação Divisão" },
  { section: "Acesso Externo", path: "/chefe-seccao/distribuicao", title: "Secção — Distribuição" },
  { section: "Acesso Externo", path: "/chefe-seccao/validacao", title: "Validação Secção" },
  { section: "Acesso Externo", path: "/analise-tecnica", title: "Análise Técnica" },
  { section: "Acesso Externo", path: "/dst/controle-qualidade", title: "Controle Qualidade (DST)" },
  { section: "Acesso Externo", path: "/juiz/decisao", title: "Decisão Juiz Relator" },
  { section: "Acesso Externo", path: "/custas/emolumentos", title: "Cobrança Emolumentos" },
  { section: "Acesso Externo", path: "/ministerio-publico/despacho", title: "Despacho Min. Público" },
  { section: "Acesso Externo", path: "/escrivao/cumprimento-despachos", title: "Cumprimento Despachos" },
  { section: "Acesso Externo", path: "/secretaria/oficio-remessa", title: "Ofício de Remessa" },
  { section: "Acesso Externo", path: "/diligencias/expediente-saida", title: "Expediente de Saída" },
  { section: "Acesso Externo", path: "/juiz/arquivamento", title: "Arquivamento" },
  { section: "Sistema", path: "/configuracoes", title: "Configurações" },
];

const ALL_SECTIONS = ["Principal", "Dados", "Relatórios", "Dossiê", "Acesso Externo", "Sistema"];

// All roles except "Representante da Entidade" (uses portal)
const ALL_ROLES: UserRole[] = [
  "Técnico da Secretaria-Geral",
  "Chefe da Secretaria-Geral",
  "Técnico da Contadoria Geral",
  "Escrivão dos Autos",
  "Contadoria Geral",
  "Chefe de Divisão",
  "Chefe de Secção",
  "Técnico de Análise",
  "Coordenador de Equipa",
  "Diretor dos Serviços Técnicos",
  "Juiz Relator",
  "Juiz Adjunto",
  "Ministério Público",
  "Técnico da Secção de Custas e Emolumentos",
  "Oficial de Diligências",
  "Presidente da Câmara",
  "Presidente do Tribunal de Contas",
  "Administrador do Sistema",
];

// Short labels for display in matrix
const SHORT_ROLE_LABELS: Record<string, string> = {
  "Técnico da Secretaria-Geral": "Téc. Secretaria",
  "Chefe da Secretaria-Geral": "Ch. Secretaria",
  "Técnico da Contadoria Geral": "Téc. Contadoria",
  "Escrivão dos Autos": "Escrivão",
  "Contadoria Geral": "Contadoria Geral",
  "Chefe de Divisão": "Ch. Divisão",
  "Chefe de Secção": "Ch. Secção",
  "Técnico de Análise": "Téc. Análise",
  "Coordenador de Equipa": "Coord. Equipa",
  "Diretor dos Serviços Técnicos": "Dir. DST",
  "Juiz Relator": "Juiz Relator",
  "Juiz Adjunto": "Juiz Adjunto",
  "Ministério Público": "Min. Público",
  "Técnico da Secção de Custas e Emolumentos": "Téc. Custas",
  "Oficial de Diligências": "Of. Diligências",
  "Presidente da Câmara": "Pres. Câmara",
  "Presidente do Tribunal de Contas": "Pres. TCA",
  "Administrador do Sistema": "Admin",
};

function isMenuVisibleForRole(path: string, section: string, role: UserRole): boolean {
  const sections = roleSidebarSections[role];
  const hidden = roleHiddenPaths[role];
  return sections.includes(section) && !hidden.includes(path);
}

export function MenuPerfilMatrix() {
  const [searchMenu, setSearchMenu] = useState("");
  const [filterSection, setFilterSection] = useState<string>("todos");
  const [selectedRole, setSelectedRole] = useState<UserRole | "todos">("todos");

  // Build matrix state from current config
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const m: Record<string, Record<string, boolean>> = {};
    for (const item of ALL_MENU_ITEMS) {
      m[item.path] = {};
      for (const role of ALL_ROLES) {
        m[item.path][role] = isMenuVisibleForRole(item.path, item.section, role);
      }
    }
    return m;
  });

  const toggleAccess = (path: string, role: UserRole) => {
    setMatrix((prev) => ({
      ...prev,
      [path]: {
        ...prev[path],
        [role]: !prev[path][role],
      },
    }));
  };

  const toggleAllForRole = (role: UserRole, value: boolean) => {
    setMatrix((prev) => {
      const next = { ...prev };
      for (const item of filteredItems) {
        next[item.path] = { ...next[item.path], [role]: value };
      }
      return next;
    });
  };

  const toggleAllForMenu = (path: string, value: boolean) => {
    setMatrix((prev) => {
      const next = { ...prev };
      next[path] = { ...next[path] };
      for (const role of displayedRoles) {
        next[path][role] = value;
      }
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    return ALL_MENU_ITEMS.filter((item) => {
      if (filterSection !== "todos" && item.section !== filterSection) return false;
      if (searchMenu && !item.title.toLowerCase().includes(searchMenu.toLowerCase()) && !item.path.toLowerCase().includes(searchMenu.toLowerCase())) return false;
      return true;
    });
  }, [filterSection, searchMenu]);

  const displayedRoles = useMemo(() => {
    if (selectedRole === "todos") return ALL_ROLES;
    return ALL_ROLES.filter((r) => r === selectedRole);
  }, [selectedRole]);

  const countForRole = (role: UserRole) => {
    return ALL_MENU_ITEMS.filter((item) => matrix[item.path]?.[role]).length;
  };

  const countForMenu = (path: string) => {
    return ALL_ROLES.filter((role) => matrix[path]?.[role]).length;
  };

  const handleSave = () => {
    // In a real implementation, this would persist to database
    // For now, show the current state as a summary
    toast.success("Mapeamento de menus por perfil guardado com sucesso.");
  };

  // Group items by section for visual separation
  const sections = useMemo(() => {
    const secs: { label: string; items: typeof ALL_MENU_ITEMS }[] = [];
    let currentSection = "";
    for (const item of filteredItems) {
      if (item.section !== currentSection) {
        currentSection = item.section;
        secs.push({ label: currentSection, items: [] });
      }
      secs[secs.length - 1].items.push(item);
    }
    return secs;
  }, [filteredItems]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" /> Mapeamento Menus ↔ Perfis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define quais menus são visíveis para cada perfil de utilizador. {ALL_MENU_ITEMS.length} menus × {ALL_ROLES.length} perfis
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          <Save className="h-4 w-4" /> Guardar Alterações
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar menu..."
            value={searchMenu}
            onChange={(e) => setSearchMenu(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Secção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Secções</SelectItem>
            {ALL_SECTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole | "todos")}>
          <SelectTrigger className="w-[220px] h-8 text-xs">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Perfis</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{SHORT_ROLE_LABELS[r] || r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matrix Table */}
      <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="text-left px-3 py-2 border-b border-border font-semibold text-foreground min-w-[200px] sticky left-0 bg-muted z-20">
                  Menu
                </th>
                <th className="px-2 py-2 border-b border-border font-medium text-muted-foreground w-12 text-center">
                  Perfis
                </th>
                {displayedRoles.map((role) => (
                  <th
                    key={role}
                    className="px-1 py-2 border-b border-border font-medium text-center min-w-[70px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground leading-tight whitespace-nowrap">
                        {SHORT_ROLE_LABELS[role]}
                      </span>
                      <span className="text-[9px] text-primary font-semibold">
                        {countForRole(role)}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => toggleAllForRole(role, true)}
                          className="text-[8px] text-primary hover:underline"
                          title="Seleccionar todos"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => toggleAllForRole(role, false)}
                          className="text-[8px] text-destructive hover:underline"
                          title="Desmarcar todos"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <>
                  <tr key={`sec-${section.label}`}>
                    <td
                      colSpan={displayedRoles.length + 2}
                      className="px-3 py-1.5 bg-muted/50 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border"
                    >
                      {section.label}
                    </td>
                  </tr>
                  {section.items.map((item) => (
                    <tr
                      key={item.path}
                      className="hover:bg-muted/30 transition-colors border-b border-border/50"
                    >
                      <td className="px-3 py-1.5 sticky left-0 bg-card z-[5]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-foreground">{item.title}</span>
                            <span className="text-[10px] text-muted-foreground ml-2 font-mono">{item.path}</span>
                          </div>
                          <div className="flex gap-0.5 mr-1">
                            <button
                              onClick={() => toggleAllForMenu(item.path, true)}
                              className="text-[8px] text-primary hover:underline"
                              title="Todos"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => toggleAllForMenu(item.path, false)}
                              className="text-[8px] text-destructive hover:underline"
                              title="Nenhum"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                          countForMenu(item.path) === ALL_ROLES.length
                            ? "bg-primary/10 text-primary"
                            : countForMenu(item.path) === 0
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {countForMenu(item.path)}/{ALL_ROLES.length}
                        </span>
                      </td>
                      {displayedRoles.map((role) => (
                        <td key={role} className="px-1 py-1.5 text-center">
                          <Checkbox
                            checked={matrix[item.path]?.[role] ?? false}
                            onCheckedChange={() => toggleAccess(item.path, role)}
                            className="mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-muted/30 rounded-lg border border-border p-4">
        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" /> Resumo por Perfil
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ALL_ROLES.map((role) => (
            <div key={role} className="bg-card rounded border border-border px-2.5 py-1.5">
              <p className="text-[10px] font-medium text-foreground truncate">{SHORT_ROLE_LABELS[role]}</p>
              <p className="text-xs font-semibold text-primary">{countForRole(role)} menus</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
