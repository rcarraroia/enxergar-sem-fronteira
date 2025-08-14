
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const patientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  consentimento_lgpd: z.boolean().refine(val => val === true, 'Você deve aceitar os termos da LGPD'),
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientRegistrationFormProps {
  eventId?: string
  eventDateId?: string
  onSuccess?: () => void
}

export const PatientRegistrationForm = ({ eventId, eventDateId, onSuccess }: PatientRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true)

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

      if (patientError) throw patientError

      // Se há uma data específica de evento selecionada, criar inscrição
      if (eventDateId && patient) {
        const { error: registrationError } = await supabase
          .from('registrations')
          .insert({
            patient_id: patient.id,
            event_date_id: eventDateId,
            status: 'confirmed',
          })

        if (registrationError) throw registrationError

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
          console.error('Erro ao criar token de acesso:', tokenError)
          // Não falhar a inscrição por causa do token
        }

        toast.success('Inscrição realizada com sucesso!')
      } else {
        toast.success('Cadastro realizado com sucesso!')
      }

      reset()
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao processar inscrição:', error)
      toast.error('Erro ao processar inscrição. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Inscrição de Paciente</CardTitle>
        <CardDescription>
          Preencha os dados para se inscrever no evento
        </CardDescription>
      </CardHeader>
      <CardContent>
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
  )
}
