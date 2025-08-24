
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReminderJob {
  id: string
  patient_id: string
  event_date_id: string
  reminder_type: "24h" | "48h" | "confirmation"
  scheduled_for: string
  sent_at: string | null
  status: "pending" | "processing" | "sent" | "failed" | "cancelled"
  error_message: string | null
  retry_count: number
  email_sent: boolean
  whatsapp_sent: boolean
  sms_sent: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  patient?: {
    nome: string
    email: string
    telefone: string
  }
  event_date?: {
    date: string
    start_time: string
    end_time: string
    event?: {
      title: string
      location: string
      address: string
      city: string
    }
  }
}

export const useReminderJobs = () => {
  const queryClient = useQueryClient();

  const { data: reminderJobs, isLoading, error } = useQuery({
    queryKey: ["reminder-jobs"],
    queryFn: async () => {
      console.log("🔄 Buscando reminder jobs...");
      
      const { data, error } = await supabase
        .from("reminder_jobs")
        .select(`
          *,
          patient:patients (
            nome,
            email,
            telefone
          ),
          event_date:event_dates (
            date,
            start_time,
            end_time,
            event:events (
              title,
              location,
              address,
              city
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar reminder jobs:", error);
        throw error;
      }

      console.log("✅ Reminder jobs encontrados:", data?.length || 0);
      return data as ReminderJob[];
    }
  });

  const triggerReminders = useMutation({
    mutationFn: async (params: { 
      type: "reminder" | "confirmation"
      timestamp: string
      eventId?: string
      reminderType?: "24h" | "48h"
    }) => {
      console.log("🚀 Disparando lembretes:", params);
      
      const { data, error } = await supabase.functions.invoke("trigger-reminders", {
        body: params
      });

      if (error) {
        console.error("❌ Erro ao disparar lembretes:", error);
        throw error;
      }

      console.log("✅ Lembretes disparados com sucesso:", data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.data?.jobsCreated || 0} lembretes foram agendados!`);
      queryClient.invalidateQueries({ queryKey: ["reminder-jobs"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao disparar lembretes:", error);
      toast.error(`Erro ao disparar lembretes: ${  error.message}`);
    }
  });

  const processReminders = useMutation({
    mutationFn: async (params: { 
      batchSize?: number
      testMode?: boolean 
    } = {}) => {
      console.log("⚙️ Processando lembretes:", params);
      
      const { data, error } = await supabase.functions.invoke("process-reminder-jobs", {
        body: params
      });

      if (error) {
        console.error("❌ Erro ao processar lembretes:", error);
        throw error;
      }

      console.log("✅ Lembretes processados com sucesso:", data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.processed || 0} lembretes foram processados!`);
      queryClient.invalidateQueries({ queryKey: ["reminder-jobs"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao processar lembretes:", error);
      toast.error(`Erro ao processar lembretes: ${  error.message}`);
    }
  });

  const updateReminderJob = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      error_message 
    }: { 
      id: string
      status: ReminderJob["status"]
      error_message?: string 
    }) => {
      const { error } = await supabase
        .from("reminder_jobs")
        .update({ 
          status, 
          error_message,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {throw error;}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-jobs"] });
    }
  });

  const deleteReminderJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminder_jobs")
        .delete()
        .eq("id", id);

      if (error) {throw error;}
    },
    onSuccess: () => {
      toast.success("Job removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["reminder-jobs"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao remover job:", error);
      toast.error("Erro ao remover job");
    }
  });

  return {
    reminderJobs,
    isLoading,
    error,
    triggerReminders,
    processReminders,
    updateReminderJob,
    deleteReminderJob,
    isTriggering: triggerReminders.isPending,
    isProcessing: processReminders.isPending
  };
};
