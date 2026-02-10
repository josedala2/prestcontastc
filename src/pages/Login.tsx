import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, Shield, Building2, UserCheck, Eye, EyeOff } from "lucide-react";

const demoUsers = [
  {
    label: "Administrador TCA",
    email: "admin@tca.gov.ao",
    password: "admin123",
    role: "Administrador",
    icon: Shield,
    description: "Acesso total ao sistema",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    label: "Técnico Validador",
    email: "tecnico@tca.gov.ao",
    password: "tecnico123",
    role: "Técnico Validador",
    icon: UserCheck,
    description: "Validação e análise de contas",
    color: "bg-accent/10 text-accent border-accent/20",
  },
  {
    label: "Entidade (Portal)",
    email: "entidade@ende.co.ao",
    password: "entidade123",
    role: "Preparador / Contabilista",
    icon: Building2,
    description: "Portal de prestação de contas",
    color: "bg-info/10 text-info border-info/20",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = (user: (typeof demoUsers)[number]) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Find which demo user matches (or default to admin path)
    const matched = demoUsers.find((u) => u.email === email);
    setTimeout(() => {
      setLoading(false);
      if (matched?.role === "Preparador / Contabilista") {
        navigate("/portal");
      } else {
        navigate("/");
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] sidebar-gradient flex-col justify-between p-10 text-white relative overflow-hidden">
        {/* Decorative elements */}
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
          <p className="text-[10px] text-white/30">
            © Tribunal de Contas de Angola — Resolução nº 1/17
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/logo-tca.png" alt="TCA" className="h-10 w-10" />
          <div>
            <p className="text-xs text-muted-foreground">Tribunal de Contas de Angola</p>
            <p className="text-sm font-semibold text-foreground">Sistema de Prestação de Contas</p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Title */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Iniciar Sessão</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Introduza as suas credenciais para aceder ao sistema
            </p>
          </div>

          {/* Demo user cards */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Utilizadores Demo — clique para preencher
            </p>
            <div className="grid gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleDemoLogin(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:scale-[1.01] hover:shadow-sm ${user.color} ${
                    email === user.email ? "ring-2 ring-primary/30 shadow-sm" : ""
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-background/80 flex items-center justify-center shrink-0">
                    <user.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.label}</p>
                    <p className="text-[11px] opacity-70">{user.description}</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[10px] font-mono opacity-60">{user.email}</p>
                    <p className="text-[10px] font-mono opacity-40">{user.password}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.gov.ao"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
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
              ) : (
                "Iniciar Sessão"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[10px] text-muted-foreground/60 pt-2">
            Sistema protegido com autenticação e controlo de acesso
          </p>
        </div>
      </div>
    </div>
  );
}
