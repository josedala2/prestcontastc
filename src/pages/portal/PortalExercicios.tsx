import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader, StatusBadge } from "@/components/ui-custom/PageElements";
import { mockFiscalYears, mockAttachments } from "@/data/mockData";
import { STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Eye, FileText, Paperclip, Download } from "lucide-react";

const PortalExercicios = () => {
  const navigate = useNavigate();
  const { entityId } = usePortalEntity();
  const entityExercicios = mockFiscalYears.filter((fy) => fy.entityId === entityId);

  return (
    <PortalLayout>
      <PageHeader title="Exercícios Fiscais" description="Balancete e documentos submetidos por exercício" />

      <div className="space-y-6">
        {entityExercicios.map((fy) => (
          <Card key={fy.id} className="animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Exercício {fy.year}</CardTitle>
                  <StatusBadge
                    status={STATUS_LABELS[fy.status].label}
                    variant={STATUS_LABELS[fy.status].color as any}
                  />
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate(`/portal/exercicios/${fy.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> Ver Balancete
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Documentos submetidos */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" /> Documentos Submetidos
                </h4>
                {mockAttachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">Nenhum documento submetido.</p>
                ) : (
                  <div className="space-y-1.5">
                    {mockAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(a.size / 1024 / 1024).toFixed(1)} MB · {a.uploadedAt} · v{a.version}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 shrink-0">
                          <Download className="h-3 w-3" /> Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {entityExercicios.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Sem exercícios registados para esta entidade.</div>
        )}
      </div>
    </PortalLayout>
  );
};

export default PortalExercicios;
