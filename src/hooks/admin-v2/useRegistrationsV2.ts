/**
 * REGISTRATIONS HOOK V2 - Gestão de inscrições
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface RegistrationV2 {
  id: string
  patient_id: string
  event_id: string
  event_date_id: string
  status: string
  created_at: string
  updated_at: string
  patient?: {
    id: string
    name: string
    email: string
    phone: string
    city: string
    state: string
  }
  event?: {
    id: string
    title: string
    location: string
  }
  event_date?: {
    id: string
    date: string
    start_time: string
    end_time: string
    total_slots: number
    available_slots: number
  }
}

export interface RegistrationFilters {
  search?: string
  event_id?: string
  status?: string
  date_from?: string
  date_to?: string
}

export const useRegistrationsV2 = (filters: RegistrationFilters = {}) => {
  return useQuery({
    queryKey: ['registrations-v2', filters],
    queryFn: async (): Promise<RegistrationV2[]> => {
      try {
        console.log('🔍 [V2] Buscando inscrições com filtros:', filters)

        let query = supabase
          .from('registrations')
          .select(`
            id,
            patient_id,
            event_id,
            event_date_id,
            status,
            created_at,
            updated_at,
            patients(
              id,
              name,
              email,
              phone,
              city,
              state
            ),
            events(
              id,
              title,
              location
            ),
            event_dates(
              id,
              date,
              start_time,
              end_time,
              total_slots,
              available_slots
            )
          `)

        // Aplicar filtros
        if (filters.search) {
          // Buscar por nome do paciente ou título do evento
          const { data: patientsSearch } = await supabase
            .from('patients')
            .select('id')
            .ilike('name', `%${filters.search}%`)

          const { data: eventsSearch } = await supabase
            .from('events')
            .select('id')
            .ilike('title', `%${filters.search}%`)

          const patientIds = patientsSearch?.map(p => p.id) || []
          const eventIds = eventsSearch?.map(e => e.id) || []

          if (patientIds.length > 0 || eventIds.length > 0) {
            const conditions = []
            if (patientIds.length > 0) {
              conditions.push(`patient_id.in.(${patientIds.join(',')})`)
            }
            if (eventIds.length > 0) {
              conditions.push(`event_id.in.(${eventIds.join(',')})`)
            }
            query = query.or(conditions.join(','))
          } else {
            // Se não encontrou nada na busca, retornar vazio
            return []
          }
        }

        if (filters.event_id) {
          query = query.eq('event_id', filters.event_id)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        // Filtros de data baseados na event_date
        if (filters.date_from || filters.date_to) {
          let eventDateQuery = supabase
            .from('event_dates')
            .select('id')

          if (filters.date_from) {
            eventDateQuery = eventDateQuery.gte('date', filters.date_from)
          }
          if (filters.date_to) {
            eventDateQuery = eventDateQuery.lte('date', filters.date_to)
          }

          const { data: eventDatesInRange } = await eventDateQuery
          const eventDateIds = eventDatesInRange?.map(ed => ed.id) || []

          if (eventDateIds.length > 0) {
            query = query.in('event_date_id', eventDateIds)
          } else {
            return []
          }
        }

        // Ordenar por data de criação (mais recente primeiro)
        query = query.order('created_at', { ascending: false })

        const { data: registrations, error } = await query

        if (error) {
          console.error('❌ [V2] Erro ao buscar inscrições:', error)
          throw error
        }

        const processedRegistrations: RegistrationV2[] = (registrations || []).map(registration => {
          const regData = registration as any
          return {
            id: regData.id,
            patient_id: regData.patient_id,
            event_id: regData.event_id,
            event_date_id: regData.event_date_id,
            status: regData.status || 'confirmed',
            created_at: regData.created_at,
            updated_at: regData.updated_at,
            patient: regData.patients,
            event: regData.events,
            event_date: regData.event_dates
          }
        })

        console.log('📊 [V2] Inscrições carregadas:', processedRegistrations.length)
        return processedRegistrations

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao carregar inscrições:', error)
        throw error
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  })
}

// Hook para estatísticas de inscrições
export const useRegistrationStatsV2 = () => {
  return useQuery({
    queryKey: ['registration-stats-v2'],
    queryFn: async () => {
      try {
        console.log('🔍 [V2] Buscando estatísticas de inscrições...')

        // Total de inscrições
        const { count: totalRegistrations } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })

        // Inscrições por status
        const { data: statusStats } = await supabase
          .from('registrations')
          .select('status')

        const statusCounts = statusStats?.reduce((acc, reg) => {
          const status = reg.status || 'confirmed'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // Inscrições recentes (últimos 7 dias)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { count: recentRegistrations } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString())

        // Top eventos com mais inscrições
        const { data: eventStats } = await supabase
          .from('registrations')
          .select(`
            event_id,
            events(title)
          `)

        const eventCounts = eventStats?.reduce((acc, reg) => {
          const eventId = reg.event_id
          const eventTitle = (reg.events as any)?.title || 'Evento sem título'
          
          if (!acc[eventId]) {
            acc[eventId] = { title: eventTitle, count: 0 }
          }
          acc[eventId].count++
          return acc
        }, {} as Record<string, { title: string, count: number }>) || {}

        const topEvents = Object.entries(eventCounts)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 5)
          .map(([eventId, data]) => ({
            eventId,
            title: data.title,
            registrations: data.count
          }))

        return {
          totalRegistrations: totalRegistrations || 0,
          statusCounts,
          recentRegistrations: recentRegistrations || 0,
          topEvents
        }

      } catch (error) {
        console.error('❌ [V2] Erro ao carregar estatísticas:', error)
        return {
          totalRegistrations: 0,
          statusCounts: {},
          recentRegistrations: 0,
          topEvents: []
        }
      }
    },
    staleTime: 60000
  })
}

// Hook para atualizar status de inscrição
export const useUpdateRegistrationStatusV2 = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ registrationId, status }: { registrationId: string, status: string }) => {
      try {
        console.log('🔄 [V2] Atualizando status da inscrição:', registrationId, status)

        const { data, error } = await supabase
          .from('registrations')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', registrationId)
          .select()
          .single()

        if (error) {
          console.error('❌ [V2] Erro ao atualizar status:', error)
          throw error
        }

        console.log('✅ [V2] Status atualizado com sucesso:', registrationId)
        return data

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao atualizar status:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations-v2'] })
      queryClient.invalidateQueries({ queryKey: ['registration-stats-v2'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-v2'] })
      toast.success('Status da inscrição atualizado!')
    },
    onError: (error: any) => {
      console.error('❌ [V2] Erro na atualização:', error)
      toast.error('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'))
    }
  })
}