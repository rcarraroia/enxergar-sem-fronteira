import React, { useState } from 'react'
import { useEventsAdmin } from '@/hooks/useEventsAdmin'
import { useAsaasPayment } from '@/hooks/useAsaasPayment'
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
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const PaymentForm = () => {
  const { events } = useEventsAdmin()
  const { createPayment, loading } = useAsaasPayment()
  
  const [formData, setFormData] = useState({
    eventId: '',
    amount: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.eventId || !formData.amount || !formData.customerName || !formData.customerEmail) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      await createPayment({
        eventId: formData.eventId,
        amount: parseFloat(formData.amount),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        description: formData.description
      })

      // Reset form
      setFormData({
        eventId: '',
        amount: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        description: ''
      })
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
    }
  }

  const selectedEvent = events?.find(e => e.id === formData.eventId)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Novo Pagamento</CardTitle>
        </div>
        <CardDescription>
          Crie uma cobrança para um evento específico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventId">Evento *</Label>
            <Select value={formData.eventId} onValueChange={(value) => setFormData(prev => ({ ...prev, eventId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.city} - {event.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Valor *</Label>
            <Input 
              type="number" 
              id="amount" 
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <Label htmlFor="customerName">Nome do Cliente *</Label>
            <Input 
              type="text" 
              id="customerName" 
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Nome completo"
            />
          </div>

          <div>
            <Label htmlFor="customerEmail">Email do Cliente *</Label>
            <Input 
              type="email" 
              id="customerEmail" 
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <Label htmlFor="customerPhone">Telefone do Cliente</Label>
            <Input 
              type="tel" 
              id="customerPhone" 
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="(XX) XXXX-XXXX"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description" 
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Informações adicionais"
            />
          </div>

          <Button disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Pagamento'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
