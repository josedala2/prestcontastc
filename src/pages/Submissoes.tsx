import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader, StatCard } from "@/components/ui-custom/PageElements";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEntities } from "@/hooks/useEntities";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Search, Building2, Calendar, ChevronLeft, ChevronRight, Inbox, Stamp, BarChart3, CalendarCheck } from "lucide-react";

interface SubmissaoRow {
  id: string;
  entityId: string;
  fiscalYearId: string;
  processId?: string;
  entityName: string;
  nif: string;
  provincia?: string;
  exercicio: string;
  dataSubmissao: string;
  estado: string;
}

const estadoLabels: Record<string, string> = {
  rascunho: "Rascunho",
  pendente: "Pendente",
  submetido: "Submetido",
  recepcionado: "Recepcionado",
  em_analise: "Em Análise",
  rejeitado: "Rejeitado",
};

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  pendente: "outline",
  submetido: "outline",
  recepcionado: "default",
  em_analise: "secondary",
  rejeitado: "destructive",
};

const ITEMS_PER_PAGE = 10;

const extractExercise = (fiscalYearId?: string | null) => fiscalYearId?.split("-").pop() || "2024";

const Submissoes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entities } = useEntities();
  const [submissoes, setSubmissoes] = useState<SubmissaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadSubmissoes();
  }, [entities]);

  const handleOpenSubmission = (submissao: SubmissaoRow) => {
    if (user?.role === "Escrivão dos Autos" && submissao.processId) {
      navigate(`/escrivao/registo-autuacao?processoId=${submissao.processId}`);
      return;
    }

    navigate(`/submissoes/${submissao.id}`);
  };

  const loadSubmissoes = async () => {
    if (entities.length === 0) return;
    setLoading(true);

    const { data: subs } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: processos } = await supabase
      .from("processos")
      .select("id, entity_id, ano_gerencia")
      .order("created_at", { ascending: false });

    const processosByEntityYear = new Map(
      ((processos as Array<{ id: string; entity_id: string; ano_gerencia: number }> | null) || []).map((processo) => [
        `${processo.entity_id}::${processo.ano_gerencia}`,
        processo.id,
      ])
    );

    if (subs) {
      const rows: SubmissaoRow[] = subs.map((s: any) => {
        const ent = entities.find((e) => e.id === s.entity_id);
        const exercicio = extractExercise(s.fiscal_year_id);

        return {
          id: s.id,
          entityId: s.entity_id,
          fiscalYearId: s.fiscal_year_id,
          processId: processosByEntityYear.get(`${s.entity_id}::${exercicio}`),
          entityName: ent?.name || s.entity_id,
          nif: ent?.nif || "",
          provincia: ent?.provincia,
          exercicio,
          dataSubmissao: s.submitted_at
            ? new Date(s.submitted_at).toLocaleDateString("pt-AO")
            : new Date(s.created_at).toLocaleDateString("pt-AO"),
          estado: s.status,
        };
      });
      setSubmissoes(rows);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => submissoes.filter((s) => {
    const matchSearch =
      s.entityName.toLowerCase().includes(search.toLowerCase()) ||
      s.nif.includes(search);
    const matchEstado = filtroEstado === "todos" || s.estado === filtroEstado;
    return matchSearch && matchEstado;
  }), [submissoes, search, filtroEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const pendentesCount = submissoes.filter((s) => s.estado === "pendente" || s.estado === "submetido").length;
  const emAnaliseCount = submissoes.filter((s) => s.estado === "em_analise").length;
  const recepcionadosCount = submissoes.filter((s) => s.estado === "recepcionado").length;

  return (
    <AppLayout>
      <PageHeader
        title="Submissões"
        description="Gestão de prestações de contas submetidas — Verificação documental e emissão de actas"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pendentes"
          value={pendentesCount}
          subtitle="aguardam verificação"
          icon={<Inbox className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Em Análise"
          value={emAnaliseCount}
          subtitle="transitaram para análise técnica"
          icon={<BarChart3 className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Recepcionados"
          value={recepcionadosCount}
          subtitle="concluídos com sucesso"
          icon={<Stamp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total"
          value={submissoes.length}
          subtitle="submissões registadas"
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="submetido">Submetido</SelectItem>
                <SelectItem value="recepcionado">Recepcionado</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    A carregar submissões...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma submissão encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((s) => (
                  <TableRow key={s.id} className={`hover:bg-muted/30 ${s.estado === "pendente" ? "bg-primary/[0.03]" : ""}`}>
                    <TableCell className="text-sm font-medium max-w-[280px]">
                      <span className="line-clamp-1">{s.entityName}</span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{s.nif}</TableCell>
                    <TableCell className="text-sm">{s.provincia}</TableCell>
                    <TableCell className="text-sm font-medium">{s.exercicio}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.dataSubmissao}</TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[s.estado] || "outline"}>
                        {estadoLabels[s.estado] || s.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => handleOpenSubmission(s)}
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
