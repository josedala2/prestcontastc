import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole =
  | "Representante da Entidade"
  | "Técnico da Secretaria-Geral"
  | "Chefe da Secretaria-Geral"
  | "Técnico da Contadoria Geral"
  | "Escrivão dos Autos"
  | "Chefe de Divisão"
  | "Chefe de Secção"
  | "Técnico de Análise"
  | "Coordenador de Equipa"
  | "Diretor dos Serviços Técnicos"
  | "Juiz Relator"
  | "Juiz Adjunto"
  | "Ministério Público"
  | "Técnico da Secção de Custas e Emolumentos"
  | "Oficial de Diligências"
  | "Presidente da Câmara"
  | "Presidente do Tribunal de Contas"
  | "Administrador do Sistema";

export interface AuthUser {
  email: string;
  displayName: string;
  role: UserRole;
  initials: string;
}

// Which workflow stages (1-18) each role can act on (advance/return)
export const roleStagePermissions: Record<UserRole, number[]> = {
  "Representante da Entidade": [],
  "Técnico da Secretaria-Geral": [1, 2, 16],
  "Chefe da Secretaria-Geral": [3],
  "Técnico da Contadoria Geral": [4],
  "Escrivão dos Autos": [5, 15],
  "Chefe de Divisão": [6, 10],
  "Chefe de Secção": [7, 9],
  "Técnico de Análise": [8],
  "Coordenador de Equipa": [6, 7, 8, 9, 10],
  "Diretor dos Serviços Técnicos": [11],
  "Juiz Relator": [12, 18],
  "Juiz Adjunto": [12],
  "Ministério Público": [14],
  "Técnico da Secção de Custas e Emolumentos": [13],
  "Oficial de Diligências": [17],
  "Presidente da Câmara": [12, 14, 18],
  "Presidente do Tribunal de Contas": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  "Administrador do Sistema": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
};

// Route permissions per role
export const rolePermissions: Record<UserRole, string[]> = {
  "Representante da Entidade": [
    "/portal", "/portal/exercicios", "/portal/prestacao-contas",
    "/portal/solicitacao-visto", "/portal/solicitacoes", "/portal/mapas",
    "/portal/esclarecimentos", "/portal/validacoes", "/portal/documentos",
  ],
  "Técnico da Secretaria-Geral": [
    "/secretaria", "/submissoes", "/actas-recepcao", "/entidades",
    "/gestao-processos", "/mapas", "/relatorios", "/anexos",
  ],
  "Chefe da Secretaria-Geral": [
    "/secretaria", "/submissoes", "/actas-recepcao", "/entidades",
    "/gestao-processos", "/mapas", "/relatorios", "/anexos",
  ],
  "Técnico da Contadoria Geral": [
    "/contadoria", "/contadoria/verificacao", "/contadoria/documentos",
    "/contadoria/esclarecimentos", "/contadoria/processos",
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/documentos-obrigatorios", "/esclarecimentos", "/mapas", "/relatorios",
  ],
  "Escrivão dos Autos": [
    "/dashboard", "/gestao-processos", "/entidades", "/submissoes",
    "/actas-recepcao", "/documentos-obrigatorios", "/escrivao/registo-autuacao",
  ],
  "Chefe de Divisão": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/anexos", "/documentos-obrigatorios",
    "/chefe-divisao/processos",
  ],
  "Chefe de Secção": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/documentos-obrigatorios",
  ],
  "Técnico de Análise": [
    "/tecnico", "/tecnico/prestacao-contas", "/tecnico/exercicios",
    "/tecnico/documentos", "/tecnico/mapas", "/tecnico/esclarecimentos",
    "/tecnico/validacoes", "/gestao-processos",
  ],
  "Coordenador de Equipa": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/anexos", "/documentos-obrigatorios",
    "/esclarecimentos", "/auditoria",
  ],
  "Diretor dos Serviços Técnicos": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/relatorios", "/mapas", "/anexos",
    "/documentos-obrigatorios", "/esclarecimentos", "/auditoria",
  ],
  "Juiz Relator": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/relatorios", "/mapas", "/anexos",
    "/documentos-obrigatorios", "/auditoria", "/processos-visto",
  ],
  "Juiz Adjunto": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/documentos-obrigatorios",
  ],
  "Ministério Público": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/documentos-obrigatorios", "/auditoria",
  ],
  "Técnico da Secção de Custas e Emolumentos": [
    "/dashboard", "/gestao-processos", "/submissoes", "/entidades",
  ],
  "Oficial de Diligências": [
    "/dashboard", "/gestao-processos", "/entidades",
  ],
  "Presidente da Câmara": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/processos-visto", "/relatorios", "/mapas", "/anexos",
    "/actas-recepcao", "/documentos-obrigatorios", "/auditoria",
  ],
  "Presidente do Tribunal de Contas": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/processos-visto", "/relatorios", "/mapas", "/anexos",
    "/actas-recepcao", "/documentos-obrigatorios", "/auditoria", "/esclarecimentos",
    "/configuracoes",
  ],
  "Administrador do Sistema": [
    "/dashboard", "/entidades", "/exercicios", "/importacao", "/plano-contas",
    "/validacoes", "/relatorios", "/mapas", "/anexos", "/actas-recepcao",
    "/documentos-obrigatorios", "/auditoria", "/esclarecimentos", "/configuracoes",
    "/submissoes", "/processos-visto", "/gestao-processos", "/secretaria", "/portal", "/tecnico",
  ],
};

// Sidebar sections visible per role
export const roleSidebarSections: Record<UserRole, string[]> = {
  "Representante da Entidade": [],
  "Técnico da Secretaria-Geral": ["Principal", "Relatórios", "Dossiê"],
  "Chefe da Secretaria-Geral": ["Principal", "Relatórios", "Dossiê"],
  "Técnico da Contadoria Geral": ["Principal", "Relatórios", "Dossiê"],
  "Escrivão dos Autos": ["Principal", "Dossiê", "Acesso Externo"],
  "Chefe de Divisão": ["Principal", "Relatórios", "Dossiê"],
  "Chefe de Secção": ["Principal", "Relatórios", "Dossiê"],
  "Técnico de Análise": [],
  "Coordenador de Equipa": ["Principal", "Relatórios", "Dossiê"],
  "Diretor dos Serviços Técnicos": ["Principal", "Relatórios", "Dossiê"],
  "Juiz Relator": ["Principal", "Relatórios", "Dossiê"],
  "Juiz Adjunto": ["Principal", "Relatórios", "Dossiê"],
  "Ministério Público": ["Principal", "Relatórios", "Dossiê"],
  "Técnico da Secção de Custas e Emolumentos": ["Principal"],
  "Oficial de Diligências": ["Principal"],
  "Presidente da Câmara": ["Principal", "Relatórios", "Dossiê"],
  "Presidente do Tribunal de Contas": ["Principal", "Relatórios", "Dossiê", "Sistema"],
  "Administrador do Sistema": ["Principal", "Dados", "Relatórios", "Dossiê", "Acesso Externo", "Sistema"],
};

// Sidebar items hidden per role (paths)
export const roleHiddenPaths: Record<UserRole, string[]> = {
  "Representante da Entidade": ["/gestao-processos", "/atividades"],
  "Técnico da Secretaria-Geral": [
    "/dashboard", "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/processos-visto",
    "/submissoes/manual", "/auditoria", "/gestao-processos", "/atividades",
  ],
  "Chefe da Secretaria-Geral": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/processos-visto",
    "/submissoes/manual", "/gestao-processos", "/atividades",
  ],
  "Técnico da Contadoria Geral": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao", "/auditoria", "/anexos",
    "/gestao-processos", "/atividades",
  ],
  "Escrivão dos Autos": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/relatorios", "/mapas",
    "/anexos", "/esclarecimentos", "/auditoria", "/gestao-processos", "/atividades",
  ],
  "Chefe de Divisão": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/esclarecimentos", "/auditoria", "/gestao-processos", "/atividades",
  ],
  "Chefe de Secção": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/anexos", "/esclarecimentos", "/auditoria", "/gestao-processos", "/atividades",
  ],
  "Técnico de Análise": ["/gestao-processos", "/atividades"],
  "Coordenador de Equipa": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/gestao-processos", "/atividades",
  ],
  "Diretor dos Serviços Técnicos": [
    "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/gestao-processos", "/atividades",
  ],
  "Juiz Relator": [
    "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/submissoes/manual", "/esclarecimentos", "/actas-recepcao",
    "/gestao-processos", "/atividades",
  ],
  "Juiz Adjunto": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/anexos", "/esclarecimentos", "/auditoria", "/gestao-processos", "/atividades",
  ],
  "Ministério Público": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/anexos", "/esclarecimentos", "/gestao-processos", "/atividades",
  ],
  "Técnico da Secção de Custas e Emolumentos": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
    "/relatorios", "/mapas", "/anexos", "/documentos-obrigatorios",
    "/esclarecimentos", "/auditoria", "/gestao-processos", "/atividades",
  ],
  "Oficial de Diligências": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/submissoes",
    "/actas-recepcao", "/relatorios", "/mapas", "/anexos",
    "/documentos-obrigatorios", "/esclarecimentos", "/auditoria",
    "/gestao-processos", "/atividades",
  ],
  "Presidente da Câmara": [
    "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/submissoes/manual", "/esclarecimentos", "/gestao-processos", "/atividades",
  ],
  "Presidente do Tribunal de Contas": [
    "/importacao", "/plano-contas", "/validacoes",
    "/portal", "/tecnico", "/secretaria", "/submissoes/manual",
    "/gestao-processos", "/atividades",
  ],
  "Administrador do Sistema": [],
};

// Role groups for UI display
export const roleGroups = [
  {
    label: "Entidade",
    roles: ["Representante da Entidade"],
  },
  {
    label: "Secretaria-Geral",
    roles: ["Técnico da Secretaria-Geral", "Chefe da Secretaria-Geral"],
  },
  {
    label: "Contadoria e Autuação",
    roles: ["Técnico da Contadoria Geral", "Escrivão dos Autos"],
  },
  {
    label: "Divisão / Secção / Análise",
    roles: ["Chefe de Divisão", "Chefe de Secção", "Técnico de Análise", "Coordenador de Equipa"],
  },
  {
    label: "Direcção e Magistratura",
    roles: ["Diretor dos Serviços Técnicos", "Juiz Relator", "Juiz Adjunto", "Ministério Público"],
  },
  {
    label: "Custas, Diligências e Presidência",
    roles: ["Técnico da Secção de Custas e Emolumentos", "Oficial de Diligências", "Presidente da Câmara", "Presidente do Tribunal de Contas"],
  },
  {
    label: "Sistema",
    roles: ["Administrador do Sistema"],
  },
];

// Default route for each role after login
export const roleDefaultRoute: Record<UserRole, string> = {
  "Representante da Entidade": "/portal",
  "Técnico da Secretaria-Geral": "/secretaria",
  "Chefe da Secretaria-Geral": "/secretaria",
  "Técnico da Contadoria Geral": "/contadoria",
  "Escrivão dos Autos": "/dashboard",
  "Chefe de Divisão": "/dashboard",
  "Chefe de Secção": "/dashboard",
  "Técnico de Análise": "/tecnico",
  "Coordenador de Equipa": "/dashboard",
  "Diretor dos Serviços Técnicos": "/dashboard",
  "Juiz Relator": "/dashboard",
  "Juiz Adjunto": "/dashboard",
  "Ministério Público": "/dashboard",
  "Técnico da Secção de Custas e Emolumentos": "/dashboard",
  "Oficial de Diligências": "/dashboard",
  "Presidente da Câmara": "/dashboard",
  "Presidente do Tribunal de Contas": "/dashboard",
  "Administrador do Sistema": "/dashboard",
};

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  canAccess: (path: string) => boolean;
  canActOnStage: (stageId: number) => boolean;
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
    return perms.some(p => path === p || path.startsWith(p + "/"));
  };

  const canActOnStage = (stageId: number): boolean => {
    if (!user) return false;
    return roleStagePermissions[user.role].includes(stageId);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess, canActOnStage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
