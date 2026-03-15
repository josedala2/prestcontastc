import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Acta {
  id: string;
  entity_id: string;
  entity_name: string;
  fiscal_year: string;
  acta_numero: string;
  file_path: string;
  file_name: string;
  created_at: string;
  created_by: string;
}

interface ActasRecepcaoListProps {
  entityId?: string;
  fiscalYear?: string;
  compact?: boolean;
}

export function ActasRecepcaoList({ entityId, fiscalYear, compact }: ActasRecepcaoListProps) {
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActas = async () => {
      setLoading(true);
      let query = supabase
        .from("actas_recepcao")
        .select("*")
        .order("created_at", { ascending: false });

      if (entityId) query = query.eq("entity_id", entityId);
      if (fiscalYear) query = query.eq("fiscal_year", fiscalYear);

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching actas:", error);
      } else {
        setActas((data as any[]) || []);
      }
      setLoading(false);
    };
    fetchActas();
  }, [entityId, fiscalYear]);

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("actas-recepcao")
        .download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao descarregar a acta.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          A carregar actas...
        </CardContent>
      </Card>
    );
  }

  if (actas.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma acta de recepção disponível.</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {actas.map((acta) => (
          <div
            key={acta.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{acta.acta_numero}</p>
                <p className="text-xs text-muted-foreground">
                  {acta.entity_name} · Exercício {acta.fiscal_year}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {new Date(acta.created_at).toLocaleDateString("pt-AO")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => handleDownload(acta.file_path, acta.file_name)}
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          Actas de Recepção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actas.map((acta) => (
          <div
            key={acta.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{acta.acta_numero}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{acta.entity_name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {acta.fiscal_year}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(acta.created_at).toLocaleDateString("pt-AO")}
                </p>
                <p className="text-[10px] text-muted-foreground">{acta.created_by}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleDownload(acta.file_path, acta.file_name)}
              >
                <Download className="h-3.5 w-3.5" />
                Descarregar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
