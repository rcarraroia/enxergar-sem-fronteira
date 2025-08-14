
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCampaigns, CreateCampaignData } from '@/hooks/useCampaigns'
import { useEvents } from '@/hooks/useEvents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, CalendarIcon, Plus, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const campaignSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  event_id: z.string().optional(),
  goal_amount: z.number().optional(),
  suggested_amounts: z.array(z.number()).optional(),
  allow_custom_amount: z.boolean().default(true),
  allow_subscriptions: z.boolean().default(true),
  status: z.enum(['active', 'paused', 'ended']).default('active'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

export const CampaignForm = () => {
  const { createCampaign } = useCampaigns()
  const { data: events } = useEvents()
  const [customAmounts, setCustomAmounts] = useState<number[]>([25, 50, 100, 200])
  const [newAmount, setNewAmount] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      allow_custom_amount: true,
      allow_subscriptions: true,
      status: 'active'
    }
  })

  const selectedEventId = watch('event_id')

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const submitData: CreateCampaignData = {
        title: data.title,
        description: data.description,
        event_id: data.event_id,
        goal_amount: data.goal_amount,
        suggested_amounts: customAmounts,
        allow_custom_amount: data.allow_custom_amount,
        allow_subscriptions: data.allow_subscriptions,
        status: data.status,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      }

      await createCampaign.mutateAsync(submitData)
      reset()
      setCustomAmounts([25, 50, 100, 200])
      setStartDate(undefined)
      setEndDate(undefined)
      setNewAmount('')
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
    }
  }

  const addCustomAmount = () => {
    const amount = parseFloat(newAmount)
    if (amount > 0 && !customAmounts.includes(amount)) {
      setCustomAmounts([...customAmounts, amount].sort((a, b) => a - b))
      setNewAmount('')
    }
  }

  const removeCustomAmount = (amount: number) => {
    setCustomAmounts(customAmounts.filter(a => a !== amount))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Campanha</CardTitle>
        <CardDescription>
          Crie uma nova campanha de arrecadação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Campanha</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ex: Ajude-nos a levar atendimento para São Paulo"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva os objetivos e impacto da campanha..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="event_id">Evento Associado (Opcional)</Label>
              <Select value={selectedEventId || ""} onValueChange={(value) => setValue('event_id', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Campanha Geral</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.city} - {event.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meta e valores */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal_amount">Meta de Arrecadação (Opcional)</Label>
              <Input
                id="goal_amount"
                type="number"
                step="0.01"
                min="0"
                {...register('goal_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Valores Sugeridos</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {customAmounts.map((amount) => (
                  <div key={amount} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                    <span>R$ {amount}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomAmount(amount)}
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Novo valor"
                  className="flex-1"
                />
                <Button type="button" onClick={addCustomAmount} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Fim (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Valor Personalizado</Label>
                <p className="text-sm text-muted-foreground">
                  Doadores podem inserir valores personalizados
                </p>
              </div>
              <Switch
                checked={watch('allow_custom_amount')}
                onCheckedChange={(checked) => setValue('allow_custom_amount', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Assinaturas Mensais</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar doações recorrentes mensais
                </p>
              </div>
              <Switch
                checked={watch('allow_subscriptions')}
                onCheckedChange={(checked) => setValue('allow_subscriptions', checked)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value as 'active' | 'paused' | 'ended')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="ended">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createCampaign.isPending}>
            {createCampaign.isPending ? 'Criando...' : 'Criar Campanha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
