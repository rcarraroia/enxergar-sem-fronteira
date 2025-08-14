
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
  title: string
  description: string | null
  location: string
  address: string
  status: string
  created_at: string
  event_dates: EventDate[]
}

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('🔍 Buscando eventos disponíveis...')
      
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
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        throw error
      }

      // Filtrar apenas eventos com datas futuras
      const today = new Date().toISOString().split('T')[0]
      const filteredEvents = data?.filter(event => 
        event.event_dates && event.event_dates.some(date => date.date >= today)
      ).map(event => ({
        ...event,
        event_dates: event.event_dates.filter(date => date.date >= today).sort((a, b) => a.date.localeCompare(b.date))
      })) || []

      console.log(`✅ Encontrados ${filteredEvents.length} eventos`)
      return filteredEvents as Event[]
    }
  })
}
