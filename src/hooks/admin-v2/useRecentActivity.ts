
/**
 * RECENT ACTIVITY HOOK V2 - Atividades recentes (versão corrigida)
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ActivityItem {
  id: string
  type: 'patient_registered' | 'event_created' | 'registration_completed' | 'sync_completed'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export const useRecentActivityV2 = () => {
  return useQuery({
    queryKey: ['recent-activity-v2'],
    queryFn: async (): Promise<ActivityItem[]> => {
      try {
        console.log('🔍 [Activity V2] Buscando atividades recentes...')
        
        const activities: ActivityItem[] = []
        const now = new Date()
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // Buscar pacientes registrados recentemente
        const { data: patients } = await supabase
          .from('patients')
          .select('id, nome, created_at')
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        patients?.forEach(patient => {
          activities.push({
            id: `patient-${patient.id}`,
            type: 'patient_registered',
            title: 'Novo paciente cadastrado',
            description: `${patient.nome} se cadastrou no sistema`,
            timestamp: patient.created_at,
            metadata: { patientName: patient.nome }
          })
        })

        // Buscar eventos criados recentemente
        const { data: events } = await supabase
          .from('events')
          .select('id, title, created_at')
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        events?.forEach(event => {
          activities.push({
            id: `event-${event.id}`,
            type: 'event_created',
            title: 'Novo evento criado',
            description: `Evento "${event.title}" foi criado`,
            timestamp: event.created_at,
            metadata: { eventTitle: event.title }
          })
        })

        // Buscar inscrições recentes
        const { data: registrations } = await supabase
          .from('registrations')
          .select(`
            id,
            created_at,
            patient:patients(nome),
            event_date:event_dates(
              event:events(title)
            )
          `)
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false })
          .limit(10)

        registrations?.forEach(registration => {
          const patientName = (registration.patient as any)?.nome || 'Paciente'
          const eventTitle = (registration.event_date as any)?.event?.title || 'Evento'
          
          activities.push({
            id: `registration-${registration.id}`,
            type: 'registration_completed',
            title: 'Nova inscrição',
            description: `${patientName} se inscreveu em "${eventTitle}"`,
            timestamp: registration.created_at,
            metadata: { patientName, eventTitle }
          })
        })

        // Ordenar por timestamp (mais recente primeiro)
        const sortedActivities = activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 20) // Limitar a 20 atividades

        console.log('📊 [Activity V2] Atividades carregadas:', sortedActivities.length)
        return sortedActivities

      } catch (error) {
        console.error('❌ [Activity V2] Erro ao carregar atividades:', error)
        return []
      }
    },
    staleTime: 60000,
    refetchInterval: 120000 // Atualizar a cada 2 minutos
  })
}
