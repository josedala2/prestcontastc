import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Eye, EyeOff, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth, roleDefaultRoute } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DemoUser {
  email: string;
  password: string;
  label: string;
  shortLabel: string;
  divisao?: string;
}

interface DemoGroup {
  label: string;
  users: DemoUser[];
}

const DEMO_GROUPS: DemoGroup[] = [
  {
    label: "Entidade",
    users: [
      { email: "entidade@demo.tca.ao", password: "demo123456", label: "Representante da Entidade", shortLabel: "Entidade" },
    ],
  },
  {
    label: "Secretaria-Geral",
    users: [
      { email: "secretaria@demo.tca.ao", password: "demo123456", label: "Técnico da Secretaria-Geral", shortLabel: "Téc. Secretaria" },
      { email: "chefe.secretaria@demo.tca.ao", password: "demo123456", label: "Chefe da Secretaria-Geral", shortLabel: "Ch. Secretaria" },
    ],
  },
  {
    label: "Contadoria e Autuação",
    users: [
      { email: "contadoria@demo.tca.ao", password: "demo123456", label: "Técnico da Contadoria Geral", shortLabel: "Téc. Contadoria" },
      { email: "escrivao@demo.tca.ao", password: "demo123456", label: "Escrivão dos Autos", shortLabel: "Escrivão" },
      { email: "contadoria.geral@demo.tca.ao", password: "demo123456", label: "Contadoria Geral", shortLabel: "Cont. Geral" },
    ],
  },
  {
    label: "3ª Divisão",
    users: [
      { email: "chefe.divisao@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão", divisao: "3ª Divisão" },
      { email: "chefe.seccao@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção", divisao: "3ª Divisão" },
    ],
  },
  {
    label: "4ª Divisão",
    users: [
      { email: "chefe.divisao4@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão", divisao: "4ª Divisão" },
      { email: "chefe.seccao4@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção", divisao: "4ª Divisão" },
    ],
  },
  {
    label: "5ª Divisão",
    users: [
      { email: "chefe.divisao5@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão", divisao: "5ª Divisão" },
      { email: "chefe.seccao5@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção", divisao: "5ª Divisão" },
      { email: "tecnico.analise5@demo.tca.ao", password: "demo123456", label: "Técnico de Análise", shortLabel: "Téc. Análise", divisao: "5ª Divisão" },
    ],
  },
  {
    label: "6ª Divisão",
    users: [
      { email: "chefe.divisao6@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão", divisao: "6ª Divisão" },
      { email: "chefe.seccao6@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção", divisao: "6ª Divisão" },
    ],
  },
  {
    label: "7ª Divisão",
    users: [
      { email: "chefe.divisao7@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão", divisao: "7ª Divisão" },
      { email: "chefe.seccao7@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção", divisao: "7ª Divisão" },
    ],
  },
  {
    label: "8ª Divisão",
    users: [
      { email: "chefe.divisao8@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão", divisao: "8ª Divisão" },
      { email: "chefe.seccao8@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção", divisao: "8ª Divisão" },
    ],
  },
  {
    label: "Análise e Coordenação",
    users: [
      { email: "tecnico.analise@demo.tca.ao", password: "demo123456", label: "Técnico de Análise", shortLabel: "Téc. Análise" },
      { email: "coordenador@demo.tca.ao", password: "demo123456", label: "Coordenador de Equipa", shortLabel: "Coordenador" },
    ],
  },
  {
    label: "Direcção e Magistratura",
    users: [
      { email: "dst@demo.tca.ao", password: "demo123456", label: "Diretor dos Serviços Técnicos", shortLabel: "DST" },
      { email: "juiz.relator@demo.tca.ao", password: "demo123456", label: "Juiz Relator", shortLabel: "Juiz Relator" },
      { email: "juiz.adjunto@demo.tca.ao", password: "demo123456", label: "Juiz Adjunto", shortLabel: "Juiz Adjunto" },
      { email: "mp@demo.tca.ao", password: "demo123456", label: "Ministério Público", shortLabel: "Min. Público" },
    ],
  },
  {
    label: "Custas, Diligências e Presidência",
    users: [
      { email: "custas@demo.tca.ao", password: "demo123456", label: "Téc. Custas e Emolumentos", shortLabel: "Custas" },
      { email: "diligencias@demo.tca.ao", password: "demo123456", label: "Oficial de Diligências", shortLabel: "Diligências" },
      { email: "presidente.camara@demo.tca.ao", password: "demo123456", label: "Presidente da Câmara", shortLabel: "Pres. Câmara" },
      { email: "presidente@demo.tca.ao", password: "demo123456", label: "Presidente do Tribunal de Contas", shortLabel: "Presidente TCA" },
    ],
  },
  {
    label: "Sistema",
    users: [
      { email: "admin@demo.tca.ao", password: "demo123456", label: "Administrador do Sistema", shortLabel: "Admin" },
    ],
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(roleDefaultRoute[user.role] || "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(true);

  const handleDemoFill = (demo: DemoUser) => {
    setLoginEmail(demo.email);
    setLoginPassword(demo.password);
    toast.info(`Credenciais preenchidas: ${demo.label}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Autenticado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Credenciais inválidas.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-[hsl(213,100%,18%)] via-[hsl(243,31%,22%)] to-[hsl(213,100%,12%)] text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[hsl(37,56%,52%)] blur-3xl" />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <img src="/logo-tca.png" alt="TCA" className="h-24 mx-auto drop-shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tribunal de Contas
            </h1>
            <p className="text-lg text-white/80 mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              República de Angola
            </p>
          </div>
          <div className="w-16 h-0.5 bg-[hsl(37,56%,52%)] mx-auto" />
          <p className="text-sm text-white/60 max-w-xs">
            Sistema Integrado de Prestação de Contas e Tramitação Processual
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-auto">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center lg:hidden mb-6">
            <img src="/logo-tca.png" alt="TCA" className="h-16 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tribunal de Contas de Angola
            </h1>
          </div>

          <div className="text-center mb-2">
            <h2 className="text-lg font-semibold text-foreground">Autenticação</h2>
            <p className="text-xs text-muted-foreground">Introduza as suas credenciais para aceder ao sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-email" className="text-xs">Email institucional</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="utilizador@tca.gov.ao"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="login-password" className="text-xs">Palavra-passe</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showLoginPw ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw(!showLoginPw)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loginLoading}>
              {loginLoading ? "A autenticar..." : "Entrar no Sistema"}
            </Button>
          </form>

          {/* Demo Users Section */}
          <div className="mt-4 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowDemoUsers(!showDemoUsers)}
              className="flex items-center gap-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">Utilizadores Demo</span>
              {showDemoUsers ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
            </button>
            
            {showDemoUsers && (
              <ScrollArea className="mt-3 h-[280px] rounded-md border bg-muted/30 p-2">
                <div className="space-y-2">
                  {DEMO_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {group.users.map((demo) => (
                          <button
                            key={demo.email}
                            type="button"
                            onClick={() => handleDemoFill(demo)}
                            className="text-left px-2.5 py-1.5 rounded-md text-[11px] leading-tight border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                            title={`${demo.label}${demo.divisao ? ` — ${demo.divisao}` : ''}\n${demo.email}`}
                          >
                            <span className="font-medium block truncate">{demo.shortLabel}</span>
                            {demo.divisao && (
                              <span className="text-primary/70 text-[9px] block truncate">{demo.divisao}</span>
                            )}
                            <span className="text-muted-foreground text-[10px] block truncate">{demo.email}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Sistema protegido · Acesso restrito a utilizadores autorizados
          </p>
        </div>
      </div>
    </div>
  );
}
