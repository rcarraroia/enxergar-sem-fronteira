
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

interface Event {
  id: string
  title: string
  description?: string
  location: string
  address: string
  city: string
  status: 'open' | 'closed' | 'cancelled'
  organizer_id: string
  created_at: string
  updated_at: string
  event_dates?: {
    id: string
    date: string
    start_time: string
    end_time: string
    total_slots: number
    available_slots: number
  }[]
  registrations_count?: number
}

interface CreateEventData {
  title: string
  description?: string
  location: string
  address: string
  city: string
  event_dates: {
    date: string
    start_time: string
    end_time: string
    total_slots: number
  }[]
}

export const useOrganizerEvents = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchOrganizerEvents = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location,
          address,
          city,
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
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Buscar contagem de inscrições para cada evento
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .in('event_date_id', event.event_dates?.map(ed => ed.id) || [])

          return {
            ...event,
            registrations_count: count || 0
          }
        })
      )

      setEvents(eventsWithCounts)
    } catch (error) {
      console.error('Erro ao buscar eventos do organizador:', error)
      toast.error('Erro ao carregar eventos')
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: CreateEventData) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      // Criar o evento
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          address: eventData.address,
          city: eventData.city,
          organizer_id: user.id,
          status: 'open'
        })
        .select()
        .single()

      if (eventError) throw eventError

      // Criar as datas do evento
      const eventDatesData = eventData.event_dates.map(date => ({
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

      if (datesError) throw datesError

      await fetchOrganizerEvents()
      toast.success('Evento criado com sucesso!')
      return event
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      toast.error('Erro ao criar evento')
      throw error
    }
  }

  const updateEvent = async (eventId: string, eventData: Partial<CreateEventData>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)

      if (error) throw error

      await fetchOrganizerEvents()
      toast.success('Evento atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
      toast.error('Erro ao atualizar evento')
      throw error
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      await fetchOrganizerEvents()
      toast.success('Evento excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      toast.error('Erro ao excluir evento')
      throw error
    }
  }

  const duplicateEvent = async (eventId: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      // Buscar evento original
      const { data: originalEvent, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          event_dates (*)
        `)
        .eq('id', eventId)
        .single()

      if (fetchError) throw fetchError

      // Criar novo evento
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          title: `${originalEvent.title} (Cópia)`,
          description: originalEvent.description,
          location: originalEvent.location,
          address: originalEvent.address,
          city: originalEvent.city,
          organizer_id: user.id,
          status: 'open'
        })
        .select()
        .single()

      if (eventError) throw eventError

      // Duplicar datas do evento (sem copiar as datas específicas)
      if (originalEvent.event_dates?.length > 0) {
        const eventDatesData = originalEvent.event_dates.map((date: any) => ({
          event_id: newEvent.id,
          start_time: date.start_time,
          end_time: date.end_time,
          total_slots: date.total_slots,
          available_slots: date.total_slots,
          // Não copiar a data específica, deixar o organizador definir
          date: new Date().toISOString().split('T')[0]
        }))

        const { error: datesError } = await supabase
          .from('event_dates')
          .insert(eventDatesData)

        if (datesError) throw datesError
      }

      await fetchOrganizerEvents()
      toast.success('Evento duplicado com sucesso!')
      return newEvent
    } catch (error) {
      console.error('Erro ao duplicar evento:', error)
      toast.error('Erro ao duplicar evento')
      throw error
    }
  }

  const toggleEventStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open'
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId)

      if (error) throw error

      await fetchOrganizerEvents()
      toast.success(`Evento ${newStatus === 'open' ? 'ativado' : 'pausado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status do evento:', error)
      toast.error('Erro ao alterar status do evento')
      throw error
    }
  }

  const getEventStats = async (eventId: string) => {
    try {
      const { data: eventDates } = await supabase
        .from('event_dates')
        .select('id, total_slots, available_slots')
        .eq('event_id', eventId)

      const { count: totalRegistrations } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .in('event_date_id', eventDates?.map(ed => ed.id) || [])

      const totalSlots = eventDates?.reduce((sum, date) => sum + date.total_slots, 0) || 0
      const availableSlots = eventDates?.reduce((sum, date) => sum + date.available_slots, 0) || 0

      return {
        totalRegistrations: totalRegistrations || 0,
        totalSlots,
        availableSlots,
        occupancyRate: totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots) * 100 : 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do evento:', error)
      return {
        totalRegistrations: 0,
        totalSlots: 0,
        availableSlots: 0,
        occupancyRate: 0
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchOrganizerEvents()
    }
  }, [user])

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    toggleEventStatus,
    getEventStats,
    fetchOrganizerEvents
  }
}
