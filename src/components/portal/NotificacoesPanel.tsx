import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSubmissions, PortalNotification } from "@/contexts/SubmissionContext";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import {
  Bell,
  CheckCircle,
  XCircle,
  Filter,
  CheckCheck,
  Inbox,
  Search,
  Mail,
  MailX,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "todas" | "recepcionado" | "rejeitado" | "solicitacao_elementos" | "em_analise" | "nao_lidas";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "nao_lidas", label: "Não lidas" },
  { value: "recepcionado", label: "Recepcionadas" },
  { value: "em_analise", label: "Em Análise" },
  { value: "rejeitado", label: "Devolvidas" },
  { value: "solicitacao_elementos", label: "Solicitações" },
];

const PAGE_SIZE = 5;

export function NotificacoesPanel() {
  const { entity } = usePortalEntity();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loadingNotifications, refreshNotifications } = useSubmissions();
  const [filter, setFilter] = useState<FilterType>("todas");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const entityNotifications = notifications.filter((n) => n.entityId === entity.id);
  const entityUnread = unreadCount(entity.id);

  const filtered = useMemo(() => {
    let result = entityNotifications;

    // Type/read filter
    if (filter === "nao_lidas") result = result.filter((n) => !n.read);
    else if (filter === "recepcionado") result = result.filter((n) => n.type === "recepcionado");
    else if (filter === "rejeitado") result = result.filter((n) => n.type === "rejeitado");
    else if (filter === "solicitacao_elementos") result = result.filter((n) => n.type === "solicitacao_elementos");

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.message.toLowerCase().includes(q) ||
          (n.detail && n.detail.toLowerCase().includes(q)) ||
          n.fiscalYearId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [entityNotifications, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeePage = Math.min(page, totalPages - 1);
  const paginated = filtered.slice(safeePage * PAGE_SIZE, (safeePage + 1) * PAGE_SIZE);

  // Reset page when filter/search changes
  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(0);
  };
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(0);
  };

  const filterCounts = useMemo(() => ({
    todas: entityNotifications.length,
    nao_lidas: entityUnread,
    recepcionado: entityNotifications.filter((n) => n.type === "recepcionado").length,
    rejeitado: entityNotifications.filter((n) => n.type === "rejeitado").length,
    solicitacao_elementos: entityNotifications.filter((n) => n.type === "solicitacao_elementos").length,
  }), [entityNotifications, entityUnread]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificações
            {entityUnread > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {entityUnread} nova{entityUnread !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 h-7"
              onClick={() => refreshNotifications()}
              disabled={loadingNotifications}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingNotifications && "animate-spin")} />
              Actualizar
            </Button>
            {entityUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1.5 h-7"
                onClick={() => markAllAsRead(entity.id)}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 mt-1 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar notificações..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 pt-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const count = filterCounts[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {opt.label}
                {count > 0 && (
                  <span className={cn("ml-1", isActive ? "opacity-80" : "opacity-60")}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {loadingNotifications && filtered.length === 0 ? (
          <div className="text-center py-10">
            <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">A carregar notificações...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {search ? "Nenhum resultado encontrado" : filter === "todas" ? "Sem notificações" : "Nenhuma notificação neste filtro"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {search
                ? "Tente ajustar os termos de pesquisa."
                : "As notificações aparecem quando a Secretaria processa a sua submissão."}
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted-foreground">
                {filtered.length} notificação{filtered.length !== 1 ? "ões" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-2">
              {paginated.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={() => markAsRead(notif.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  Página {safeePage + 1} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={safeePage === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={safeePage >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: PortalNotification;
  onRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = notif.type === "recepcionado";
  const isSolicitacao = notif.type === "solicitacao_elementos";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-AO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora mesmo";
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days}d`;
  };

  const handleClick = () => {
    if (!notif.read) onRead();
    setExpanded((e) => !e);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-all",
        notif.read
          ? "bg-card border-border hover:bg-muted/30"
          : "bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm"
      )}
    >
      <div
        className={cn(
          "mt-0.5 shrink-0 rounded-full p-1.5",
          isSuccess
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : isSolicitacao
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {isSuccess ? (
          <CheckCircle className="h-4 w-4" />
        ) : isSolicitacao ? (
          <FileQuestion className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm flex-1", !notif.read && "font-semibold")}>{notif.message}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {!notif.read && <span className="w-2 h-2 rounded-full bg-primary" />}
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Collapsed info */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0",
              isSuccess ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                : isSolicitacao ? "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                : "border-destructive/30 text-destructive"
            )}
          >
            {isSuccess ? "Recepcionado" : isSolicitacao ? "Solicitação" : "Devolvido"}
          </Badge>
          <span className="text-[10px] text-muted-foreground/60">{formatRelative(notif.createdAt)}</span>
          {notif.emailSent !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 text-[9px]", notif.emailSent ? "text-green-600 dark:text-green-400" : "text-muted-foreground/50")}>
              {notif.emailSent ? <Mail className="h-3 w-3" /> : <MailX className="h-3 w-3" />}
              {notif.emailSent ? "Email enviado" : "Sem email"}
            </span>
          )}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-fade-in">
            {notif.detail && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Detalhe</p>
                <p className="text-xs text-foreground leading-relaxed">{notif.detail}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Data</p>
                <p className="text-xs text-foreground">{formatDate(notif.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Exercício</p>
                <p className="text-xs text-foreground">{notif.fiscalYearId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
