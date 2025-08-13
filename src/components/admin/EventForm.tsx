
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EventFormData } from '@/hooks/useEventsAdmin'
import { Loader2, Save, X } from 'lucide-react'

interface EventFormProps {
  initialData?: EventFormData & { id?: string }
  onSubmit: (data: EventFormData & { id?: string }) => void
  onCancel: () => void
  isLoading: boolean
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    address: '',
    date: '',
    start_time: '',
    end_time: '',
    total_slots: 50,
    status: 'open'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        location: initialData.location,
        address: initialData.address,
        date: initialData.date,
        start_time: initialData.start_time,
        end_time: initialData.end_time,
        total_slots: initialData.total_slots,
        status: initialData.status
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      ...(initialData?.id && { id: initialData.id })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Editar Evento' : 'Criar Novo Evento'}
        </CardTitle>
        <CardDescription>
          Preencha os dados do evento oftalmológico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título do Evento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Consulta Oftalmológica Gratuita"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o evento, procedimentos disponíveis, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">Local *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Centro de Saúde Municipal"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço Completo *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro, cidade - CEP"
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Data do Evento *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="total_slots">Total de Vagas *</Label>
              <Input
                id="total_slots"
                type="number"
                min="1"
                max="1000"
                value={formData.total_slots}
                onChange={(e) => setFormData(prev => ({ ...prev, total_slots: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="start_time">Horário Início *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_time">Horário Fim *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'open' | 'closed' | 'full') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto para Inscrições</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                  <SelectItem value="full">Lotado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {initialData ? 'Atualizar' : 'Criar'} Evento
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
