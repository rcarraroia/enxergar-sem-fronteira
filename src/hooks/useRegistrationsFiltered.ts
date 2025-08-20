
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Registration } from '@/hooks/useRegistrations'

interface FilterOptions {
  searchTerm?: string
  city?: string
  date?: Date
  status?: string
  eventStatus?: string
}

export const useRegistrationsFiltered = (filters: FilterOptions = {}) => {
  return useQuery({
    queryKey: ['registrations-filtered', filters],
    queryFn: async () => {
      console.log('🔍 Buscando inscrições com filtros:', filters)
      
      let query = supabase
        .from('registrations')
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
            data_nascimento,
            diagnostico
          ),
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots,
            events (
              id,
              title,
              location,
              city,
              address
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtro de status da inscrição
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const { data: allRegistrations, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar inscrições:', error)
        throw error
      }

      if (!allRegistrations) {
        return []
      }

      // Filtrar no cliente para filtros mais complexos
      let filteredRegistrations = allRegistrations.filter(reg => {
        // Verificar se a estrutura está correta
        if (!reg.patients || !reg.event_dates?.events) {
          return false
        }

        const patient = reg.patients
        const eventDate = reg.event_dates
        const event = eventDate.events

        // Filtro de busca por texto
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          const matchesSearch = 
            patient.nome.toLowerCase().includes(searchLower) ||
            patient.email.toLowerCase().includes(searchLower) ||
            patient.cpf.includes(searchLower) ||
            event.title.toLowerCase().includes(searchLower)
          
          if (!matchesSearch) return false
        }

        // Filtro por cidade
        if (filters.city && filters.city !== 'all') {
          if (event.city !== filters.city) return false
        }

        // Filtro por data
        if (filters.date) {
          const eventDateStr = eventDate.date
          const filterDateStr = filters.date.toISOString().split('T')[0]
          if (eventDateStr !== filterDateStr) return false
        }

        // Filtro por status do evento (ativo/concluído)
        if (filters.eventStatus && filters.eventStatus !== 'all') {
          const now = new Date()
          const eventDateTime = new Date(`${eventDate.date}T${eventDate.start_time}`)
          
          if (filters.eventStatus === 'active' && eventDateTime <= now) {
            return false
          }
          if (filters.eventStatus === 'completed' && eventDateTime > now) {
            return false
          }
        }

        return true
      })

      // Transformar para o formato esperado
      const transformedRegistrations: Registration[] = filteredRegistrations.map(reg => ({
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
          total_slots: reg.event_dates.total_slots,
          available_slots: reg.event_dates.available_slots,
          event: reg.event_dates.events
        }
      }))

      console.log(`✅ Encontradas ${transformedRegistrations.length} inscrições após filtros`)
      return transformedRegistrations
    }
  })
}

// Hook para buscar cidades únicas
export const useAvailableCities = () => {
  return useQuery({
    queryKey: ['available-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('city')
        .not('city', 'is', null)
        .not('city', 'eq', '')

      if (error) throw error

      // Extrair cidades únicas e ordenar
      const uniqueCities = [...new Set(data.map(event => event.city))]
        .filter(Boolean)
        .sort()

      return uniqueCities
    }
  })
}
