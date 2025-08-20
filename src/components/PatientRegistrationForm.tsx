
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cpfMask, validateCPF } from '@/utils/cpfUtils'

const patientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  birthdate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),  
  zip: z.string().min(8, 'CEP deve ter 8 dígitos'),
  terms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
  comments: z.string().optional()
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientRegistrationFormProps {
  eventDateId: string
  onSuccess: (patientName: string) => void
}

const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({ eventDateId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema)
  })

  const cpfValue = watch('cpf')

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = cpfMask(e.target.value)
    setValue('cpf', maskedValue)
  }

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('📋 Iniciando cadastro do paciente...', data.name)
      
      // 1. Criar o paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert({
          nome: data.name,
          email: data.email,
          telefone: data.phone,
          cpf: data.cpf.replace(/\D/g, ''),
          data_nascimento: data.birthdate,
          diagnostico: data.comments || null,
          endereco: data.address,
          cidade: data.city,
          estado: data.state,
          cep: data.zip,
          genero: data.gender
        })
        .select()
        .single()

      if (patientError) {
        console.error('❌ Erro ao criar paciente:', patientError)
        throw patientError
      }

      console.log('✅ Paciente criado:', patientData.id)

      // 2. Criar a inscrição
      const { data: registrationData, error: registrationError } = await supabase
        .from('registrations')
        .insert({
          patient_id: patientData.id,
          event_date_id: eventDateId,
          status: 'confirmed'
        })
        .select()
        .single()

      if (registrationError) {
        console.error('❌ Erro ao criar inscrição:', registrationError)
        throw registrationError
      }

      console.log('✅ Inscrição criada:', registrationData.id)
      
      toast.success('Inscrição realizada com sucesso!')
      onSuccess(data.name)
      
    } catch (error: any) {
      console.error('❌ Erro no cadastro:', error)
      toast.error('Erro ao realizar inscrição: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Digite o nome completo"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Digite o email"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(11) 99999-9999"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={cpfValue || ''}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
            </div>

            <div>
              <Label htmlFor="birthdate">Data de Nascimento *</Label>
              <Input
                id="birthdate"
                type="date"
                {...register('birthdate')}
              />
              {errors.birthdate && <p className="text-sm text-red-500">{errors.birthdate.message}</p>}
            </div>

            <div>
              <Label htmlFor="gender">Gênero *</Label>
              <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço Completo *</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Rua, número, bairro"
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Digite a cidade"
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
            </div>

            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="SP"
                maxLength={2}
              />
              {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
            </div>

            <div>
              <Label htmlFor="zip">CEP *</Label>
              <Input
                id="zip"
                {...register('zip')}
                placeholder="00000-000"
              />
              {errors.zip && <p className="text-sm text-red-500">{errors.zip.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Observações Médicas</Label>
            <Textarea
              id="comments"
              {...register('comments')}
              placeholder="Descreva alguma condição específica ou observação importante"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              onCheckedChange={(checked) => setValue('terms', checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm">
              Aceito os termos de uso e política de privacidade *
            </Label>
          </div>
          {errors.terms && <p className="text-sm text-red-500">{errors.terms.message}</p>}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Inscrição'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default PatientRegistrationForm
