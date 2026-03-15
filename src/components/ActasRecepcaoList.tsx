import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCheck, Download, Calendar, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  allowEdit?: boolean;
  onEdit?: (acta: Acta) => void;
}

export function ActasRecepcaoList({ entityId, fiscalYear, compact, allowEdit, onEdit }: ActasRecepcaoListProps) {
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchActas();
  }, [entityId, fiscalYear]);

  const handlePreview = (filePath: string) => {
    const { data } = supabase.storage
      .from("actas-recepcao")
      .getPublicUrl(filePath);
    window.open(data.publicUrl, "_blank", "noopener,noreferrer");
  };

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

  const handleDelete = async (acta: Acta) => {
    try {
      // Delete from storage
      await supabase.storage.from("actas-recepcao").remove([acta.file_path]);
      // Delete record - need DELETE policy, fallback gracefully
      const { error } = await supabase.from("actas_recepcao").delete().eq("id", acta.id) as any;
      if (error) console.error("Delete record error:", error);
      setActas((prev) => prev.filter((a) => a.id !== acta.id));
      toast.success("Acta removida com sucesso.");
    } catch {
      toast.error("Erro ao remover a acta.");
    }
    setDeleteId(null);
  };

  const actaToDelete = actas.find((a) => a.id === deleteId);

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

  const actionButtons = (acta: Acta) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => handlePreview(acta.file_path, acta.acta_numero)}
        title="Visualizar"
      >
        <Eye className="h-3.5 w-3.5" />
        {!compact && "Ver"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => handleDownload(acta.file_path, acta.file_name)}
        title="Descarregar"
      >
        <Download className="h-3.5 w-3.5" />
        {!compact && "PDF"}
      </Button>
      {allowEdit && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => onEdit(acta)}
          title="Editar e regenerar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {allowEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-destructive"
          onClick={() => setDeleteId(acta.id)}
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      {compact ? (
        <div className="space-y-2">
          {actas.map((acta) => (
            <div key={acta.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
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
                {actionButtons(acta)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              Actas de Recepção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actas.map((acta) => (
              <div key={acta.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
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
                  {actionButtons(acta)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Acta de Recepção — {previewTitle}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <embed
              src={previewUrl}
              type="application/pdf"
              className="w-full flex-1 min-h-0 rounded-lg border"
              style={{ height: "calc(85vh - 80px)" }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" /> Remover Acta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a acta <strong>{actaToDelete?.acta_numero}</strong>?
              Esta acção não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actaToDelete && handleDelete(actaToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
