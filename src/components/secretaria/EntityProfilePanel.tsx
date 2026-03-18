import { Entity, FiscalYear, TIPOLOGIA_LABELS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Phone, MapPin, Calendar, Hash, Briefcase, Globe } from "lucide-react";
import { mockFinancialIndicators, formatKz } from "@/data/mockData";
import { useFiscalYears } from "@/hooks/useFiscalYears";
import { EntityExerciciosTab } from "./EntityExerciciosTab";
import { EntityFinanceiroTab } from "./EntityFinanceiroTab";
import { useAuth } from "@/contexts/AuthContext";

interface EntityProfilePanelProps {
  entity: Entity;
  fiscalYear: FiscalYear;
  children?: React.ReactNode; // slot for Verificação Documental tab content
}

export function EntityProfilePanel({ entity, fiscalYear, children }: EntityProfilePanelProps) {
  const { user } = useAuth();
  const { fiscalYears: entityFiscalYears } = useFiscalYears(entity.id);
  const entityIndicators = mockFinancialIndicators.filter((fi) => fi.entityId === entity.id);

  // Hide financial data for Secretaria roles
  const showFinanceiro = user?.role !== "Chefe da Secretaria-Geral" &&
    user?.role !== "Técnico da Secretaria-Geral";

  const tabCount = showFinanceiro ? 4 : 3;

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight">{entity.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {TIPOLOGIA_LABELS[entity.tipologia]}
                </Badge>
                {entity.provincia && (
                  <Badge variant="secondary" className="text-[10px]">
                    {entity.provincia}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className={`w-full grid grid-cols-${tabCount}`}>
          <TabsTrigger value="perfil" className="text-xs">Perfil</TabsTrigger>
          <TabsTrigger value="exercicios" className="text-xs">Exercícios</TabsTrigger>
          <TabsTrigger value="verificacao" className="text-xs">Verificação</TabsTrigger>
          {showFinanceiro && (
            <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
          )}
        </TabsList>

        {/* Perfil Tab */}
        <TabsContent value="perfil" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da Entidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={<Hash className="h-4 w-4" />} label="NIF" value={entity.nif} mono />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Tutela" value={entity.tutela} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Contacto" value={entity.contacto} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Morada" value={entity.morada} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Província" value={entity.provincia || "—"} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Registado em" value={entity.createdAt} />
              </div>

              {/* Summary for the selected fiscal year — hide financial values for Secretaria */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-3">Exercício Seleccionado</p>
                <div className={`grid gap-4 ${showFinanceiro ? "grid-cols-3" : "grid-cols-1"}`}>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Exercício</p>
                    <p className="text-sm font-bold">{fiscalYear.year}</p>
                  </div>
                  {showFinanceiro && (
                    <>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Total Débito</p>
                        <p className="text-sm font-bold font-mono">{formatKz(fiscalYear.totalDebito)} Kz</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">Total Crédito</p>
                        <p className="text-sm font-bold font-mono">{formatKz(fiscalYear.totalCredito)} Kz</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercícios Tab */}
        <TabsContent value="exercicios" className="mt-4">
          <EntityExerciciosTab fiscalYears={entityFiscalYears} />
        </TabsContent>

        {/* Verificação Documental Tab */}
        <TabsContent value="verificacao" className="mt-4">
          {children}
        </TabsContent>

        {/* Financeiro Tab — only for non-Secretaria roles */}
        {showFinanceiro && (
          <TabsContent value="financeiro" className="mt-4">
            <EntityFinanceiroTab indicators={entityIndicators} entityName={entity.name} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
