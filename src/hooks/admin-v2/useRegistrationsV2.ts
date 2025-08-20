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
    nome: string
    cpf: string
    email: string
    telefone: string
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
            status,
            created_at,
            updated_at,
            patient_id,
            event_id,
            event_date_id,
            patient:patients (
              id,
              nome,
              cpf,
              email,
              telefone,
              city,
              state
            ),
            event:events (
              id,
              title,
              location
            ),
            event_date:event_dates (
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
          // Buscar por nome do paciente ou título do evento usando joins
          query = query.or(`patients.nome.ilike.%${filters.search}%,events.title.ilike.%${filters.search}%`)
        }

        if (filters.event_id) {
          query = query.eq('event_id', filters.event_id)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        // Filtros de data baseados na event_date usando join
        if (filters.date_from) {
          query = query.gte('event_dates.date', filters.date_from)
        }
        if (filters.date_to) {
          query = query.lte('event_dates.date', filters.date_to)
        }

        // Ordenar por data de criação (mais recente primeiro)
        query = query.order('created_at', { ascending: false })

        const { data: registrations, error } = await query

        if (error) {
          console.error('❌ [V2] Erro ao buscar inscrições:', error)
          throw error
        }

        // Processar dados com joins já incluídos
        const processedRegistrations: RegistrationV2[] = (registrations || []).map(registration => ({
          id: registration.id,
          patient_id: registration.patient_id,
          event_id: registration.event_id,
          event_date_id: registration.event_date_id,
          status: registration.status || 'confirmed',
          created_at: registration.created_at,
          updated_at: registration.updated_at,
          patient: registration.patient ? {
            id: registration.patient.id,
            name: registration.patient.nome, // Mapear nome correto
            email: registration.patient.email,
            phone: registration.patient.telefone, // Mapear telefone correto
            city: registration.patient.city,
            state: registration.patient.state
          } : null,
          event: registration.event,
          event_date: registration.event_date
        }))

        console.log('📊 [V2] Inscrições carregadas:', processedRegistrations.length)
        console.log('📊 [V2] Dados de exemplo:', processedRegistrations[0])
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
            event:events(title)
          `)

        const eventCounts = eventStats?.reduce((acc, reg) => {
          const eventId = reg.event_id
          const eventTitle = (reg.event as any)?.title || 'Evento sem título'
          
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