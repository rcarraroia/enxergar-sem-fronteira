
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Event {
  id: string
  title: string
  description: string | null
  location: string
  address: string
  date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
  status: string
  created_at: string
}

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('🔍 Buscando eventos disponíveis...')
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'open')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        throw error
      }

      console.log(`✅ Encontrados ${data?.length || 0} eventos`)
      return data as Event[]
    }
  })
}
