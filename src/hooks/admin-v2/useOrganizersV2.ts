/**
 * Hook para gestão de organizadores V2
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizerV2 {
  id: string
  nome: string
  email: string
  telefone: string
  cidade?: string
  status: "active" | "inactive"
  created_at: string
  total_events?: number
}

export interface OrganizerFilters {
  search?: string
  status?: string
  cidade?: string
}

// Hook para buscar organizadores
export const useOrganizersV2 = (filters: OrganizerFilters = {}) => {
  return useQuery({
    queryKey: ["organizers-v2", filters],
    queryFn: async (): Promise<OrganizerV2[]> => {
      try {
        console.log("🔍 [Organizers V2] Buscando organizadores com filtros:", filters);
        
        // Buscar organizadores da tabela organizers (simplificado)
        const { data: organizers, error } = await supabase
          .from("organizers")
          .select("id, name, email, phone, organization, created_at");

        if (error) {
          console.error("❌ [Organizers V2] Erro ao buscar organizadores:", error);
          return [];
        }

        // Processar dados básicos
        const organizersWithStats: OrganizerV2[] = (organizers || []).map((organizer: any) => ({
          id: organizer.id,
          nome: organizer.name || "N/A",
          email: organizer.email || "N/A",
          telefone: organizer.phone || "N/A",
          cidade: organizer.organization || "N/A",
          status: "active" as const,
          created_at: organizer.created_at,
          total_events: 0
        }));

        console.log("📊 [Organizers V2] Organizadores carregados:", organizersWithStats.length);
        return organizersWithStats;

      } catch (error) {
        console.error("❌ [Organizers V2] Erro crítico ao carregar organizadores:", error);
        throw error;
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
};