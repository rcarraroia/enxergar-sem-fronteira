
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export interface EventDate {
  id: string
  date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
}

export interface EventFormData {
  city: string
  description?: string
  location: string
  address: string
  status: 'open' | 'closed' | 'full'
  dates: EventDate[]
}

export interface Event extends Omit<EventFormData, 'dates'> {
  id: string
  organizer_id: string
  created_at: string
  updated_at: string
  event_dates: EventDate[]
  organizers?: {
    id: string
    name: string
    email: string
  }
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
        .select(`
          *,
          event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots
          ),
          organizers (
            id,
            name,
            email
          )
        `)
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
      
      console.log('📝 Criando novo evento:', eventData.city)
      
      // Criar o evento - usar insert direto com os campos corretos
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          city: eventData.city,
          description: eventData.description,
          location: eventData.location,
          address: eventData.address,
          status: eventData.status,
          organizer_id: user.id,
          title: eventData.city // Temporário para compatibilidade com a estrutura atual
        })
        .select()
        .single()

      if (eventError) {
        console.error('❌ Erro ao criar evento:', eventError)
        throw eventError
      }

      // Criar as datas do evento
      const eventDatesData = eventData.dates.map(date => ({
        event_id: event.id,
        date: date.date,
        start_time: date.start_time,
        end_time: date.end_time,
        total_slots: date.total_slots,
        available_slots: date.total_slots
      }))

      const { error: datesError } = await supabase
        .from('event_dates')
        .insert(eventDatesData)

      if (datesError) {
        console.error('❌ Erro ao criar datas do evento:', datesError)
        throw datesError
      }

      console.log('✅ Evento criado com sucesso:', event.city)
      return event
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
      console.log('📝 Atualizando evento:', eventData.city)
      
      // Atualizar o evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .update({
          city: eventData.city,
          description: eventData.description,
          location: eventData.location,
          address: eventData.address,
          status: eventData.status,
          updated_at: new Date().toISOString(),
          title: eventData.city // Temporário para compatibilidade
        })
        .eq('id', eventData.id)
        .select()
        .single()

      if (eventError) {
        console.error('❌ Erro ao atualizar evento:', eventError)
        throw eventError
      }

      // Remover datas antigas
      const { error: deleteError } = await supabase
        .from('event_dates')
        .delete()
        .eq('event_id', eventData.id)

      if (deleteError) {
        console.error('❌ Erro ao remover datas antigas:', deleteError)
        throw deleteError
      }

      // Adicionar novas datas
      const eventDatesData = eventData.dates.map(date => ({
        event_id: eventData.id,
        date: date.date,
        start_time: date.start_time,
        end_time: date.end_time,
        total_slots: date.total_slots,
        available_slots: date.available_slots
      }))

      const { error: datesError } = await supabase
        .from('event_dates')
        .insert(eventDatesData)

      if (datesError) {
        console.error('❌ Erro ao criar novas datas:', datesError)
        throw datesError
      }

      console.log('✅ Evento atualizado com sucesso:', event.city)
      return event
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
