import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubmissions, PortalNotification } from "@/contexts/SubmissionContext";
import { usePortalEntity } from "@/contexts/PortalEntityContext";
import {
  Bell,
  CheckCircle,
  XCircle,
  Filter,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "todas" | "recepcionado" | "rejeitado" | "nao_lidas";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "nao_lidas", label: "Não lidas" },
  { value: "recepcionado", label: "Recepcionadas" },
  { value: "rejeitado", label: "Devolvidas" },
];

export function NotificacoesPanel() {
  const { entity } = usePortalEntity();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSubmissions();
  const [filter, setFilter] = useState<FilterType>("todas");

  const entityNotifications = notifications.filter((n) => n.entityId === entity.id);
  const entityUnread = unreadCount(entity.id);

  const filtered = entityNotifications.filter((n) => {
    if (filter === "nao_lidas") return !n.read;
    if (filter === "recepcionado") return n.type === "recepcionado";
    if (filter === "rejeitado") return n.type === "rejeitado";
    return true;
  });

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

        {/* Filters */}
        <div className="flex items-center gap-1.5 pt-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const count =
              opt.value === "todas"
                ? entityNotifications.length
                : opt.value === "nao_lidas"
                ? entityUnread
                : entityNotifications.filter((n) => n.type === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
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
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {filter === "todas" ? "Sem notificações" : "Nenhuma notificação neste filtro"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              As notificações aparecem quando a Secretaria processa a sua submissão.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onRead={() => markAsRead(notif.id)}
                formatDate={formatDate}
                formatRelative={formatRelative}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  notif,
  onRead,
  formatDate,
  formatRelative,
}: {
  notif: PortalNotification;
  onRead: () => void;
  formatDate: (iso: string) => string;
  formatRelative: (iso: string) => string;
}) {
  const isSuccess = notif.type === "recepcionado";

  return (
    <button
      onClick={onRead}
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
            : "bg-destructive/10 text-destructive"
        )}
      >
        {isSuccess ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm", !notif.read && "font-semibold")}>{notif.message}</p>
          {!notif.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        {notif.detail && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {notif.detail}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-muted-foreground">{formatDate(notif.createdAt)}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0",
              isSuccess ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400" : "border-destructive/30 text-destructive"
            )}
          >
            {isSuccess ? "Recepcionado" : "Devolvido"}
          </Badge>
          <span className="text-[10px] text-muted-foreground/60 ml-auto">{formatRelative(notif.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}
