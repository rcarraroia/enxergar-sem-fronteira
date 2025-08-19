import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface EventFormData {
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  location: string
  address: string
  total_slots: number
  available_slots?: number
}

interface Event extends EventFormData {
  id: string
  organizer_id: string
  status: string
  created_at: string
}

export const useOrganizerEventForm = (eventId?: string) => {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  // Buscar evento para edição
  const { data: event, isLoading: loading } = useQuery({
    queryKey: ['organizer-event', eventId],
    queryFn: async (): Promise<Event | null> => {
      if (!eventId || !user?.id) return null

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

      if (error) {
        console.error('Erro ao buscar evento:', error)
        throw error
      }

      return data
    },
    enabled: !!eventId && !!user?.id
  })

  const createEvent = async (eventData: EventFormData) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado')
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          organizer_id: user.id,
          status: 'active',
          available_slots: eventData.total_slots
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar evento:', error)
        toast.error('Erro ao criar evento: ' + error.message)
        throw error
      }

      console.log('Evento criado com sucesso:', data)
      return data
    } finally {
      setSaving(false)
    }
  }

  const updateEvent = async (eventId: string, eventData: EventFormData) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado')
    }

    setSaving(true)
    try {
      // Verificar se o evento pertence ao organizador
      const { data: existingEvent, error: checkError } = await supabase
        .from('events')
        .select('id, organizer_id, total_slots, available_slots')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

      if (checkError || !existingEvent) {
        toast.error('Evento não encontrado ou você não tem permissão para editá-lo')
        throw new Error('Evento não encontrado')
      }

      // Se o total de vagas mudou, ajustar as vagas disponíveis
      let newAvailableSlots = eventData.available_slots || existingEvent.available_slots
      if (eventData.total_slots !== existingEvent.total_slots) {
        const occupiedSlots = existingEvent.total_slots - existingEvent.available_slots
        newAvailableSlots = Math.max(0, eventData.total_slots - occupiedSlots)
      }

      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          available_slots: newAvailableSlots
        })
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar evento:', error)
        toast.error('Erro ao atualizar evento: ' + error.message)
        throw error
      }

      console.log('Evento atualizado com sucesso:', data)
      return data
    } finally {
      setSaving(false)
    }
  }

  return {
    event,
    loading,
    saving,
    createEvent,
    updateEvent
  }
}