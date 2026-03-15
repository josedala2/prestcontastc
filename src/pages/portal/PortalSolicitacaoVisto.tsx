import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { useState } from "react";
import {
  Stamp,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NovaSolicitacaoVistoForm } from "@/components/portal/NovaSolicitacaoVistoForm";

interface SolicitacaoVisto {
  id: string;
  tipo: string;
  descricao: string;
  valor?: string;
  dataSubmissao: string;
  estado: "pendente" | "em_analise" | "aprovado" | "recusado";
  observacoes?: string;
  documentos: string[];
}

const mockSolicitacoes: SolicitacaoVisto[] = [
  {
    id: "SV-2024-001",
    tipo: "Contrato de Fornecimento",
    descricao: "Contrato de fornecimento de material informático para o exercício 2024",
    valor: "45.000.000,00 Kz",
    dataSubmissao: "2024-11-15",
    estado: "aprovado",
    observacoes: "Visto concedido em 20/11/2024",
    documentos: ["Contrato_Fornecimento.pdf", "Parecer_Juridico.pdf"],
  },
  {
    id: "SV-2024-002",
    tipo: "Contrato de Empreitada",
    descricao: "Empreitada de reabilitação das instalações sede",
    valor: "120.000.000,00 Kz",
    dataSubmissao: "2024-12-01",
    estado: "em_analise",
    documentos: ["Contrato_Empreitada.pdf", "Projecto_Obra.pdf", "Orcamento.pdf"],
  },
  {
    id: "SV-2025-001",
    tipo: "Contrato de Prestação de Serviços",
    descricao: "Serviços de consultoria em auditoria interna",
    valor: "18.500.000,00 Kz",
    dataSubmissao: "2025-01-10",
    estado: "pendente",
    documentos: ["Contrato_Consultoria.pdf"],
  },
  {
    id: "SV-2024-003",
    tipo: "Contrato de Fornecimento",
    descricao: "Aquisição de viaturas de serviço",
    valor: "85.000.000,00 Kz",
    dataSubmissao: "2024-09-20",
    estado: "recusado",
    observacoes: "Documentação incompleta. Falta parecer da assessoria jurídica e caderno de encargos.",
    documentos: ["Contrato_Viaturas.pdf"],
  },
];


const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
  aprovado: { label: "Visto Concedido", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  recusado: { label: "Recusado", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

export default function PortalSolicitacaoVisto() {
  const { entity } = usePortalEntity();
  const [solicitacoes] = useState<SolicitacaoVisto[]>(mockSolicitacoes);
  const [showNovaDialog, setShowNovaDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState<SolicitacaoVisto | null>(null);

  const resumo = {
    total: solicitacoes.length,
    pendentes: solicitacoes.filter((s) => s.estado === "pendente").length,
    emAnalise: solicitacoes.filter((s) => s.estado === "em_analise").length,
    aprovados: solicitacoes.filter((s) => s.estado === "aprovado").length,
    recusados: solicitacoes.filter((s) => s.estado === "recusado").length,
  };


  return (
    <PortalLayout>
      <PageHeader
        title="Solicitação de Visto"
        description="Submeta e acompanhe os pedidos de visto prévio para contratos e actos sujeitos a fiscalização"
      />

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
        {[
          { label: "Total", value: resumo.total, icon: Stamp, color: "text-foreground" },
          { label: "Pendentes", value: resumo.pendentes, icon: Clock, color: "text-amber-600" },
          { label: "Em Análise", value: resumo.emAnalise, icon: Eye, color: "text-blue-600" },
          { label: "Aprovados", value: resumo.aprovados, icon: CheckCircle, color: "text-green-600" },
          { label: "Recusados", value: resumo.recusados, icon: XCircle, color: "text-destructive" },
        ].map((item) => (
          <Card key={item.label} className="border">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", item.color)} />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{item.value}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acção */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowNovaDialog(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span className="sm:inline">Nova Solicitação de Visto</span>
        </Button>
      </div>

      {/* Lista de Solicitações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Solicitações Submetidas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {solicitacoes.map((sol) => {
              const config = estadoConfig[sol.estado];
              const Icon = config.icon;
              return (
                <div
                  key={sol.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setDetailDialog(sol)}
                >
                  <div className="shrink-0">
                    <div className={cn("rounded-full p-2", config.color.split(" ")[0])}>
                      <Icon className={cn("h-4 w-4", config.color.split(" ")[1])} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{sol.id}</span>
                      <Badge variant="outline" className="text-[10px]">{sol.tipo}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{sol.descricao}</p>
                  </div>
                  {sol.valor && (
                    <span className="text-sm font-medium text-foreground hidden sm:block">{sol.valor}</span>
                  )}
                  <div className="text-right shrink-0 hidden md:block">
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(sol.dataSubmissao).toLocaleDateString("pt-AO")}
                    </p>
                  </div>
                  <Badge className={cn("text-[11px] shrink-0", config.color)} variant="secondary">
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nova Solicitação */}
      <Dialog open={showNovaDialog} onOpenChange={setShowNovaDialog}>
        <DialogContent className="max-w-2xl">
          <NovaSolicitacaoVistoForm onClose={() => setShowNovaDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhe */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg">
          {detailDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-primary" />
                  {detailDialog.id}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Tipo</p>
                    <p className="text-sm font-medium">{detailDialog.tipo}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Estado</p>
                    <Badge className={cn("text-[11px]", estadoConfig[detailDialog.estado].color)} variant="secondary">
                      {estadoConfig[detailDialog.estado].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-0.5">Data de Submissão</p>
                    <p className="text-sm">{new Date(detailDialog.dataSubmissao).toLocaleDateString("pt-AO")}</p>
                  </div>
                  {detailDialog.valor && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-0.5">Valor</p>
                      <p className="text-sm font-semibold">{detailDialog.valor}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Descrição</p>
                  <p className="text-sm">{detailDialog.descricao}</p>
                </div>
                {detailDialog.observacoes && (
                  <div className={cn(
                    "rounded-md p-3 text-sm",
                    detailDialog.estado === "recusado" ? "bg-destructive/5 border border-destructive/20" : "bg-green-50 border border-green-200 dark:bg-green-900/10 dark:border-green-800"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {detailDialog.estado === "recusado" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <span className="text-xs font-semibold">
                        {detailDialog.estado === "recusado" ? "Motivo da Recusa" : "Observações"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{detailDialog.observacoes}</p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5">Documentos Anexados</p>
                  <div className="space-y-1">
                    {detailDialog.documentos.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
