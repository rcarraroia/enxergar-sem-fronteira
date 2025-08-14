import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { supabase } from '@/integrations/supabase/client'
import { Checkbox } from "@/components/ui/checkbox"
import { usePatientTokens } from '@/hooks/usePatientTokens'

const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
  telefone: z.string().min(10, {
    message: "Telefone deve ter pelo menos 10 caracteres.",
  }),
  cpf: z.string().min(11, {
    message: "CPF deve ter pelo menos 11 caracteres.",
  }).max(11, {
    message: "CPF deve ter no máximo 11 caracteres.",
  }),
  data_nascimento: z.string().nullable(),
  consentimento_lgpd: z.boolean().refine((value) => value === true, {
    message: "Você precisa aceitar os termos de LGPD.",
  }),
})

interface PatientRegistrationFormProps {
  eventId: string
  onSuccess?: () => void
}

type FormData = z.infer<typeof formSchema>

export const PatientRegistrationForm = ({ eventId, onSuccess }: PatientRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      data_nascimento: null,
      consentimento_lgpd: false,
    },
  })

  const { generatePatientToken } = usePatientTokens()

  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true)
      console.log('📝 Iniciando cadastro do paciente...')

      // Gerar tags automaticamente
      const tags = ['inscrito-online', 'evento-' + eventId]

      // Inserir paciente no banco de dados
      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...values,
          tags: tags,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir paciente:', error)
        throw error
      }

      if (data) {
        // Gerar token de acesso para o paciente
        try {
          await generatePatientToken(data.id, eventId)
          console.log('🔗 Token de acesso gerado para o paciente')
        } catch (tokenError) {
          console.error('Erro ao gerar token de acesso:', tokenError)
          // Não bloqueia o cadastro se der erro no token
        }

        console.log('✅ Paciente cadastrado:', data.nome)
        toast.success(`Cadastro realizado com sucesso! Bem-vindo(a), ${data.nome}!`)
        
        // Reset form
        form.reset()
        
        // Call success callback
        onSuccess?.()
      }

    } catch (error) {
      console.error('❌ Erro no cadastro:', error)
      toast.error('Erro ao realizar cadastro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Digite seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seuemail@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="(11) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input type="number" placeholder="00000000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_nascimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Nascimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consentimento_lgpd"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Eu concordo com a LGPD</FormLabel>
                <FormDescription>
                  Você concorda em fornecer seus dados para o projeto.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>
    </Form>
  )
}
