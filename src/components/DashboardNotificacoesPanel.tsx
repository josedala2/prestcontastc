import { useMemo, useState } from "react";
import { useAuth, roleStagePermissions } from "@/contexts/AuthContext";
import { useSubmissions, PortalNotification } from "@/contexts/SubmissionContext";
import { WORKFLOW_STAGES } from "@/types/workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, XCircle, FileQuestion, FileSearch, Send, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Extract stage number from notification message like "...etapa 6: ..." */
function extractStageFromMessage(message: string): number | null {
  const match = message.match(/etapa\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

export function DashboardNotificacoesPanel() {
  const { user } = useAuth();
  const { notifications, markAsRead, refreshNotifications } = useSubmissions();
  const [showAll, setShowAll] = useState(false);

  const myStages = user ? roleStagePermissions[user.role] || [] : [];

  const filteredNotifs = useMemo(() => {
    if (!user || myStages.length === 0) return notifications;
    return notifications.filter((n) => {
      const stage = extractStageFromMessage(n.message);
      if (stage === null) return true; // show non-stage notifs to everyone
      return myStages.includes(stage) || myStages.includes(stage - 1);
    });
  }, [notifications, user, myStages]);

  const unread = filteredNotifs.filter((n) => !n.read).length;
  const displayed = showAll ? filteredNotifs.slice(0, 20) : filteredNotifs.slice(0, 6);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "submissao": return <Send className="h-3.5 w-3.5" />;
      case "recepcionado": return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejeitado": return <XCircle className="h-3.5 w-3.5" />;
      case "solicitacao_elementos": return <FileQuestion className="h-3.5 w-3.5" />;
      case "em_analise": return <FileSearch className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const getNotifColor = (type: string, isUnread: boolean) => {
    if (!isUnread) return "bg-muted text-muted-foreground";
    switch (type) {
      case "submissao": return "bg-primary/10 text-primary";
      case "recepcionado": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "rejeitado": return "bg-destructive/10 text-destructive";
      case "solicitacao_elementos": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "em_analise": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificações do Meu Perfil
            {unread > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 ml-1">
                {unread} não lida{unread !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshNotifications} title="Actualizar">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {user && myStages.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Etapas: {myStages.map((s) => {
                const stage = WORKFLOW_STAGES.find((ws) => ws.id === s);
                return stage ? `${s}` : `${s}`;
              }).join(", ")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({user.role})
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-6 w-6 mb-2 opacity-30" />
            <p className="text-xs">Sem notificações para o seu perfil</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayed.map((n) => (
              <button
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-start gap-2.5",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className={cn("mt-0.5 p-1 rounded-full shrink-0", getNotifColor(n.type, !n.read))}>
                  {getNotifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs leading-snug", !n.read ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            ))}
          </div>
        )}
        {filteredNotifs.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Mostrar menos" : `Ver todas (${filteredNotifs.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
