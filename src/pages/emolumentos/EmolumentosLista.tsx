import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEmolumentos } from "@/hooks/useEmolumentos";
import { formatKz, ESTADO_LABELS, ESTADOS_EMOLUMENTO, TIPO_PROCESSO_LABELS, EstadoEmolumento, TipoProcesso } from "@/lib/emolumentosCalculo";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";

export default function EmolumentosLista() {
  const { emolumentos, loading } = useEmolumentos();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const filtered = emolumentos.filter((em) => {
    const matchSearch = !search || 
      em.numero_processo.toLowerCase().includes(search.toLowerCase()) ||
      em.entity_name.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === "todos" || em.estado === filtroEstado;
    const matchTipo = filtroTipo === "todos" || em.tipo_processo === filtroTipo;
    return matchSearch && matchEstado && matchTipo;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Emolumentos</h1>
            <p className="text-sm text-muted-foreground">Lista completa de emolumentos</p>
          </div>
          <Button onClick={() => navigate("/emolumentos/novo")} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Emolumento
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground mb-1 block">Pesquisar</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Processo ou entidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
                </div>
              </div>
              <div className="w-[180px]">
                <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {ESTADOS_EMOLUMENTO.map((e) => (
                      <SelectItem key={e} value={e}>{ESTADO_LABELS[e].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[220px]">
                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(TIPO_PROCESSO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">A carregar...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum emolumento encontrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Processo</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Entidade</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Base Cálculo</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Valor Final</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Pago</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Dívida</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((em) => {
                      const info = ESTADO_LABELS[em.estado as EstadoEmolumento];
                      return (
                        <tr key={em.id} className="border-b hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/emolumentos/${em.id}`)}>
                          <td className="p-3 font-mono text-xs">{em.numero_processo}</td>
                          <td className="p-3 truncate max-w-[180px]">{em.entity_name}</td>
                          <td className="p-3 text-xs">{TIPO_PROCESSO_LABELS[em.tipo_processo as TipoProcesso] || em.tipo_processo}</td>
                          <td className="p-3 text-right">{formatKz(Number(em.base_calculo))}</td>
                          <td className="p-3 text-right font-medium">{formatKz(Number(em.valor_final))}</td>
                          <td className="p-3 text-right text-green-700">{formatKz(Number(em.valor_pago))}</td>
                          <td className="p-3 text-right text-red-700">{formatKz(Number(em.valor_divida))}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[10px] ${info?.color || ""}`}>{info?.label || em.estado}</Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{new Date(em.created_at).toLocaleDateString("pt-AO")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
