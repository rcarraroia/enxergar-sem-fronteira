
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ActivityItem {
  id: string
  type: 'patient_registered' | 'event_created' | 'registration_completed' | 'sync_completed'
  title: string
  description: string
  timestamp: string
  icon: string
}

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      console.log('⚡ Buscando atividades recentes...')
      
      const activities: ActivityItem[] = []

      // Buscar novos pacientes (últimas 24h)
      const { data: newPatients } = await supabase
        .from('patients')
        .select('id, nome, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      newPatients?.forEach(patient => {
        activities.push({
          id: `patient-${patient.id}`,
          type: 'patient_registered',
          title: 'Novo paciente cadastrado',
          description: `${patient.nome} se cadastrou no sistema`,
          timestamp: patient.created_at,
          icon: 'user-plus'
        })
      })

      // Buscar novos eventos (última semana)
      const { data: newEvents } = await supabase
        .from('events')
        .select('id, title, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      newEvents?.forEach(event => {
        activities.push({
          id: `event-${event.id}`,
          type: 'event_created',
          title: 'Novo evento criado',
          description: `Evento "${event.title}" foi cadastrado`,
          timestamp: event.created_at,
          icon: 'calendar-plus'
        })
      })

      // Buscar novas inscrições (últimas 12h)
      const { data: newRegistrations } = await supabase
        .from('event_registrations')
        .select(`
          id, 
          created_at,
          patients(nome),
          events(title)
        `)
        .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      newRegistrations?.forEach(registration => {
        const patient = registration.patients as any
        const event = registration.events as any
        activities.push({
          id: `registration-${registration.id}`,
          type: 'registration_completed',
          title: 'Nova inscrição realizada',
          description: `${patient?.nome} se inscreveu em "${event?.title}"`,
          timestamp: registration.created_at,
          icon: 'user-check'
        })
      })

      // Ordenar por timestamp mais recente
      const sortedActivities = activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10)

      console.log(`✅ Encontradas ${sortedActivities.length} atividades recentes`)
      return sortedActivities
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  })
}
