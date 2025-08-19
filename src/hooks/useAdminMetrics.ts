
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
  newPatientsThisWeek: number
  todayRegistrations: number
  totalOrganizers: number
  totalDonations: number
  systemHealth: 'healthy' | 'warning' | 'error'
  // Template metrics
  totalTemplates: number
  activeTemplates: number
  emailTemplates: number
  whatsappTemplates: number
  templatesLastUpdated?: string
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
          .select('id, created_at')

        const totalEvents = events?.length || 0
        
        // Eventos ativos (com datas futuras)
        const { data: eventDates } = await supabase
          .from('event_dates')
          .select('event_id, date')
          .gte('date', new Date().toISOString().split('T')[0])

        const activeEvents = new Set(eventDates?.map(ed => ed.event_id)).size || 0

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

        // Inscrições de hoje
        const today = new Date().toISOString().split('T')[0]
        const { count: todayRegistrations } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)

        // Novos pacientes desta semana
        const { count: newPatientsThisWeek } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())

        // Buscar organizadores
        const { count: totalOrganizers } = await supabase
          .from('organizers')
          .select('*', { count: 'exact', head: true })

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

        // Buscar métricas de templates
        const { data: templates } = await supabase
          .from('notification_templates')
          .select('id, type, is_active, updated_at')

        const totalTemplates = templates?.length || 0
        const activeTemplates = templates?.filter(t => t.is_active).length || 0
        const emailTemplates = templates?.filter(t => t.type === 'email').length || 0
        const whatsappTemplates = templates?.filter(t => t.type === 'whatsapp').length || 0
        
        // Find most recent template update
        const templatesLastUpdated = templates?.length > 0 
          ? templates.reduce((latest, template) => {
              return new Date(template.updated_at) > new Date(latest) ? template.updated_at : latest
            }, templates[0].updated_at)
          : undefined

        // Simular saúde do sistema
        const systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'

        const metrics: AdminMetrics = {
          totalPatients: totalPatients || 0,
          totalEvents,
          activeEvents,
          thisWeekEvents,
          totalRegistrations: totalRegistrations || 0,
          thisWeekRegistrations: thisWeekRegistrations || 0,
          totalRevenue,
          occupancyRate: Math.round(occupancyRate),
          growthRate: Math.round(growthRate),
          newPatientsThisWeek: newPatientsThisWeek || 0,
          todayRegistrations: todayRegistrations || 0,
          totalOrganizers: totalOrganizers || 0,
          totalDonations: totalRevenue, // Using same as revenue for now
          systemHealth,
          // Template metrics
          totalTemplates,
          activeTemplates,
          emailTemplates,
          whatsappTemplates,
          templatesLastUpdated
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
          growthRate: 0,
          newPatientsThisWeek: 0,
          todayRegistrations: 0,
          totalOrganizers: 0,
          totalDonations: 0,
          systemHealth: 'error',
          // Template metrics (error state)
          totalTemplates: 0,
          activeTemplates: 0,
          emailTemplates: 0,
          whatsappTemplates: 0
        }
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  })
}
