/**
 * Hook para gestão de organizadores V2
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface OrganizerV2 {
  id: string
  nome: string
  email: string
  telefone: string
  cidade?: string
  status: 'active' | 'inactive'
  created_at: string
  total_events?: number
}

export interface OrganizerFilters {
  search?: string
  status?: string
  cidade?: string
}

// Hook para buscar organizadores
export const useOrganizersV2 = (filters: OrganizerFilters = {}) => {
  return useQuery({
    queryKey: ['organizers-v2', filters],
    queryFn: async (): Promise<OrganizerV2[]> => {
      try {
        console.log('🔍 [Organizers V2] Buscando organizadores com filtros:', filters)
        
        // Buscar usuários com role de organizer
        let query = supabase
          .from('profiles')
          .select(`
            id,
            nome,
            email,
            telefone,
            cidade,
            created_at
          `)
          .eq('role', 'organizer')

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        if (filters.cidade) {
          query = query.eq('cidade', filters.cidade)
        }

        // Ordenar por nome
        query = query.order('nome', { ascending: true })

        const { data: organizers, error } = await query

        if (error) {
          console.error('❌ [Organizers V2] Erro ao buscar organizadores:', error)
          throw error
        }

        // Para cada organizador, buscar quantos eventos ele criou
        const organizersWithStats = await Promise.all(
          (organizers || []).map(async (organizer) => {
            const { data: events } = await supabase
              .from('events')
              .select('id')
              .eq('organizer_id', organizer.id)

            return {
              id: organizer.id,
              nome: organizer.nome || 'N/A',
              email: organizer.email || 'N/A',
              telefone: organizer.telefone || 'N/A',
              cidade: organizer.cidade,
              status: 'active' as const, // Por enquanto todos ativos
              created_at: organizer.created_at,
              total_events: events?.length || 0
            }
          })
        )

        console.log('📊 [Organizers V2] Organizadores carregados:', organizersWithStats.length)
        return organizersWithStats

      } catch (error) {
        console.error('❌ [Organizers V2] Erro crítico ao carregar organizadores:', error)
        throw error
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  })
}