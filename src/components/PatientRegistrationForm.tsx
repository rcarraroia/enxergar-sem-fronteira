
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { webhookService } from "@/services/WebhookService";
import { cpfMask, validateCPF } from "@/utils/cpfUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const patientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  cpf: z.string().refine(validateCPF, "CPF inválido"),
  birthdate: z.string().min(1, "Data de nascimento é obrigatória").refine((date) => {
    // Aceita formato AAAA-MM-DD (desktop) ou DD/MM/AAAA (mobile)
    const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})$/;
    return dateRegex.test(date);
  }, "Data deve estar no formato DD/MM/AAAA ou ser uma data válida"),
  terms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
  comments: z.string().optional()
});

type PatientFormData = z.infer<typeof patientSchema>

interface PatientRegistrationFormProps {
  eventDateId: string
  onSuccess: (patientName: string) => void
}

const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({ eventDateId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema)
  });

  const cpfValue = watch("cpf");
  const birthdateValue = watch("birthdate");

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = cpfMask(e.target.value);
    setValue("cpf", maskedValue);
  };

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é dígito

    // Aplica máscara DD/MM/AAAA
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + "/" + value.substring(5, 9);
    }

    setValue("birthdate", value);
  };

  const convertDateFormat = (dateStr: string) => {
    // Converte DD/MM/AAAA para AAAA-MM-DD (formato do input date)
    if (dateStr && dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      if (day && month && year && year.length === 4) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return dateStr;
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const onSubmit = async (data: PatientFormData) => {
    console.log("🚀 Iniciando processo de cadastro...", data);
    setIsSubmitting(true);

    try {
      const cleanCpf = data.cpf.replace(/\D/g, "");

      // 1. Verificar se CPF já existe
      console.log("🔍 Verificando se CPF já existe...", cleanCpf);
      const { data: existingPatient, error: checkError } = await supabase
        .from("patients")
        .select("id, nome, email")
        .eq("cpf", cleanCpf)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // Erro diferente de "não encontrado"
        console.error("❌ Erro ao verificar CPF:", checkError);
        throw new Error("Erro ao verificar dados. Tente novamente.");
      }

      if (existingPatient) {
        // CPF já existe - usar registro existente
        console.log("ℹ️ CPF já cadastrado, usando registro existente:", existingPatient.id);
        toast.info(`CPF já cadastrado para ${existingPatient.nome}. Usando dados existentes.`);

        // Pular para criação da inscrição com o paciente existente
        const { data: registrationData, error: registrationError } = await supabase
          .from("registrations")
          .insert({
            patient_id: existingPatient.id,
            event_date_id: eventDateId,
            status: "confirmed"
          })
          .select()
          .single();

        if (registrationError) {
          console.error("❌ Erro ao criar inscrição:", registrationError);
          throw registrationError;
        }

        console.log("✅ Inscrição criada para paciente existente:", registrationData.id);

        // Disparar webhook de confirmação (não-bloqueante)
        webhookService.sendConfirmationWebhook(registrationData.id).catch(error => {
          console.warn("⚠️ Webhook de confirmação falhou (não afeta inscrição):", error);
        });

        toast.success("Inscrição realizada com sucesso!");
        onSuccess(existingPatient.nome);
        return;
      }

      // 2. CPF não existe - criar novo paciente
      console.log("📋 Criando novo paciente...", data.name);
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          nome: data.name,
          email: data.email,
          telefone: data.phone,
          cpf: cleanCpf,
          data_nascimento: convertDateFormat(data.birthdate),
          consentimento_lgpd: data.terms
        })
        .select()
        .single();

      if (patientError) {
        console.error("❌ Erro ao criar paciente:", patientError);

        // Tratar erro de CPF duplicado especificamente
        if (patientError.code === "23505" && patientError.details?.includes("cpf")) {
          throw new Error("Este CPF já está cadastrado. Recarregue a página e tente novamente.");
        }

        throw patientError;
      }

      console.log("✅ Paciente criado:", patientData.id);

      // 3. Criar a inscrição
      const { data: registrationData, error: registrationError } = await supabase
        .from("registrations")
        .insert({
          patient_id: patientData.id,
          event_date_id: eventDateId,
          status: "confirmed"
        })
        .select()
        .single();

      if (registrationError) {
        console.error("❌ Erro ao criar inscrição:", registrationError);
        throw registrationError;
      }

      console.log("✅ Inscrição criada:", registrationData.id);

      // Disparar webhook de confirmação (não-bloqueante)
      webhookService.sendConfirmationWebhook(registrationData.id).catch(error => {
        console.warn("⚠️ Webhook de confirmação falhou (não afeta inscrição):", error);
      });

      toast.success("Inscrição realizada com sucesso!");
      onSuccess(data.name);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao realizar inscrição: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {...register("name")}
                placeholder="Digite o nome completo"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="Digite o email"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 99999-9999"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={cpfValue || ""}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
            </div>

            <div>
              <Label htmlFor="birthdate">Data de Nascimento *</Label>
              {isMobile() ? (
                <Input
                  id="birthdate"
                  type="text"
                  value={birthdateValue || ""}
                  onChange={handleBirthdateChange}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
              ) : (
                <Input
                  id="birthdate"
                  type="date"
                  {...register("birthdate")}
                />
              )}
              {errors.birthdate && <p className="text-sm text-red-500">{errors.birthdate.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Observações (opcional)</Label>
            <Textarea
              id="comments"
              {...register("comments")}
              placeholder="Alguma observação adicional..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              onCheckedChange={(checked) => setValue("terms", checked as boolean)}
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
            onClick={(e) => {
              console.log("🖱️ Botão clicado! Submetendo formulário...");
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
          >
            {isSubmitting ? "Processando..." : "Confirmar Inscrição"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PatientRegistrationForm;
