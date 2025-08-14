
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
import { useAsaasPayment } from '@/hooks/useAsaasPayment'
import { toast } from 'sonner'
import { CalendarDays, DollarSign, Users } from 'lucide-react'

const paymentSchema = z.object({
  event_date_id: z.string().min(1, 'Selecione uma data do evento'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export const PaymentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { events, isLoading: eventsLoading } = useEventsAdmin()
  const { createPayment, loading } = useAsaasPayment()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
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

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true)

      const selectedEventDate = eventDateOptions.find(ed => ed.eventDateId === data.event_date_id)
      if (!selectedEventDate) {
        toast.error('Data do evento não encontrada')
        return
      }

      const paymentData = {
        eventId: selectedEventDate.eventId,
        patientId: '', // This will need to be provided somehow
        amount: data.amount,
        description: data.description,
      }

      const result = await createPayment(paymentData)
      
      if (result) {
        reset()
        toast.success('Cobrança criada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao criar cobrança:', error)
      toast.error('Erro ao criar cobrança. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedEventDate = eventDateOptions.find(ed => ed.eventDateId === selectedEventDateId)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Criar Cobrança
        </CardTitle>
        <CardDescription>
          Configure uma cobrança para um evento específico
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
            <Label htmlFor="amount">Valor (R$)</Label>
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
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição da cobrança"
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
            {isSubmitting || loading ? 'Criando...' : 'Criar Cobrança'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
