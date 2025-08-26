
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

interface Registration {
  id: string
  status: string
  created_at: string
  updated_at: string
  event_date_id: string
  patient: {
    id: string
    nome: string
    email: string
    telefone: string
    cpf: string
    data_nascimento?: string
  }
  event_date: {
    id: string
    date: string
    start_time: string
    end_time: string
    event: {
      id: string
      title: string
      location: string
      city: string
    }
  }
}

interface RegistrationStats {
  totalRegistrations: number
  thisWeekRegistrations: number
  attendanceRate: number
  topEvents: { eventTitle: string; count: number }[]
  demographicData: { ageGroup: string; count: number }[]
}

export const useOrganizerRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const { user } = useAuth();

  const fetchRegistrationsByOrganizer = async (eventId?: string) => {
    if (!user) {return;}

    try {
      let query = supabase
        .from("registrations")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          event_date_id,
          patients (
            id,
            nome,
            email,
            telefone,
            cpf,
            data_nascimento
          ),
          event_dates (
            id,
            date,
            start_time,
            end_time,
            events (
              id,
              title,
              location,
              city,
              organizer_id
            )
          )
        `)
        .eq("event_dates.events.organizer_id", user.id)
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_dates.event_id", eventId);
      }

      const { data, error } = await query;

      if (error) {throw error;}

      // Filtrar registrações que pertencem ao organizador
      const filteredRegistrations = (data || []).filter(
        reg => reg.event_dates?.events?.organizer_id === user.id
      );

      setRegistrations(filteredRegistrations.map(reg => ({
        id: reg.id,
        status: reg.status,
        created_at: reg.created_at,
        updated_at: reg.updated_at,
        event_date_id: reg.event_date_id,
        patient: reg.patients,
        event_date: {
          id: reg.event_dates.id,
          date: reg.event_dates.date,
          start_time: reg.event_dates.start_time,
          end_time: reg.event_dates.end_time,
          event: reg.event_dates.events
        }
      })));

    } catch (error) {
      console.error("Erro ao buscar inscrições do organizador:", error);
      toast.error("Erro ao carregar inscrições");
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationStats = async () => {
    if (!user) {return;}

    try {
      // Buscar todas as inscrições do organizador
      const { data: registrations, error } = await supabase
        .from("registrations")
        .select(`
          id,
          status,
          created_at,
          patients (data_nascimento),
          event_dates (
            events (
              id,
              title,
              organizer_id
            )
          )
        `)
        .eq("event_dates.events.organizer_id", user.id);

      if (error) {throw error;}

      const filteredRegistrations = (registrations || []).filter(
        reg => reg.event_dates?.events?.organizer_id === user.id
      );

      const totalRegistrations = filteredRegistrations.length;

      // Inscrições desta semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekRegistrations = filteredRegistrations.filter(
        reg => new Date(reg.created_at) >= oneWeekAgo
      ).length;

      // Taxa de comparecimento (assumindo que status 'attended' indica presença)
      const attendedCount = filteredRegistrations.filter(
        reg => reg.status === "attended"
      ).length;
      const attendanceRate = totalRegistrations > 0 
        ? (attendedCount / totalRegistrations) * 100 
        : 0;

      // Top eventos por número de inscrições
      const eventCounts: { [key: string]: { title: string; count: number } } = {};
      filteredRegistrations.forEach(reg => {
        const eventId = reg.event_dates?.events?.id;
        const eventTitle = reg.event_dates?.events?.title;
        if (eventId && eventTitle) {
          if (!eventCounts[eventId]) {
            eventCounts[eventId] = { title: eventTitle, count: 0 };
          }
          eventCounts[eventId].count++;
        }
      });

      const topEvents = Object.values(eventCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(event => ({ eventTitle: event.title, count: event.count }));

      // Dados demográficos por faixa etária
      const currentYear = new Date().getFullYear();
      const ageGroups: { [key: string]: number } = {
        "0-17": 0,
        "18-29": 0,
        "30-49": 0,
        "50-69": 0,
        "70+": 0,
        "Não informado": 0
      };

      filteredRegistrations.forEach(reg => {
        if (reg.patients?.data_nascimento) {
          const birthYear = new Date(reg.patients.data_nascimento).getFullYear();
          const age = currentYear - birthYear;
          
          if (age < 18) {ageGroups["0-17"]++;}
          else if (age < 30) {ageGroups["18-29"]++;}
          else if (age < 50) {ageGroups["30-49"]++;}
          else if (age < 70) {ageGroups["50-69"]++;}
          else {ageGroups["70+"]++;}
        } else {
          ageGroups["Não informado"]++;
        }
      });

      const demographicData = Object.entries(ageGroups)
        .map(([ageGroup, count]) => ({ ageGroup, count }))
        .filter(item => item.count > 0);

      setStats({
        totalRegistrations,
        thisWeekRegistrations,
        attendanceRate,
        topEvents,
        demographicData
      });

    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const exportRegistrations = async (format: "csv" | "pdf" = "csv", eventId?: string) => {
    try {
      const registrationsToExport = eventId 
        ? registrations.filter(reg => reg.event_date.event.id === eventId)
        : registrations;

      if (format === "csv") {
        const csvContent = [
          ["Nome", "Email", "Telefone", "CPF", "Evento", "Data", "Status"].join(","),
          ...registrationsToExport.map(reg => [
            reg.patient.nome,
            reg.patient.email,
            reg.patient.telefone,
            reg.patient.cpf,
            reg.event_date.event.title,
            reg.event_date.date,
            reg.status
          ].join(","))
        ].join("
");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inscricoes_${eventId || "todas"}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success("Dados exportados com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  const markAttendance = async (registrationId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ status: attended ? "attended" : "confirmed" })
        .eq("id", registrationId);

      if (error) {throw error;}

      await fetchRegistrationsByOrganizer();
      toast.success(`Presença ${attended ? "marcada" : "desmarcada"} com sucesso!`);
    } catch (error) {
      console.error("Erro ao marcar presença:", error);
      toast.error("Erro ao marcar presença");
    }
  };

  const sendBulkNotification = async (
    registrationIds: string[], 
    message: string, 
    subject: string
  ) => {
    try {
      // Aqui você implementaria o envio de notificações em massa
      // Por ora, vamos simular
      console.log("Enviando notificação para:", registrationIds, { subject, message });
      
      toast.success(`Notificação enviada para ${registrationIds.length} pessoas!`);
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      toast.error("Erro ao enviar notificações");
    }
  };

  useEffect(() => {
    if (user) {
      fetchRegistrationsByOrganizer();
      getRegistrationStats();
    }
  }, [user]);

  return {
    registrations,
    loading,
    stats,
    fetchRegistrationsByOrganizer,
    exportRegistrations,
    markAttendance,
    sendBulkNotification,
    getRegistrationStats
  };
};
