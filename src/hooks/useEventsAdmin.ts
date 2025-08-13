
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
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

export const useEventsAdmin = () => {
  const queryClient = useQueryClient()

  // Buscar todos os eventos (incluindo inativos)
  const {
    data: events,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      console.log('🔍 Buscando todos os eventos para admin...')
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          registrations(count)
        `)
        .order('date', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar eventos:', error)
        throw error
      }

      console.log(`✅ Encontrados ${data?.length || 0} eventos`)
      return data
    }
  })

  // Criar evento
  const createEvent = useMutation({
    mutationFn: async (eventData: EventFormData) => {
      console.log('📝 Criando novo evento:', eventData.title)
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          available_slots: eventData.total_slots,
          organizer_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar evento:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      toast.success('✅ Evento criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error) => {
      console.error('❌ Erro ao criar evento:', error)
      toast.error('Erro ao criar evento')
    }
  })

  // Atualizar evento
  const updateEvent = useMutation({
    mutationFn: async ({ id, ...eventData }: EventFormData & { id: string }) => {
      console.log('✏️ Atualizando evento:', id)
      
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar evento:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      toast.success('✅ Evento atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar evento:', error)
      toast.error('Erro ao atualizar evento')
    }
  })

  // Excluir evento
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
    },
    onSuccess: () => {
      toast.success('✅ Evento excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error) => {
      console.error('❌ Erro ao excluir evento:', error)
      toast.error('Erro ao excluir evento')
    }
  })

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent
  }
}
