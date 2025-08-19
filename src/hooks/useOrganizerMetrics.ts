
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface OrganizerMetrics {
  totalEvents: number
  activeEvents: number
  totalRegistrations: number
  todayRegistrations: number
  occupancyRate: number
  recentEvents: any[]
}

export const useOrganizerMetrics = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['organizer-metrics', user?.id],
    queryFn: async (): Promise<OrganizerMetrics> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar eventos do organizador
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          city,
          location,
          status,
          created_at,
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots
          )
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })

      if (eventsError) {
        console.error('Erro ao buscar eventos:', eventsError)
        throw eventsError
      }

      const totalEvents = events?.length || 0
      const activeEvents = events?.filter(e => e.status === 'open').length || 0

      // Buscar inscrições dos eventos do organizador
      let totalRegistrations = 0
      let todayRegistrations = 0

      if (events && events.length > 0) {
        // Coletar todos os IDs das datas dos eventos
        const eventDateIds = events.flatMap(event => 
          event.event_dates?.map(ed => ed.id) || []
        )

        if (eventDateIds.length > 0) {
          const { data: registrations, error: registrationsError } = await supabase
            .from('registrations')
            .select('id, created_at')
            .in('event_date_id', eventDateIds)

          if (registrationsError) {
            console.error('Erro ao buscar inscrições:', registrationsError)
          } else {
            totalRegistrations = registrations?.length || 0
            
            // Contar inscrições de hoje
            const today = new Date().toISOString().split('T')[0]
            todayRegistrations = registrations?.filter(r => 
              r.created_at.startsWith(today)
            ).length || 0
          }
        }
      }

      // Calcular taxa de ocupação média
      let occupancyRate = 0
      if (events && events.length > 0) {
        const allEventDates = events.flatMap(e => e.event_dates || [])
        const totalSlots = allEventDates.reduce((sum, ed) => sum + ed.total_slots, 0)
        const occupiedSlots = allEventDates.reduce((sum, ed) => sum + (ed.total_slots - ed.available_slots), 0)
        occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
      }

      return {
        totalEvents,
        activeEvents,
        totalRegistrations,
        todayRegistrations,
        occupancyRate,
        recentEvents: events?.slice(0, 5) || []
      }
    },
    enabled: !!user?.id
  })
}
