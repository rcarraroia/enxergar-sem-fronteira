
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminMetrics {
  totalEvents: number
  activeEvents: number
  thisWeekEvents: number
  totalPatients: number
  newPatientsThisWeek: number
  totalRegistrations: number
  todayRegistrations: number
  totalOrganizers: number
  totalDonations: number
  systemHealth: 'healthy' | 'warning' | 'error'
}

export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async (): Promise<AdminMetrics> => {
      console.log('📊 Buscando métricas do dashboard...')
      
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Buscar métricas em paralelo
      const [
        eventsResult,
        patientsResult,
        registrationsResult,
        organizersResult,
        donationsResult
      ] = await Promise.all([
        // Eventos
        supabase
          .from('events')
          .select('id, status, created_at'),
        
        // Pacientes
        supabase
          .from('patients')
          .select('id, created_at'),
        
        // Inscrições
        supabase
          .from('event_registrations')
          .select('id, created_at'),
        
        // Organizadores
        supabase
          .from('organizers')
          .select('id'),
        
        // Doações (assumindo que existe tabela de doações)
        supabase
          .from('asaas_transactions')
          .select('id, amount')
      ])

      const events = eventsResult.data || []
      const patients = patientsResult.data || []
      const registrations = registrationsResult.data || []
      const organizers = organizersResult.data || []
      const donations = donationsResult.data || []

      const metrics: AdminMetrics = {
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'open').length,
        thisWeekEvents: events.filter(e => e.created_at >= weekAgo).length,
        totalPatients: patients.length,
        newPatientsThisWeek: patients.filter(p => p.created_at >= weekAgo).length,
        totalRegistrations: registrations.length,
        todayRegistrations: registrations.filter(r => r.created_at.split('T')[0] === today).length,
        totalOrganizers: organizers.length,
        totalDonations: donations.reduce((sum, d) => sum + (d.amount || 0), 0),
        systemHealth: 'healthy' // Simplificado por enquanto
      }

      console.log('✅ Métricas carregadas:', metrics)
      return metrics
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  })
}
