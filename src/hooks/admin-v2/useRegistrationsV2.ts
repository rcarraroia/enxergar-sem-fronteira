/**
 * Hook para gestão de inscrições V2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface RegistrationV2 {
  id: string
  patient_id: string
  event_id: string
  event_date_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended'
  created_at: string
  updated_at: string
  // Dados relacionados
  patient?: {
    nome: string
    telefone: string
    email: string
  }
  event?: {
    title: string
    location: string
  }
  event_date?: {
    date: string
    start_time: string
    end_time: string
  }
}

export interface RegistrationFilters {
  search?: string
  event_id?: string
  status?: string
  date_from?: string
  date_to?: string
}

export interface RegistrationStats {
  totalRegistrations: number
  statusCounts: {
    pending: number
    confirmed: number
    cancelled: number
    attended: number
  }
  recentRegistrations: number
}

// Hook para buscar inscrições
export const useRegistrationsV2 = (filters: RegistrationFilters = {}) => {
  return useQuery({
    queryKey: ['registrations-v2', filters],
    queryFn: async (): Promise<RegistrationV2[]> => {
      try {
        console.log('🔍 [Registrations V2] Buscando inscrições com filtros:', filters)
        
        let query = supabase
          .from('registrations')
          .select(`
            *,
            patients(nome, telefone, email),
            events(title, location),
            event_dates(date, start_time, end_time)
          `)

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`patients.nome.ilike.%${filters.search}%,events.title.ilike.%${filters.search}%`)
        }

        if (filters.event_id) {
          query = query.eq('event_id', filters.event_id)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

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
          console.error('❌ [Registrations V2] Erro ao buscar inscrições:', error)
          throw error
        }

        // Processar dados das inscrições
        const processedRegistrations: RegistrationV2[] = (registrations || []).map(registration => ({
          id: registration.id,
          patient_id: registration.patient_id,
          event_id: registration.event_id,
          event_date_id: registration.event_date_id,
          status: registration.status,
          created_at: registration.created_at,
          updated_at: registration.updated_at,
          patient: registration.patients,
          event: registration.events,
          event_date: registration.event_dates
        }))

        console.log('📊 [Registrations V2] Inscrições carregadas:', processedRegistrations.length)
        return processedRegistrations

      } catch (error) {
        console.error('❌ [Registrations V2] Erro crítico ao carregar inscrições:', error)
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
    queryFn: async (): Promise<RegistrationStats> => {
      try {
        console.log('🔍 [Registrations V2] Buscando estatísticas...')

        // Buscar todas as inscrições
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select('id, status, created_at')

        if (error) throw error

        const totalRegistrations = registrations?.length || 0
        
        // Contar por status
        const statusCounts = {
          pending: registrations?.filter(r => r.status === 'pending').length || 0,
          confirmed: registrations?.filter(r => r.status === 'confirmed').length || 0,
          cancelled: registrations?.filter(r => r.status === 'cancelled').length || 0,
          attended: registrations?.filter(r => r.status === 'attended').length || 0
        }

        // Inscrições dos últimos 7 dias
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentRegistrations = registrations?.filter(r => 
          new Date(r.created_at) >= sevenDaysAgo
        ).length || 0

        return {
          totalRegistrations,
          statusCounts,
          recentRegistrations
        }

      } catch (error) {
        console.error('❌ [Registrations V2] Erro ao carregar estatísticas:', error)
        return {
          totalRegistrations: 0,
          statusCounts: { pending: 0, confirmed: 0, cancelled: 0, attended: 0 },
          recentRegistrations: 0
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
        console.log('🔨 [Registrations V2] Atualizando status:', registrationId, status)
        
        const { data, error } = await supabase
          .from('registrations')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', registrationId)
          .select()
          .single()

        if (error) throw error

        console.log('✅ [Registrations V2] Status atualizado:', data.id)
        return data

      } catch (error: any) {
        console.error('❌ [Registrations V2] Erro crítico ao atualizar status:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations-v2'] })
      queryClient.invalidateQueries({ queryKey: ['registration-stats-v2'] })
      toast.success('Status da inscrição atualizado com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [Registrations V2] Erro na atualização:', error)
      toast.error('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'))
    }
  })
}