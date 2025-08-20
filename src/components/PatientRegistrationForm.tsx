import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { CPFInput } from '@/components/ui/cpf-input'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Loader2, UserPlus, Calendar, MapPin, Clock } from 'lucide-react'
import { useRegistrations } from '@/hooks/useRegistrations'
import { formatTime, formatDate } from '@/utils/timeFormat'
import { validateCPF } from '@/utils/cpfUtils'

interface PatientRegistrationFormProps {
  eventId?: string
  eventDateId?: string
  onSuccess?: () => void
}

interface EventInfo {
  id: string
  title: string
  description: string
  location: string
  address: string
  city: string
  event_dates: Array<{
    id: string
    date: string
    start_time: string
    end_time: string
    available_slots: number
    total_slots: number
  }>
}

const fetchEventInfo = async (id: string): Promise<EventInfo | null> => {
  if (!id) return null
  
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        address,
        city,
        event_dates (
          id,
          date,
          start_time,
          end_time,
          available_slots,
          total_slots
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar informações do evento:', error)
    toast.error('Erro ao carregar informações do evento')
    return null
  }
}

export const PatientRegistrationForm = ({ eventId, eventDateId, onSuccess }: PatientRegistrationFormProps) => {
  const { createRegistration } = useRegistrations()
  const [isLoading, setIsLoading] = useState(false)
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    current_medications: '',
    allergies: '',
    has_previous_eye_surgery: false,
    wears_glasses: false,
    main_complaint: '',
    accepts_terms: false,
    accepts_privacy: false
  })

  useEffect(() => {
    if (eventId) {
      setIsLoadingEvent(true)
      fetchEventInfo(eventId)
        .then(setEventInfo)
        .finally(() => setIsLoadingEvent(false))
    }
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.accepts_terms || !formData.accepts_privacy) {
      toast.error('Você deve aceitar os termos de uso e política de privacidade')
      return
    }

    if (!validateCPF(formData.cpf)) {
      toast.error('CPF inválido')
      return
    }

    if (!eventDateId && eventInfo?.event_dates.length === 1) {
      // Se não foi especificado eventDateId mas há apenas uma data, usar essa
      const singleEventDateId = eventInfo.event_dates[0].id
      await submitRegistration(singleEventDateId)
    } else if (eventDateId) {
      await submitRegistration(eventDateId)
    } else {
      toast.error('Data do evento não especificada')
      return
    }
  }

  const submitRegistration = async (dateId: string) => {
    setIsLoading(true)
    try {
      await createRegistration.mutateAsync({
        ...formData,
        event_date_id: dateId
      })
      
      toast.success('Cadastro realizado com sucesso!')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Erro ao realizar cadastro:', error)
      toast.error('Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingEvent) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando informações do evento...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedEventDate = eventInfo?.event_dates.find(ed => ed.id === eventDateId) || 
                           (eventInfo?.event_dates.length === 1 ? eventInfo.event_dates[0] : null)

  return (
    <div className="space-y-6">
      {/* Informações do Evento */}
      {eventInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {eventInfo.title}
            </CardTitle>
            <CardDescription>{eventInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{eventInfo.location}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {eventInfo.address}, {eventInfo.city}
            </div>
            
            {selectedEventDate && (
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold">Data e Horário:</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{formatDate(selectedEventDate.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(selectedEventDate.start_time)} às {formatTime(selectedEventDate.end_time)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedEventDate.available_slots} vagas disponíveis
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulário de Cadastro */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastro do Paciente
          </CardTitle>
          <CardDescription>
            Preencha seus dados para se cadastrar no evento oftalmológico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <CPFInput
                    value={formData.cpf}
                    onChange={(value) => setFormData(prev => ({ ...prev, cpf: value }))}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="birth_date">Data de Nascimento *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gênero *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Endereço</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip_code">CEP *</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                      placeholder="00000-000"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contato de Emergência */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contato de Emergência</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Nome do Contato *</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">Telefone do Contato *</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Informações Médicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informações Médicas</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medical_history">Histórico Médico</Label>
                  <Textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
                    placeholder="Descreva seu histórico médico relevante..."
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="current_medications">Medicações Atuais</Label>
                  <Textarea
                    id="current_medications"
                    value={formData.current_medications}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_medications: e.target.value }))}
                    placeholder="Liste os medicamentos que você usa atualmente..."
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="Liste suas alergias conhecidas..."
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_previous_eye_surgery"
                      checked={formData.has_previous_eye_surgery}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, has_previous_eye_surgery: !!checked }))
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="has_previous_eye_surgery">
                      Já fez cirurgia nos olhos?
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wears_glasses"
                      checked={formData.wears_glasses}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, wears_glasses: !!checked }))
                      }
                      disabled={isLoading}
                    />
                    <Label htmlFor="wears_glasses">
                      Usa óculos ou lentes de contato?
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="main_complaint">Queixa Principal</Label>
                  <Textarea
                    id="main_complaint"
                    value={formData.main_complaint}
                    onChange={(e) => setFormData(prev => ({ ...prev, main_complaint: e.target.value }))}
                    placeholder="Descreva o motivo principal da sua consulta..."
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Termos e Condições */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Termos e Condições</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accepts_terms"
                    checked={formData.accepts_terms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, accepts_terms: !!checked }))
                    }
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <Label htmlFor="accepts_terms" className="text-sm leading-relaxed">
                    Aceito os{' '}
                    <a href="/terms-of-use" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e concordo com as condições do atendimento.
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accepts_privacy"
                    checked={formData.accepts_privacy}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, accepts_privacy: !!checked }))
                    }
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <Label htmlFor="accepts_privacy" className="text-sm leading-relaxed">
                    Aceito a{' '}
                    <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>{' '}
                    e autorizo o tratamento dos meus dados pessoais.
                  </Label>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={isLoading || !formData.accepts_terms || !formData.accepts_privacy}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Realizando Cadastro...' : 'Realizar Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
