import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = 
  | "Administrador"
  | "Técnico Validador"
  | "Auditor / Fiscal TCA"
  | "Secretaria"
  | "Preparador / Contabilista";

export interface AuthUser {
  email: string;
  displayName: string;
  role: UserRole;
  initials: string;
}

// Define which routes each role can access
export const rolePermissions: Record<UserRole, string[]> = {
  "Administrador": [
    "/dashboard", "/entidades", "/exercicios", "/importacao", "/plano-contas",
    "/validacoes", "/relatorios", "/mapas", "/anexos", "/actas-recepcao",
    "/documentos-obrigatorios", "/auditoria", "/esclarecimentos", "/configuracoes",
    "/submissoes", "/processos-visto", "/secretaria", "/portal", "/tecnico",
  ],
  "Técnico Validador": [
    "/tecnico", "/tecnico/prestacao-contas", "/tecnico/exercicios",
    "/tecnico/documentos", "/tecnico/mapas", "/tecnico/esclarecimentos",
    "/tecnico/validacoes",
  ],
  "Auditor / Fiscal TCA": [
    "/dashboard", "/entidades", "/exercicios", "/relatorios", "/mapas",
    "/anexos", "/auditoria", "/documentos-obrigatorios", "/actas-recepcao",
    "/esclarecimentos", "/submissoes", "/processos-visto",
  ],
  "Secretaria": [
    "/secretaria", "/submissoes", "/actas-recepcao", "/entidades",
  ],
  "Preparador / Contabilista": [
    "/portal", "/portal/exercicios", "/portal/prestacao-contas",
    "/portal/solicitacao-visto", "/portal/solicitacoes", "/portal/mapas",
    "/portal/esclarecimentos", "/portal/validacoes", "/portal/documentos",
  ],
};

// Sidebar sections visible per role
export const roleSidebarSections: Record<UserRole, string[]> = {
  "Administrador": ["Principal", "Dados", "Relatórios", "Dossiê", "Acesso Externo", "Sistema"],
  "Técnico Validador": [],
  "Auditor / Fiscal TCA": ["Principal", "Relatórios", "Dossiê"],
  "Secretaria": ["Principal", "Dossiê"],
  "Preparador / Contabilista": [],
};

// Sidebar items hidden per role (paths)
export const roleHiddenPaths: Record<UserRole, string[]> = {
  "Administrador": [],
  "Técnico Validador": [],
  "Auditor / Fiscal TCA": [
    "/importacao", "/plano-contas", "/validacoes", "/configuracoes",
    "/portal", "/tecnico", "/secretaria", "/submissoes/manual",
  ],
  "Secretaria": [],
  "Preparador / Contabilista": [],
};

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem("auth_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (u: AuthUser) => {
    setUser(u);
    sessionStorage.setItem("auth_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("auth_user");
  };

  const canAccess = (path: string): boolean => {
    if (!user) return false;
    const perms = rolePermissions[user.role];
    // Check if path starts with any allowed route
    return perms.some(p => path === p || path.startsWith(p + "/"));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
