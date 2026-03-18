import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth, UserRole, roleGroups, roleDefaultRoute } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DemoUser {
  label: string;
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  initials: string;
  stages: string;
  divisao?: string;
}

export const demoUsers: DemoUser[] = [
  // Entidade
  { label: "Representante da Entidade", email: "entidade@ende.co.ao", password: "entidade123", role: "Representante da Entidade", displayName: "Maria Costa", initials: "MC", stages: "Portal" },
  // Secretaria-Geral
  { label: "Técnico da Secretaria-Geral", email: "tec.secretaria@tca.gov.ao", password: "tec123", role: "Técnico da Secretaria-Geral", displayName: "João Silva", initials: "JS", stages: "Etapas 1, 2, 16" },
  { label: "Chefe da Secretaria-Geral", email: "chefe.secretaria@tca.gov.ao", password: "chefe123", role: "Chefe da Secretaria-Geral", displayName: "Rosa Tavares", initials: "RT", stages: "Etapa 3" },
  // Contadoria e Autuação
  { label: "Técnico da Contadoria Geral", email: "contadoria@tca.gov.ao", password: "contadoria123", role: "Técnico da Contadoria Geral", displayName: "Pedro Neto", initials: "PN", stages: "Etapa 4" },
  { label: "Escrivão dos Autos", email: "escrivao@tca.gov.ao", password: "escrivao123", role: "Escrivão dos Autos", displayName: "António Gomes", initials: "AG", stages: "Etapas 5, 15" },
  { label: "Contadoria Geral (Triagem)", email: "contadoria.geral@tca.gov.ao", password: "triagem123", role: "Contadoria Geral", displayName: "Teresa Machado", initials: "TM", stages: "Pós-Escrivão" },
  // Chefes de Divisão (3ª–8ª)
  { label: "Chefe 3ª Divisão", email: "chefe.div3@tca.gov.ao", password: "div3123", role: "Chefe de Divisão", displayName: "Fernanda Lopes", initials: "FL", stages: "3ª Divisão", divisao: "3ª Divisão" },
  { label: "Chefe 4ª Divisão", email: "chefe.div4@tca.gov.ao", password: "div4123", role: "Chefe de Divisão", displayName: "Ricardo Soares", initials: "RS", stages: "4ª Divisão", divisao: "4ª Divisão" },
  { label: "Chefe 5ª Divisão", email: "chefe.div5@tca.gov.ao", password: "div5123", role: "Chefe de Divisão", displayName: "Isabel Mendes", initials: "IM", stages: "5ª Divisão", divisao: "5ª Divisão" },
  { label: "Chefe 6ª Divisão", email: "chefe.div6@tca.gov.ao", password: "div6123", role: "Chefe de Divisão", displayName: "Paulo Henriques", initials: "PH", stages: "6ª Divisão", divisao: "6ª Divisão" },
  { label: "Chefe 7ª Divisão", email: "chefe.div7@tca.gov.ao", password: "div7123", role: "Chefe de Divisão", displayName: "Graça Tavares", initials: "GT", stages: "7ª Divisão", divisao: "7ª Divisão" },
  { label: "Chefe 8ª Divisão", email: "chefe.div8@tca.gov.ao", password: "div8123", role: "Chefe de Divisão", displayName: "Mário Santos", initials: "MS", stages: "8ª Divisão", divisao: "8ª Divisão" },
  // Chefes de Secção (3ª–8ª)
  { label: "Chefe Secção 3ª Div.", email: "chefe.sec3@tca.gov.ao", password: "sec3123", role: "Chefe de Secção", displayName: "Manuel Dias", initials: "MD", stages: "3ª Divisão", divisao: "3ª Divisão" },
  { label: "Chefe Secção 4ª Div.", email: "chefe.sec4@tca.gov.ao", password: "sec4123", role: "Chefe de Secção", displayName: "Ana Figueiredo", initials: "AF", stages: "4ª Divisão", divisao: "4ª Divisão" },
  { label: "Chefe Secção 5ª Div.", email: "chefe.sec5@tca.gov.ao", password: "sec5123", role: "Chefe de Secção", displayName: "Carlos Nunes", initials: "CN", stages: "5ª Divisão", divisao: "5ª Divisão" },
  { label: "Chefe Secção 6ª Div.", email: "chefe.sec6@tca.gov.ao", password: "sec6123", role: "Chefe de Secção", displayName: "Sofia Almeida", initials: "SA", stages: "6ª Divisão", divisao: "6ª Divisão" },
  { label: "Chefe Secção 7ª Div.", email: "chefe.sec7@tca.gov.ao", password: "sec7123", role: "Chefe de Secção", displayName: "Rui Ferreira", initials: "RF", stages: "7ª Divisão", divisao: "7ª Divisão" },
  { label: "Chefe Secção 8ª Div.", email: "chefe.sec8@tca.gov.ao", password: "sec8123", role: "Chefe de Secção", displayName: "Lúcia Cardoso", initials: "LC", stages: "8ª Divisão", divisao: "8ª Divisão" },
  // Análise e Coordenação
  { label: "Técnico de Análise", email: "tecnico@tca.gov.ao", password: "tecnico123", role: "Técnico de Análise", displayName: "Ana Ferreira", initials: "AF", stages: "Etapa 8" },
  { label: "Coordenador de Equipa", email: "coordenador@tca.gov.ao", password: "coord123", role: "Coordenador de Equipa", displayName: "Luís Pereira", initials: "LP", stages: "Etapas 6–10" },
  // Direcção e Magistratura
  { label: "Diretor dos Serviços Técnicos", email: "dst@tca.gov.ao", password: "dst123", role: "Diretor dos Serviços Técnicos", displayName: "Carlos Mendes", initials: "CM", stages: "Etapa 11" },
  { label: "Juiz Relator", email: "juiz.relator@tca.gov.ao", password: "juiz123", role: "Juiz Relator", displayName: "Dr. Alberto Sousa", initials: "AS", stages: "Etapas 12, 18" },
  { label: "Juiz Adjunto", email: "juiz.adjunto@tca.gov.ao", password: "adjunto123", role: "Juiz Adjunto", displayName: "Dra. Beatriz Faria", initials: "BF", stages: "Etapa 12" },
  { label: "Ministério Público", email: "mp@tca.gov.ao", password: "mp123", role: "Ministério Público", displayName: "Dr. Ricardo Alves", initials: "RA", stages: "Etapa 14" },
  // Custas, Diligências e Presidência
  { label: "Téc. Custas e Emolumentos", email: "custas@tca.gov.ao", password: "custas123", role: "Técnico da Secção de Custas e Emolumentos", displayName: "Helena Santos", initials: "HS", stages: "Etapa 13" },
  { label: "Oficial de Diligências", email: "oficial@tca.gov.ao", password: "oficial123", role: "Oficial de Diligências", displayName: "Jorge Baptista", initials: "JB", stages: "Etapa 17" },
  { label: "Presidente da Câmara", email: "presidente.camara@tca.gov.ao", password: "pcam123", role: "Presidente da Câmara", displayName: "Dr. Paulo Mendonça", initials: "PM", stages: "Supervisão" },
  { label: "Presidente do Tribunal", email: "presidente@tca.gov.ao", password: "ptc123", role: "Presidente do Tribunal de Contas", displayName: "Cons. Mariana Vaz", initials: "MV", stages: "Acesso total" },
  // Sistema
  { label: "Administrador do Sistema", email: "admin@tca.gov.ao", password: "admin123", role: "Administrador do Sistema", displayName: "Sysadmin TCA", initials: "SA", stages: "Acesso total" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = (user: DemoUser) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const matched = demoUsers.find((u) => u.email === email);
    setTimeout(() => {
      setLoading(false);
      if (matched) {
        login({
          email: matched.email,
          displayName: matched.displayName,
          role: matched.role,
          initials: matched.initials,
          divisao: matched.divisao,
        });
        navigate(roleDefaultRoute[matched.role]);
      }
    }, 600);
  };

  // Group demo users for display
  const getDemoUsersForGroup = (group: typeof roleGroups[0]) => {
    if ((group as any).showAllDemoUsers) {
      return demoUsers.filter(u => group.roles.includes(u.role));
    }
    return group.roles.map(roleName => demoUsers.find(u => u.role === roleName)).filter(Boolean) as DemoUser[];
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] sidebar-gradient flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo-tca.png" alt="TCA" className="h-12 w-12" />
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">República de Angola</p>
              <p className="text-sm font-semibold tracking-wide">Tribunal de Contas</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl font-bold leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
            Sistema de Prestação de Contas
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Plataforma integrada para a gestão e fiscalização das contas públicas,
            nos termos da Resolução n.º 1/17 de 5 de Janeiro.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">PGC</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] text-white/30">© Tribunal de Contas de Angola — Resolução nº 1/17</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/logo-tca.png" alt="TCA" className="h-10 w-10" />
          <div>
            <p className="text-xs text-muted-foreground">Tribunal de Contas de Angola</p>
            <p className="text-sm font-semibold text-foreground">Sistema de Prestação de Contas</p>
          </div>
        </div>

        <div className="w-full max-w-lg space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Iniciar Sessão</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione um perfil demo ou introduza as credenciais
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Perfis Demo — clique para preencher
            </p>
            <ScrollArea className="h-[320px] rounded-lg border border-border p-3">
              <div className="space-y-3">
                {roleGroups.map((group) => {
                  const users = getDemoUsersForGroup(group);
                  if (users.length === 0) return null;
                  return (
                    <div key={group.label}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {users.map((user) => (
                          <button
                            key={user.email}
                            type="button"
                            onClick={() => handleDemoLogin(user)}
                            className={`flex items-center gap-2 p-2 rounded-md border text-left transition-all hover:bg-accent/50 ${
                              email === user.email
                                ? "ring-2 ring-primary/40 bg-primary/5 border-primary/30"
                                : "border-border"
                            }`}
                          >
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                              {user.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate text-foreground">{user.label}</p>
                              <p className="text-[10px] text-muted-foreground">{user.stages}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="email@exemplo.gov.ao" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading || !email || !password}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  A autenticar...
                </span>
              ) : "Iniciar Sessão"}
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
            Sistema protegido com autenticação e controlo de acesso por perfil
          </p>
        </div>
      </div>
    </div>
  );
}
