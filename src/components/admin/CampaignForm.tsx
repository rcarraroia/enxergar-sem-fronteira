
import React, { useState } from 'react'
import { useEventsAdmin } from '@/hooks/useEventsAdmin'
import { useCampaigns, CreateCampaignData } from '@/hooks/useCampaigns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Heart, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

export const CampaignForm = () => {
  const { events } = useEventsAdmin()
  const { createCampaign } = useCampaigns()
  
  const [formData, setFormData] = useState<CreateCampaignData>({
    title: '',
    description: '',
    event_id: '',
    goal_amount: undefined,
    suggested_amounts: [25, 50, 100, 200],
    allow_custom_amount: true,
    allow_subscriptions: true,
    status: 'active'
  })

  const [suggestedAmountsText, setSuggestedAmountsText] = useState('25, 50, 100, 200')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Título da campanha é obrigatório')
      return
    }

    try {
      // Parse suggested amounts
      const amounts = suggestedAmountsText
        .split(',')
        .map(amount => parseFloat(amount.trim()))
        .filter(amount => !isNaN(amount) && amount > 0)

      await createCampaign.mutateAsync({
        ...formData,
        suggested_amounts: amounts.length > 0 ? amounts : [25, 50, 100, 200],
        goal_amount: formData.goal_amount || undefined,
        event_id: formData.event_id || undefined
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_id: '',
        goal_amount: undefined,
        suggested_amounts: [25, 50, 100, 200],
        allow_custom_amount: true,
        allow_subscriptions: true,
        status: 'active'
      })
      setSuggestedAmountsText('25, 50, 100, 200')
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-primary" />
          <CardTitle>Nova Campanha de Arrecadação</CardTitle>
        </div>
        <CardDescription>
          Crie uma nova campanha para captação de recursos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Campanha *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Ajude a levar atendimento para..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Evento Associado</Label>
              <Select value={formData.event_id} onValueChange={(value) => setFormData(prev => ({ ...prev, event_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum evento específico</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.city} - {event.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo da campanha, como os recursos serão utilizados..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal_amount">Meta de Arrecadação (R$)</Label>
              <Input
                id="goal_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.goal_amount || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  goal_amount: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="Ex: 5000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggested_amounts">Valores Sugeridos (R$)</Label>
              <Input
                id="suggested_amounts"
                value={suggestedAmountsText}
                onChange={(e) => setSuggestedAmountsText(e.target.value)}
                placeholder="Ex: 25, 50, 100, 200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Valor Personalizado</Label>
                <p className="text-sm text-muted-foreground">
                  Doadores podem inserir qualquer valor
                </p>
              </div>
              <Switch
                checked={formData.allow_custom_amount}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_custom_amount: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Assinaturas Mensais</Label>
                <p className="text-sm text-muted-foreground">
                  Doadores podem fazer doações recorrentes
                </p>
              </div>
              <Switch
                checked={formData.allow_subscriptions}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_subscriptions: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Campanha
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
