/**
 * ADMIN METRICS HOOK V2 - Redesigned sem problemas de hooks
 * CORREÇÃO: Estrutura limpa, sem violações
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminMetricsV2 {
  totalPatients: number
  totalEvents: number
  activeEvents: number
  totalRegistrations: number
  occupancyRate: number
  systemHealth: 'healthy' | 'warning' | 'error'
  lastUpdated: string
}

export const useAdminMetricsV2 = () => {
  return useQuery({
    queryKey: ['admin-metrics-v2'],
    queryFn: async (): Promise<AdminMetricsV2> => {
      try {
        console.log('🔍 [V2] Buscando métricas administrativas...')

        // Executar todas as queries em paralelo para melhor performance
        const [
          patientsResult,
          eventsResult,
          registrationsResult,
          eventDatesResult
        ] = await Promise.allSettled([
          supabase.from('patients').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('id, created_at, title'),
          supabase.from('registrations').select('*', { count: 'exact', head: true }),
          supabase.from('event_dates').select('event_id, date, total_slots, available_slots')
        ])

        // Processar resultados com fallbacks
        const totalPatients = patientsResult.status === 'fulfilled' 
          ? (patientsResult.value.count || 0) 
          : 0

        const events = eventsResult.status === 'fulfilled' 
          ? (eventsResult.value.data || []) 
          : []
        const totalEvents = events.length

        const totalRegistrations = registrationsResult.status === 'fulfilled' 
          ? (registrationsResult.value.count || 0) 
          : 0

        const eventDates = eventDatesResult.status === 'fulfilled' 
          ? (eventDatesResult.value.data || []) 
          : []

        // Calcular eventos ativos (com datas futuras)
        const today = new Date().toISOString().split('T')[0]
        const activeEventIds = new Set(
          eventDates
            .filter(ed => ed.date >= today)
            .map(ed => ed.event_id)
        )
        const activeEvents = activeEventIds.size

        // Calcular taxa de ocupação real
        let occupancyRate = 0
        if (eventDates.length > 0) {
          const totalSlots = eventDates.reduce((sum, ed) => sum + (ed.total_slots || 0), 0)
          const availableSlots = eventDates.reduce((sum, ed) => sum + (ed.available_slots || 0), 0)
          const occupiedSlots = totalSlots - availableSlots
          
          if (totalSlots > 0) {
            occupancyRate = Math.round((occupiedSlots / totalSlots) * 100)
          }
        }

        // Determinar saúde do sistema
        let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'
        if (occupancyRate > 90) {
          systemHealth = 'warning'
        }
        if (totalEvents === 0 || totalPatients === 0) {
          systemHealth = 'warning'
        }

        const metrics: AdminMetricsV2 = {
          totalPatients,
          totalEvents,
          activeEvents,
          totalRegistrations,
          occupancyRate,
          systemHealth,
          lastUpdated: new Date().toISOString()
        }

        console.log('📊 [V2] Métricas carregadas com sucesso:', metrics)
        return metrics

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao carregar métricas:', error)
        
        // Retornar métricas de fallback
        return {
          totalPatients: 0,
          totalEvents: 0,
          activeEvents: 0,
          totalRegistrations: 0,
          occupancyRate: 0,
          systemHealth: 'error',
          lastUpdated: new Date().toISOString()
        }
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
    staleTime: 30000, // Considerar dados frescos por 30 segundos
    retry: 2, // Tentar 2 vezes em caso de erro
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  })
}