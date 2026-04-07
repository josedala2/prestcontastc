import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole =
  | "Representante da Entidade"
  | "Técnico da Secretaria-Geral"
  | "Chefe da Secretaria-Geral"
  | "Técnico da Contadoria Geral"
  | "Escrivão dos Autos"
  | "Contadoria Geral"
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
  divisao?: string; // e.g. "3ª Divisão", used to scope Chefe de Divisão / Secção
}

// Which workflow stages (1-18) each role can act on (advance/return)
export const roleStagePermissions: Record<UserRole, number[]> = {
  "Representante da Entidade": [],
  "Técnico da Secretaria-Geral": [1, 2, 16],
  "Chefe da Secretaria-Geral": [3],
  "Técnico da Contadoria Geral": [4],
  "Escrivão dos Autos": [5, 15],
  "Contadoria Geral": [6],
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
  "Presidente da Câmara": [12, 18],
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
    "/secretaria/oficio-remessa",
  ],
  "Chefe da Secretaria-Geral": [
    "/dashboard", "/secretaria", "/submissoes", "/actas-recepcao", "/entidades",
    "/gestao-processos", "/mapas", "/relatorios", "/anexos",
    "/secretaria/oficio-remessa",
  ],
  "Técnico da Contadoria Geral": [
    "/contadoria", "/contadoria/verificacao", "/contadoria/documentos",
    "/contadoria/esclarecimentos", "/contadoria/processos",
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/documentos-obrigatorios", "/esclarecimentos", "/mapas", "/relatorios",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/novo",
    "/emolumentos/solicitacoes", "/emolumentos/reclamacoes",
    "/emolumentos/reconciliacao", "/emolumentos/relatorios",
  ],
  "Escrivão dos Autos": [
    "/dashboard", "/gestao-processos", "/entidades", "/submissoes",
    "/actas-recepcao", "/documentos-obrigatorios", "/escrivao/registo-autuacao",
    "/escrivao/cumprimento-despachos",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/novo",
  ],
  "Contadoria Geral": [
    "/dashboard", "/gestao-processos", "/entidades", "/submissoes",
    "/documentos-obrigatorios", "/contadoria-geral/triagem",
    "/mapas", "/relatorios",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/novo",
    "/emolumentos/solicitacoes", "/emolumentos/reclamacoes",
    "/emolumentos/cobranca-coerciva",
    "/emolumentos/reconciliacao", "/emolumentos/relatorios",
  ],
  "Chefe de Divisão": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/anexos", "/documentos-obrigatorios",
    "/chefe-divisao/processos", "/chefe-divisao/validacao",
  ],
  "Chefe de Secção": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/documentos-obrigatorios",
    "/chefe-seccao/distribuicao", "/chefe-seccao/validacao",
  ],
  "Técnico de Análise": [
    "/tecnico", "/tecnico/prestacao-contas", "/tecnico/exercicios",
    "/tecnico/documentos", "/tecnico/mapas", "/tecnico/esclarecimentos",
    "/tecnico/validacoes", "/gestao-processos", "/analise-tecnica",
  ],
  "Coordenador de Equipa": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/anexos", "/documentos-obrigatorios",
    "/esclarecimentos", "/auditoria", "/analise-tecnica",
  ],
  "Diretor dos Serviços Técnicos": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/relatorios", "/mapas", "/anexos",
    "/documentos-obrigatorios", "/esclarecimentos", "/auditoria",
    "/dst/controle-qualidade",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/relatorios",
  ],
  "Juiz Relator": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/relatorios", "/mapas", "/anexos",
    "/documentos-obrigatorios", "/auditoria", "/processos-visto",
    "/juiz/decisao", "/juiz/arquivamento",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/reclamacoes", "/emolumentos/relatorios",
  ],
  "Juiz Adjunto": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/documentos-obrigatorios",
    "/juiz/decisao",
  ],
  "Ministério Público": [
    "/dashboard", "/entidades", "/gestao-processos", "/submissoes",
    "/relatorios", "/mapas", "/documentos-obrigatorios", "/auditoria",
    "/ministerio-publico/despacho",
  ],
  "Técnico da Secção de Custas e Emolumentos": [
    "/dashboard", "/gestao-processos", "/submissoes", "/entidades",
    "/custas/emolumentos",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/novo",
    "/emolumentos/reclamacoes", "/emolumentos/cobranca-coerciva",
    "/emolumentos/reconciliacao", "/emolumentos/relatorios",
  ],
  "Oficial de Diligências": [
    "/dashboard", "/gestao-processos", "/entidades",
    "/diligencias/expediente-saida",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/cobranca-coerciva",
  ],
  "Presidente da Câmara": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/processos-visto", "/relatorios", "/mapas", "/anexos",
    "/actas-recepcao", "/documentos-obrigatorios", "/auditoria",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/reclamacoes", "/emolumentos/relatorios",
  ],
  "Presidente do Tribunal de Contas": [
    "/dashboard", "/entidades", "/exercicios", "/gestao-processos",
    "/submissoes", "/processos-visto", "/relatorios", "/mapas", "/anexos",
    "/actas-recepcao", "/documentos-obrigatorios", "/auditoria", "/esclarecimentos",
    "/configuracoes",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/reclamacoes",
    "/emolumentos/reconciliacao", "/emolumentos/relatorios",
  ],
  "Administrador do Sistema": [
    "/dashboard", "/entidades", "/exercicios", "/importacao", "/plano-contas",
    "/validacoes", "/relatorios", "/mapas", "/anexos", "/actas-recepcao",
    "/documentos-obrigatorios", "/auditoria", "/esclarecimentos", "/configuracoes",
    "/submissoes", "/processos-visto", "/gestao-processos", "/secretaria", "/portal", "/tecnico",
    "/contadoria-geral/triagem",
    "/emolumentos", "/emolumentos/lista", "/emolumentos/novo",
    "/emolumentos/reclamacoes", "/emolumentos/cobranca-coerciva",
    "/emolumentos/reconciliacao", "/emolumentos/relatorios",
    "/custas/emolumentos",
  ],
};

// Sidebar sections visible per role
export const roleSidebarSections: Record<UserRole, string[]> = {
  "Representante da Entidade": [],
  "Técnico da Secretaria-Geral": ["Principal", "Relatórios", "Dossiê", "Acesso Externo"],
  "Chefe da Secretaria-Geral": ["Principal", "Relatórios", "Dossiê", "Acesso Externo"],
  "Técnico da Contadoria Geral": ["Principal", "Relatórios", "Dossiê", "Emolumentos"],
  "Escrivão dos Autos": ["Principal", "Dossiê", "Emolumentos", "Acesso Externo"],
  "Contadoria Geral": ["Principal", "Relatórios", "Dossiê", "Emolumentos", "Acesso Externo"],
  "Chefe de Divisão": ["Principal", "Relatórios", "Dossiê", "Acesso Externo"],
  "Chefe de Secção": ["Principal", "Relatórios", "Dossiê", "Acesso Externo"],
  "Técnico de Análise": ["Acesso Externo"],
  "Coordenador de Equipa": ["Principal", "Relatórios", "Dossiê"],
  "Diretor dos Serviços Técnicos": ["Principal", "Relatórios", "Dossiê", "Emolumentos", "Acesso Externo"],
  "Juiz Relator": ["Principal", "Relatórios", "Dossiê", "Emolumentos", "Acesso Externo"],
  "Juiz Adjunto": ["Principal", "Relatórios", "Dossiê", "Acesso Externo"],
  "Ministério Público": ["Principal", "Relatórios", "Dossiê", "Acesso Externo"],
  "Técnico da Secção de Custas e Emolumentos": ["Principal", "Emolumentos", "Acesso Externo"],
  "Oficial de Diligências": ["Principal", "Emolumentos", "Acesso Externo"],
  "Presidente da Câmara": ["Principal", "Relatórios", "Dossiê", "Emolumentos"],
  "Presidente do Tribunal de Contas": ["Principal", "Relatórios", "Dossiê", "Emolumentos", "Sistema"],
  "Administrador do Sistema": ["Principal", "Dados", "Relatórios", "Dossiê", "Emolumentos", "Acesso Externo", "Sistema"],
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
  "Contadoria Geral": [
    "/exercicios", "/importacao", "/plano-contas", "/validacoes",
    "/configuracoes", "/portal", "/tecnico", "/secretaria",
    "/processos-visto", "/submissoes/manual", "/actas-recepcao",
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
    roles: ["Técnico da Contadoria Geral", "Escrivão dos Autos", "Contadoria Geral"],
  },
  {
    label: "Chefes de Divisão (3ª–8ª)",
    roles: ["Chefe de Divisão"],
    showAllDemoUsers: true,
  },
  {
    label: "Chefes de Secção (3ª–8ª)",
    roles: ["Chefe de Secção"],
    showAllDemoUsers: true,
  },
  {
    label: "Análise e Coordenação",
    roles: ["Técnico de Análise", "Coordenador de Equipa"],
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
  "Contadoria Geral": "/contadoria-geral/triagem",
  "Chefe de Divisão": "/chefe-divisao/processos",
  "Chefe de Secção": "/chefe-seccao/distribuicao",
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

// Divisions 3-8 with their sections
export const DIVISOES_ESTRUTURA: Record<string, { nome: string; seccoes: string[] }> = {
  "3ª Divisão": {
    nome: "3ª Divisão — Órgãos de Soberania e Afins",
    seccoes: ["Secção A — Presidência e Assembleia", "Secção B — Tribunais e MP"],
  },
  "4ª Divisão": {
    nome: "4ª Divisão — Administração Central e Institutos",
    seccoes: ["Secção A — Ministérios", "Secção B — Institutos Públicos"],
  },
  "5ª Divisão": {
    nome: "5ª Divisão — Administração Local (Municípios)",
    seccoes: ["Secção A — Administrações Municipais I", "Secção B — Administrações Municipais II"],
  },
  "6ª Divisão": {
    nome: "6ª Divisão — Sector Empresarial Público",
    seccoes: ["Secção A — Empresas Públicas", "Secção B — Sociedades Comerciais do Estado", "Secção C — Fundos e Serviços Autónomos"],
  },
  "7ª Divisão": {
    nome: "7ª Divisão — Serviços no Estrangeiro",
    seccoes: ["Secção A — Embaixadas e Consulados", "Secção B — Missões e Representações"],
  },
  "8ª Divisão": {
    nome: "8ª Divisão — Contas Especiais",
    seccoes: ["Secção A — Contas Especiais I", "Secção B — Contas Especiais II"],
  },
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nomeCompleto: string, cargo: UserRole, divisao?: string) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (path: string) => boolean;
  canActOnStage: (stageId: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "U";

  const applyUser = useCallback((email: string, role?: string | null, displayName?: string | null, divisao?: string | null) => {
    if (!role) return false;

    const safeRole = role as UserRole;
    const safeName = displayName || email;

    setUser({
      email,
      displayName: safeName,
      role: safeRole,
      initials: getInitials(safeName),
      divisao: divisao || undefined,
    });

    return true;
  }, []);

  const loadProfile = useCallback(async (userId: string, email: string, metadata?: Record<string, any>) => {
    try {
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Auto-create profile if it doesn't exist (first login after signup)
      if (!profile) {
        const nomeCompleto = metadata?.nome_completo || email.split("@")[0];
        const cargo = metadata?.cargo || null;
        const divisao = metadata?.divisao || null;
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            nome_completo: nomeCompleto,
            email,
            cargo,
            divisao,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Erro ao criar perfil:", insertError);
        }

        profile = newProfile;
      }

      if (profile) {
        if (applyUser(email, profile.cargo, profile.nome_completo, profile.divisao)) {
          return;
        }
      }

      // Fallback to auth metadata when profile read/creation is delayed or fails transiently
      if (applyUser(email, metadata?.cargo, metadata?.nome_completo, metadata?.divisao)) {
        return;
      }

      setUser(null);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);

      if (!applyUser(email, metadata?.cargo, metadata?.nome_completo, metadata?.divisao)) {
        setUser(null);
      }
    }
  }, [applyUser]);

  useEffect(() => {
    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            await loadProfile(session.user.id, session.user.email || "", session.user.user_metadata);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // 2. Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      // onAuthStateChange will handle setting the user if session exists
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, nomeCompleto: string, cargo: UserRole, divisao?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome_completo: nomeCompleto, cargo, divisao: divisao || null },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const canAccess = (path: string): boolean => {
    if (!user) return false;
    const perms = rolePermissions[user.role];
    if (!perms) return false;
    return perms.some(p => path === p || path.startsWith(p + "/"));
  };

  const canActOnStage = (stageId: number): boolean => {
    if (!user) return false;
    const stages = roleStagePermissions[user.role];
    if (!stages) return false;
    return stages.includes(stageId);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, canAccess, canActOnStage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
