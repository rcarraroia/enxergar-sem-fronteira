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

        // Buscar total de pacientes
        const { count: totalPatients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })

        // Buscar eventos
        const { data: events } = await supabase
          .from('events')
          .select('id, created_at')

        const totalEvents = events?.length || 0
        
        // Eventos ativos (com datas futuras)
        const { data: eventDates } = await supabase
          .from('event_dates')
          .select('event_id, date')
          .gte('date', new Date().toISOString().split('T')[0])

        const activeEvents = new Set(eventDates?.map(ed => ed.event_id)).size || 0

        // Buscar inscrições
        const { count: totalRegistrations } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })

        // Calcular taxa de ocupação
        let totalSlots = 0
        let occupiedSlots = 0
        
        if (eventDates && eventDates.length > 0) {
          const { data: eventDatesDetails } = await supabase
            .from('event_dates')
            .select('total_slots, available_slots')
          
          if (eventDatesDetails) {
            totalSlots = eventDatesDetails.reduce((sum, ed) => sum + (ed.total_slots || 0), 0)
            const availableSlots = eventDatesDetails.reduce((sum, ed) => sum + (ed.available_slots || 0), 0)
            occupiedSlots = totalSlots - availableSlots
          }
        }
        
        const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0

        const metrics: AdminMetricsV2 = {
          totalPatients: totalPatients || 0,
          totalEvents,
          activeEvents,
          totalRegistrations: totalRegistrations || 0,
          occupancyRate,
          systemHealth: 'healthy',
          lastUpdated: new Date().toISOString()
        }

        console.log('📊 [V2] Métricas carregadas:', metrics)
        return metrics

      } catch (error) {
        console.error('❌ [V2] Erro ao carregar métricas:', error)
        
        // Retornar métricas zeradas em caso de erro
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
  })
}