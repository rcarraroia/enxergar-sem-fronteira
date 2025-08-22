/**
 * Hook simplificado para testar organizadores V2
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface OrganizerV2Simple {
  id: string
  nome: string
  email: string
  telefone: string
  created_at: string
}

// Hook simplificado para buscar organizadores
export const useOrganizersV2Simple = () => {
  return useQuery({
    queryKey: ['organizers-v2-simple'],
    queryFn: async (): Promise<OrganizerV2Simple[]> => {
      try {
        console.log('🔍 [Organizers V2 Simple] Testando busca básica...')
        
        // Busca mais simples possível
        const { data, error } = await supabase
          .from('organizers')
          .select('id, nome, email, telefone, created_at')
          .limit(10)

        if (error) {
          console.error('❌ [Organizers V2 Simple] Erro:', error)
          throw error
        }

        console.log('✅ [Organizers V2 Simple] Dados encontrados:', data?.length || 0)
        console.log('📊 [Organizers V2 Simple] Primeiros dados:', data?.slice(0, 2))
        
        return data || []

      } catch (error) {
        console.error('❌ [Organizers V2 Simple] Erro crítico:', error)
        throw error
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false
  })
}