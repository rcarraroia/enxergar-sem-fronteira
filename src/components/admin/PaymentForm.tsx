
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAsaasPayment } from '@/hooks/useAsaasPayment'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { CreditCard, Loader2 } from 'lucide-react'

const PaymentForm = () => {
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  const { createPayment, loading } = useAsaasPayment()

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date')
        .order('date', { ascending: true })
      
      if (error) throw error
      return data || []
    }
  })

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, nome, cpf')
        .order('nome')
      
      if (error) throw error
      return data || []
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEventId || !selectedPatientId || !amount || !description) {
      return
    }

    const paymentData = {
      eventId: selectedEventId,
      patientId: selectedPatientId,
      amount: parseFloat(amount),
      description
    }

    const payment = await createPayment(paymentData)
    
    if (payment) {
      // Abrir URL de pagamento em nova aba
      if (payment.invoiceUrl) {
        window.open(payment.invoiceUrl, '_blank')
      }
      
      // Limpar formulário
      setSelectedEventId('')
      setSelectedPatientId('')
      setAmount('')
      setDescription('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Criar Pagamento Asaas
        </CardTitle>
        <CardDescription>
          Gere cobranças com split automático de 25% para cada ente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="event">Evento</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="patient">Paciente</Label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.nome} - {patient.cpf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do pagamento..."
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando pagamento...
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

export default PaymentForm
