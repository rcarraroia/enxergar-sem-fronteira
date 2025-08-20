/**
 * EVENT FORM V2 - Formulário de criação/edição de eventos
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus, 
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { useCreateEventV2, useUpdateEventV2, useEventV2, type EventFormData } from '@/hooks/admin-v2/useEventsV2'
import { format } from 'date-fns'

interface EventFormProps {
  eventId?: string
  mode: 'create' | 'edit'
}

interface EventDateForm {
  date: string
  start_time: string
  end_time: string
  total_slots: number
  available_slots: number
  location_details?: string
}

export const EventForm: React.FC<EventFormProps> = ({ eventId, mode }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    status: 'active',
    event_dates: []
  })
  const [eventDates, setEventDates] = useState<EventDateForm[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: existingEvent, isLoading: loadingEvent } = useEventV2(eventId || '')
  const createEventMutation = useCreateEventV2()
  const updateEventMutation = useUpdateEventV2()

  // Carregar dados do evento existente
  useEffect(() => {
    if (mode === 'edit' && existingEvent) {
      setFormData({
        title: existingEvent.title,
        description: existingEvent.description,
        location: existingEvent.location,
        status: existingEvent.status,
        event_dates: []
      })
      
      if (existingEvent.event_dates) {
        setEventDates(existingEvent.event_dates.map(date => ({
          date: date.date,
          start_time: date.start_time,
          end_time: date.end_time,
          total_slots: date.total_slots,
          available_slots: date.available_slots,
          location_details: date.location_details
        })))
      }
    }
  }, [mode, existingEvent])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Local é obrigatório'
    }

    if (eventDates.length === 0) {
      newErrors.dates = 'Pelo menos uma data é obrigatória'
    }

    // Validar datas
    eventDates.forEach((date, index) => {
      if (!date.date) {
        newErrors[`date_${index}`] = 'Data é obrigatória'
      }
      if (!date.start_time) {
        newErrors[`start_time_${index}`] = 'Horário de início é obrigatório'
      }
      if (!date.end_time) {
        newErrors[`end_time_${index}`] = 'Horário de fim é obrigatório'
      }
      if (date.total_slots <= 0) {
        newErrors[`total_slots_${index}`] = 'Número de vagas deve ser maior que 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const eventData: EventFormData = {
        ...formData,
        event_dates: eventDates.map(date => ({
          ...date,
          available_slots: date.total_slots // Inicialmente todas as vagas estão disponíveis
        }))
      }

      if (mode === 'create') {
        await createEventMutation.mutateAsync(eventData)
        navigate('/admin-v2/events')
      } else if (mode === 'edit' && eventId) {
        await updateEventMutation.mutateAsync({ eventId, eventData })
        navigate('/admin-v2/events')
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
    }
  }

  const addEventDate = () => {
    const newDate: EventDateForm = {
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      total_slots: 20,
      available_slots: 20,
      location_details: ''
    }
    setEventDates([...eventDates, newDate])
  }

  const removeEventDate = (index: number) => {
    setEventDates(eventDates.filter((_, i) => i !== index))
  }

  const updateEventDate = (index: number, field: keyof EventDateForm, value: string | number) => {
    const updatedDates = [...eventDates]
    updatedDates[index] = { ...updatedDates[index], [field]: value }
    setEventDates(updatedDates)
  }

  const isLoading = createEventMutation.isPending || updateEventMutation.isPending || loadingEvent

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin-v2/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Criar Novo Evento' : 'Editar Evento'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Evento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Consulta Oftalmológica - São Paulo"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o evento, procedimentos, requisitos..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Local *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Hospital das Clínicas - São Paulo"
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas e Horários */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Datas e Horários
              </CardTitle>
              <Button type="button" onClick={addEventDate} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {errors.dates && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.dates}</AlertDescription>
              </Alert>
            )}

            {eventDates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma data adicionada</p>
                <p className="text-sm">Clique em "Adicionar Data" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {eventDates.map((eventDate, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">Data {index + 1}</Badge>
                        {eventDates.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEventDate(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label>Data *</Label>
                          <Input
                            type="date"
                            value={eventDate.date}
                            onChange={(e) => updateEventDate(index, 'date', e.target.value)}
                            className={errors[`date_${index}`] ? 'border-red-500' : ''}
                          />
                          {errors[`date_${index}`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`date_${index}`]}</p>
                          )}
                        </div>

                        <div>
                          <Label>Início *</Label>
                          <Input
                            type="time"
                            value={eventDate.start_time}
                            onChange={(e) => updateEventDate(index, 'start_time', e.target.value)}
                            className={errors[`start_time_${index}`] ? 'border-red-500' : ''}
                          />
                          {errors[`start_time_${index}`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`start_time_${index}`]}</p>
                          )}
                        </div>

                        <div>
                          <Label>Fim *</Label>
                          <Input
                            type="time"
                            value={eventDate.end_time}
                            onChange={(e) => updateEventDate(index, 'end_time', e.target.value)}
                            className={errors[`end_time_${index}`] ? 'border-red-500' : ''}
                          />
                          {errors[`end_time_${index}`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`end_time_${index}`]}</p>
                          )}
                        </div>

                        <div>
                          <Label>Vagas *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={eventDate.total_slots}
                            onChange={(e) => updateEventDate(index, 'total_slots', parseInt(e.target.value) || 0)}
                            className={errors[`total_slots_${index}`] ? 'border-red-500' : ''}
                          />
                          {errors[`total_slots_${index}`] && (
                            <p className="text-sm text-red-600 mt-1">{errors[`total_slots_${index}`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Detalhes do Local (opcional)</Label>
                        <Input
                          value={eventDate.location_details || ''}
                          onChange={(e) => updateEventDate(index, 'location_details', e.target.value)}
                          placeholder="Ex: Sala 201, 2º andar"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'create' ? 'Criar Evento' : 'Salvar Alterações'}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin-v2/events')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}