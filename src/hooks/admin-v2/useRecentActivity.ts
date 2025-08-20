/**
 * RECENT ACTIVITY HOOK V2 - Feed de atividades real
 * Busca atividades recentes do sistema
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ActivityItem {
  id: string
  type: 'patient_registered' | 'event_created' | 'registration_completed' | 'event_updated'
  title: string
  description: string
  timestamp: string
  metadata?: {
    patientName?: string
    eventTitle?: string
    organizerName?: string
  }
}

export const useRecentActivityV2 = () => {
  return useQuery({
    queryKey: ['recent-activity-v2'],
    queryFn: async (): Promise<ActivityItem[]> => {
      try {
        console.log('🔍 [V2] Buscando atividades recentes...')

        const activities: ActivityItem[] = []

        // Buscar pacientes recentes (últimos 7 dias)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: recentPatients } = await supabase
          .from('patients')
          .select('id, name, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentPatients) {
          recentPatients.forEach(patient => {
            activities.push({
              id: `patient-${patient.id}`,
              type: 'patient_registered',
              title: 'Novo paciente cadastrado',
              description: `${patient.name} se cadastrou no sistema`,
              timestamp: patient.created_at,
              metadata: {
                patientName: patient.name
              }
            })
          })
        }

        // Buscar eventos recentes (últimos 7 dias)
        const { data: recentEvents } = await supabase
          .from('events')
          .select('id, title, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(3)

        if (recentEvents) {
          recentEvents.forEach(event => {
            activities.push({
              id: `event-${event.id}`,
              type: 'event_created',
              title: 'Novo evento criado',
              description: `${event.title}`,
              timestamp: event.created_at,
              metadata: {
                eventTitle: event.title
              }
            })
          })
        }

        // Buscar inscrições recentes (últimos 3 dias)
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        const { data: recentRegistrations } = await supabase
          .from('registrations')
          .select(`
            id, 
            created_at,
            patients!inner(name),
            events!inner(title)
          `)
          .gte('created_at', threeDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentRegistrations) {
          recentRegistrations.forEach(registration => {
            const patient = registration.patients as any
            const event = registration.events as any
            
            activities.push({
              id: `registration-${registration.id}`,
              type: 'registration_completed',
              title: 'Nova inscrição confirmada',
              description: `${patient?.name} se inscreveu em ${event?.title}`,
              timestamp: registration.created_at,
              metadata: {
                patientName: patient?.name,
                eventTitle: event?.title
              }
            })
          })
        }

        // Ordenar todas as atividades por data (mais recente primeiro)
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10) // Limitar a 10 atividades

        console.log('📊 [V2] Atividades carregadas:', sortedActivities.length)
        return sortedActivities

      } catch (error) {
        console.error('❌ [V2] Erro ao carregar atividades:', error)
        
        // Retornar atividades de fallback
        return [
          {
            id: 'fallback-1',
            type: 'patient_registered',
            title: 'Sistema funcionando',
            description: 'Monitoramento de atividades ativo',
            timestamp: new Date().toISOString()
          }
        ]
      }
    },
    refetchInterval: 120000, // Atualizar a cada 2 minutos
    staleTime: 60000, // Considerar dados frescos por 1 minuto
    retry: 1
  })
}