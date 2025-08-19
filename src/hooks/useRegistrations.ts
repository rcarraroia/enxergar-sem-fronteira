
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Registration {
  id: string
  status: string
  created_at: string
  patient: {
    id: string
    nome: string
    cpf: string
    email: string
    telefone: string
    data_nascimento: string | null
    diagnostico: string | null
  }
  event_date: {
    id: string
    date: string
    start_time: string
    end_time: string
    total_slots: number
    available_slots: number
    event: {
      id: string
      title: string
      location: string
      address: string
      city: string
    }
  }
}

export const useRegistrations = (eventId?: string) => {
  return useQuery({
    queryKey: ['registrations', eventId],
    queryFn: async () => {
      console.log('🔍 Buscando inscrições...', eventId ? `para evento ${eventId}` : 'todas')
      
      let query = supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          patient:patients (
            id,
            nome,
            cpf,
            email,
            telefone,
            data_nascimento,
            diagnostico
          ),
          event_date:event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots,
            event:events (
              id,
              title,
              location,
              address,
              city
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (eventId) {
        // Buscar por event_date_id relacionado ao eventId
        const { data: eventDates } = await supabase
          .from('event_dates')
          .select('id')
          .eq('event_id', eventId)
        
        if (eventDates && eventDates.length > 0) {
          const eventDateIds = eventDates.map(ed => ed.id)
          query = query.in('event_date_id', eventDateIds)
        } else {
          // Se não encontrou datas para o evento, retornar array vazio
          console.log('📭 Nenhuma data encontrada para o evento:', eventId)
          return []
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar inscrições:', error)
        throw error
      }

      console.log(`✅ Encontradas ${data?.length || 0} inscrições`)
      console.log('📊 Dados das inscrições:', data)
      return data as Registration[]
    }
  })
}
