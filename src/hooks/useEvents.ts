import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface EventDate {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  available_slots: number;
}

export interface Event {
  id: string;
  city: string;
  title: string;
  description?: string;
  location: string;
  address: string;
  status: 'open' | 'closed' | 'full';
  organizer_id: string;
  created_at: string;
  updated_at: string;
  event_dates: EventDate[];
  organizers?: {
    id: string;
    name: string;
    email: string;
  };
}

export const useEvents = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for registrations and event_dates
  useEffect(() => {
    const registrationsChannel = supabase
      .channel('registrations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        () => {
          // Invalidate events query to refetch with updated slot counts
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_dates',
        },
        () => {
          // Invalidate events query to refetch with updated data
          queryClient.invalidateQueries({ queryKey: ['events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(registrationsChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      // Primeiro, tentar buscar eventos com status 'open' (para usuários anônimos)
      let result = await supabase
        .from('events')
        .select(
          `
          *,
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots
          ),
          organizers (
            id,
            name,
            email
          )
        `
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Se falhou (provavelmente por RLS), tentar com status 'active'
      if (result.error?.code === 'PGRST116') {
        result = await supabase
          .from('events')
          .select(
            `
            *,
            event_dates (
              id,
              date,
              start_time,
              end_time,
              total_slots,
              available_slots
            ),
            organizers (
              id,
              name,
              email
            )
          `
          )
          .eq('status', 'active')
          .order('created_at', { ascending: false });
      }

      const { data, error } = result;

      if (error) {
        throw error;
      }

      // Obter data atual no formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      // Recalcular available_slots e filtrar eventos passados
      const eventsWithUpdatedSlots = await Promise.all(
        (data ?? []).map(async event => {
          const updatedEventDates = await Promise.all(
            event.event_dates.map(async eventDate => {
              // Contar inscrições confirmadas para esta data
              const { count: registrationsCount, error: countError } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_date_id', eventDate.id)
                .eq('status', 'confirmed');

              if (countError) {
                return eventDate;
              }

              const confirmedRegistrations = registrationsCount ?? 0;
              const actualAvailableSlots = Math.max(
                0,
                eventDate.total_slots - confirmedRegistrations
              );

              return {
                ...eventDate,
                available_slots: actualAvailableSlots,
              };
            })
          );

          // Filtrar apenas datas futuras (>= hoje)
          const futureDates = updatedEventDates.filter(eventDate => eventDate.date >= today);

          return {
            ...event,
            event_dates: futureDates.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
          };
        })
      );

      // Filtrar eventos que têm pelo menos uma data futura
      const eventsWithFutureDates = eventsWithUpdatedSlots.filter(
        event => event.event_dates.length > 0
      );

      // Ordenar eventos pela data mais próxima
      const processedEvents = eventsWithFutureDates.sort((a, b) => {
        const dateA = a.event_dates[0]?.date
          ? new Date(a.event_dates[0].date)
          : new Date('9999-12-31');
        const dateB = b.event_dates[0]?.date
          ? new Date(b.event_dates[0].date)
          : new Date('9999-12-31');
        return dateA.getTime() - dateB.getTime();
      });

      return processedEvents as Event[];
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });
};
