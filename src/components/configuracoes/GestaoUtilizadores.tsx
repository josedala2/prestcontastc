import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Plus, UserPlus, Lock, Mail, User } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

interface CreatedUser {
  email: string;
  nome: string;
  cargo: string;
  divisao?: string;
  criadoEm: string;
}

export function GestaoUtilizadores() {
  const { signup } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState<UserRole>("Técnico da Secretaria-Geral");
  const [divisao, setDivisao] = useState("");

  const needsDivisao = cargo === "Chefe de Divisão" || cargo === "Chefe de Secção";

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNome("");
    setCargo("Técnico da Secretaria-Geral");
    setDivisao("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nome) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (needsDivisao && !divisao) {
      toast.error("Seleccione a divisão.");
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, nome, cargo, needsDivisao ? divisao : undefined);
      
      setCreatedUsers((prev) => [
        {
          email,
          nome,
          cargo,
          divisao: needsDivisao ? divisao : undefined,
          criadoEm: new Date().toLocaleString("pt-AO"),
        },
        ...prev,
      ]);
      toast.success(`Utilizador "${nome}" criado com sucesso!`);
      resetForm();
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar utilizador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Gestão de Utilizadores
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie e gerencie contas de utilizadores do sistema
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Utilizador
        </Button>
      </div>

      {createdUsers.length > 0 && (
        <div className="bg-card rounded-lg border border-border card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Cargo</TableHead>
                <TableHead className="text-xs">Divisão</TableHead>
                <TableHead className="text-xs">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {createdUsers.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{u.nome}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{u.cargo}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{u.divisao || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.criadoEm}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {createdUsers.length === 0 && (
        <div className="bg-muted/30 rounded-lg border border-dashed border-border p-8 text-center">
          <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum utilizador criado nesta sessão.</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Utilizador" para registar uma nova conta.</p>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Criar Novo Utilizador
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Nome completo *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="João da Silva"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Email institucional *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utilizador@tca.gov.ao"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Palavra-passe * (mín. 6 caracteres)</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Cargo / Perfil *</Label>
              <Select value={cargo} onValueChange={(v) => setCargo(v as UserRole)}>
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
                <Select value={divisao} onValueChange={setDivisao}>
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? "A criar..." : "Criar Utilizador"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
