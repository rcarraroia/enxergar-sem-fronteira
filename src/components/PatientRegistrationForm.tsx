
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, MapPin, Clock, Users, AlertCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { formatTime, formatDate } from '@/utils/timeFormat'

const patientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  consentimento_lgpd: z.boolean().refine(val => val === true, 'Você deve aceitar os termos da LGPD'),
})

type PatientFormData = z.infer<typeof patientSchema>

interface EventInfo {
  id: string
  city: string
  title: string
  location: string
  address: string
  date: string
  start_time: string
  end_time: string
  available_slots: number
  total_slots: number
}

interface PatientRegistrationFormProps {
  eventId?: string
  eventDateId?: string
  onSuccess?: () => void
}

export const PatientRegistrationForm = ({ eventId, eventDateId, onSuccess }: PatientRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [loadingEventInfo, setLoadingEventInfo] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  console.log('🎯 PatientRegistrationForm iniciado com:', { eventId, eventDateId })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  })

  const consentimento = watch('consentimento_lgpd')

  // Buscar informações do evento se eventId e eventDateId forem fornecidos
  useEffect(() => {
    if (eventId && eventDateId) {
      fetchEventInfo()
    }
  }, [eventId, eventDateId])

  const fetchEventInfo = async () => {
    if (!eventId || !eventDateId) return

    try {
      setLoadingEventInfo(true)
      console.log('🔍 Buscando informações do evento:', { eventId, eventDateId })

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          city,
          title,
          location,
          address
        `)
        .eq('id', eventId)
        .single()

      if (eventError) {
        console.error('❌ Erro ao buscar evento:', eventError)
        return
      }

      const { data: eventDateData, error: eventDateError } = await supabase
        .from('event_dates')
        .select(`
          date,
          start_time,
          end_time,
          available_slots,
          total_slots
        `)
        .eq('id', eventDateId)
        .single()

      if (eventDateError) {
        console.error('❌ Erro ao buscar data do evento:', eventDateError)
        return
      }

      const combinedEventInfo: EventInfo = {
        ...eventData,
        ...eventDateData
      }

      setEventInfo(combinedEventInfo)
      console.log('✅ Informações do evento carregadas:', combinedEventInfo)
    } catch (error) {
      console.error('💥 Erro ao buscar informações do evento:', error)
    } finally {
      setLoadingEventInfo(false)
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true)
      setDuplicateError(null)
      console.log('📝 Iniciando cadastro de paciente:', data)

      // Inserir paciente
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          cpf: data.cpf,
          data_nascimento: data.data_nascimento,
          consentimento_lgpd: data.consentimento_lgpd,
        })
        .select()
        .single()

      if (patientError) {
        console.error('❌ Erro ao criar paciente:', patientError)
        
        // Tratar erros de duplicação
        if (patientError.message.includes('unique constraint') || 
            patientError.message.includes('unique_cpf') ||
            patientError.message.includes('Já existe um paciente cadastrado')) {
          
          if (patientError.message.includes('CPF')) {
            setDuplicateError('Este CPF já está cadastrado em nossa base de dados. Se você já se inscreveu anteriormente, verifique seu email para mais informações.')
          } else if (patientError.message.includes('email')) {
            setDuplicateError('Este email já está cadastrado em nossa base de dados. Se você já se inscreveu anteriormente, verifique seu email para mais informações.')
          } else {
            setDuplicateError('Já existe um cadastro com essas informações. Verifique seus dados ou entre em contato conosco.')
          }
          return
        }
        
        throw patientError
      }

      console.log('✅ Paciente criado:', patient)

      // Se há uma data específica de evento selecionada, criar inscrição
      if (eventDateId && patient) {
        console.log('📅 Criando inscrição para data do evento:', eventDateId)
        
        const { error: registrationError } = await supabase
          .from('registrations')
          .insert({
            patient_id: patient.id,
            event_date_id: eventDateId,
            status: 'confirmed',
          })

        if (registrationError) {
          console.error('❌ Erro ao criar inscrição:', registrationError)
          throw registrationError
        }

        console.log('✅ Inscrição criada com sucesso')

        // Gerar token de acesso único para o paciente
        const accessToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        
        const { error: tokenError } = await supabase
          .from('patient_access_tokens')
          .insert({
            patient_id: patient.id,
            token: accessToken,
            event_date_id: eventDateId,
          })

        if (tokenError) {
          console.error('⚠️ Erro ao criar token de acesso:', tokenError)
          // Não falhar a inscrição por causa do token
        } else {
          console.log('🔑 Token de acesso criado')
        }

        toast.success('Inscrição realizada com sucesso!')
      } else {
        console.log('📋 Cadastro sem evento específico (lista de espera)')
        toast.success('Cadastro realizado com sucesso!')
      }

      reset()
      setDuplicateError(null)
      onSuccess?.()
    } catch (error) {
      console.error('💥 Erro ao processar inscrição:', error)
      toast.error('Erro ao processar inscrição. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Evento */}
      {eventInfo && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="h-5 w-5" />
              Resumo do Evento
            </CardTitle>
            <CardDescription>
              Você está se inscrevendo para o seguinte evento:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-primary">{eventInfo.city}</h3>
                  <p className="text-sm text-muted-foreground">{eventInfo.title}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">{formatDate(eventInfo.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(eventInfo.start_time)} às {formatTime(eventInfo.end_time)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{eventInfo.location}</div>
                    <div className="text-muted-foreground">{eventInfo.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    {eventInfo.available_slots} de {eventInfo.total_slots} vagas disponíveis
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {eventInfo.available_slots > 0 ? 'Disponível' : 'Lotado'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Inscrição */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            {eventInfo ? 'Dados para Inscrição' : 'Inscrição de Paciente'}
          </CardTitle>
          <CardDescription>
            {eventInfo 
              ? 'Preencha seus dados para confirmar a inscrição no evento'
              : 'Preencha os dados para se inscrever no evento'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alerta de erro de duplicação */}
          {duplicateError && (
            <Alert className="mb-6 border-destructive/50 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {duplicateError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Seu nome completo"
                />
                {errors.nome && (
                  <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && (
                  <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && (
                  <p className="text-sm text-destructive mt-1">{errors.cpf.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  {...register('data_nascimento')}
                />
                {errors.data_nascimento && (
                  <p className="text-sm text-destructive mt-1">{errors.data_nascimento.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentimento_lgpd"
                checked={consentimento}
                onCheckedChange={(checked) => setValue('consentimento_lgpd', checked as boolean)}
              />
              <Label htmlFor="consentimento_lgpd" className="text-sm leading-5">
                Concordo com o tratamento dos meus dados pessoais de acordo com a{' '}
                <a href="/lgpd" className="text-primary hover:underline">
                  Lei Geral de Proteção de Dados (LGPD)
                </a>
                {' '}e autorizo o contato para informações sobre o evento.
              </Label>
            </div>
            {errors.consentimento_lgpd && (
              <p className="text-sm text-destructive">{errors.consentimento_lgpd.message}</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Processando...' : 'Confirmar Inscrição'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
