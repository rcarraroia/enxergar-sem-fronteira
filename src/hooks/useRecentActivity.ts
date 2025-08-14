
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ActivityItem {
  id: string
  type: 'registration' | 'event' | 'patient' | 'system'
  title: string
  description: string
  timestamp: string
  icon: string
}

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      try {
        console.log('🔍 Buscando atividades recentes...')

        const activities: ActivityItem[] = []

        // Buscar inscrições recentes (sem join complexo)
        const { data: registrations } = await supabase
          .from('registrations')
          .select('id, created_at, patient_id, event_date_id')
          .order('created_at', { ascending: false })
          .limit(5)

        // Para cada inscrição, buscar dados do paciente e evento separadamente
        if (registrations) {
          for (const reg of registrations) {
            try {
              const { data: patient } = await supabase
                .from('patients')
                .select('nome')
                .eq('id', reg.patient_id)
                .single()

              const { data: eventDate } = await supabase
                .from('event_dates')
                .select('event_id')
                .eq('id', reg.event_date_id)
                .single()

              let eventTitle = 'evento'
              if (eventDate) {
                const { data: event } = await supabase
                  .from('events')
                  .select('title')
                  .eq('id', eventDate.event_id)
                  .single()
                
                eventTitle = event?.title || 'evento'
              }

              activities.push({
                id: `reg-${reg.id}`,
                type: 'registration',
                title: 'Nova Inscrição',
                description: `${patient?.nome || 'Paciente'} se inscreveu em ${eventTitle}`,
                timestamp: reg.created_at,
                icon: 'UserPlus'
              })
            } catch (error) {
              console.log('Erro ao buscar detalhes da inscrição:', error)
            }
          }
        }

        // Buscar eventos recentes
        const { data: events } = await supabase
          .from('events')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        events?.forEach(event => {
          activities.push({
            id: `event-${event.id}`,
            type: 'event',
            title: 'Evento Criado',
            description: `Novo evento: ${event.title}`,
            timestamp: event.created_at,
            icon: 'Calendar'
          })
        })

        // Buscar pacientes recentes
        const { data: patients } = await supabase
          .from('patients')
          .select('id, nome, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        patients?.forEach(patient => {
          activities.push({
            id: `patient-${patient.id}`,
            type: 'patient',
            title: 'Paciente Cadastrado',
            description: `Novo paciente: ${patient.nome}`,
            timestamp: patient.created_at,
            icon: 'User'
          })
        })

        // Ordenar por timestamp e limitar a 10 itens
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)

        console.log('📋 Atividades carregadas:', sortedActivities.length)
        return sortedActivities

      } catch (error) {
        console.error('❌ Erro ao carregar atividades:', error)
        return []
      }
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  })
}
