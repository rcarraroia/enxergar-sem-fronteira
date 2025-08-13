
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import { useEvents } from '@/hooks/useEvents'
import { toast } from 'sonner'
import { Loader2, UserPlus, Calendar, MapPin } from 'lucide-react'

interface Props {
  selectedEventId?: string | null
  onSuccess?: () => void
}

export const PatientRegistrationForm = ({ selectedEventId, onSuccess }: Props) => {
  const { data: events, isLoading: eventsLoading } = useEvents()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    diagnostico: '',
    event_id: selectedEventId || '',
    consentimento_lgpd: false
  })

  // Atualizar event_id quando selectedEventId mudar
  useEffect(() => {
    if (selectedEventId) {
      setFormData(prev => ({ ...prev, event_id: selectedEventId }))
    }
  }, [selectedEventId])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    return numbers.length === 11
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.consentimento_lgpd) {
      toast.error('É necessário aceitar os termos da LGPD')
      return
    }

    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido')
      return
    }

    if (!formData.event_id) {
      toast.error('Selecione um evento')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('📝 Iniciando cadastro do paciente...')

      // Buscar dados do evento selecionado para as tags
      const selectedEvent = events?.find(e => e.id === formData.event_id)
      
      const tags = {
        evento: selectedEvent?.title || 'evento_desconhecido',
        local: selectedEvent?.location || 'local_desconhecido'
      }

      console.log('🏷️ Tags para sincronização:', tags)

      // Inserir paciente (trigger automático irá adicionar na fila de sincronização)
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          nome: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ''),
          email: formData.email,
          telefone: formData.telefone,
          data_nascimento: formData.data_nascimento || null,
          diagnostico: formData.diagnostico || null,
          consentimento_lgpd: formData.consentimento_lgpd,
          tags: tags
        })
        .select()
        .single()

      if (patientError) {
        console.error('❌ Erro ao cadastrar paciente:', patientError)
        
        if (patientError.code === '23505') {
          toast.error('CPF já cadastrado no sistema')
        } else {
          toast.error('Erro ao cadastrar paciente')
        }
        return
      }

      console.log('✅ Paciente cadastrado:', patient.nome)

      // Verificar vagas disponíveis
      const { data: eventData } = await supabase
        .from('events')
        .select('available_slots')
        .eq('id', formData.event_id)
        .single()

      if (!eventData || eventData.available_slots <= 0) {
        toast.error('Evento não possui vagas disponíveis')
        return
      }

      // Registrar no evento
      const { error: registrationError } = await supabase
        .from('registrations')
        .insert({
          patient_id: patient.id,
          event_id: formData.event_id
        })

      if (registrationError) {
        console.error('❌ Erro ao registrar no evento:', registrationError)
        toast.error('Erro ao registrar no evento')
        return
      }

      // Atualizar vagas disponíveis
      await supabase
        .from('events')
        .update({ 
          available_slots: eventData.available_slots - 1,
          status: eventData.available_slots - 1 <= 0 ? 'full' : 'open'
        })
        .eq('id', formData.event_id)

      toast.success('🎉 Cadastro realizado com sucesso! Os dados serão sincronizados automaticamente.')

      // Limpar formulário
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        diagnostico: '',
        event_id: selectedEventId || '',
        consentimento_lgpd: false
      })

      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess()
      }

      // Disparar processamento da fila (opcional - pode ser executado por cron)
      try {
        await supabase.functions.invoke('process-valente-sync')
        console.log('🚀 Fila de sincronização processada')
      } catch (syncError) {
        console.warn('⚠️ Erro ao processar fila (será processada automaticamente):', syncError)
      }

    } catch (error) {
      console.error('❌ Erro geral:', error)
      toast.error('Erro interno do sistema')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (eventsLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando eventos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Cadastro de Paciente
        </CardTitle>
        <CardDescription>
          Preencha seus dados para se inscrever em um evento oftalmológico gratuito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="event_id">Evento * {selectedEventId && '(Pré-selecionado)'}</Label>
              <Select 
                value={formData.event_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_id: value }))}
                disabled={!!selectedEventId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {event.title}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location} - {new Date(event.date).toLocaleDateString('pt-BR')}
                          <span className="ml-2">({event.available_slots} vagas)</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="diagnostico">Diagnóstico ou Observações</Label>
            <Textarea
              id="diagnostico"
              value={formData.diagnostico}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
              placeholder="Descreva seu diagnóstico oftalmológico ou observações relevantes"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lgpd"
              checked={formData.consentimento_lgpd}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, consentimento_lgpd: checked === true }))
              }
            />
            <Label htmlFor="lgpd" className="text-sm">
              Concordo com o tratamento dos meus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD) e autorizo o compartilhamento com o Instituto Coração Valente para follow-up *
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Cadastrando...' : 'Realizar Cadastro'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
