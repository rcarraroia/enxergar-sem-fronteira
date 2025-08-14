
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
  event: {
    id: string
    title: string
    date: string
    location: string
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
          event:events (
            id,
            title,
            date,
            location
          )
        `)
        .order('created_at', { ascending: false })

      if (eventId) {
        query = query.eq('event_id', eventId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar inscrições:', error)
        throw error
      }

      console.log(`✅ Encontradas ${data?.length || 0} inscrições`)
      return data as Registration[]
    }
  })
}
