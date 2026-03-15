import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockEntities, mockFiscalYears } from "@/data/mockData";
import { Eye, Search, Building2, Calendar, ChevronLeft, ChevronRight, Inbox, Stamp, BarChart3, CalendarCheck } from "lucide-react";

// Mock submission data
const mockSubmissoes = mockEntities.map((e, i) => ({
  id: e.id,
  entityName: e.name,
  nif: e.nif,
  provincia: e.provincia,
  tipologia: e.tipologia,
  exercicio: "2024",
  dataSubmissao: new Date(2025, 0 + i, 10 + i * 2).toLocaleDateString("pt-AO"),
  estado: (["submetido", "em_analise", "aprovado", "rejeitado"] as const)[i % 4],
}));

const estadoLabels: Record<string, string> = {
  submetido: "Submetido",
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  submetido: "outline",
  em_analise: "secondary",
  aprovado: "default",
  rejeitado: "destructive",
};

const ITEMS_PER_PAGE = 10;

const Submissoes = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = mockSubmissoes.filter((s) => {
    const matchSearch =
      s.entityName.toLowerCase().includes(search.toLowerCase()) ||
      s.nif.includes(search);
    const matchEstado = filtroEstado === "todos" || s.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // KPI stats
  const pendentesCount = mockSubmissoes.filter((s) => s.estado === "submetido").length;
  const emAnaliseCount = mockSubmissoes.filter((s) => s.estado === "em_analise").length;
  const aprovadosCount = mockSubmissoes.filter((s) => s.estado === "aprovado").length;
  const hoje = new Date();
  const submetidosEsteMes = mockFiscalYears.filter((fy) => {
    if (!fy.submittedAt) return false;
    const d = new Date(fy.submittedAt);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  return (
    <AppLayout>
      <PageHeader
        title="Submissões"
        description="Gestão de prestações de contas submetidas — Verificação documental e emissão de actas"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pendentes de Recepção"
          value={pendentesCount}
          subtitle="aguardam verificação documental"
          icon={<Inbox className="h-5 w-5" />}
          variant={pendentesCount > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Em Análise"
          value={emAnaliseCount}
          subtitle="transitaram para análise técnica"
          icon={<BarChart3 className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Aprovados"
          value={aprovadosCount}
          subtitle="concluídos com sucesso"
          icon={<Stamp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Recebidos Este Mês"
          value={submetidosEsteMes}
          subtitle={`de ${mockSubmissoes.length} total`}
          icon={<CalendarCheck className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou NIF..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={filtroEstado} onValueChange={(v) => { setFiltroEstado(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="submetido">Submetido</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-hidden rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Entidade
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold">NIF</TableHead>
                <TableHead className="text-xs font-semibold">Província</TableHead>
                <TableHead className="text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Exercício
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold">Data Submissão</TableHead>
                <TableHead className="text-xs font-semibold">Estado</TableHead>
                <TableHead className="text-xs font-semibold text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma submissão encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium max-w-[280px]">
                      <span className="line-clamp-1">{s.entityName}</span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{s.nif}</TableCell>
                    <TableCell className="text-sm">{s.provincia}</TableCell>
                    <TableCell className="text-sm font-medium">{s.exercicio}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.dataSubmissao}</TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[s.estado]}>
                        {estadoLabels[s.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => navigate(`/submissoes/${s.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {filtered.length} resultado(s) · Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </AppLayout>
  );
};

export default Submissoes;
