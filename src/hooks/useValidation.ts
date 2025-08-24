/**
 * =====================================================
 * HOOKS DE VALIDAÇÃO REACT
 * =====================================================
 * Hooks para validação em tempo real em formulários React
 */

import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import type { 
  SanitizationOptions, 
  ValidationError,
  ValidationResult
} from "@/lib/validation/utils";
import { 
  sanitizeObject, 
  validateData,
  validatePartial
} from "@/lib/validation/utils";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Opções de configuração para o hook useValidation
 * 
 * @template T - Tipo dos dados sendo validados
 */
interface UseValidationOptions<T> {
  /** Schema Zod para validação dos dados */
  schema: z.ZodSchema<T>
  /** Dados iniciais do formulário */
  initialData?: Partial<T>
  /** Se deve validar automaticamente quando um campo muda */
  validateOnChange?: boolean
  /** Se deve validar quando um campo perde o foco */
  validateOnBlur?: boolean
  /** Se deve sanitizar os dados automaticamente */
  sanitize?: boolean
  /** Opções específicas de sanitização */
  sanitizationOptions?: SanitizationOptions
}

/**
 * Estado interno do hook de validação
 * 
 * @template T - Tipo dos dados sendo validados
 */
interface ValidationState<T> {
  /** Dados atuais do formulário */
  data: Partial<T>
  /** Lista de erros de validação */
  errors: ValidationError[]
  /** Se todos os dados são válidos */
  isValid: boolean
  /** Se está executando validação assíncrona */
  isValidating: boolean
  /** Campos que foram tocados pelo usuário */
  touchedFields: Set<string>
}

/**
 * Retorno do hook useValidation
 * 
 * @template T - Tipo dos dados sendo validados
 */
interface UseValidationReturn<T> {
  /** Dados atuais do formulário */
  data: Partial<T>
  /** Lista de erros de validação */
  errors: ValidationError[]
  /** Se todos os dados são válidos */
  isValid: boolean
  /** Se está executando validação assíncrona */
  isValidating: boolean
  /** Campos que foram tocados pelo usuário */
  touchedFields: Set<string>
  
  // Métodos de manipulação
  /** Define o valor de um campo específico */
  setValue: (field: keyof T, value: any) => void
  /** Define múltiplos dados de uma vez */
  setData: (data: Partial<T>) => void
  /** Executa validação completa dos dados */
  validate: () => ValidationResult<T>
  validateField: (field: keyof T) => void
  clearErrors: () => void
  clearFieldError: (field: keyof T) => void
  markFieldTouched: (field: keyof T) => void
  reset: (newData?: Partial<T>) => void
  
  // Helpers
  getFieldError: (field: keyof T) => string | undefined
  hasFieldError: (field: keyof T) => boolean
  isFieldTouched: (field: keyof T) => boolean
}

// ============================================================================
// HOOK PRINCIPAL DE VALIDAÇÃO
// ============================================================================

/**
 * Hook React para validação de formulários em tempo real
 * 
 * Fornece validação automática usando schemas Zod, com suporte a:
 * - Validação em tempo real (onChange/onBlur)
 * - Sanitização automática de dados
 * - Controle de estado de campos tocados
 * - Validação parcial e completa
 * - Gerenciamento de erros por campo
 * 
 * @template T - Tipo dos dados do formulário
 * @param options - Configurações do hook
 * @returns Objeto com dados, erros e métodos de controle
 * 
 * @example
 * ```typescript
 * const {
 *   data,
 *   errors,
 *   isValid,
 *   setValue,
 *   validate,
 *   getFieldError
 * } = useValidation({
 *   schema: PatientSchema,
 *   initialData: { nome: '', email: '' },
 *   validateOnChange: true
 * })
 * 
 * // Usar em um input
 * <input
 *   value={data.nome || ''}
 *   onChange={(e) => setValue('nome', e.target.value)}
 *   error={getFieldError('nome')}
 * />
 * ```
 */
export function useValidation<T>({
  schema,
  initialData = {},
  validateOnChange = true,
  validateOnBlur = true,
  sanitize = true,
  sanitizationOptions = {}
}: UseValidationOptions<T>): UseValidationReturn<T> {
  
  const [state, setState] = useState<ValidationState<T>>({
    data: initialData,
    errors: [],
    isValid: false,
    isValidating: false,
    touchedFields: new Set()
  });

  // Validar dados completos
  const validate = useCallback((): ValidationResult<T> => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    let dataToValidate = state.data;
    
    // Sanitizar se necessário
    if (sanitize && typeof dataToValidate === "object" && dataToValidate !== null) {
      dataToValidate = sanitizeObject(dataToValidate as Record<string, any>, sanitizationOptions);
    }
    
    const result = validateData(schema, dataToValidate);
    
    setState(prev => ({
      ...prev,
      errors: result.errors || [],
      isValid: result.success,
      isValidating: false,
      data: result.success ? result.data! : prev.data
    }));
    
    return result;
  }, [schema, state.data, sanitize, sanitizationOptions]);

  // Validar campo específico
  const validateField = useCallback((field: keyof T) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    // Criar schema parcial apenas para este campo
    const fieldSchema = schema.pick({ [field]: true } as any);
    const fieldData = { [field]: state.data[field] };
    
    let dataToValidate = fieldData;
    if (sanitize) {
      dataToValidate = sanitizeObject(fieldData as Record<string, any>, sanitizationOptions);
    }
    
    const result = validatePartial(fieldSchema, dataToValidate);
    
    setState(prev => {
      // Remover erros antigos do campo
      const filteredErrors = prev.errors.filter(error => error.field !== String(field));
      
      // Adicionar novos erros do campo
      const newErrors = result.errors || [];
      
      return {
        ...prev,
        errors: [...filteredErrors, ...newErrors],
        isValidating: false
      };
    });
  }, [schema, state.data, sanitize, sanitizationOptions]);

  // Definir valor de campo
  const setValue = useCallback((field: keyof T, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [field]: value };
      return {
        ...prev,
        data: newData
      };
    });
    
    // Validar em tempo real se habilitado
    if (validateOnChange) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateOnChange, validateField]);

  // Definir dados completos
  const setData = useCallback((newData: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...newData }
    }));
    
    if (validateOnChange) {
      setTimeout(validate, 0);
    }
  }, [validateOnChange, validate]);

  // Marcar campo como tocado
  const markFieldTouched = useCallback((field: keyof T) => {
    setState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, String(field)])
    }));
    
    if (validateOnBlur) {
      validateField(field);
    }
  }, [validateOnBlur, validateField]);

  // Limpar todos os erros
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
      isValid: false
    }));
  }, []);

  // Limpar erro de campo específico
  const clearFieldError = useCallback((field: keyof T) => {
    setState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.field !== String(field))
    }));
  }, []);

  // Resetar formulário
  const reset = useCallback((newData?: Partial<T>) => {
    setState({
      data: newData || initialData,
      errors: [],
      isValid: false,
      isValidating: false,
      touchedFields: new Set()
    });
  }, [initialData]);

  // Helpers
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const fieldErrors = state.errors.filter(error => error.field === String(field));
    return fieldErrors.length > 0 ? fieldErrors[0].message : undefined;
  }, [state.errors]);

  const hasFieldError = useCallback((field: keyof T): boolean => {
    return state.errors.some(error => error.field === String(field));
  }, [state.errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return state.touchedFields.has(String(field));
  }, [state.touchedFields]);

  return {
    data: state.data,
    errors: state.errors,
    isValid: state.isValid,
    isValidating: state.isValidating,
    touchedFields: state.touchedFields,
    
    setValue,
    setData,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    markFieldTouched,
    reset,
    
    getFieldError,
    hasFieldError,
    isFieldTouched
  };
}

// ============================================================================
// HOOK PARA VALIDAÇÃO DE FORMULÁRIO SIMPLES
// ============================================================================

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => void | Promise<void>
  initialData?: Partial<T>
}

export function useFormValidation<T>({
  schema,
  onSubmit,
  initialData = {}
}: UseFormValidationOptions<T>) {
  
  const validation = useValidation({
    schema,
    initialData,
    validateOnChange: false,
    validateOnBlur: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);
    
    try {
      const result = validation.validate();
      
      if (result.success && result.data) {
        await onSubmit(result.data);
      }
    } catch (error) {
      console.error("Erro no envio do formulário:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validation, onSubmit]);

  return {
    ...validation,
    isSubmitting,
    handleSubmit
  };
}

// ============================================================================
// HOOK PARA VALIDAÇÃO EM TEMPO REAL
// ============================================================================

export function useRealtimeValidation<T>(
  schema: z.ZodSchema<T>,
  data: Partial<T>,
  debounceMs = 300
) {
  const [validationResult, setValidationResult] = useState<ValidationResult<T> | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setIsValidating(true);
    
    const timeoutId = setTimeout(() => {
      const result = validatePartial(schema, data);
      setValidationResult(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [schema, data, debounceMs]);

  return {
    validationResult,
    isValidating,
    isValid: validationResult?.success || false,
    errors: validationResult?.errors || []
  };
}

// ============================================================================
// HOOK PARA VALIDAÇÃO DE CAMPO ÚNICO
// ============================================================================

export function useFieldValidation<T>(
  fieldSchema: z.ZodSchema<T>,
  initialValue?: T
) {
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [isTouched, setIsTouched] = useState(false);

  const validate = useCallback((newValue: T) => {
    const result = validateData(fieldSchema, newValue);
    
    if (result.success) {
      setError(undefined);
      return true;
    } else {
      setError(result.errors?.[0]?.message);
      return false;
    }
  }, [fieldSchema]);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (isTouched) {
      validate(newValue);
    }
  }, [isTouched, validate]);

  const handleBlur = useCallback(() => {
    setIsTouched(true);
    if (value !== undefined) {
      validate(value);
    }
  }, [value, validate]);

  return {
    value,
    error,
    isTouched,
    isValid: !error && isTouched,
    
    setValue: handleChange,
    onBlur: handleBlur,
    validate: () => value !== undefined ? validate(value) : false
  };
}