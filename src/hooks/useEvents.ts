
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

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
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('🔍 Buscando eventos públicos...')
      
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

      // Processar e ordenar eventos por data mais próxima
      const processedEvents = data?.map(event => ({
        ...event,
        event_dates: event.event_dates.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      })).sort((a, b) => {
        // Ordenar eventos pela data mais próxima (primeira data de cada evento)
        const dateA = a.event_dates.length > 0 ? new Date(a.event_dates[0].date) : new Date('9999-12-31')
        const dateB = b.event_dates.length > 0 ? new Date(b.event_dates[0].date) : new Date('9999-12-31')
        return dateA.getTime() - dateB.getTime()
      }) || []

      console.log(`✅ Encontrados ${processedEvents.length} eventos públicos, ordenados por data`)
      return processedEvents as Event[]
    }
  })
}
