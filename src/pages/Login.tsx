import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Eye, EyeOff, User, LogIn, UserPlus, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth, UserRole, roleDefaultRoute } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALL_ROLES: UserRole[] = [
  "Administrador do Sistema",
  "Representante da Entidade",
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
];

const DIVISOES = ["3ª Divisão", "4ª Divisão", "5ª Divisão", "6ª Divisão", "7ª Divisão", "8ª Divisão"];

interface DemoUser {
  email: string;
  password: string;
  label: string;
  shortLabel: string;
}

const DEMO_USERS: DemoUser[] = [
  { email: "admin@demo.tca.ao", password: "demo123456", label: "Administrador do Sistema", shortLabel: "Admin" },
  { email: "entidade@demo.tca.ao", password: "demo123456", label: "Representante da Entidade", shortLabel: "Entidade" },
  { email: "secretaria@demo.tca.ao", password: "demo123456", label: "Técnico da Secretaria-Geral", shortLabel: "Téc. Secretaria" },
  { email: "chefe.secretaria@demo.tca.ao", password: "demo123456", label: "Chefe da Secretaria-Geral", shortLabel: "Ch. Secretaria" },
  { email: "contadoria@demo.tca.ao", password: "demo123456", label: "Técnico da Contadoria Geral", shortLabel: "Téc. Contadoria" },
  { email: "escrivao@demo.tca.ao", password: "demo123456", label: "Escrivão dos Autos", shortLabel: "Escrivão" },
  { email: "contadoria.geral@demo.tca.ao", password: "demo123456", label: "Contadoria Geral", shortLabel: "Cont. Geral" },
  { email: "chefe.divisao@demo.tca.ao", password: "demo123456", label: "Chefe de Divisão", shortLabel: "Ch. Divisão" },
  { email: "chefe.seccao@demo.tca.ao", password: "demo123456", label: "Chefe de Secção", shortLabel: "Ch. Secção" },
  { email: "tecnico.analise@demo.tca.ao", password: "demo123456", label: "Técnico de Análise", shortLabel: "Téc. Análise" },
  { email: "coordenador@demo.tca.ao", password: "demo123456", label: "Coordenador de Equipa", shortLabel: "Coordenador" },
  { email: "dst@demo.tca.ao", password: "demo123456", label: "Diretor dos Serviços Técnicos", shortLabel: "DST" },
  { email: "juiz.relator@demo.tca.ao", password: "demo123456", label: "Juiz Relator", shortLabel: "Juiz Relator" },
  { email: "juiz.adjunto@demo.tca.ao", password: "demo123456", label: "Juiz Adjunto", shortLabel: "Juiz Adjunto" },
  { email: "mp@demo.tca.ao", password: "demo123456", label: "Ministério Público", shortLabel: "Min. Público" },
  { email: "custas@demo.tca.ao", password: "demo123456", label: "Téc. Custas e Emolumentos", shortLabel: "Custas" },
  { email: "diligencias@demo.tca.ao", password: "demo123456", label: "Oficial de Diligências", shortLabel: "Diligências" },
  { email: "presidente.camara@demo.tca.ao", password: "demo123456", label: "Presidente da Câmara", shortLabel: "Pres. Câmara" },
  { email: "presidente@demo.tca.ao", password: "demo123456", label: "Presidente do Tribunal de Contas", shortLabel: "Presidente TCA" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(roleDefaultRoute[user.role] || "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupNome, setSignupNome] = useState("");
  const [signupCargo, setSignupCargo] = useState<UserRole>("Técnico da Secretaria-Geral");
  const [signupDivisao, setSignupDivisao] = useState<string>("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const needsDivisao = signupCargo === "Chefe de Divisão" || signupCargo === "Chefe de Secção";

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupNome) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (needsDivisao && !signupDivisao) {
      toast.error("Seleccione a divisão.");
      return;
    }
    setSignupLoading(true);
    try {
      await signup(signupEmail, signupPassword, signupNome, signupCargo, needsDivisao ? signupDivisao : undefined);
      toast.success("Conta criada com sucesso! A iniciar sessão...");
      setTimeout(() => {
        navigate(roleDefaultRoute[signupCargo] || "/dashboard");
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta.");
    } finally {
      setSignupLoading(false);
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

      {/* Right - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-auto">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center lg:hidden mb-6">
            <img src="/logo-tca.png" alt="TCA" className="h-16 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tribunal de Contas de Angola
            </h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="gap-1.5">
                <LogIn className="h-4 w-4" /> Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-1.5">
                <UserPlus className="h-4 w-4" /> Registar
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
                  <ScrollArea className="mt-3 h-[220px] rounded-md border bg-muted/30 p-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {DEMO_USERS.map((demo) => (
                        <button
                          key={demo.email}
                          type="button"
                          onClick={() => handleDemoFill(demo)}
                          className="text-left px-2.5 py-1.5 rounded-md text-[11px] leading-tight border bg-background hover:bg-accent hover:text-accent-foreground transition-colors truncate"
                          title={`${demo.label}\n${demo.email}`}
                        >
                          <span className="font-medium block truncate">{demo.shortLabel}</span>
                          <span className="text-muted-foreground text-[10px] block truncate">{demo.email}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3 mt-4">
                <div>
                  <Label htmlFor="signup-nome" className="text-xs">Nome completo *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-nome"
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      placeholder="João da Silva"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-email" className="text-xs">Email institucional *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="utilizador@tca.gov.ao"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-xs">Palavra-passe * (mín. 6 caracteres)</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showSignupPw ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPw(!showSignupPw)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showSignupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Cargo / Perfil *</Label>
                  <Select value={signupCargo} onValueChange={(v) => setSignupCargo(v as UserRole)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {needsDivisao && (
                  <div>
                    <Label className="text-xs">Divisão *</Label>
                    <Select value={signupDivisao} onValueChange={setSignupDivisao}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione a divisão..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DIVISOES.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full gap-2" disabled={signupLoading}>
                  {signupLoading ? "A criar conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-[10px] text-muted-foreground">
            Sistema protegido · Acesso restrito a utilizadores autorizados
          </p>
        </div>
      </div>
    </div>
  );
}
