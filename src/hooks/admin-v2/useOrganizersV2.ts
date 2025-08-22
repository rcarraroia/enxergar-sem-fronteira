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
        
        // Buscar organizadores da tabela organizers
        let query = supabase
          .from('organizers')
          .select(`
            id,
            nome,
            email,
            telefone,
            cidade,
            created_at
          `)

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
          
          // Se a tabela organizers não existir, tentar buscar da tabela events os organizadores únicos
          console.log('🔄 [Organizers V2] Tentando buscar organizadores da tabela events...')
          
          const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('organizer_id, organizer_name, organizer_email, organizer_phone, city, created_at')
            .not('organizer_id', 'is', null)

          if (eventsError) {
            console.error('❌ [Organizers V2] Erro ao buscar da tabela events:', eventsError)
            return []
          }

          // Extrair organizadores únicos dos eventos
          const uniqueOrganizers = events?.reduce((acc: any[], event) => {
            const existing = acc.find(org => org.id === event.organizer_id)
            if (!existing && event.organizer_id) {
              acc.push({
                id: event.organizer_id,
                nome: event.organizer_name || 'N/A',
                email: event.organizer_email || 'N/A',
                telefone: event.organizer_phone || 'N/A',
                cidade: event.city,
                status: 'active' as const,
                created_at: event.created_at,
                total_events: events.filter(e => e.organizer_id === event.organizer_id).length
              })
            }
            return acc
          }, []) || []

          console.log('📊 [Organizers V2] Organizadores extraídos dos eventos:', uniqueOrganizers.length)
          return uniqueOrganizers.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
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
              status: 'active' as const,
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