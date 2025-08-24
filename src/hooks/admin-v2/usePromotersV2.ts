
/**
 * PROMOTERS HOOK V2 - Gestão de organizadores (versão corrigida)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PromoterV2 {
  id: string
  name: string
  email: string
  phone: string
  organization: string
  role: "admin" | "organizer"
  status: "active" | "inactive" | "pending"
  created_at: string
  last_login: string
  events_count: number
}

export interface PromoterFilters {
  search?: string
  role?: string
  status?: string
}

export interface PromoterCreation {
  name: string
  email: string
  phone?: string
  organization?: string
  role: "admin" | "organizer"
}

// Hook para buscar organizadores
export const usePromotersV2 = (filters: PromoterFilters = {}) => {
  return useQuery({
    queryKey: ["promoters-v2", filters],
    queryFn: async (): Promise<PromoterV2[]> => {
      try {
        console.log("🔍 [Promoters V2] Buscando organizadores com filtros:", filters);
        
        let query = supabase
          .from("organizers")
          .select(`
            *,
            events!organizer_id(count)
          `);

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        if (filters.role) {
          query = query.eq("role", filters.role);
        }

        if (filters.status) {
          query = query.eq("status", filters.status);
        }

        // Ordenar por data de criação (mais recente primeiro)
        query = query.order("created_at", { ascending: false });

        const { data: organizers, error } = await query;

        if (error) {
          console.error("❌ [Promoters V2] Erro ao buscar organizadores:", error);
          throw error;
        }

        // Processar dados dos organizadores
        const processedPromoters: PromoterV2[] = (organizers || []).map(organizer => ({
          id: organizer.id,
          name: organizer.name || "",
          email: organizer.email || "",
          phone: organizer.phone || "",
          organization: organizer.organization || "",
          role: (organizer.role as "admin" | "organizer") || "organizer",
          status: (organizer.status as "active" | "inactive" | "pending") || "active",
          created_at: organizer.created_at,
          last_login: organizer.last_login || "",
          events_count: 0 // Será calculado posteriormente
        }));

        console.log("📊 [Promoters V2] Organizadores carregados:", processedPromoters.length);
        return processedPromoters;

      } catch (error) {
        console.error("❌ [Promoters V2] Erro crítico ao carregar organizadores:", error);
        throw error;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

// Hook para criar organizador
export const useCreatePromoterV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PromoterCreation) => {
      try {
        console.log("🔨 [Promoters V2] Criando organizador:", data.email);
        
        const { data: organizer, error } = await supabase
          .from("organizers")
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            organization: data.organization,
            role: data.role,
            status: "active"
          })
          .select()
          .single();

        if (error) {throw error;}

        console.log("✅ [Promoters V2] Organizador criado:", organizer.id);
        return organizer.id;

      } catch (error: any) {
        console.error("❌ [Promoters V2] Erro crítico ao criar organizador:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters-v2"] });
      toast.success("Organizador criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [Promoters V2] Erro na criação:", error);
      toast.error(`Erro ao criar organizador: ${  error.message || "Erro desconhecido"}`);
    }
  });
};
