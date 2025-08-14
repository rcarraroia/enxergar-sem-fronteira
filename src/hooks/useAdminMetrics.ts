
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminMetrics {
  totalPatients: number
  totalEvents: number
  activeEvents: number
  thisWeekEvents: number
  totalRegistrations: number
  thisWeekRegistrations: number
  totalRevenue: number
  occupancyRate: number
  growthRate: number
}

export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async (): Promise<AdminMetrics> => {
      try {
        console.log('🔍 Buscando métricas administrativas...')

        // Buscar total de pacientes
        const { count: totalPatients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })

        // Buscar eventos
        const { data: events } = await supabase
          .from('events')
          .select('id, created_at, event_dates(event_date)')

        const totalEvents = events?.length || 0
        
        // Eventos ativos (com datas futuras)
        const now = new Date()
        const activeEvents = events?.filter(event => 
          event.event_dates?.some(date => new Date(date.event_date) > now)
        ).length || 0

        // Eventos desta semana
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const thisWeekEvents = events?.filter(event => 
          new Date(event.created_at) > weekAgo
        ).length || 0

        // Buscar inscrições
        const { count: totalRegistrations } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })

        // Inscrições desta semana
        const { count: thisWeekRegistrations } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())

        // Buscar receita total
        const { data: transactions } = await supabase
          .from('asaas_transactions')
          .select('amount')
          .eq('payment_status', 'CONFIRMED')

        const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0

        // Calcular taxa de ocupação (simulada)
        const occupancyRate = totalRegistrations && totalEvents 
          ? Math.min((totalRegistrations / (totalEvents * 100)) * 100, 100)
          : 0

        // Taxa de crescimento (simulada)
        const growthRate = thisWeekRegistrations && totalRegistrations
          ? ((thisWeekRegistrations / Math.max(totalRegistrations - thisWeekRegistrations, 1)) * 100)
          : 0

        const metrics: AdminMetrics = {
          totalPatients: totalPatients || 0,
          totalEvents,
          activeEvents,
          thisWeekEvents,
          totalRegistrations: totalRegistrations || 0,
          thisWeekRegistrations: thisWeekRegistrations || 0,
          totalRevenue,
          occupancyRate: Math.round(occupancyRate),
          growthRate: Math.round(growthRate)
        }

        console.log('📊 Métricas carregadas:', metrics)
        return metrics

      } catch (error) {
        console.error('❌ Erro ao carregar métricas:', error)
        // Retornar métricas zeradas em caso de erro
        return {
          totalPatients: 0,
          totalEvents: 0,
          activeEvents: 0,
          thisWeekEvents: 0,
          totalRegistrations: 0,
          thisWeekRegistrations: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          growthRate: 0
        }
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  })
}
