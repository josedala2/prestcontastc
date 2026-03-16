import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileText, CheckCircle, AlertTriangle, Trash2, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { EntityTipologia, TIPOLOGIA_RESOLUCAO, RESOLUCAO_LABELS, ResolucaoCategoria } from "@/types";

interface DocRequirement {
  id: string;
  label: string;
  required: boolean;
  accept?: string;
}

// ─── Documentos por Resolução ───

const DOCS_RESOLUCAO_2_16: DocRequirement[] = [
  { id: "modelos", label: "Modelos de Prestação de Contas", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "relatorio_gestao", label: "Relatório de Gestão", required: true, accept: ".pdf,.docx" },
  { id: "extractos", label: "Extratos Bancários de todas as contas do exercício", required: false, accept: ".pdf,.xlsx,.xls" },
  { id: "ordens_saque", label: "Relação das Ordens de Saque pagas no período / Livro de Ordens de Saque", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "contratos", label: "Cópia dos Contratos celebrados no período", required: false, accept: ".pdf,.docx" },
  { id: "suporte_despesas", label: "Suporte documental das despesas realizadas no período", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "emolumentos", label: "Comprovativo de Pagamento dos Emolumentos ao Tribunal de Contas", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

const DOCS_RESOLUCAO_4_16: DocRequirement[] = [
  { id: "modelos", label: "Modelos de Prestação de Contas", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "relatorio_gestao", label: "Relatório de Gestão", required: true, accept: ".pdf,.docx" },
  { id: "extractos", label: "Extratos Bancários de todas as contas do exercício", required: false, accept: ".pdf,.xlsx,.xls" },
  { id: "ordens_saque", label: "Relação das Ordens de Saque pagas no período / Livro de Ordens de Saque", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "contratos", label: "Cópia dos Contratos celebrados no período", required: false, accept: ".pdf,.docx" },
  { id: "suporte_despesas", label: "Suporte documental das despesas realizadas no período", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "emolumentos", label: "Comprovativo de Pagamento dos Emolumentos devidos ao Tribunal de Contas", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

const DOCS_RESOLUCAO_5_16: DocRequirement[] = [
  { id: "modelos", label: "Modelos de Prestação de Contas", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "relatorio_gestao", label: "Relatório de Gestão", required: false, accept: ".pdf,.docx" },
  { id: "extractos", label: "Extratos Bancários de todas as contas do exercício", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "reconciliacoes", label: "Reconciliações Bancárias de todas as contas do exercício", required: false, accept: ".pdf,.xlsx,.xls" },
  { id: "folhas_caixa", label: "Folhas de caixa contendo as operações de tesouraria", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "comprov_seguranca", label: "Comprovativos de entrega das Contribuições à Segurança Social", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "recibos_emolumentares", label: "Relação dos recibos Emolumentares emitidos", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "comprov_moeda", label: "Comprovativo de aquisição de moeda local", required: false, accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "emolumentos", label: "Comprovativo de Pagamento dos Emolumentos devidos ao Tribunal de Contas", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

const DOCS_RESOLUCAO_1_17: DocRequirement[] = [
  { id: "modelos", label: "Modelos de Prestação de Contas", required: true, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "relatorio_gestao", label: "Relatório de Gestão", required: true, accept: ".pdf,.docx" },
  { id: "balanco", label: "Balanço", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "dem_resultados", label: "Demonstração de Resultados", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "fluxo_caixa", label: "Demonstração de Fluxo de Caixa", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "balancete_analitico", label: "Balancete Analítico e Sintético, antes e depois do Apuramento", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "parecer_fiscal", label: "Parecer do Conselho Fiscal", required: true, accept: ".pdf,.docx" },
  { id: "parecer_auditor", label: "Relatório e Parecer do Auditor Externo", required: true, accept: ".pdf,.docx" },
  { id: "comprov_impostos", label: "Comprovativos de Pagamento dos Impostos", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "comprov_seguranca", label: "Comprovativos de Pagamento à Segurança Social", required: false, accept: ".pdf,.jpg,.jpeg,.png" },
  { id: "acta_apreciacao", label: "Acta sobre a Apreciação das Contas", required: true, accept: ".pdf,.docx" },
  { id: "extractos", label: "Extratos Bancários de todas as contas do exercício", required: true, accept: ".pdf,.xlsx,.xls" },
  { id: "reconciliacoes", label: "Reconciliações Bancárias de todas as contas do exercício", required: false, accept: ".pdf,.xlsx,.xls" },
  { id: "inventario", label: "Inventário dos Bens Patrimoniais adquiridos no período", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "abates", label: "Relação de Abates e Alienações de Imóveis no período", required: false, accept: ".pdf,.xlsx,.xls,.docx" },
  { id: "emolumentos", label: "Comprovativo de Pagamento dos Emolumentos ao Tribunal de Contas", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

const DOCS_BY_RESOLUCAO: Record<ResolucaoCategoria, DocRequirement[]> = {
  resolucao_2_16: DOCS_RESOLUCAO_2_16,
  resolucao_4_16: DOCS_RESOLUCAO_4_16,
  resolucao_5_16: DOCS_RESOLUCAO_5_16,
  resolucao_1_17: DOCS_RESOLUCAO_1_17,
};

export function getDocumentRequirements(tipologia: EntityTipologia): DocRequirement[] {
  const resolucao = TIPOLOGIA_RESOLUCAO[tipologia];
  return DOCS_BY_RESOLUCAO[resolucao] || DOCS_RESOLUCAO_1_17;
}

// Keep backward compat export
export const DOCUMENT_REQUIREMENTS = DOCS_RESOLUCAO_1_17;

interface UploadedDoc {
  name: string;
  size: number;
}

const formatSize = (bytes: number) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

interface Props {
  disabled?: boolean;
  tipologia?: EntityTipologia;
}

export function EntidadeDocumentosTab({ disabled, tipologia = "empresa_publica" }: Props) {
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const resolucao = TIPOLOGIA_RESOLUCAO[tipologia];
  const resolucaoInfo = RESOLUCAO_LABELS[resolucao];
  const documentRequirements = getDocumentRequirements(tipologia);

  const handleDocUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocs((prev) => ({ ...prev, [docId]: { name: file.name, size: file.size } }));
    toast.success(`"${file.name}" carregado com sucesso.`);
  };

  const removeDoc = (docId: string) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    if (inputRefs.current[docId]) inputRefs.current[docId]!.value = "";
  };

  const requiredDocs = documentRequirements.filter((d) => d.required);
  const uploadedRequiredCount = requiredDocs.filter((d) => uploadedDocs[d.id]).length;
  const totalUploaded = Object.keys(uploadedDocs).length;
  const progress = Math.round((uploadedRequiredCount / requiredDocs.length) * 100);
  const allRequiredDone = uploadedRequiredCount === requiredDocs.length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" /> Progresso Documental
            </h3>
            <span className="text-sm font-mono font-semibold">
              {uploadedRequiredCount}/{requiredDocs.length} obrigatórios
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{progress}% completo · {totalUploaded} ficheiro(s) total</p>
            {allRequiredDone ? (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Todos os obrigatórios carregados
              </span>
            ) : (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Documentos obrigatórios em falta
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos Exigidos ({resolucaoInfo.label})
          </CardTitle>
          <p className="text-xs text-muted-foreground">{resolucaoInfo.descricao}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {documentRequirements.map((doc) => {
            const uploaded = uploadedDocs[doc.id];
            return (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  uploaded
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30"
                    : doc.required
                      ? "bg-destructive/5 border-destructive/15"
                      : "bg-muted/20 border-border"
                }`}
              >
                {uploaded ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${uploaded ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
                    {doc.label}
                  </p>
                  {uploaded && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {uploaded.name} · {formatSize(uploaded.size)}
                    </p>
                  )}
                </div>

                {doc.required && !uploaded && (
                  <Badge variant="destructive" className="text-[9px] shrink-0">OBRIGATÓRIO</Badge>
                )}
                {!doc.required && !uploaded && (
                  <Badge variant="outline" className="text-[9px] shrink-0">FACULTATIVO</Badge>
                )}

                <input
                  ref={(el) => { inputRefs.current[doc.id] = el; }}
                  type="file"
                  accept={doc.accept}
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => handleDocUpload(doc.id, e)}
                />

                {uploaded ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 h-7 px-2"
                      disabled={disabled}
                      onClick={() => inputRefs.current[doc.id]?.click()}
                    >
                      <Upload className="h-3 w-3" /> Substituir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 text-destructive"
                      disabled={disabled}
                      onClick={() => removeDoc(doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 shrink-0"
                    disabled={disabled}
                    onClick={() => inputRefs.current[doc.id]?.click()}
                  >
                    <Upload className="h-3 w-3" /> Carregar
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
