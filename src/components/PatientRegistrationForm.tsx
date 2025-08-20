
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres.',
  }),
  email: z.string().email({
    message: 'Email inválido.',
  }),
  phone: z.string().min(10, {
    message: 'Telefone deve ter pelo menos 10 dígitos.',
  }),
  birthdate: z.date({
    required_error: 'Data de nascimento é obrigatória.',
  }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gênero é obrigatório.',
  }),
  address: z.string().min(5, {
    message: 'Endereço deve ter pelo menos 5 caracteres.',
  }),
  city: z.string().min(2, {
    message: 'Cidade deve ter pelo menos 2 caracteres.',
  }),
  state: z.string().min(2, {
    message: 'Estado deve ter pelo menos 2 caracteres.',
  }),
  zip: z.string().min(8, {
    message: 'CEP deve ter pelo menos 8 caracteres.',
  }),
  terms: z.boolean().refine((value) => value === true, {
    message: 'Você deve aceitar os termos e condições.',
  }),
  comments: z.string().optional(),
});

interface PatientRegistrationFormProps {
  eventDateId?: string;
  onSuccess?: (patientName: string) => void;
}

const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({ 
  eventDateId, 
  onSuccess 
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  const dateId = eventDateId || searchParams.get('eventDateId');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      birthdate: new Date(),
      gender: 'other',
      address: '',
      city: '',
      state: '',
      zip: '',
      terms: false,
      comments: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('🚀 Dados do formulário:', values);

    try {
      // Primeiro, criar o paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            nome: values.name,
            email: values.email,
            telefone: values.phone,
            cpf: '000.000.000-00', // Placeholder - você pode adicionar campo CPF ao form
            data_nascimento: values.birthdate.toISOString().split('T')[0],
            diagnostico: values.comments || '',
            consentimento_lgpd: values.terms,
          },
        ])
        .select()
        .single();

      if (patientError) {
        console.error('❌ Erro ao criar paciente:', patientError);
        toast.error('Erro ao criar paciente: ' + patientError.message);
        return;
      }

      console.log('✅ Paciente criado com sucesso!', patientData);

      // Se temos um event_date_id, criar a inscrição
      if (dateId) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('registrations')
          .insert([
            {
              patient_id: patientData.id,
              event_date_id: dateId,
              status: 'confirmed',
            },
          ])
          .select();

        if (registrationError) {
          console.error('❌ Erro ao criar inscrição:', registrationError);
          toast.error('Erro ao criar inscrição: ' + registrationError.message);
          return;
        }

        console.log('✅ Inscrição criada com sucesso!', registrationData);
      }

      toast.success('Cadastro realizado com sucesso!');

      // Chamar callback se fornecido
      if (onSuccess) {
        onSuccess(values.name);
      } else {
        // Redirecionar para página de sucesso
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Erro ao processar cadastro:', error);
      toast.error('Erro ao processar cadastro: ' + (error as Error).message);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-semibold mb-6">Registro de Paciente</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
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
                  <Input placeholder="seuemail@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(99) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthdate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Nascimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, número, complemento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex space-x-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="w-1/4">
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem className="w-1/4">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="CEP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal pl-0">
                  Eu concordo com os <a href="#" className="text-primary underline underline-offset-2">Termos e Condições</a>
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentários Adicionais</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Alguma informação adicional?"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Enviar Registro</Button>
        </form>
      </Form>
    </div>
  );
};

export default PatientRegistrationForm;
