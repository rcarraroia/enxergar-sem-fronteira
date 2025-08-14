
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEventsAdmin } from '@/hooks/useEventsAdmin'
import { useAsaasDonation } from '@/hooks/useAsaasDonation'
import { toast } from 'sonner'
import { CalendarDays, Heart, Users } from 'lucide-react'

const donationSchema = z.object({
  event_date_id: z.string().min(1, 'Selecione uma data do evento'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
})

type DonationFormData = z.infer<typeof donationSchema>

export const DonationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { events, isLoading: eventsLoading } = useEventsAdmin()
  const { createDonation, loading } = useAsaasDonation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
  })

  const selectedEventDateId = watch('event_date_id')

  // Criar lista de todas as datas de eventos disponíveis
  const eventDateOptions = events?.flatMap(event => 
    event.event_dates.map(eventDate => ({
      eventDateId: eventDate.id,
      eventId: event.id,
      eventTitle: event.title,
      date: eventDate.date,
      startTime: eventDate.start_time,
      endTime: eventDate.end_time,
      totalSlots: eventDate.total_slots,
      availableSlots: eventDate.available_slots
    }))
  ) || []

  const onSubmit = async (data: DonationFormData) => {
    try {
      setIsSubmitting(true)

      const selectedEventDate = eventDateOptions.find(ed => ed.eventDateId === data.event_date_id)
      if (!selectedEventDate) {
        toast.error('Data do evento não encontrada')
        return
      }

      const donationData = {
        eventId: selectedEventDate.eventId,
        patientId: '', // This will need to be provided somehow
        amount: data.amount,
        description: data.description,
      }

      const result = await createDonation(donationData)
      
      if (result) {
        reset()
        toast.success('Campanha de doação criada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao criar campanha de doação:', error)
      toast.error('Erro ao criar campanha de doação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedEventDate = eventDateOptions.find(ed => ed.eventDateId === selectedEventDateId)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Criar Campanha de Doação
        </CardTitle>
        <CardDescription>
          Configure uma campanha de arrecadação para um evento específico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Seleção da Data do Evento */}
          <div className="space-y-2">
            <Label htmlFor="event_date_id">Data do Evento</Label>
            <Select 
              value={selectedEventDateId} 
              onValueChange={(value) => setValue('event_date_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma data do evento" />
              </SelectTrigger>
              <SelectContent>
                {eventDateOptions.map((eventDate) => (
                  <SelectItem key={eventDate.eventDateId} value={eventDate.eventDateId}>
                    {eventDate.eventTitle} - {new Date(eventDate.date + 'T00:00:00').toLocaleDateString('pt-BR')} ({eventDate.startTime} - {eventDate.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.event_date_id && (
              <p className="text-sm text-destructive">{errors.event_date_id.message}</p>
            )}
          </div>

          {/* Informações do Evento Selecionado */}
          {selectedEventDate && (
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedEventDate.eventTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>📅 {new Date(selectedEventDate.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  <span>• 🕐 {selectedEventDate.startTime} - {selectedEventDate.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEventDate.availableSlots} vagas disponíveis de {selectedEventDate.totalSlots}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Meta (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Campanha</Label>
            <Input
              id="description"
              placeholder="Descrição da campanha de arrecadação"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || loading || eventsLoading} 
            className="w-full"
          >
            {isSubmitting || loading ? 'Criando...' : 'Criar Campanha de Doação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
