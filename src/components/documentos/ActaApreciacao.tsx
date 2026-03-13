import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Membro { id: string; nome: string; cargo: string; presente: boolean; }

const initialMembros: Membro[] = [
  { id: "1", nome: "Dr. António Mendes", cargo: "Presidente do Conselho Fiscal", presente: true },
  { id: "2", nome: "Dra. Maria Santos", cargo: "Vogal", presente: true },
  { id: "3", nome: "Eng. Carlos Ferreira", cargo: "Vogal", presente: true },
];

export function ActaApreciacao() {
  const [entidade, setEntidade] = useState("Empresa Pública de Águas");
  const [exercicio, setExercicio] = useState("2024");
  const [dataReuniao, setDataReuniao] = useState("2025-03-15");
  const [local, setLocal] = useState("Sala de Reuniões — Sede");
  const [membros, setMembros] = useState<Membro[]>(initialMembros);
  const [deliberacoes, setDeliberacoes] = useState(
    "Após análise detalhada das demonstrações financeiras relativas ao exercício de 2024, o Conselho Fiscal deliberou por unanimidade:\n\n1. Aprovar o Balanço Patrimonial, a Demonstração de Resultados e o Fluxo de Caixa;\n2. Recomendar ao Órgão de Gestão o reforço da provisão para cobrança duvidosa;\n3. Remeter o presente dossiê ao Tribunal de Contas dentro do prazo legal (30 de Junho)."
  );
  const [observacoes, setObservacoes] = useState("");

  const addMembro = () => setMembros((p) => [...p, { id: `m_${Date.now()}`, nome: "", cargo: "", presente: true }]);
  const removeMembro = (id: string) => setMembros((p) => p.filter((m) => m.id !== id));
  const updateMembro = (id: string, field: keyof Membro, value: string | boolean) =>
    setMembros((p) => p.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acta de Apreciação das Contas</CardTitle>
        <CardDescription>Acta da reunião do órgão fiscalizador interno para apreciação das contas do exercício (Art.º 3.º, al. g) da Resolução 1/17)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Entidade</Label><Input value={entidade} onChange={(e) => setEntidade(e.target.value)} /></div>
          <div><Label>Exercício Financeiro</Label><Input value={exercicio} onChange={(e) => setExercicio(e.target.value)} /></div>
          <div><Label>Data da Reunião</Label><Input type="date" value={dataReuniao} onChange={(e) => setDataReuniao(e.target.value)} /></div>
          <div><Label>Local</Label><Input value={local} onChange={(e) => setLocal(e.target.value)} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">Membros Presentes</Label>
            <Button variant="outline" size="sm" className="gap-1" onClick={addMembro}><Plus className="h-3 w-3" /> Adicionar</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="w-24">Presente</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membros.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><Input value={m.nome} onChange={(e) => updateMembro(m.id, "nome", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell><Input value={m.cargo} onChange={(e) => updateMembro(m.id, "cargo", e.target.value)} className="h-8 text-sm" /></TableCell>
                  <TableCell>
                    <input type="checkbox" checked={m.presente} onChange={(e) => updateMembro(m.id, "presente", e.target.checked)} className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeMembro(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <Label>Deliberações e Parecer</Label>
          <Textarea rows={8} value={deliberacoes} onChange={(e) => setDeliberacoes(e.target.value)} />
        </div>

        <div>
          <Label>Observações Adicionais</Label>
          <Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Reservas, votos vencidos, etc." />
        </div>

        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => toast.success("Acta guardada.")}><Save className="h-4 w-4" /> Guardar Acta</Button>
        </div>
      </CardContent>
    </Card>
  );
}
