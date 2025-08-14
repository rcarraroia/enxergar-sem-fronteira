
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

        // Buscar inscrições recentes
        const { data: registrations } = await supabase
          .from('registrations')
          .select(`
            id, 
            created_at, 
            patients(name),
            events(title)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        registrations?.forEach(reg => {
          activities.push({
            id: `reg-${reg.id}`,
            type: 'registration',
            title: 'Nova Inscrição',
            description: `${reg.patients?.name || 'Paciente'} se inscreveu em ${reg.events?.title || 'evento'}`,
            timestamp: reg.created_at,
            icon: 'UserPlus'
          })
        })

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
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        patients?.forEach(patient => {
          activities.push({
            id: `patient-${patient.id}`,
            type: 'patient',
            title: 'Paciente Cadastrado',
            description: `Novo paciente: ${patient.name}`,
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
