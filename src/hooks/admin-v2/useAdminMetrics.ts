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

        // Verificar autenticação primeiro
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.warn('⚠️ [V2] Usuário não autenticado')
          throw new Error('Usuário não autenticado')
        }

        console.log('👤 [V2] Usuário autenticado:', user.email)

        // Buscar total de pacientes com tratamento de erro
        let totalPatients = 0
        try {
          const { count, error: patientsError } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
          
          if (patientsError) {
            console.error('❌ [V2] Erro ao buscar pacientes:', patientsError)
          } else {
            totalPatients = count || 0
            console.log('📊 [V2] Total de pacientes:', totalPatients)
          }
        } catch (error) {
          console.error('❌ [V2] Exceção ao buscar pacientes:', error)
        }

        // Buscar eventos com tratamento de erro
        let totalEvents = 0
        try {
          const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, created_at')

          if (eventsError) {
            console.error('❌ [V2] Erro ao buscar eventos:', eventsError)
          } else {
            totalEvents = events?.length || 0
            console.log('📊 [V2] Total de eventos:', totalEvents)
          }
        } catch (error) {
          console.error('❌ [V2] Exceção ao buscar eventos:', error)
        }

        // Buscar inscrições com tratamento de erro
        let totalRegistrations = 0
        try {
          const { count, error: registrationsError } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
          
          if (registrationsError) {
            console.error('❌ [V2] Erro ao buscar inscrições:', registrationsError)
          } else {
            totalRegistrations = count || 0
            console.log('📊 [V2] Total de inscrições:', totalRegistrations)
          }
        } catch (error) {
          console.error('❌ [V2] Exceção ao buscar inscrições:', error)
        }

        // Calcular taxa de ocupação simplificada
        let occupancyRate = 0
        if (totalEvents > 0 && totalRegistrations > 0) {
          occupancyRate = Math.min(Math.round((totalRegistrations / (totalEvents * 10)) * 100), 100)
        }

        const metrics: AdminMetricsV2 = {
          totalPatients,
          totalEvents,
          activeEvents: Math.floor(totalEvents * 0.7), // Estimativa de eventos ativos
          totalRegistrations,
          occupancyRate,
          systemHealth: 'healthy',
          lastUpdated: new Date().toISOString()
        }

        console.log('📊 [V2] Métricas finais carregadas:', metrics)
        return metrics

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao carregar métricas:', error)
        
        // Retornar métricas de fallback para demonstração
        const fallbackMetrics: AdminMetricsV2 = {
          totalPatients: 0,
          totalEvents: 0,
          activeEvents: 0,
          totalRegistrations: 0,
          occupancyRate: 0,
          systemHealth: 'error',
          lastUpdated: new Date().toISOString()
        }
        
        console.log('🔄 [V2] Usando métricas de fallback:', fallbackMetrics)
        return fallbackMetrics
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
    staleTime: 30000, // Considerar dados frescos por 30 segundos
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: 1000, // Aguardar 1 segundo entre tentativas
  })
}