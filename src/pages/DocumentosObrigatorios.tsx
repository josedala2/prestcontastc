import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/ui-custom/PageElements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActaApreciacao } from "@/components/documentos/ActaApreciacao";
import { ExtractoBancario } from "@/components/documentos/ExtractoBancario";
import { Reconciliacoes } from "@/components/documentos/Reconciliacoes";
import { ComprovativosEntrega } from "@/components/documentos/ComprovativosEntrega";
import { InventarioPatrimonial } from "@/components/documentos/InventarioPatrimonial";
import { RelacaoAbates } from "@/components/documentos/RelacaoAbates";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";

const DocumentosObrigatorios = () => {
  const handlePrint = () => window.print();
  const handleExport = () => toast.info("Exportação dos documentos em desenvolvimento.");

  return (
    <AppLayout>
      <PageHeader
        title="Documentos Obrigatórios"
        description="Formulários adicionais exigidos pela Resolução 1/17 do Tribunal de Contas"
      >
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <FileDown className="h-4 w-4" /> Exportar
        </Button>
      </PageHeader>

      <Tabs defaultValue="acta" className="animate-fade-in">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="acta">Acta de Apreciação</TabsTrigger>
          <TabsTrigger value="extracto">Extracto Bancário</TabsTrigger>
          <TabsTrigger value="reconciliacoes">Reconciliações</TabsTrigger>
          <TabsTrigger value="comprovativos">Comprovativos</TabsTrigger>
          <TabsTrigger value="inventario">Inventário Patrimonial</TabsTrigger>
          <TabsTrigger value="abates">Relação de Abates</TabsTrigger>
        </TabsList>

        <TabsContent value="acta"><ActaApreciacao /></TabsContent>
        <TabsContent value="extracto"><ExtractoBancario /></TabsContent>
        <TabsContent value="reconciliacoes"><Reconciliacoes /></TabsContent>
        <TabsContent value="comprovativos"><ComprovativosEntrega /></TabsContent>
        <TabsContent value="inventario"><InventarioPatrimonial /></TabsContent>
        <TabsContent value="abates"><RelacaoAbates /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default DocumentosObrigatorios;
