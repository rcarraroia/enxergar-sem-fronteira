
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'

export interface EventDate {
  id: string
  date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
}

export interface Event {
  id: string
  city: string
  title: string
  description?: string
  location: string
  address: string
  status: 'open' | 'closed' | 'full'
  organizer_id: string
  created_at: string
  updated_at: string
  event_dates: EventDate[]
  organizers?: {
    id: string
    name: string
    email: string
  }
}

export const useEvents = () => {
  const queryClient = useQueryClient()

  // Set up real-time subscription for registrations and event_dates
  useEffect(() => {
    console.log('🔄 Configurando atualizações em tempo real para vagas...')
    
    const registrationsChannel = supabase
      .channel('registrations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations'
        },
        (payload) => {
          console.log('📝 Nova inscrição detectada:', payload)
          // Invalidate events query to refetch with updated slot counts
          queryClient.invalidateQueries({ queryKey: ['events'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_dates'
        },
        (payload) => {
          console.log('📅 Atualização de data de evento:', payload)
          // Invalidate events query to refetch with updated data
          queryClient.invalidateQueries({ queryKey: ['events'] })
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Desconectando atualizações em tempo real')
      supabase.removeChannel(registrationsChannel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('🔍 Buscando eventos públicos com contagem atualizada...')
      
      const { data, error } = await supabase
        .from('events')
        .select(`
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
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        throw error
      }

      // Recalcular available_slots baseado nas inscrições reais
      const eventsWithUpdatedSlots = await Promise.all(
        (data || []).map(async (event) => {
          const updatedEventDates = await Promise.all(
            event.event_dates.map(async (eventDate) => {
              // Contar inscrições confirmadas para esta data
              const { count: registrationsCount, error: countError } = await supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_date_id', eventDate.id)
                .eq('status', 'confirmed')

              if (countError) {
                console.error('❌ Erro ao contar inscrições:', countError)
                return eventDate
              }

              const confirmedRegistrations = registrationsCount || 0
              const actualAvailableSlots = Math.max(0, eventDate.total_slots - confirmedRegistrations)

              console.log(`📊 Data ${eventDate.date}: ${confirmedRegistrations} inscrições, ${actualAvailableSlots} vagas restantes`)

              return {
                ...eventDate,
                available_slots: actualAvailableSlots
              }
            })
          )

          return {
            ...event,
            event_dates: updatedEventDates.sort((a, b) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            )
          }
        })
      )

      // Ordenar eventos pela data mais próxima
      const processedEvents = eventsWithUpdatedSlots.sort((a, b) => {
        const dateA = a.event_dates.length > 0 ? new Date(a.event_dates[0].date) : new Date('9999-12-31')
        const dateB = b.event_dates.length > 0 ? new Date(b.event_dates[0].date) : new Date('9999-12-31')
        return dateA.getTime() - dateB.getTime()
      })

      console.log(`✅ Encontrados ${processedEvents.length} eventos públicos com vagas atualizadas`)
      return processedEvents as Event[]
    },
    staleTime: 0, // Always refetch to ensure fresh data
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  })
}
