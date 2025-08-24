
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemAlert {
  id: string
  type: "warning" | "error" | "info" | "success"
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  priority: "high" | "medium" | "low"
  timestamp: string
}

export const useSystemAlerts = () => {
  return useQuery({
    queryKey: ["system-alerts"],
    queryFn: async (): Promise<SystemAlert[]> => {
      console.log("🚨 Verificando alertas do sistema...");
      
      const alerts: SystemAlert[] = [];
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Verificar eventos com vagas esgotadas
      const { data: fullEvents } = await supabase
        .from("events")
        .select("id, title, event_dates(*)")
        .eq("status", "full");

      fullEvents?.forEach(event => {
        alerts.push({
          id: `full-event-${event.id}`,
          type: "warning",
          title: "Evento com vagas esgotadas",
          message: `O evento "${event.title}" está com todas as vagas preenchidas`,
          actionLabel: "Ver evento",
          actionUrl: `/admin/events/${event.id}`,
          priority: "medium",
          timestamp: now.toISOString()
        });
      });

      // Verificar eventos próximos (24-48h)
      const { data: upcomingEvents } = await supabase
        .from("events")
        .select(`
          id, 
          title,
          event_dates!inner(date, start_time)
        `)
        .gte("event_dates.date", tomorrow.toISOString().split("T")[0])
        .lte("event_dates.date", dayAfterTomorrow.toISOString().split("T")[0])
        .eq("status", "open");

      upcomingEvents?.forEach(event => {
        alerts.push({
          id: `upcoming-event-${event.id}`,
          type: "info",
          title: "Evento próximo",
          message: `O evento "${event.title}" acontece em breve`,
          actionLabel: "Enviar lembretes",
          actionUrl: `/admin/events/${event.id}`,
          priority: "high",
          timestamp: now.toISOString()
        });
      });

      // Verificar erros de sincronização (últimas 24h)
      const { data: syncErrors } = await supabase
        .from("instituto_integration_queue")
        .select("id, error_message, updated_at")
        .eq("status", "failed")
        .gte("updated_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      if (syncErrors && syncErrors.length > 0) {
        alerts.push({
          id: "sync-errors",
          type: "error",
          title: "Erros de sincronização",
          message: `${syncErrors.length} erros de sincronização nas últimas 24h`,
          actionLabel: "Ver sincronização",
          actionUrl: "/admin/sync",
          priority: "high",
          timestamp: now.toISOString()
        });
      }

      // Ordenar por prioridade e timestamp
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const sortedAlerts = alerts.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      console.log(`✅ Encontrados ${sortedAlerts.length} alertas do sistema`);
      return sortedAlerts;
    },
    refetchInterval: 120000 // Atualizar a cada 2 minutos
  });
};
