
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OrganizerLayout } from '@/components/organizer/OrganizerLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Save, ArrowLeft, Calendar, Clock, Users } from 'lucide-react'
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents'
import { toast } from 'sonner'

interface EventDate {
  date: string
  start_time: string
  end_time: string
  total_slots: number
}

interface EventFormData {
  title: string
  description: string
  location: string
  address: string
  city: string
  event_dates: EventDate[]
}

const OrganizerEventForm = () => {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const { createEvent, updateEvent, events } = useOrganizerEvents()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    address: '',
    city: '',
    event_dates: [{
      date: '',
      start_time: '',
      end_time: '',
      total_slots: 50
    }]
  })

  const isEditing = !!eventId

  useEffect(() => {
    if (isEditing && events.length > 0) {
      const event = events.find(e => e.id === eventId)
      if (event) {
        setFormData({
          title: event.title,
          description: event.description || '',
          location: event.location,
          address: event.address,
          city: event.city,
          event_dates: event.event_dates?.map(date => ({
            date: date.date,
            start_time: date.start_time,
            end_time: date.end_time,
            total_slots: date.total_slots
          })) || [{
            date: '',
            start_time: '',
            end_time: '',
            total_slots: 50
          }]
        })
      }
    }
  }, [isEditing, eventId, events])

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (index: number, field: keyof EventDate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      event_dates: prev.event_dates.map((date, i) => 
        i === index ? { ...date, [field]: value } : date
      )
    }))
  }

  const addEventDate = () => {
    setFormData(prev => ({
      ...prev,
      event_dates: [...prev.event_dates, {
        date: '',
        start_time: '',
        end_time: '',
        total_slots: 50
      }]
    }))
  }

  const removeEventDate = (index: number) => {
    if (formData.event_dates.length > 1) {
      setFormData(prev => ({
        ...prev,
        event_dates: prev.event_dates.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    
    if (!formData.location.trim()) {
      toast.error('Local é obrigatório')
      return
    }
    
    if (!formData.city.trim()) {
      toast.error('Cidade é obrigatória')
      return
    }
    
    if (!formData.address.trim()) {
      toast.error('Endereço é obrigatório')
      return
    }

    const hasInvalidDates = formData.event_dates.some(date => 
      !date.date || !date.start_time || !date.end_time || date.total_slots <= 0
    )
    
    if (hasInvalidDates) {
      toast.error('Todas as datas devem estar preenchidas corretamente')
      return
    }

    setLoading(true)
    
    try {
      if (isEditing) {
        await updateEvent(eventId!, formData)
        toast.success('Evento atualizado com sucesso!')
      } else {
        await createEvent(formData)
        toast.success('Evento criado com sucesso!')
      }
      navigate('/organizer/events')
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      toast.error('Erro ao salvar evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/organizer/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Evento' : 'Novo Evento'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Atualize as informações do seu evento' : 'Crie um novo evento para receber inscrições'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Evento *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Consulta Oftalmológica Gratuita"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva os detalhes do evento, público-alvo, documentos necessários..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Nome do Local *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ex: Hospital Regional, Centro Médico..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número, bairro..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Ex: São Paulo, Rio de Janeiro..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Datas e Horários */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Datas e Horários</CardTitle>
                <Button type="button" variant="outline" onClick={addEventDate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Data
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.event_dates.map((eventDate, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Data {index + 1}</h4>
                    {formData.event_dates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEventDate(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`date-${index}`}>
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Data *
                      </Label>
                      <Input
                        id={`date-${index}`}
                        type="date"
                        value={eventDate.date}
                        onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`start-time-${index}`}>
                        <Clock className="h-4 w-4 inline mr-1" />
                        Início *
                      </Label>
                      <Input
                        id={`start-time-${index}`}
                        type="time"
                        value={eventDate.start_time}
                        onChange={(e) => handleDateChange(index, 'start_time', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`end-time-${index}`}>
                        <Clock className="h-4 w-4 inline mr-1" />
                        Término *
                      </Label>
                      <Input
                        id={`end-time-${index}`}
                        type="time"
                        value={eventDate.end_time}
                        onChange={(e) => handleDateChange(index, 'end_time', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`slots-${index}`}>
                        <Users className="h-4 w-4 inline mr-1" />
                        Vagas *
                      </Label>
                      <Input
                        id={`slots-${index}`}
                        type="number"
                        min="1"
                        value={eventDate.total_slots}
                        onChange={(e) => handleDateChange(index, 'total_slots', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organizer/events')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar Evento' : 'Criar Evento')}
            </Button>
          </div>
        </form>
      </div>
    </OrganizerLayout>
  )
}

export default OrganizerEventForm
