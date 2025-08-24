/**
 * Hook para métricas do dashboard admin v2
 */

import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface AdminMetrics {
  totalEvents: number
  totalRegistrations: number
  totalPatients: number
  occupancyRate: number
  activeEvents: number
  systemHealth: "healthy" | "warning" | "error"
}

export const useAdminMetricsV2 = () => {
  return useQuery({
    queryKey: ["admin-metrics-v2"],
    queryFn: async (): Promise<AdminMetrics> => {
      try {
        // Buscar métricas básicas
        const [eventsResult, registrationsResult, patientsResult] = await Promise.all([
          supabase.from("events").select("id", { count: "exact" }),
          supabase.from("registrations").select("id", { count: "exact" }),
          supabase.from("patients").select("id", { count: "exact" })
        ]);

        const totalEvents = eventsResult.count || 0;
        const totalRegistrations = registrationsResult.count || 0;
        const totalPatients = patientsResult.count || 0;

        // Buscar eventos ativos
        const { data: activeEventsData } = await supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("status", "active");

        const activeEvents = activeEventsData?.length || 0;

        // Calcular taxa de ocupação (simulada por enquanto)
        const occupancyRate = totalEvents > 0 ? Math.round((totalRegistrations / (totalEvents * 50)) * 100) : 0;

        // Determinar saúde do sistema
        let systemHealth: "healthy" | "warning" | "error" = "healthy";
        if (totalEvents === 0 && totalPatients === 0) {
          systemHealth = "warning";
        } else if (occupancyRate > 95) {
          systemHealth = "warning";
        }

        return {
          totalEvents,
          totalRegistrations,
          totalPatients,
          occupancyRate: Math.min(occupancyRate, 100),
          activeEvents,
          systemHealth
        };
      } catch (error) {
        console.error("Erro ao buscar métricas:", error);
        return {
          totalEvents: 0,
          totalRegistrations: 0,
          totalPatients: 0,
          occupancyRate: 0,
          activeEvents: 0,
          systemHealth: "error" as const
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000 // 10 minutos
  });
};
