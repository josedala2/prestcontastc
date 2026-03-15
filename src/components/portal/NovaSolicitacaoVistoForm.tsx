import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Send,
  Upload,
  FileText,
  X,
  CalendarIcon,
  Stamp,
} from "lucide-react";
import { toast } from "sonner";

const tiposVisto = [
  { value: "sucessivo", label: "Visto Sucessivo" },
  { value: "previo", label: "Visto Prévio" },
];

const naturezasVisto = [
  { value: "normal", label: "Visto Normal (30 dias)" },
  { value: "simplificado_urgencia", label: "Visto Simplificado de Urgência (10 dias)" },
  { value: "urgente", label: "Visto de Carácter Urgente (5 dias)" },
];

const orgaosSoberania = [
  { value: "A", label: "A. Presidente da República" },
  { value: "B", label: "B. Assembleia Nacional" },
  { value: "C", label: "C. Governo (Executivo Central)" },
  { value: "D", label: "D. Tribunais Superiores" },
  { value: "E", label: "E. Procuradoria-Geral da República" },
  { value: "F", label: "F. Outros Órgãos de Soberania" },
  { value: "G", label: "G. Governos Provinciais" },
];

const fontesFinanciamento = [
  { value: "oge", label: "Orçamento Geral do Estado (OGE)" },
  { value: "fundos_autonomos", label: "Fundos Autónomos" },
  { value: "cooperacao", label: "Cooperação Internacional" },
  { value: "credito_externo", label: "Crédito Externo" },
  { value: "receitas_proprias", label: "Receitas Próprias" },
];

interface DocumentoChecklist {
  id: string;
  label: string;
  obrigatorio: boolean;
  checked: boolean;
  file?: File;
}

const documentosIniciais: DocumentoChecklist[] = [
  { id: "oficio", label: "Ofício de Solicitação de Visto", obrigatorio: true, checked: false },
  { id: "minuta", label: "Minuta do Contrato", obrigatorio: true, checked: false },
  { id: "cabimento", label: "Cabimento Orçamental", obrigatorio: true, checked: false },
  { id: "adjudicacao", label: "Proposta de Adjudicação / Despacho de Adjudicação", obrigatorio: false, checked: false },
  { id: "concurso", label: "Programa de Concurso / Caderno de Encargos", obrigatorio: false, checked: false },
  { id: "habilitacao", label: "Documentos de Habilitação da Empresa", obrigatorio: false, checked: false },
  { id: "certidao", label: "Certidão Negativa de Dívidas Fiscais", obrigatorio: false, checked: false },
  { id: "seguranca_social", label: "Declaração de Regularidade com Segurança Social", obrigatorio: false, checked: false },
];

interface NovaSolicitacaoVistoFormProps {
  onClose: () => void;
}

export function NovaSolicitacaoVistoForm({ onClose }: NovaSolicitacaoVistoFormProps) {
  const [tipoVisto, setTipoVisto] = useState("");
  const [naturezaVisto, setNaturezaVisto] = useState("");
  const [orgao, setOrgao] = useState("");
  const [entidadeContratada, setEntidadeContratada] = useState("");
  const [nif, setNif] = useState("");
  const [objecto, setObjecto] = useState("");
  const [valor, setValor] = useState("");
  const [dataContrato, setDataContrato] = useState<Date>();
  const [fonte, setFonte] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [documentos, setDocumentos] = useState<DocumentoChecklist[]>(documentosIniciais);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!tipoVisto) newErrors.tipoVisto = "O tipo de visto é obrigatório";
    if (!naturezaVisto) newErrors.naturezaVisto = "A natureza do visto é obrigatória";
    if (!orgao) newErrors.orgao = "O órgão de soberania é obrigatório";
    if (!entidadeContratada || entidadeContratada.trim().length < 2)
      newErrors.entidadeContratada = "O nome da entidade contratada deve ter pelo menos 2 caracteres";
    if (!nif || !/^\d{9}$/.test(nif))
      newErrors.nif = "O NIF deve ter exactamente 9 dígitos";
    if (!objecto || objecto.trim().length < 10)
      newErrors.objecto = "O objecto do contrato deve ter pelo menos 10 caracteres";
    if (!valor) newErrors.valor = "O valor do contrato é obrigatório";
    if (!dataContrato) newErrors.dataContrato = "A data do contrato é obrigatória";
    if (!fonte) newErrors.fonte = "A fonte de financiamento é obrigatória";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error("Corrija os erros no formulário antes de submeter");
      return;
    }
    toast.success("Solicitação de visto submetida com sucesso");
    onClose();
  };

  const toggleDocumento = (id: string, checked: boolean) => {
    setDocumentos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, checked } : d))
    );
  };

  const setDocFile = (id: string, file: File | undefined) => {
    setDocumentos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, file, checked: file ? true : d.checked } : d))
    );
  };

  const numeroContrato = `SV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Stamp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Nova Solicitação de Visto
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 sm:space-y-6 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto pr-1 -mr-1">
        {/* ── Tipo e Natureza ── */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground border-b pb-1 mb-2 w-full">
            Tipo e Natureza do Visto
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de Visto *</Label>
              <Select value={tipoVisto} onValueChange={setTipoVisto}>
                <SelectTrigger className={cn(errors.tipoVisto && "border-destructive")}>
                  <SelectValue placeholder="Seleccione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposVisto.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipoVisto && <p className="text-[11px] text-destructive">{errors.tipoVisto}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Natureza do Visto *</Label>
              <Select value={naturezaVisto} onValueChange={setNaturezaVisto}>
                <SelectTrigger className={cn(errors.naturezaVisto && "border-destructive")}>
                  <SelectValue placeholder="Seleccione a natureza" />
                </SelectTrigger>
                <SelectContent>
                  {naturezasVisto.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.naturezaVisto && <p className="text-[11px] text-destructive">{errors.naturezaVisto}</p>}
            </div>
          </div>
        </fieldset>

        {/* ── Partes Contratantes ── */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground border-b pb-1 mb-2 w-full">
            Partes Contratantes
          </legend>

          <div className="space-y-1.5">
            <Label>Órgão de Soberania *</Label>
            <Select value={orgao} onValueChange={setOrgao}>
              <SelectTrigger className={cn(errors.orgao && "border-destructive")}>
                <SelectValue placeholder="Selecione o órgão de soberania" />
              </SelectTrigger>
              <SelectContent>
                {orgaosSoberania.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.orgao && <p className="text-[11px] text-destructive">{errors.orgao}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Entidade Contratada *</Label>
              <Input
                value={entidadeContratada}
                onChange={(e) => setEntidadeContratada(e.target.value)}
                placeholder="Nome da entidade contratada"
                className={cn(errors.entidadeContratada && "border-destructive")}
              />
              {errors.entidadeContratada && <p className="text-[11px] text-destructive">{errors.entidadeContratada}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>NIF da Entidade Contratada *</Label>
              <Input
                value={nif}
                onChange={(e) => setNif(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="123456789"
                maxLength={9}
                className={cn(errors.nif && "border-destructive")}
              />
              {errors.nif && <p className="text-[11px] text-destructive">{errors.nif}</p>}
            </div>
          </div>
        </fieldset>

        {/* ── Dados do Contrato ── */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground border-b pb-1 mb-2 w-full">
            Dados do Contrato
          </legend>

          <div className="space-y-1.5">
            <Label>Objecto do Contrato *</Label>
            <Textarea
              value={objecto}
              onChange={(e) => setObjecto(e.target.value)}
              placeholder="Descreva o objecto do contrato..."
              rows={3}
              className={cn(errors.objecto && "border-destructive")}
            />
            {errors.objecto && <p className="text-[11px] text-destructive">{errors.objecto}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor do Contrato *</Label>
              <div className="relative">
                <Input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className={cn("pr-10", errors.valor && "border-destructive")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Kz</span>
              </div>
              {errors.valor && <p className="text-[11px] text-destructive">{errors.valor}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Nº do Contrato (Automático)</Label>
              <Input value={numeroContrato} disabled className="bg-muted/50" />
              <p className="text-[10px] text-muted-foreground">Gerado automaticamente pelo sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data do Contrato *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataContrato && "text-muted-foreground",
                      errors.dataContrato && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataContrato ? format(dataContrato, "dd/MM/yyyy", { locale: pt }) : "Seleccione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataContrato}
                    onSelect={setDataContrato}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {errors.dataContrato && <p className="text-[11px] text-destructive">{errors.dataContrato}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Fonte de Financiamento *</Label>
              <Select value={fonte} onValueChange={setFonte}>
                <SelectTrigger className={cn(errors.fonte && "border-destructive")}>
                  <SelectValue placeholder="Seleccione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  {fontesFinanciamento.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">A fonte de financiamento determina a divisão competente (1ª ou 2ª Divisão)</p>
              {errors.fonte && <p className="text-[11px] text-destructive">{errors.fonte}</p>}
            </div>
          </div>
        </fieldset>

        {/* ── Documentação Anexa ── */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground border-b pb-1 mb-2 w-full">
            Documentação Anexa ao Pedido de Visto
          </legend>
          <p className="text-xs text-muted-foreground">
            Marque os documentos a anexar. Documentos obrigatórios estão assinalados (*):
          </p>

          <div className="space-y-2">
            {documentos.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  checked={doc.checked}
                  onCheckedChange={(checked) => toggleDocumento(doc.id, !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">
                      {doc.label} {doc.obrigatorio && <span className="text-destructive">*</span>}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({doc.obrigatorio ? "obrigatório" : "opcional"})
                    </span>
                  </div>

                  {doc.checked && (
                    <div className="mt-2">
                      {doc.file ? (
                        <div className="flex items-center gap-2 text-xs bg-muted/50 px-2 py-1.5 rounded">
                          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{doc.file.name}</span>
                          <button onClick={() => setDocFile(doc.id, undefined)}>
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded cursor-pointer hover:bg-muted/30 transition-colors">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">Seleccionar ficheiro PDF...</span>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  toast.error("Tamanho máximo: 10 MB por ficheiro");
                                  return;
                                }
                                if (file.type !== "application/pdf") {
                                  toast.error("Apenas ficheiros PDF são permitidos");
                                  return;
                                }
                                setDocFile(doc.id, file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground">
            Apenas ficheiros PDF são permitidos. Tamanho máximo: 10 MB por ficheiro.
          </p>
        </fieldset>

        {/* ── Observações ── */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-foreground border-b pb-1 mb-2 w-full">
            Observações
          </legend>
          <div className="space-y-1.5">
            <Label>Observações Adicionais</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações complementares ou observações relevantes..."
              rows={3}
            />
          </div>
        </fieldset>
      </div>

      <DialogFooter className="pt-4">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} className="gap-2">
          <Send className="h-3.5 w-3.5" />
          Submeter Solicitação
        </Button>
      </DialogFooter>
    </>
  );
}
