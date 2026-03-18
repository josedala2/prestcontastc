import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Eye, EyeOff, User, Building2, LogIn, UserPlus } from "lucide-react";
import { useAuth, UserRole, roleGroups, roleDefaultRoute } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

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

export default function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupNome, setSignupNome] = useState("");
  const [signupCargo, setSignupCargo] = useState<UserRole>("Técnico da Secretaria-Geral");
  const [signupDivisao, setSignupDivisao] = useState<string>("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const needsDivisao = signupCargo === "Chefe de Divisão" || signupCargo === "Chefe de Secção";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Autenticado com sucesso!");
      // Navigation will happen via useEffect watching auth state
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
      // Auto-login after signup (auto-confirm is enabled)
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
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden mb-8">
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
