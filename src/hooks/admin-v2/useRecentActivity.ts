/**
 * Hook para atividades recentes do dashboard admin v2
 * Limitado a 4 atividades conforme solicitado
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
}

export const useRecentActivityV2 = () => {
  return useQuery({
    queryKey: ['recent-activity-v2'],
    queryFn: async (): Promise<RecentActivity[]> => {
      try {
        const activities: RecentActivity[] = []

        // Buscar eventos recentes (últimos 2)
        const { data: recentEvents } = await supabase
          .from('events')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })
          .limit(2)

        if (recentEvents) {
          recentEvents.forEach(event => {
            activities.push({
              id: `event-${event.id}`,
              type: 'event_created',
              title: 'Novo evento criado',
              description: `Evento "${event.title}" foi criado`,
              timestamp: event.created_at
            })
          })
        }

        // Buscar inscrições recentes (últimas 2)
        const { data: recentRegistrations } = await supabase
          .from('registrations')
          .select(`
            id, 
            created_at,
            patients!inner(nome),
            events!inner(title)
          `)
          .order('created_at', { ascending: false })
          .limit(2)

        if (recentRegistrations) {
          recentRegistrations.forEach(registration => {
            activities.push({
              id: `registration-${registration.id}`,
              type: 'registration_completed',
              title: 'Nova inscrição',
              description: `${registration.patients?.nome} se inscreveu em "${registration.events?.title}"`,
              timestamp: registration.created_at
            })
          })
        }

        // Ordenar por timestamp (mais recente primeiro) e limitar a 4
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 4)

        return sortedActivities

      } catch (error) {
        console.error('Erro ao buscar atividades recentes:', error)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000 // 5 minutos
  })
}