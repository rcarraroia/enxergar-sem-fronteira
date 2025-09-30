/**
 * Hook para controle de eventos - Interface de atendimento
 * Gerencia presenças, compras de óculos e finalização de atendimentos
 */

import { supabase } from "@/integrations/supabase/client";
import { webhookService } from "@/services/WebhookService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface EventControlRegistration {
  id: string;
  patient_id: string;
  event_date_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_date?: string;
  delivery_status: string;

  // Novos campos de controle (após migração)
  attendance_confirmed?: boolean;
  attendance_confirmed_at?: string;
  purchased_glasses?: boolean;
  glasses_purchase_amount?: number;
  process_completed?: boolean;
  completed_at?: string;
  attended_by?: string;

  // Dados relacionados
  patient: {
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
  };
  event_date: {
    date: string;
    start_time: string;
    end_time: string;
    event: {
      title: string;
      location: string;
      city: string;
    };
  };
}

export interface EventControlFilters {
  search?: string;
  status?: 'all' | 'waiting' | 'present' | 'with_glasses' | 'without_glasses' | 'completed';
}

export interface EventControlStats {
  total: number;
  present: number;
  absent: number;
  withGlasses: number;
  completed: number;
  totalRevenue: number;
}

// Hook para buscar registros de um evento específico
export const useEventControlRegistrations = (eventDateId: string, filters: EventControlFilters = {}) => {
  return useQuery({
    queryKey: ["event-control-registrations", eventDateId, filters],
    queryFn: async (): Promise<EventControlRegistration[]> => {
      try {
        console.log("🔍 [EventControl] Buscando registros do evento:", eventDateId);

        let query = supabase
          .from("registrations")
          .select(`
            *,
            patients!inner(nome, telefone, email, cpf),
            event_dates!inner(
              date, start_time, end_time,
              events!inner(title, location, city)
            )
          `)
          .eq("event_date_id", eventDateId);

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`patients.nome.ilike.%${filters.search}%,patients.cpf.ilike.%${filters.search}%`);
        }

        // Filtros de status serão aplicados no frontend por enquanto
        // (até a migração ser aplicada)

        const { data: registrations, error } = await query.order("created_at", { ascending: true });

        if (error) {
          console.error("❌ [EventControl] Erro ao buscar registros:", error);
          throw error;
        }

        const processedRegistrations: EventControlRegistration[] = (registrations || []).map(registration => ({
          id: registration.id,
          patient_id: registration.patient_id,
          event_date_id: registration.event_date_id,
          status: registration.status,
          created_at: registration.created_at,
          updated_at: registration.updated_at,
          delivery_date: registration.delivery_date,
          delivery_status: registration.delivery_status || 'pending',

          // Novos campos (serão null até migração ser aplicada)
          attendance_confirmed: registration.attendance_confirmed || false,
          attendance_confirmed_at: registration.attendance_confirmed_at,
          purchased_glasses: registration.purchased_glasses || false,
          glasses_purchase_amount: registration.glasses_purchase_amount,
          process_completed: registration.process_completed || false,
          completed_at: registration.completed_at,
          attended_by: registration.attended_by,

          patient: registration.patients,
          event_date: registration.event_dates
        }));

        console.log("📊 [EventControl] Registros carregados:", processedRegistrations.length);
        return processedRegistrations;

      } catch (error) {
        console.error("❌ [EventControl] Erro crítico ao carregar registros:", error);
        throw error;
      }
    },
    enabled: !!eventDateId,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

// Hook para confirmar presença
export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, attendedBy }: { registrationId: string, attendedBy: string }) => {
      try {
        console.log("✅ [EventControl] Confirmando presença:", registrationId);

        const { data, error } = await supabase
          .from("registrations")
          .update({
            attendance_confirmed: true,
            attendance_confirmed_at: new Date().toISOString(),
            attended_by: attendedBy,
            updated_at: new Date().toISOString()
          })
          .eq("id", registrationId)
          .select()
          .single();

        if (error) {
          console.error("❌ [EventControl] Erro ao confirmar presença:", error);
          throw error;
        }

        console.log("✅ [EventControl] Presença confirmada:", data.id);
        return data;

      } catch (error: any) {
        console.error("❌ [EventControl] Erro crítico ao confirmar presença:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-control-registrations"] });
      toast.success("Presença confirmada com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [EventControl] Erro na confirmação de presença:", error);
      toast.error(`Erro ao confirmar presença: ${error.message || "Erro desconhecido"}`);
    }
  });
};

// Hook para registrar compra de óculos
export const useRegisterGlasses = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationId,
      amount,
      deliveryDate,
      attendedBy
    }: {
      registrationId: string;
      amount: number;
      deliveryDate: Date;
      attendedBy: string;
    }) => {
      try {
        console.log("👓 [EventControl] Registrando compra de óculos:", registrationId);

        const { data, error } = await supabase
          .from("registrations")
          .update({
            purchased_glasses: true,
            glasses_purchase_amount: amount,
            delivery_date: deliveryDate.toISOString(),
            delivery_status: 'scheduled',
            attended_by: attendedBy,
            updated_at: new Date().toISOString()
          })
          .eq("id", registrationId)
          .select()
          .single();

        if (error) {
          console.error("❌ [EventControl] Erro ao registrar óculos:", error);
          throw error;
        }

        // Disparar webhook de entrega (não-bloqueante)
        webhookService.sendDeliveryWebhook(registrationId, deliveryDate).catch(error => {
          console.warn("⚠️ Webhook de entrega falhou (não afeta operação):", error);
        });

        console.log("✅ [EventControl] Óculos registrados:", data.id);
        return data;

      } catch (error: any) {
        console.error("❌ [EventControl] Erro crítico ao registrar óculos:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-control-registrations"] });
      toast.success("Compra de óculos registrada com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [EventControl] Erro no registro de óculos:", error);
      toast.error(`Erro ao registrar óculos: ${error.message || "Erro desconhecido"}`);
    }
  });
};

// Hook para finalizar atendimento
export const useCompleteProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, attendedBy }: { registrationId: string, attendedBy: string }) => {
      try {
        console.log("✔️ [EventControl] Finalizando atendimento:", registrationId);

        // Primeiro, buscar dados atuais para verificar se comprou óculos
        const { data: currentData, error: fetchError } = await supabase
          .from("registrations")
          .select("purchased_glasses, attendance_confirmed")
          .eq("id", registrationId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Validar que presença foi confirmada
        if (!currentData.attendance_confirmed) {
          throw new Error("Presença deve ser confirmada antes de finalizar o atendimento");
        }

        const { data, error } = await supabase
          .from("registrations")
          .update({
            process_completed: true,
            completed_at: new Date().toISOString(),
            attended_by: attendedBy,
            updated_at: new Date().toISOString()
          })
          .eq("id", registrationId)
          .select()
          .single();

        if (error) {
          console.error("❌ [EventControl] Erro ao finalizar atendimento:", error);
          throw error;
        }

        // Se não comprou óculos, agendar webhook de doação para 48h depois
        if (!currentData.purchased_glasses) {
          const baseDate = new Date();
          webhookService.scheduleDonationWebhook(registrationId, baseDate).catch(error => {
            console.warn("⚠️ Agendamento de webhook de doação falhou (não afeta operação):", error);
          });
        }

        console.log("✅ [EventControl] Atendimento finalizado:", data.id);
        return data;

      } catch (error: any) {
        console.error("❌ [EventControl] Erro crítico ao finalizar atendimento:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-control-registrations"] });
      toast.success("Atendimento finalizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ [EventControl] Erro na finalização:", error);
      toast.error(`Erro ao finalizar atendimento: ${error.message || "Erro desconhecido"}`);
    }
  });
};

// Hook para estatísticas do evento
export const useEventControlStats = (eventDateId: string) => {
  return useQuery({
    queryKey: ["event-control-stats", eventDateId],
    queryFn: async (): Promise<EventControlStats> => {
      try {
        console.log("📊 [EventControl] Calculando estatísticas do evento:", eventDateId);

        const { data: registrations, error } = await supabase
          .from("registrations")
          .select("attendance_confirmed, purchased_glasses, glasses_purchase_amount, process_completed")
          .eq("event_date_id", eventDateId);

        if (error) {
          throw error;
        }

        const total = registrations?.length || 0;
        const present = registrations?.filter(r => r.attendance_confirmed).length || 0;
        const absent = total - present;
        const withGlasses = registrations?.filter(r => r.purchased_glasses).length || 0;
        const completed = registrations?.filter(r => r.process_completed).length || 0;

        const totalRevenue = registrations?.reduce((sum, r) => {
          return sum + (r.glasses_purchase_amount || 0);
        }, 0) || 0;

        return {
          total,
          present,
          absent,
          withGlasses,
          completed,
          totalRevenue
        };

      } catch (error) {
        console.error("❌ [EventControl] Erro ao calcular estatísticas:", error);
        return {
          total: 0,
          present: 0,
          absent: 0,
          withGlasses: 0,
          completed: 0,
          totalRevenue: 0
        };
      }
    },
    enabled: !!eventDateId,
    staleTime: 30000
  });
};
