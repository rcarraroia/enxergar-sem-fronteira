/**
 * Hook para gestão de campanhas V2
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignV2 {
  id: string
  title: string
  description: string
  goal_amount: number
  raised_amount: number
  progress: number
  status: "active" | "completed" | "paused" | "cancelled"
  start_date: string
  end_date?: string
  created_at: string
}

export interface CampaignFilters {
  search?: string
  status?: string
}

// Hook para buscar campanhas
export const useCampaignsV2 = (filters: CampaignFilters = {}) => {
  return useQuery({
    queryKey: ["campaigns-v2", filters],
    queryFn: async (): Promise<CampaignV2[]> => {
      try {
        console.log("🔍 [Campaigns V2] Buscando campanhas com filtros:", filters);
        
        // Por enquanto, retornar dados simulados já que não temos tabela de campanhas
        const mockCampaigns: CampaignV2[] = [
          {
            id: "1",
            title: "Campanha de Óculos 2025",
            description: "Arrecadação para compra de óculos para pacientes carentes",
            goal_amount: 50000,
            raised_amount: 32500,
            progress: 65,
            status: "active",
            start_date: "2025-01-01",
            end_date: "2025-12-31",
            created_at: "2025-01-01T00:00:00Z"
          },
          {
            id: "2",
            title: "Equipamentos Médicos",
            description: "Compra de novos equipamentos para exames oftalmológicos",
            goal_amount: 100000,
            raised_amount: 25000,
            progress: 25,
            status: "active",
            start_date: "2025-02-01",
            end_date: "2025-11-30",
            created_at: "2025-02-01T00:00:00Z"
          },
          {
            id: "3",
            title: "Cirurgias de Catarata",
            description: "Financiamento de cirurgias de catarata para idosos",
            goal_amount: 75000,
            raised_amount: 75000,
            progress: 100,
            status: "completed",
            start_date: "2024-06-01",
            end_date: "2024-12-31",
            created_at: "2024-06-01T00:00:00Z"
          }
        ];

        // Aplicar filtros
        let filteredCampaigns = mockCampaigns;

        if (filters.search) {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            campaign.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
            campaign.description.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }

        if (filters.status && filters.status !== "all") {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            campaign.status === filters.status
          );
        }

        console.log("📊 [Campaigns V2] Campanhas carregadas:", filteredCampaigns.length);
        return filteredCampaigns;

      } catch (error) {
        console.error("❌ [Campaigns V2] Erro crítico ao carregar campanhas:", error);
        throw error;
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
};