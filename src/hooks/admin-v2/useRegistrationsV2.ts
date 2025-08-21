
/**
 * REGISTRATIONS HOOK V2 - Gestão de inscrições (versão corrigida)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface RegistrationV2 {
  id: string
  status: 'confirmed' | 'cancelled' | 'pending'
  created_at: string
  patient: {
    id: string
    name: string
    email: string
    phone: string
    cpf: string
    birth_date: string
    diagnosis: string
    city: string
    state: string
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

export interface RegistrationFilters {
  search?: string
  status?: string
  event_id?: string
  date_from?: string
  date_to?: string
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
            id,
            status,
            created_at,
            patient:patients (
              id,
              nome,
              email,
              telefone,
              cpf,
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

        // Aplicar filtros
        if (filters.search) {
          // Para busca, precisamos fazer uma consulta mais complexa
          // Por agora, vamos buscar todas e filtrar depois
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
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
          status: registration.status as 'confirmed' | 'cancelled' | 'pending',
          created_at: registration.created_at,
          patient: {
            id: (registration.patient as any)?.id || '',
            name: (registration.patient as any)?.nome || '',
            email: (registration.patient as any)?.email || '',
            phone: (registration.patient as any)?.telefone || '',
            cpf: (registration.patient as any)?.cpf || '',
            birth_date: (registration.patient as any)?.data_nascimento || '',
            diagnosis: (registration.patient as any)?.diagnostico || '',
            city: 'N/A', // Campo não existe na tabela atual
            state: 'N/A' // Campo não existe na tabela atual
          },
          event_date: {
            id: (registration.event_date as any)?.id || '',
            date: (registration.event_date as any)?.date || '',
            start_time: (registration.event_date as any)?.start_time || '',
            end_time: (registration.event_date as any)?.end_time || '',
            total_slots: (registration.event_date as any)?.total_slots || 0,
            available_slots: (registration.event_date as any)?.available_slots || 0,
            event: {
              id: (registration.event_date as any)?.event?.id || '',
              title: (registration.event_date as any)?.event?.title || '',
              location: (registration.event_date as any)?.event?.location || '',
              address: (registration.event_date as any)?.event?.address || '',
              city: (registration.event_date as any)?.event?.city || ''
            }
          }
        }))

        // Aplicar filtro de busca após o processamento
        let filteredRegistrations = processedRegistrations
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredRegistrations = processedRegistrations.filter(reg =>
            reg.patient.name.toLowerCase().includes(searchLower) ||
            reg.patient.email.toLowerCase().includes(searchLower) ||
            reg.event_date.event.title.toLowerCase().includes(searchLower)
          )
        }

        console.log('📊 [Registrations V2] Inscrições carregadas:', filteredRegistrations.length)
        return filteredRegistrations

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
    queryFn: async () => {
      try {
        console.log('🔍 [Registrations V2] Buscando estatísticas...')

        // Buscar todas as inscrições
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select(`
            id,
            status,
            created_at
          `)

        if (error) throw error

        const totalRegistrations = registrations?.length || 0
        const confirmedRegistrations = registrations?.filter(r => r.status === 'confirmed').length || 0
        const cancelledRegistrations = registrations?.filter(r => r.status === 'cancelled').length || 0
        const pendingRegistrations = registrations?.filter(r => r.status === 'pending').length || 0

        // Inscrições de hoje
        const today = new Date().toISOString().split('T')[0]
        const todayRegistrations = registrations?.filter(r => 
          r.created_at.startsWith(today)
        ).length || 0

        return {
          total_registrations: totalRegistrations,
          confirmed_registrations: confirmedRegistrations,
          cancelled_registrations: cancelledRegistrations,
          pending_registrations: pendingRegistrations,
          today_registrations: todayRegistrations,
          confirmation_rate: totalRegistrations > 0 ? Math.round((confirmedRegistrations / totalRegistrations) * 100) : 0
        }

      } catch (error) {
        console.error('❌ [Registrations V2] Erro ao carregar estatísticas:', error)
        return {
          total_registrations: 0,
          confirmed_registrations: 0,
          cancelled_registrations: 0,
          pending_registrations: 0,
          today_registrations: 0,
          confirmation_rate: 0
        }
      }
    },
    staleTime: 60000
  })
}
