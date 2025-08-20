
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { cpfMask, validateCPF } from '@/utils/cpfUtils'
import { formatPhoneNumber } from '@/utils/validationUtils'

interface PatientRegistrationFormProps {
  eventDateId: string
  onSuccess: () => void
}

interface EventInfo {
  title: string
  date: string
  start_time: string
  location: string
  address: string
  available_slots: number
}

export const PatientRegistrationForm = ({ eventDateId, onSuccess }: PatientRegistrationFormProps) => {
  const [loading, setLoading] = useState(false)
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    diagnostico: ''
  })

  const fetchEventInfo = async () => {
    const { data, error } = await supabase
      .from('event_dates')
      .select(`
        date,
        start_time,
        available_slots,
        events (
          title,
          location,
          address
        )
      `)
      .eq('id', eventDateId)
      .single()

    if (error) {
      console.error('Erro ao buscar informações do evento:', error)
      toast.error('Erro ao carregar informações do evento')
      return
    }

    if (data?.events) {
      setEventInfo({
        title: data.events.title,
        date: data.date,
        start_time: data.start_time,
        location: data.events.location,
        address: data.events.address,
        available_slots: data.available_slots
      })
    }
  }

  useEffect(() => {
    fetchEventInfo()
  }, [eventDateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido')
      return
    }

    if (eventInfo && eventInfo.available_slots <= 0) {
      toast.error('Não há mais vagas disponíveis para este evento')
      return
    }

    setLoading(true)

    try {
      // Criar ou buscar paciente
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('cpf', formData.cpf.replace(/\D/g, ''))
        .single()

      let patientId: string

      if (existingPatient) {
        patientId = existingPatient.id
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            nome: formData.nome,
            cpf: formData.cpf.replace(/\D/g, ''),
            email: formData.email,
            telefone: formData.telefone.replace(/\D/g, ''),
            data_nascimento: formData.data_nascimento || null,
            diagnostico: formData.diagnostico || null,
            consentimento_lgpd: true
          }])
          .select('id')
          .single()

        if (patientError) {
          throw patientError
        }

        patientId = newPatient.id
      }

      // Verificar se já existe inscrição
      const { data: existingRegistration } = await supabase
        .from('registrations')
        .select('id')
        .eq('patient_id', patientId)
        .eq('event_date_id', eventDateId)
        .single()

      if (existingRegistration) {
        toast.error('Você já está inscrito neste evento')
        return
      }

      // Criar inscrição
      const { error: registrationError } = await supabase
        .from('registrations')
        .insert([{
          patient_id: patientId,
          event_date_id: eventDateId,
          status: 'confirmed'
        }])

      if (registrationError) {
        throw registrationError
      }

      toast.success('Inscrição realizada com sucesso!')
      onSuccess()

    } catch (error: any) {
      console.error('Erro ao realizar inscrição:', error)
      
      if (error.message?.includes('CPF')) {
        toast.error('Já existe um cadastro com este CPF')
      } else if (error.message?.includes('email')) {
        toast.error('Já existe um cadastro com este email')
      } else {
        toast.error('Erro ao realizar inscrição. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!eventInfo) {
    return <div>Carregando informações do evento...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrição para o Evento</CardTitle>
        <div className="text-sm text-gray-600">
          <p><strong>{eventInfo.title}</strong></p>
          <p>📅 {new Date(eventInfo.date).toLocaleDateString('pt-BR')}</p>
          <p>⏰ {eventInfo.start_time}</p>
          <p>📍 {eventInfo.location}</p>
          <p>🏠 {eventInfo.address}</p>
          <p>🎫 Vagas disponíveis: {eventInfo.available_slots}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: cpfMask(e.target.value) })}
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: formatPhoneNumber(e.target.value) })}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div>
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="diagnostico">Diagnóstico ou Observações</Label>
            <Textarea
              id="diagnostico"
              value={formData.diagnostico}
              onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
              placeholder="Descreva sua condição ou observações relevantes"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || eventInfo.available_slots <= 0}
          >
            {loading ? 'Processando...' : 'Realizar Inscrição'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
