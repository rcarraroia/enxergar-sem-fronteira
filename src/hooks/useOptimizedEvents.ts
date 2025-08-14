
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useCallback, useMemo } from 'react'

export interface OptimizedEvent {
  id: string
  city: string
  location: string
  address: string
  description?: string
  status: 'open' | 'closed' | 'full'
  organizer_id: string
  created_at: string
  updated_at: string
  dates: Array<{
    id: string
    date: string
    start_time: string
    end_time: string
    total_slots: number
    available_slots: number
  }>
  _count?: {
    registrations: number
  }
}

export const useOptimizedEvents = (filters?: {
  status?: 'open' | 'closed' | 'full'
  city?: string
  organizerId?: string
}) => {
  const queryClient = useQueryClient()

  const queryKey = ['events', 'optimized', filters]

  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<OptimizedEvent[]> => {
      console.log('🔍 Buscando eventos otimizados com filtros:', filters)
      
      let query = supabase
        .from('events')
        .select(`
          id,
          city,
          location,
          address,
          description,
          status,
          organizer_id,
          created_at,
          updated_at,
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros de forma otimizada
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`)
      }
      
      if (filters?.organizerId) {
        query = query.eq('organizer_id', filters.organizerId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        throw error
      }

      // Transformar dados para estrutura otimizada com type assertion
      const optimizedEvents: OptimizedEvent[] = data?.map(event => ({
        ...event,
        status: event.status as 'open' | 'closed' | 'full', // Type assertion para garantir o tipo correto
        dates: event.event_dates || []
      })) || []

      console.log('✅ Eventos carregados:', optimizedEvents.length)
      return optimizedEvents
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })

  // Função para invalidar cache de eventos específicos
  const invalidateEvent = useCallback((eventId: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['events', 'optimized'] 
    })
    queryClient.invalidateQueries({ 
      queryKey: ['event', eventId] 
    })
  }, [queryClient])

  // Função para atualizar evento no cache
  const updateEventInCache = useCallback((eventId: string, updatedData: Partial<OptimizedEvent>) => {
    queryClient.setQueryData<OptimizedEvent[]>(queryKey, (oldData) => {
      if (!oldData) return oldData
      
      return oldData.map(event => 
        event.id === eventId 
          ? { ...event, ...updatedData }
          : event
      )
    })
  }, [queryClient, queryKey])

  // Memoizar eventos filtrados para performance
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    return events.filter(event => {
      // Filtros adicionais no frontend se necessário
      if (filters?.status && event.status !== filters.status) {
        return false
      }
      
      return true
    })
  }, [events, filters])

  // Estatísticas computadas
  const stats = useMemo(() => {
    if (!events) return null
    
    return {
      total: events.length,
      open: events.filter(e => e.status === 'open').length,
      closed: events.filter(e => e.status === 'closed').length,
      full: events.filter(e => e.status === 'full').length,
      totalSlots: events.reduce((acc, event) => 
        acc + event.dates.reduce((dateAcc, date) => dateAcc + date.total_slots, 0), 0
      ),
      availableSlots: events.reduce((acc, event) => 
        acc + event.dates.reduce((dateAcc, date) => dateAcc + date.available_slots, 0), 0
      )
    }
  }, [events])

  return {
    events: filteredEvents,
    stats,
    isLoading,
    error,
    refetch,
    invalidateEvent,
    updateEventInCache
  }
}

// Hook para evento único otimizado
export const useOptimizedEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId, 'optimized'],
    queryFn: async (): Promise<OptimizedEvent | null> => {
      if (!eventId) return null
      
      console.log('🔍 Buscando evento específico:', eventId)
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          city,
          location,
          address,
          description,
          status,
          organizer_id,
          created_at,
          updated_at,
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots,
            registrations (
              id,
              status
            )
          )
        `)
        .eq('id', eventId)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar evento:', error)
        throw error
      }

      if (!data) return null

      const optimizedEvent: OptimizedEvent = {
        ...data,
        status: data.status as 'open' | 'closed' | 'full', // Type assertion
        dates: data.event_dates?.map(date => ({
          id: date.id,
          date: date.date,
          start_time: date.start_time,
          end_time: date.end_time,
          total_slots: date.total_slots,
          available_slots: date.available_slots
        })) || []
      }

      console.log('✅ Evento carregado:', optimizedEvent.city)
      return optimizedEvent
    },
    enabled: !!eventId,
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}
