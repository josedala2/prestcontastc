import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Modelo1Form } from "@/components/modelos/Modelo1Form";
import { Modelo2Form } from "@/components/modelos/Modelo2Form";
import { Modelo3Form } from "@/components/modelos/Modelo3Form";
import { Modelo4Form } from "@/components/modelos/Modelo4Form";
import { Modelo5Form } from "@/components/modelos/Modelo5Form";
import { Modelo6Form } from "@/components/modelos/Modelo6Form";
import { Modelo7Form } from "@/components/modelos/Modelo7Form";
import { Modelo8Form } from "@/components/modelos/Modelo8Form";
import { Modelo9Form } from "@/components/modelos/Modelo9Form";
import { Modelo10Form } from "@/components/modelos/Modelo10Form";

const modelos = [
  { code: "1", name: "Guia de Remessa", status: "pendente" },
  { code: "2", name: "Mapa dos Subsídios Recebidos", status: "completo" },
  { code: "3", name: "Mapa de Despesas com o Pessoal", status: "pendente" },
  { code: "4", name: "Entregas dos Descontos, Retenções na Fonte e Outros", status: "pendente" },
  { code: "5", name: "Mapa dos Investimentos", status: "pendente" },
  { code: "6", name: "Mapa dos Empréstimos Obtidos", status: "completo" },
  { code: "7", name: "Mapa dos Contratos", status: "pendente" },
  { code: "8", name: "Mapa dos Bens de Capital Adquiridos", status: "pendente" },
  { code: "9", name: "Saldo de Abertura e Encerramento", status: "pendente" },
  { code: "10", name: "Relação Nominal dos Responsáveis", status: "completo" },
];

const formComponents: Record<string, React.FC> = {
  "1": Modelo1Form,
  "2": Modelo2Form,
  "3": Modelo3Form,
  "4": Modelo4Form,
  "5": Modelo5Form,
  "6": Modelo6Form,
  "7": Modelo7Form,
  "8": Modelo8Form,
  "9": Modelo9Form,
  "10": Modelo10Form,
};

const PortalMapas = () => {
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const completedCount = modelos.filter((m) => m.status === "completo").length;

  if (activeModel) {
    const modelo = modelos.find((m) => m.code === activeModel)!;
    const FormComponent = formComponents[activeModel];
    return (
      <PortalLayout>
        <PageHeader title={`Modelo nº ${modelo.code}`} description={modelo.name}>
          <Button variant="outline" className="gap-2" onClick={() => setActiveModel(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </PageHeader>
        <div className="bg-card rounded-lg border border-border card-shadow p-6 animate-fade-in">
          <FormComponent />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <PageHeader title="Mapas e Modelos" description="Resolução nº 1/17 — Preencha os modelos obrigatórios de prestação de contas" />

      <div className="bg-card rounded-lg border border-border card-shadow p-4 mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{completedCount}/{modelos.length}</span> modelos preenchidos
          </p>
          <StatusBadge
            status={completedCount === modelos.length ? "Completo" : "Em Progresso"}
            variant={completedCount === modelos.length ? "success" : "warning"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modelos.map((m) => (
          <div key={m.code} className="bg-card rounded-lg border border-border card-shadow p-5 flex items-center gap-4 animate-fade-in">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-muted-foreground">Modelo {m.code}</span>
                <StatusBadge
                  status={m.status === "completo" ? "Completo" : "Pendente"}
                  variant={m.status === "completo" ? "success" : "warning"}
                />
              </div>
              <p className="text-sm font-medium text-foreground">{m.name}</p>
            </div>
            <Button variant={m.status === "completo" ? "outline" : "default"} size="sm" onClick={() => setActiveModel(m.code)}>
              {m.status === "completo" ? "Editar" : "Preencher"}
            </Button>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
};

export default PortalMapas;
