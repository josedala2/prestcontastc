import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, CheckCircle, Clock } from "lucide-react";

const modelos = [
  { code: "Modelo 1", name: "Guia de Remessa", status: "completo" },
  { code: "Modelo 2", name: "Mapa dos Subsídios Recebidos", status: "completo" },
  { code: "Modelo 3", name: "Mapa de Despesas com o Pessoal", status: "pendente" },
  { code: "Modelo 4", name: "Entregas dos Descontos, Retenções na Fonte e Outros", status: "pendente" },
  { code: "Modelo 5", name: "Mapa dos Investimentos", status: "pendente" },
  { code: "Modelo 6", name: "Mapa dos Empréstimos Obtidos", status: "completo" },
  { code: "Modelo 7", name: "Mapa dos Contratos", status: "pendente" },
  { code: "Modelo 8", name: "Mapa dos Bens de Capital Adquiridos", status: "pendente" },
  { code: "Modelo 9", name: "Saldo de Abertura e Encerramento", status: "completo" },
  { code: "Modelo 10", name: "Relação Nominal dos Responsáveis", status: "completo" },
];

const Mapas = () => {
  return (
    <AppLayout>
      <PageHeader title="Mapas e Modelos" description="Resolução nº 1/17 — Modelos de Prestação de Contas">
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" /> Exportar Todos
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modelos.map((m) => (
          <div key={m.code} className="bg-card rounded-lg border border-border card-shadow p-5 flex items-center gap-4 animate-fade-in">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-muted-foreground">{m.code}</span>
                <StatusBadge
                  status={m.status === "completo" ? "Completo" : "Pendente"}
                  variant={m.status === "completo" ? "success" : "warning"}
                />
              </div>
              <p className="text-sm font-medium text-foreground">{m.name}</p>
            </div>
            <Button variant="outline" size="sm">
              {m.status === "completo" ? "Ver" : "Preencher"}
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Mapas;
