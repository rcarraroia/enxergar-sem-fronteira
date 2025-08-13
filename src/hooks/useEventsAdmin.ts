
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface EventFormData {
  title: string
  description?: string
  location: string
  address: string
  date: string
  start_time: string
  end_time: string
  total_slots: number
  status: 'open' | 'closed' | 'full'
}

export interface Event extends EventFormData {
  id: string
  available_slots: number
  organizer_id: string
  created_at: string
  updated_at: string
}

export const useEventsAdmin = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      console.log('🔍 Buscando todos os eventos para admin...')
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        throw error
      }

      console.log(`✅ Encontrados ${data?.length || 0} eventos`)
      return data as Event[]
    },
    enabled: !!user
  })

  const createEvent = useMutation({
    mutationFn: async (eventData: EventFormData) => {
      if (!user) throw new Error('Usuário não autenticado')
      
      console.log('📝 Criando novo evento:', eventData.title)
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          organizer_id: user.id,
          available_slots: eventData.total_slots
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar evento:', error)
        throw error
      }

      console.log('✅ Evento criado com sucesso:', data.title)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      toast.success('Evento criado com sucesso!')
    },
    onError: (error) => {
      console.error('❌ Erro ao criar evento:', error)
      toast.error('Erro ao criar evento: ' + error.message)
    }
  })

  const updateEvent = useMutation({
    mutationFn: async (eventData: EventFormData & { id: string }) => {
      console.log('📝 Atualizando evento:', eventData.title)
      
      const { data, error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          address: eventData.address,
          date: eventData.date,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          total_slots: eventData.total_slots,
          status: eventData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventData.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar evento:', error)
        throw error
      }

      console.log('✅ Evento atualizado com sucesso:', data.title)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      toast.success('Evento atualizado com sucesso!')
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar evento:', error)
      toast.error('Erro ao atualizar evento: ' + error.message)
    }
  })

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      console.log('🗑️ Excluindo evento:', eventId)
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        console.error('❌ Erro ao excluir evento:', error)
        throw error
      }

      console.log('✅ Evento excluído com sucesso')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      toast.success('Evento excluído com sucesso!')
    },
    onError: (error) => {
      console.error('❌ Erro ao excluir evento:', error)
      toast.error('Erro ao excluir evento: ' + error.message)
    }
  })

  return {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent
  }
}
