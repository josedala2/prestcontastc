import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

const tipologias = [
  "Órgão Autónomo",
  "Instituto Público",
  "Empresa Pública",
  "Fundo Autónomo",
  "Serviço Autónomo",
  "Associação Pública",
  "Associação Privada com participação pública",
  "Fundação Pública",
  "Sociedade Comercial com participação pública",
  "Outro",
];

const guiaItems = [
  { key: "a", label: "Guia de Remessa (Modelo nº 1)" },
  { key: "b", label: "Mapa dos Subsídios Recebidos (Modelo nº 2)" },
  { key: "c", label: "Mapa de Despesas com o Pessoal (Modelo nº 3)" },
  { key: "d", label: "Mapa das Entregas dos Descontos, Retenções na Fonte e Outros (Modelo nº 4)" },
  { key: "e", label: "Mapa dos Investimentos (Modelo nº 5)" },
  { key: "f", label: "Mapa dos Empréstimos Obtidos (Modelo nº 6)" },
  { key: "g", label: "Mapa dos Contratos (Modelo nº 7)" },
  { key: "h", label: "Mapa dos Bens de Capital (Activo Patrimonial) Adquiridos (Modelo nº 8)" },
  { key: "i", label: "Saldo de Abertura e de Encerramento da Conta (Modelo nº 9)" },
  { key: "j", label: "Relação Nominal dos Responsáveis (Modelo nº 10)" },
  { key: "k", label: "Relatório de Gestão" },
  { key: "l", label: "Demonstração de Resultados" },
  { key: "m", label: "Demonstração do Fluxo de Caixa" },
  { key: "n", label: "Balanço e respectivas notas" },
  { key: "o", label: "Balancete Analítico e Sintético antes e depois do apuramento dos resultados" },
  { key: "p", label: "Parecer do Conselho Fiscal" },
  { key: "q", label: "Relatório e Parecer do Auditor Externo" },
  { key: "r", label: "Documentos de Arrecadação de Receita (DAR)" },
  { key: "s", label: "Certidão de regularidade da situação fiscal" },
  { key: "t", label: "Certidão de regularidade da contribuição à Segurança Social" },
  { key: "u", label: "Mapa detalhado dos direitos sobre terceiros" },
  { key: "v", label: "Mapa detalhado das obrigações com terceiros" },
  { key: "w", label: "Acta de apreciação das contas pelo órgão fiscalizador" },
  { key: "x", label: "Extractos bancários de fim de exercício" },
  { key: "y", label: "Reconciliações bancárias" },
  { key: "z", label: "Comprovativos de entrega de descontos às entidades competentes" },
  { key: "aa", label: "Inventário patrimonial" },
  { key: "ab", label: "Relação de bens imóveis e móveis abatidos" },
];

export function Modelo1Form() {
  const [entidade, setEntidade] = useState("");
  const [endereco, setEndereco] = useState("");
  const [gestaoInicio, setGestaoInicio] = useState("");
  const [gestaoFim, setGestaoFim] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(guiaItems.map((i) => [i.key, false]))
  );
  const [observacoes, setObservacoes] = useState("");
  const [elaboradoPor, setElaboradoPor] = useState("");
  const [responsavel, setResponsavel] = useState("");

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-2">
        <h3 className="text-sm font-semibold text-primary">GUIA DE REMESSA</h3>
        <p className="text-xs text-muted-foreground mt-1">Discrimina os documentos e modelos que fazem parte da prestação de contas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Órgão/Entidade</Label>
          <Input value={entidade} onChange={(e) => setEntidade(e.target.value)} placeholder="Nome da entidade" />
        </div>
        <div>
          <Label>Endereço</Label>
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço" />
        </div>
        <div>
          <Label>Gestão de</Label>
          <Input type="date" value={gestaoInicio} onChange={(e) => setGestaoInicio(e.target.value)} />
        </div>
        <div>
          <Label>a</Label>
          <Input type="date" value={gestaoFim} onChange={(e) => setGestaoFim(e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Documentos e Modelos Enviados</Label>
        <div className="space-y-2 bg-card rounded-lg border border-border p-4">
          {guiaItems.map((item) => (
            <label key={item.key} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-muted/30 px-2 rounded-md">
              <Checkbox
                checked={checked[item.key]}
                onCheckedChange={(v) => setChecked({ ...checked, [item.key]: !!v })}
              />
              <span className="text-xs font-mono text-muted-foreground w-5">{item.key})</span>
              <span className="text-sm text-foreground">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Não se enviarão os Modelos nº ... por não ter havido movimentos..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Elaborado por</Label>
          <Input value={elaboradoPor} onChange={(e) => setElaboradoPor(e.target.value)} />
        </div>
        <div>
          <Label>O Responsável</Label>
          <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2"><Save className="h-4 w-4" /> Guardar</Button>
      </div>
    </div>
  );
}
