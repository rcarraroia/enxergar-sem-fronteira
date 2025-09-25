/**
 * =====================================================
 * COMPONENTES DE FORMULÁRIO COM VALIDAÇÃO
 * =====================================================
 * Componentes React com validação integrada usando Zod
 */

import React, { forwardRef, useState } from "react";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFieldValidation } from "@/hooks/useValidation";
import { 
  sanitizeString, 
  validateAndFormatCEP, 
  validateAndFormatCPF,
  validateAndFormatPhone 
} from "@/lib/validation/utils";
import { 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props base para todos os componentes de input validados
 * 
 * @interface BaseValidatedInputProps
 */
interface BaseValidatedInputProps {
  /** Rótulo do campo */
  label?: string
  /** Texto de placeholder */
  placeholder?: string
  /** Se o campo é obrigatório */
  required?: boolean
  /** Se o campo está desabilitado */
  disabled?: boolean
  /** Classes CSS adicionais */
  className?: string
  /** Mensagem de erro a ser exibida */
  error?: string
  /** Se deve mostrar indicador de sucesso */
  success?: boolean
  /** Texto de ajuda abaixo do campo */
  helperText?: string
  showValidationIcon?: boolean
}

/**
 * Props para o componente ValidatedInput
 * 
 * @interface ValidatedInputProps
 * @extends BaseValidatedInputProps
 */
interface ValidatedInputProps extends BaseValidatedInputProps {
  /** Tipo do input HTML */
  type?: "text" | "email" | "tel" | "password" | "number" | "date" | "time"
  /** Valor atual do campo */
  value?: string
  /** Callback chamado quando o valor muda */
  onChange?: (value: string) => void
  /** Callback chamado quando o campo perde o foco */
  onBlur?: () => void
  /** Schema Zod para validação */
  schema?: z.ZodSchema<string>
  /** Formatação automática do valor */
  autoFormat?: "cpf" | "phone" | "cep"
  /** Número máximo de caracteres */
  maxLength?: number
}

/**
 * Props para o componente ValidatedTextarea
 * 
 * @interface ValidatedTextareaProps
 * @extends BaseValidatedInputProps
 */
interface ValidatedTextareaProps extends BaseValidatedInputProps {
  /** Valor atual do campo */
  value?: string
  /** Callback chamado quando o valor muda */
  onChange?: (value: string) => void
  /** Callback chamado quando o campo perde o foco */
  onBlur?: () => void
  /** Schema Zod para validação */
  schema?: z.ZodSchema<string>
  /** Número de linhas visíveis */
  rows?: number
  /** Número máximo de caracteres */
  maxLength?: number
}

/**
 * Props para o componente ValidatedSelect
 * 
 * @interface ValidatedSelectProps
 * @extends BaseValidatedInputProps
 */
interface ValidatedSelectProps extends BaseValidatedInputProps {
  /** Valor atual selecionado */
  value?: string
  /** Callback chamado quando a seleção muda */
  onChange?: (value: string) => void
  /** Callback chamado quando o campo perde o foco */
  onBlur?: () => void
  /** Schema Zod para validação */
  schema?: z.ZodSchema<string>
  /** Lista de opções disponíveis */
  options: Array<{ value: string; label: string }>
  /** Texto mostrado quando nenhuma opção está selecionada */
  placeholder?: string
}

// ============================================================================
// COMPONENTE DE INPUT VALIDADO
// ============================================================================

/**
 * Componente de input com validação integrada
 * 
 * Fornece um input HTML com validação automática, formatação e indicadores visuais.
 * Suporta diferentes tipos de input e formatação automática para CPF, telefone e CEP.
 * 
 * @component
 * @example
 * ```tsx
 * <ValidatedInput
 *   label="Nome completo"
 *   value={nome}
 *   onChange={setNome}
 *   required
 *   error={errors.nome}
 *   helperText="Digite seu nome completo"
 * />
 * 
 * <ValidatedInput
 *   label="CPF"
 *   value={cpf}
 *   onChange={setCpf}
 *   autoFormat="cpf"
 *   schema={CPFSchema}
 * />
 * ```
 */
export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    type = "text",
    label,
    placeholder,
    required = false,
    disabled = false,
    className,
    error: externalError,
    success = false,
    helperText,
    showValidationIcon = true,
    value = "",
    onChange,
    onBlur,
    schema,
    autoFormat,
    maxLength,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [showPassword, setShowPassword] = useState(false);
    
    // Usar validação interna se schema fornecido
    const fieldValidation = schema ? useFieldValidation(schema, value) : null;
    
    const currentValue = fieldValidation?.value ?? internalValue;
    const currentError = externalError || fieldValidation?.error;
    const isValid = success || (fieldValidation?.isValid && !currentError);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Aplicar formatação automática
      if (autoFormat && newValue) {
        switch (autoFormat) {
          case "cpf":
            const cpfResult = validateAndFormatCPF(newValue);
            if (cpfResult.valid && cpfResult.formatted) {
              newValue = cpfResult.formatted;
            }
            break;
          case "phone":
            const phoneResult = validateAndFormatPhone(newValue);
            if (phoneResult.valid && phoneResult.formatted) {
              newValue = phoneResult.formatted;
            }
            break;
          case "cep":
            const cepResult = validateAndFormatCEP(newValue);
            if (cepResult.valid && cepResult.formatted) {
              newValue = cepResult.formatted;
            }
            break;
        }
      }
      
      // Sanitizar entrada
      newValue = sanitizeString(newValue, { 
        allowHtml: false, 
        maxLength,
        trimWhitespace: false // Não trim durante digitação
      });
      
      // Atualizar valores
      if (fieldValidation) {
        fieldValidation.setValue(newValue);
      } else {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue);
    };

    const handleBlur = () => {
      fieldValidation?.onBlur();
      onBlur?.();
    };

    const getValidationIcon = () => {
      if (!showValidationIcon) {return null;}
      
      if (currentError) {
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      }
      
      if (isValid && currentValue) {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
      
      return null;
    };

    const inputClassName = cn(
      "pr-10", // Espaço para ícone
      currentError && "border-red-500 focus:border-red-500",
      isValid && currentValue && "border-green-500 focus:border-green-500",
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Input
            ref={ref}
            type={type === "password" && showPassword ? "text" : type}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            maxLength={maxLength}
            {...props}
          />
          
          {/* Ícone de validação */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            {getValidationIcon()}
          </div>
        </div>
        
        {/* Mensagens de erro/ajuda */}
        {currentError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {currentError}
            </AlertDescription>
          </Alert>
        )}
        
        {helperText && !currentError && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
        
        {maxLength && (
          <p className="text-xs text-gray-500 text-right">
            {currentValue.length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

// ============================================================================
// COMPONENTE DE TEXTAREA VALIDADO
// ============================================================================

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({
    label,
    placeholder,
    required = false,
    disabled = false,
    className,
    error: externalError,
    success = false,
    helperText,
    showValidationIcon = true,
    value = "",
    onChange,
    onBlur,
    schema,
    rows = 3,
    maxLength,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    
    const fieldValidation = schema ? useFieldValidation(schema, value) : null;
    
    const currentValue = fieldValidation?.value ?? internalValue;
    const currentError = externalError || fieldValidation?.error;
    const isValid = success || (fieldValidation?.isValid && !currentError);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value;
      
      // Sanitizar entrada
      newValue = sanitizeString(newValue, { 
        allowHtml: false, 
        maxLength,
        trimWhitespace: false
      });
      
      if (fieldValidation) {
        fieldValidation.setValue(newValue);
      } else {
        setInternalValue(newValue);
      }
      
      onChange?.(newValue);
    };

    const handleBlur = () => {
      fieldValidation?.onBlur();
      onBlur?.();
    };

    const textareaClassName = cn(
      currentError && "border-red-500 focus:border-red-500",
      isValid && currentValue && "border-green-500 focus:border-green-500",
      className
    );

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Textarea
            ref={ref}
            value={currentValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={textareaClassName}
            rows={rows}
            maxLength={maxLength}
            {...props}
          />
          
          {showValidationIcon && (
            <div className="absolute right-3 top-3">
              {currentError && <AlertCircle className="h-4 w-4 text-red-500" />}
              {isValid && currentValue && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>
        
        {currentError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {currentError}
            </AlertDescription>
          </Alert>
        )}
        
        {helperText && !currentError && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
        
        {maxLength && (
          <p className="text-xs text-gray-500 text-right">
            {currentValue.length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";

// ============================================================================
// COMPONENTE DE SELECT VALIDADO
// ============================================================================

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  placeholder = "Selecione uma opção",
  required = false,
  disabled = false,
  className,
  error: externalError,
  success = false,
  helperText,
  showValidationIcon = true,
  value = "",
  onChange,
  onBlur,
  schema,
  options
}) => {
  const fieldValidation = schema ? useFieldValidation(schema, value) : null;
  
  const currentValue = fieldValidation?.value ?? value;
  const currentError = externalError || fieldValidation?.error;
  const isValid = success || (fieldValidation?.isValid && !currentError);

  const handleValueChange = (newValue: string) => {
    if (fieldValidation) {
      fieldValidation.setValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Select
          value={currentValue}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger 
            className={cn(
              currentError && "border-red-500 focus:border-red-500",
              isValid && currentValue && "border-green-500 focus:border-green-500",
              className
            )}
            onBlur={onBlur}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {showValidationIcon && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            {currentError && <AlertCircle className="h-4 w-4 text-red-500" />}
            {isValid && currentValue && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        )}
      </div>
      
      {currentError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {currentError}
          </AlertDescription>
        </Alert>
      )}
      
      {helperText && !currentError && (
        <p className="text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE DE FORMULÁRIO VALIDADO
// ============================================================================

interface ValidatedFormProps {
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  isSubmitting?: boolean
  className?: string
}

export const ValidatedForm: React.FC<ValidatedFormProps> = ({
  children,
  onSubmit,
  isSubmitting = false,
  className
}) => {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)}>
      {children}
      {isSubmitting && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Processando...</span>
        </div>
      )}
    </form>
  );
};

// ============================================================================
// COMPONENTES ESPECÍFICOS PRÉ-CONFIGURADOS
// ============================================================================

// Input de CPF
export const CPFInput: React.FC<Omit<ValidatedInputProps, "autoFormat" | "type">> = (props) => (
  <ValidatedInput
    {...props}
    type="text"
    autoFormat="cpf"
    placeholder="000.000.000-00"
    maxLength={14}
  />
);

// Input de telefone
export const PhoneInput: React.FC<Omit<ValidatedInputProps, "autoFormat" | "type">> = (props) => (
  <ValidatedInput
    {...props}
    type="tel"
    autoFormat="phone"
    placeholder="(11) 99999-9999"
    maxLength={15}
  />
);

// Input de CEP
export const CEPInput: React.FC<Omit<ValidatedInputProps, "autoFormat" | "type">> = (props) => (
  <ValidatedInput
    {...props}
    type="text"
    autoFormat="cep"
    placeholder="00000-000"
    maxLength={9}
  />
);

// Input de email
export const EmailInput: React.FC<Omit<ValidatedInputProps, "type">> = (props) => (
  <ValidatedInput
    {...props}
    type="email"
    placeholder="seu@email.com"
  />
);

// Input de senha
export const PasswordInput: React.FC<Omit<ValidatedInputProps, "type">> = (props) => (
  <ValidatedInput
    {...props}
    type="password"
    placeholder="••••••••"
  />
);