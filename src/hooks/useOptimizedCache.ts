
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface CacheConfig {
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
}

export const useOptimizedCache = () => {
  const queryClient = useQueryClient()

  // Cache otimizado para configurações do sistema
  const useSystemSettingsCache = (config?: CacheConfig) => {
    return useQuery({
      queryKey: ['system-settings-optimized'],
      queryFn: async () => {
        console.log('🔧 Buscando configurações (cache otimizado)...')
        
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['project_name', 'project_description', 'social_links', 'logo_header', 'logo_footer'])

        if (error) throw error
        return data
      },
      staleTime: config?.staleTime || 1000 * 60 * 30, // 30 minutos
      gcTime: config?.gcTime || 1000 * 60 * 60, // 1 hora
      refetchOnWindowFocus: config?.refetchOnWindowFocus || false
    })
  }

  // Cache otimizado para eventos próximos
  const useUpcomingEventsCache = (config?: CacheConfig) => {
    return useQuery({
      queryKey: ['upcoming-events-optimized'],
      queryFn: async () => {
        console.log('📅 Buscando próximos eventos (cache otimizado)...')
        
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            location,
            address,
            status,
            event_dates!inner (
              id,
              date,
              start_time,
              end_time,
              total_slots,
              available_slots
            )
          `)
          .eq('status', 'open')
          .gte('event_dates.date', today)
          .order('date', { ascending: true, foreignTable: 'event_dates' })
          .limit(5)

        if (error) throw error
        return data
      },
      staleTime: config?.staleTime || 1000 * 60 * 5, // 5 minutos
      gcTime: config?.gcTime || 1000 * 60 * 15, // 15 minutos
      refetchOnWindowFocus: config?.refetchOnWindowFocus || true
    })
  }

  // Invalidar caches relacionados
  const invalidateRelatedCaches = (keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] })
    })
  }

  // Pré-carregar dados críticos
  const prefetchCriticalData = async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['system-settings-optimized'],
        queryFn: () => useSystemSettingsCache().queryFn?.()
      }),
      queryClient.prefetchQuery({
        queryKey: ['upcoming-events-optimized'],
        queryFn: () => useUpcomingEventsCache().queryFn?.()
      })
    ])
  }

  return {
    useSystemSettingsCache,
    useUpcomingEventsCache,
    invalidateRelatedCaches,
    prefetchCriticalData
  }
}
