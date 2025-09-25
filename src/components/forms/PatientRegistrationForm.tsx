/**
 * =====================================================
 * FORMULÁRIO DE CADASTRO DE PACIENTE COM VALIDAÇÃO
 * =====================================================
 * Exemplo de uso completo do sistema de validação
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CPFInput,
  EmailInput,
  PhoneInput,
  ValidatedForm,
  ValidatedInput,
  ValidatedSelect
} from "@/components/forms/ValidatedInput";
import { useFormValidation } from "@/hooks/useValidation";
import { type Patient, PatientSchema } from "@/lib/validation/schemas";
import { toast } from "sonner";
import { FileText, MapPin, Phone, User } from "lucide-react";
import { 
  ErrorDisplay, 
  useFormErrorHandler
} from "@/lib/errors";

// Estados brasileiros
const ESTADOS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];

/**
 * Props para o componente PatientRegistrationForm
 * 
 * @interface PatientRegistrationFormProps
 */
interface PatientRegistrationFormProps {
  /** Dados iniciais para pré-preencher o formulário (modo edição) */
  initialData?: Partial<Patient>
  /** Callback chamado quando o formulário é submetido com dados válidos */
  onSubmit: (data: Patient) => Promise<void>
  /** Callback opcional chamado quando o usuário cancela */
  onCancel?: () => void
  /** Se está em modo de edição (altera textos e comportamento) */
  isEditing?: boolean
}

/**
 * Formulário completo de cadastro/edição de pacientes
 * 
 * Componente que implementa um formulário completo para cadastro e edição de pacientes,
 * com validação rigorosa, tratamento de erros integrado e experiência de usuário otimizada.
 * 
 * Características:
 * - Validação em tempo real usando Zod schemas
 * - Tratamento de erros com mensagens user-friendly
 * - Formatação automática de CPF, telefone e CEP
 * - Organização em seções lógicas
 * - Suporte a modo de edição
 * - Integração com sistema de erros global
 * 
 * @component
 * @example
 * ```tsx
 * // Modo de criação
 * <PatientRegistrationForm
 *   onSubmit={async (data) => {
 *     const result = await createPatient(data)
 *     if (result.success) {
 *       navigate('/patients')
 *     }
 *   }}
 *   onCancel={() => navigate('/patients')}
 * />
 * 
 * // Modo de edição
 * <PatientRegistrationForm
 *   initialData={existingPatient}
 *   isEditing={true}
 *   onSubmit={async (data) => {
 *     const result = await updatePatient(patientId, data)
 *     if (result.success) {
 *       navigate('/patients')
 *     }
 *   }}
 * />
 * ```
 */
export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  const {
    data,
    errors,
    isValid,
    isSubmitting,
    setValue,
    getFieldError,
    handleSubmit
  } = useFormValidation({
    schema: PatientSchema,
    initialData,
    onSubmit: handleFormSubmit
  });

  const { 
    handleFormError, 
    generalError, 
    clearGeneralError 
  } = useFormErrorHandler();

  // Integrar tratamento de erros com o sistema de validação
  const handleFormSubmit = async (validatedData: Patient) => {
    try {
      clearGeneralError();
      await onSubmit(validatedData);
      toast.success(
        isEditing 
          ? "Paciente atualizado com sucesso!" 
          : "Paciente cadastrado com sucesso!"
      );
    } catch (error) {
      await handleFormError(error as Error);
      throw error;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {isEditing ? "Editar Paciente" : "Cadastro de Paciente"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ValidatedForm onSubmit={handleSubmit} isSubmitting={isSubmitting}>
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                label="Nome Completo"
                placeholder="Digite o nome completo"
                required
                value={data.nome || ""}
                onChange={(value) => setValue("nome", value)}
                error={getFieldError("nome")}
                helperText="Nome como aparece no documento"
              />
              
              <ValidatedInput
                label="Data de Nascimento"
                type="date"
                required
                value={data.data_nascimento || ""}
                onChange={(value) => setValue("data_nascimento", value)}
                error={getFieldError("data_nascimento")}
              />
            </div>
            
            <CPFInput
              label="CPF"
              value={data.cpf || ""}
              onChange={(value) => setValue("cpf", value)}
              error={getFieldError("cpf")}
              helperText="Opcional - usado apenas para identificação"
            />
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EmailInput
                label="Email"
                required
                value={data.email || ""}
                onChange={(value) => setValue("email", value)}
                error={getFieldError("email")}
                helperText="Usado para confirmações e lembretes"
              />
              
              <PhoneInput
                label="Telefone"
                required
                value={data.telefone || ""}
                onChange={(value) => setValue("telefone", value)}
                error={getFieldError("telefone")}
                helperText="WhatsApp preferencial"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </h3>
            
            <ValidatedInput
              label="Endereço Completo"
              placeholder="Rua, número, bairro"
              value={data.endereco || ""}
              onChange={(value) => setValue("endereco", value)}
              error={getFieldError("endereco")}
              helperText="Opcional - para localização de eventos próximos"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ValidatedInput
                label="Cidade"
                placeholder="Nome da cidade"
                value={data.cidade || ""}
                onChange={(value) => setValue("cidade", value)}
                error={getFieldError("cidade")}
              />
              
              <ValidatedSelect
                label="Estado"
                placeholder="Selecione o estado"
                value={data.estado || ""}
                onChange={(value) => setValue("estado", value)}
                error={getFieldError("estado")}
                options={ESTADOS}
              />
              
              <ValidatedInput
                label="CEP"
                placeholder="00000-000"
                value={data.cep || ""}
                onChange={(value) => setValue("cep", value)}
                error={getFieldError("cep")}
              />
            </div>
          </div>

          {/* Informações Médicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações Médicas
            </h3>
            
            <ValidatedInput
              label="Diagnóstico"
              placeholder="Descreva o diagnóstico ou condição"
              value={data.diagnostico || ""}
              onChange={(value) => setValue("diagnostico", value)}
              error={getFieldError("diagnostico")}
              helperText="Opcional - ajuda na organização dos atendimentos"
              maxLength={500}
            />
          </div>

          {/* Erros Gerais */}
          {generalError && (
            <ErrorDisplay
              error={generalError}
              onDismiss={clearGeneralError}
              variant="alert"
            />
          )}
          
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Corrija os seguintes erros:</strong>
                <ul className="list-disc list-inside mt-2">
                  {errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </ValidatedForm>
      </CardContent>
    </Card>
  );
};

export default PatientRegistrationForm;