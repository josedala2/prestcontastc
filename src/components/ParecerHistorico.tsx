import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateParecerPdf } from "@/lib/parecerPdfGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Download, FileText, Shield } from "lucide-react";
import { toast } from "sonner";

interface Parecer {
  id: string;
  entity_id: string;
  entity_name: string;
  fiscal_year: string;
  version: number;
  parecer_final: string;
  tecnico_nome: string;
  file_path: string | null;
  file_name: string | null;
  integrity_hash: string | null;
  created_at: string;
  total_activo: number;
  total_passivo: number;
  resultado_exercicio: number;
}

const formatKz = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA" }).replace("AOA", "Kz");

interface ParecerHistoricoProps {
  entityId: string;
  fiscalYear: string;
  refreshKey?: number;
}

export function ParecerHistorico({ entityId, fiscalYear, refreshKey }: ParecerHistoricoProps) {
  const [pareceres, setPareceres] = useState<Parecer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPareceres = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pareceres")
        .select("*")
        .eq("entity_id", entityId)
        .eq("fiscal_year", fiscalYear)
        .order("version", { ascending: false });

      if (!error && data) {
        setPareceres(data as unknown as Parecer[]);
      }
      setLoading(false);
    };
    fetchPareceres();
  }, [entityId, fiscalYear, refreshKey]);

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from("pareceres").download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao descarregar o ficheiro.");
    }
  };

  const parecerColor = (p: string) => {
    if (p === "favorável") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (p === "favorável com reservas") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          A carregar histórico...
        </CardContent>
      </Card>
    );
  }

  if (pareceres.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Histórico de Pareceres
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Nenhum parecer emitido para este exercício.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Histórico de Pareceres
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {pareceres.length} versão(ões)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y divide-border">
            {pareceres.map((p, idx) => (
              <div key={p.id} className={`px-4 py-3 flex items-center gap-3 ${idx === 0 ? "bg-primary/5" : ""}`}>
                <div className="flex-shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Versão {p.version}</span>
                    {idx === 0 && (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0">Actual</Badge>
                    )}
                    <Badge className={`text-[9px] px-1.5 py-0 capitalize border-0 ${parecerColor(p.parecer_final)}`}>
                      {p.parecer_final}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      por {p.tecnico_nome}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Resultado: {formatKz(p.resultado_exercicio)}
                    </span>
                  </div>
                  {p.integrity_hash && (
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[200px]">
                        SHA-256: {p.integrity_hash.substring(0, 16)}...
                      </span>
                    </div>
                  )}
                </div>
                {p.file_path && p.file_name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 gap-1.5 text-xs"
                    onClick={() => handleDownload(p.file_path!, p.file_name!)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    DOCX
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
