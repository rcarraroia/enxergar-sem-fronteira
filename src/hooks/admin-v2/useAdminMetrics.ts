/**
 * Hook para métricas do dashboard admin v2
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface AdminMetrics {
  totalEvents: number
  totalRegistrations: number
  totalPatients: number
  occupancyRate: number
}

export const useAdminMetricsV2 = () => {
  return useQuery({
    queryKey: ['admin-metrics-v2'],
    queryFn: async (): Promise<AdminMetrics> => {
      try {
        // Buscar métricas básicas
        const [eventsResult, registrationsResult, patientsResult] = await Promise.all([
          supabase.from('events').select('id', { count: 'exact' }),
          supabase.from('registrations').select('id', { count: 'exact' }),
          supabase.from('patients').select('id', { count: 'exact' })
        ])

        const totalEvents = eventsResult.count || 0
        const totalRegistrations = registrationsResult.count || 0
        const totalPatients = patientsResult.count || 0

        // Calcular taxa de ocupação (simulada por enquanto)
        const occupancyRate = totalEvents > 0 ? Math.round((totalRegistrations / (totalEvents * 50)) * 100) : 0

        return {
          totalEvents,
          totalRegistrations,
          totalPatients,
          occupancyRate: Math.min(occupancyRate, 100)
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error)
        return {
          totalEvents: 0,
          totalRegistrations: 0,
          totalPatients: 0,
          occupancyRate: 0
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000 // 10 minutos
  })
}