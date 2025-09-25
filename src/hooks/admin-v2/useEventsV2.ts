
/**
 * EVENTS HOOK V2 - Gestão de eventos (versão corrigida)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventV2 {
  id: string
  title: string
  description: string
  location: string
  address: string
  city: string
  status: "open" | "closed" | "full" | "cancelled"
  organizer_id: string
  created_at: string
  updated_at: string
  // Campos calculados
  total_slots?: number
  occupied_slots?: number
  occupancy_rate?: number
  upcoming_dates?: EventDateV2[]
}

export interface EventDateV2 {
  id: string
  event_id: string
  date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
}

export interface EventCreation {
  title: string
  description: string
  location: string
  address: string
  city: string
  dates: {
    date: string
    start_time: string
    end_time: string
    total_slots: number
  }[]
}

export interface EventFormData {
  title: string
  description: string
  location: string
  address: string
  city: string
  dates: {
    date: string
    start_time: string
    end_time: string
    total_slots: number
  }[]
}

export interface EventFilters {
  search?: string
  city?: string
  status?: string
  organizer_id?: string
}

// Hook para buscar eventos
export const useEventsV2 = (filters: EventFilters = {}) => {
  return useQuery({
    queryKey: ["events-v2", filters],
    queryFn: async (): Promise<EventV2[]> => {
      try {
        console.log("🔍 [Events V2] Buscando eventos com filtros:", filters);
        
        let query = supabase
          .from("events")
          .select(`
            *,
            event_dates (
              id,
              date,
              start_time,
              end_time,
              total_slots,
              available_slots
            )
          `);

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
        }

        if (filters.city) {
          query = query.eq("city", filters.city);
        }

        if (filters.status && filters.status !== "all") {
          query = query.eq("status", filters.status);
        }

        if (filters.organizer_id) {
          query = query.eq("organizer_id", filters.organizer_id);
        }

        // Ordenar por data de criação (mais recente primeiro)
        query = query.order("created_at", { ascending: false });

        const { data: events, error } = await query;

        if (error) {
          console.error("❌ [Events V2] Erro ao buscar eventos:", error);
          throw error;
        }

        // Processar dados dos eventos
        const processedEvents: EventV2[] = (events || []).map(event => {
          const eventDates = event.event_dates || [];
          const totalSlots = eventDates.reduce((sum: number, date: any) => sum + date.total_slots, 0);
          const occupiedSlots = eventDates.reduce((sum: number, date: any) => sum + (date.total_slots - date.available_slots), 0);
          const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

          return {
            id: event.id,
            title: event.title,
            description: event.description || "",
            location: event.location,
            address: event.address,
            city: event.city,
            status: event.status as "open" | "closed" | "full" | "cancelled",
            organizer_id: event.organizer_id,
            created_at: event.created_at,
            updated_at: event.updated_at,
            total_slots: totalSlots,
            occupied_slots: occupiedSlots,
            occupancy_rate: occupancyRate,
            upcoming_dates: eventDates.slice(0, 3).map((date: any) => ({
              id: date.id,
              event_id: event.id,
              date: date.date,
              start_time: date.start_time,
              end_time: date.end_time,
              total_slots: date.total_slots,
              available_slots: date.available_slots
            }))
          };
        });

        console.log("📊 [Events V2] Eventos carregados:", processedEvents.length);
        return processedEvents;

      } catch (error) {
        console.error("❌ [Events V2] Erro crítico ao carregar eventos:", error);
        throw error;
      }
    },
    staleTime: 10000, // 10 segundos
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // 30 segundos
  });
};

// Hook para estatísticas de eventos
export const useEventStatsV2 = () => {
  return useQuery({
    queryKey: ["event-stats-v2"],
    queryFn: async () => {
      try {
        console.log("🔍 [Events V2] Buscando estatísticas...");

        // Buscar eventos
        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id, status, created_at");

        if (eventsError) {throw eventsError;}

        // Buscar datas dos eventos
        const { data: eventDates, error: datesError } = await supabase
          .from("event_dates")
          .select("total_slots, available_slots");

        if (datesError) {throw datesError;}

        const totalEvents = events?.length || 0;
        const activeEvents = events?.filter(e => e.status === "open").length || 0;
        const totalSlots = eventDates?.reduce((sum, date) => sum + date.total_slots, 0) || 0;
        const occupiedSlots = eventDates?.reduce((sum, date) => sum + (date.total_slots - date.available_slots), 0) || 0;
        const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

        return {
          total_events: totalEvents,
          active_events: activeEvents,
          total_slots: totalSlots,
          occupied_slots: occupiedSlots,
          occupancy_rate: occupancyRate
        };

      } catch (error) {
        console.error("❌ [Events V2] Erro ao carregar estatísticas:", error);
        return {
          total_events: 0,
          active_events: 0,
          total_slots: 0,
          occupied_slots: 0,
          occupancy_rate: 0
        };
      }
    },
    staleTime: 60000
  });
};

// Hook para buscar um evento específico
export const useEventV2 = (eventId: string) => {
  return useQuery({
    queryKey: ["event-v2", eventId],
    queryFn: async (): Promise<EventV2> => {
      try {
        console.log("🔍 [Events V2] Buscando evento:", eventId);
        
        const { data: event, error } = await supabase
          .from("events")
          .select(`
            *,
            event_dates (
              id,
              date,
              start_time,
              end_time,
              total_slots,
              available_slots
            )
          `)
          .eq("id", eventId)
          .single();

        if (error) {
          console.error("❌ [Events V2] Erro ao buscar evento:", error);
          throw error;
        }

        // Processar dados do evento
        const eventDates = event.event_dates || [];
        const totalSlots = eventDates.reduce((sum: number, date: any) => sum + date.total_slots, 0);
        const occupiedSlots = eventDates.reduce((sum: number, date: any) => sum + (date.total_slots - date.available_slots), 0);
        const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

        const processedEvent: EventV2 = {
          id: event.id,
          title: event.title,
          description: event.description || "",
          location: event.location,
          address: event.address,
          city: event.city,
          status: event.status as "open" | "closed" | "full" | "cancelled",
          organizer_id: event.organizer_id,
          created_at: event.created_at,
          updated_at: event.updated_at,
          total_slots: totalSlots,
          occupied_slots: occupiedSlots,
          occupancy_rate: occupancyRate,
          upcoming_dates: eventDates.map(date => ({
            id: date.id,
            event_id: eventId,
            date: date.date,
            start_time: date.start_time,
            end_time: date.end_time,
            total_slots: date.total_slots,
            available_slots: date.available_slots
          }))
        };

        console.log("✅ [Events V2] Evento carregado:", processedEvent.title);
        return processedEvent;

      } catch (error) {
        console.error("❌ [Events V2] Erro crítico ao carregar evento:", error);
        throw error;
      }
    },
    enabled: !!eventId,
    staleTime: 30000
  });
};

// Hook para criar evento
export const useCreateEventV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EventCreation) => {
      try {
        console.log("🔨 [Events V2] Criando evento:", data.title);
        
        // Criar evento
        const { data: event, error: eventError } = await supabase
          .from("events")
          .insert({
            title: data.title,
            description: data.description,
            location: data.location,
            address: data.address,
            city: data.city,
            organizer_id: (await supabase.auth.getUser()).data.user?.id!
          })
          .select()
          .single();

        if (eventError) {throw eventError;}

        // Criar datas do evento
        if (data.dates && data.dates.length > 0) {
          const eventDates = data.dates.map(date => ({
            event_id: event.id,
            date: date.date,
            start_time: date.start_time,
            end_time: date.end_time,
            total_slots: date.total_slots,
            available_slots: date.total_slots
          }));

          const { error: datesError } = await supabase
            .from("event_dates")
            .insert(eventDates);

          if (datesError) {throw datesError;}
        }

        console.log("✅ [Events V2] Evento criado:", event.id);
        return event.id;

      } catch (error: any) {
        console.error("❌ [Events V2] Erro crítico ao criar evento:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-v2"] });
      queryClient.invalidateQueries({ queryKey: ["event-stats-v2"] });
      toast.success("Evento criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [Events V2] Erro na criação:", error);
      toast.error(`Erro ao criar evento: ${  error.message || "Erro desconhecido"}`);
    }
  });
};

// Hook para atualizar evento
export const useUpdateEventV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string, data: Partial<EventFormData> }) => {
      try {
        console.log("🔨 [Events V2] Atualizando evento:", eventId);
        
        // Atualizar evento
        const { data: event, error: eventError } = await supabase
          .from("events")
          .update({
            title: data.title,
            description: data.description,
            location: data.location,
            address: data.address,
            city: data.city,
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId)
          .select()
          .single();

        if (eventError) {throw eventError;}

        // Se há novas datas, remover as antigas e criar as novas
        if (data.dates && data.dates.length > 0) {
          // Remover datas antigas
          const { error: deleteError } = await supabase
            .from("event_dates")
            .delete()
            .eq("event_id", eventId);

          if (deleteError) {throw deleteError;}

          // Criar novas datas
          const eventDates = data.dates.map(date => ({
            event_id: eventId,
            date: date.date,
            start_time: date.start_time,
            end_time: date.end_time,
            total_slots: date.total_slots,
            available_slots: date.total_slots
          }));

          const { error: datesError } = await supabase
            .from("event_dates")
            .insert(eventDates);

          if (datesError) {throw datesError;}
        }

        console.log("✅ [Events V2] Evento atualizado:", event.id);
        return event.id;

      } catch (error: any) {
        console.error("❌ [Events V2] Erro crítico ao atualizar evento:", error);
        throw error;
      }
    },
    onSuccess: (eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events-v2"] });
      queryClient.invalidateQueries({ queryKey: ["event-v2", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats-v2"] });
      toast.success("Evento atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [Events V2] Erro na atualização:", error);
      toast.error(`Erro ao atualizar evento: ${  error.message || "Erro desconhecido"}`);
    }
  });
};

// Hook para deletar evento
export const useDeleteEventV2 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      try {
        console.log("🗑️ [Events V2] Deletando evento:", eventId);
        
        // Primeiro, deletar as datas do evento
        const { error: datesError } = await supabase
          .from("event_dates")
          .delete()
          .eq("event_id", eventId);

        if (datesError) {throw datesError;}

        // Depois, deletar o evento
        const { error: eventError } = await supabase
          .from("events")
          .delete()
          .eq("id", eventId);

        if (eventError) {throw eventError;}

        console.log("✅ [Events V2] Evento deletado:", eventId);
        return eventId;

      } catch (error: any) {
        console.error("❌ [Events V2] Erro crítico ao deletar evento:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-v2"] });
      queryClient.invalidateQueries({ queryKey: ["event-stats-v2"] });
      toast.success("Evento deletado com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [Events V2] Erro na exclusão:", error);
      toast.error(`Erro ao deletar evento: ${  error.message || "Erro desconhecido"}`);
    }
  });
};
