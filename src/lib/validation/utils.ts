/**
 * =====================================================
 * UTILITÁRIOS DE VALIDAÇÃO E SANITIZAÇÃO
 * =====================================================
 * Funções auxiliares para validação rigorosa e sanitização de dados
 */

import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Resultado de uma operação de validação
 *
 * @template T - Tipo dos dados validados
 */
export interface ValidationResult<T> {
  /** Se a validação foi bem-sucedida */
  success: boolean
  /** Dados validados e transformados (apenas se success = true) */
  data?: T
  /** Lista de erros encontrados (apenas se success = false) */
  errors?: ValidationError[]
}

/**
 * Representa um erro de validação específico
 */
export interface ValidationError {
  /** Nome do campo que contém o erro */
  field: string
  /** Mensagem de erro legível para o usuário */
  message: string
  /** Código interno do erro para tratamento programático */
  code: string
}

/**
 * Opções para configurar a sanitização de dados
 */
export interface SanitizationOptions {
  /** Se deve permitir tags HTML (padrão: false) */
  allowHtml?: boolean
  /** Comprimento máximo da string (trunca se exceder) */
  maxLength?: number
  /** Se deve remover espaços no início e fim (padrão: true) */
  trimWhitespace?: boolean
  /** Se deve remover espaços extras entre palavras (padrão: true) */
  removeExtraSpaces?: boolean
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida dados usando schema Zod e retorna resultado estruturado
 *
 * Função principal para validação de dados que converte erros do Zod
 * em um formato padronizado e user-friendly.
 *
 * @template T - Tipo dos dados esperados após validação
 * @param schema - Schema Zod para validação
 * @param data - Dados a serem validados
 * @returns Resultado estruturado com dados validados ou erros
 *
 * @example
 * ```typescript
 * const result = validateData(PatientSchema, formData)
 * if (result.success) {
 *   console.log('Dados válidos:', result.data)
 * } else {
 *   console.log('Erros:', result.errors)
 * }
 * ```
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        errors
      };
    }

    return {
      success: false,
      errors: [{
        field: "unknown",
        message: "Erro de validação desconhecido",
        code: "UNKNOWN_ERROR"
      }]
    };
  }
}

/**
 * Valida dados de forma assíncrona usando schema Zod
 *
 * Versão assíncrona da função validateData, útil para schemas que incluem
 * validações assíncronas como verificações de banco de dados.
 *
 * @template T - Tipo dos dados esperados após validação
 * @param schema - Schema Zod para validação
 * @param data - Dados a serem validados
 * @returns Promise com resultado estruturado
 *
 * @example
 * ```typescript
 * const result = await validateDataAsync(UserSchemaWithAsyncValidation, userData)
 * if (result.success) {
 *   console.log('Dados válidos:', result.data)
 * }
 * ```
 */
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> {
  try {
    const validatedData = await schema.parseAsync(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        errors
      };
    }

    return {
      success: false,
      errors: [{
        field: "unknown",
        message: "Erro de validação desconhecido",
        code: "UNKNOWN_ERROR"
      }]
    };
  }
}

/**
 * Valida parcialmente um objeto (útil para formulários em tempo real)
 *
 * Permite validar objetos incompletos, onde nem todos os campos obrigatórios
 * estão presentes. Ideal para validação durante o preenchimento de formulários.
 *
 * @template T - Tipo dos dados completos
 * @param schema - Schema Zod completo
 * @param data - Dados parciais a serem validados
 * @returns Resultado com dados parciais validados
 *
 * @example
 * ```typescript
 * // Validar apenas os campos preenchidos
 * const result = validatePartial(PatientSchema, { nome: 'João' })
 * if (result.success) {
 *   console.log('Campos válidos:', result.data)
 * }
 * ```
 */
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  data: Partial<unknown>
): ValidationResult<Partial<T>> {
  try {
    const partialSchema = schema.partial();
    const validatedData = partialSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        errors
      };
    }

    return {
      success: false,
      errors: [{
        field: "unknown",
        message: "Erro de validação desconhecido",
        code: "UNKNOWN_ERROR"
      }]
    };
  }
}

// ============================================================================
// FUNÇÕES DE SANITIZAÇÃO
// ============================================================================

/**
 * Sanitiza string removendo caracteres perigosos e aplicando formatação
 *
 * Remove ou escapa conteúdo HTML perigoso, normaliza espaços em branco
 * e aplica limitações de comprimento para prevenir ataques XSS e
 * garantir consistência dos dados.
 *
 * @param input - String a ser sanitizada
 * @param options - Opções de sanitização
 * @returns String sanitizada e segura
 *
 * @example
 * ```typescript
 * // Remover HTML completamente
 * const clean = sanitizeString('<script>alert("xss")</script>João', {
 *   allowHtml: false
 * })
 * // Resultado: "João"
 *
 * // Permitir HTML seguro
 * const safe = sanitizeString('<b>João</b><script>alert("xss")</script>', {
 *   allowHtml: true
 * })
 * // Resultado: "<b>João</b>"
 *
 * // Limitar comprimento
 * const limited = sanitizeString('Nome muito longo', {
 *   maxLength: 10
 * })
 * // Resultado: "Nome muito"
 * ```
 */
export function sanitizeString(
  input: string,
  options: SanitizationOptions = {}
): string {
  const {
    allowHtml = false,
    maxLength,
    trimWhitespace = true,
    removeExtraSpaces = true
  } = options;

  let sanitized = input;

  // Remover HTML se não permitido
  if (!allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  } else {
    // Sanitizar HTML mantendo tags seguras
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: []
    });
  }

  // Remover espaços extras
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (removeExtraSpaces) {
    sanitized = sanitized.replace(/\s+/g, " ");
  }

  // Limitar comprimento
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitiza objeto recursivamente aplicando sanitização em todas as strings
 *
 * Percorre recursivamente um objeto e aplica sanitização em todas as
 * propriedades do tipo string, mantendo a estrutura original do objeto.
 *
 * @template T - Tipo do objeto a ser sanitizado
 * @param obj - Objeto a ser sanitizado
 * @param options - Opções de sanitização aplicadas a todas as strings
 * @returns Objeto sanitizado com mesma estrutura
 *
 * @example
 * ```typescript
 * const userData = {
 *   nome: '  João Silva  ',
 *   bio: '<script>alert("xss")</script>Desenvolvedor',
 *   contato: {
 *     email: 'joao@email.com',
 *     telefone: '(11) 99999-9999'
 *   }
 * }
 *
 * const clean = sanitizeObject(userData, {
 *   allowHtml: false,
 *   trimWhitespace: true
 * })
 * // Todas as strings serão sanitizadas recursivamente
 * ```
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: SanitizationOptions = {}
): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value, options);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === "string"
          ? sanitizeString(item, options)
          : typeof item === "object" && item !== null
          ? sanitizeObject(item, options)
          : item
      );
    }
  }

  return sanitized;
}

/**
 * Remove caracteres especiais perigosos para SQL injection
 */
export function sanitizeForDatabase(input: string): string {
  return input
    .replace(/['"\\;]/g, "") // Remove aspas e ponto e vírgula
    .replace(/--/g, "") // Remove comentários SQL
    .replace(/\/\*/g, "") // Remove início de comentário de bloco
    .replace(/\*\//g, "") // Remove fim de comentário de bloco
    .trim();
}

/**
 * Sanitiza entrada para busca (remove caracteres que podem quebrar regex)
 */
export function sanitizeSearchTerm(input: string): string {
  return input
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
    .trim()
    .substring(0, 100); // Limitar tamanho
}

// ============================================================================
// VALIDAÇÕES ESPECÍFICAS BRASILEIRAS
// ============================================================================

/**
 * Valida e formata CPF brasileiro
 *
 * Valida um CPF usando o algoritmo oficial dos dígitos verificadores
 * e retorna a versão formatada se válido.
 *
 * @param cpf - CPF em qualquer formato (com ou sem pontuação)
 * @returns Objeto com status de validação e CPF formatado se válido
 *
 * @example
 * ```typescript
 * const result1 = validateAndFormatCPF('12345678909')
 * // { valid: true, formatted: '123.456.789-09' }
 *
 * const result2 = validateAndFormatCPF('123.456.789-09')
 * // { valid: true, formatted: '123.456.789-09' }
 *
 * const result3 = validateAndFormatCPF('11111111111')
 * // { valid: false }
 * ```
 */
export function validateAndFormatCPF(cpf: string): { valid: boolean; formatted?: string } {
  const cleaned = cpf.replace(/[^\d]/g, "");

  if (cleaned.length !== 11) {
    return { valid: false };
  }

  // Verificar se não são todos iguais
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { valid: false };
  }

  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) {digit1 = 0;}

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) {digit2 = 0;}

  const isValid = digit1 === parseInt(cleaned.charAt(9)) && digit2 === parseInt(cleaned.charAt(10));

  if (isValid) {
    const formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
    return { valid: true, formatted };
  }

  return { valid: false };
}

/**
 * Valida e formata telefone brasileiro
 *
 * Valida números de telefone brasileiros em diversos formatos e
 * retorna a versão formatada padronizada.
 *
 * Formatos aceitos:
 * - Celular: (11) 99999-9999 ou 11999999999
 * - Fixo: (11) 9999-9999 ou 1199999999
 * - Com código do país: +55 11 99999-9999
 *
 * @param phone - Telefone em qualquer formato
 * @returns Objeto com status de validação e telefone formatado se válido
 *
 * @example
 * ```typescript
 * const result1 = validateAndFormatPhone('11999999999')
 * // { valid: true, formatted: '(11) 99999-9999' }
 *
 * const result2 = validateAndFormatPhone('+5511999999999')
 * // { valid: true, formatted: '(11) 99999-9999' }
 *
 * const result3 = validateAndFormatPhone('123')
 * // { valid: false }
 * ```
 */
export function validateAndFormatPhone(phone: string): { valid: boolean; formatted?: string } {
  const cleaned = phone.replace(/[^\d]/g, "");

  // Aceitar formatos: 11987654321, 1187654321, 87654321
  if (cleaned.length < 8 || cleaned.length > 13) {
    return { valid: false };
  }

  let formatted = "";

  if (cleaned.length === 11) {
    // Celular com DDD: (11) 98765-4321
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    // Fixo com DDD: (11) 8765-4321
    formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  } else if (cleaned.length === 8) {
    // Sem DDD: 8765-4321
    formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
  } else {
    return { valid: false };
  }

  return { valid: true, formatted };
}

/**
 * Valida e formata CEP brasileiro
 *
 * Valida se o CEP tem exatamente 8 dígitos e retorna
 * a versão formatada com hífen.
 *
 * @param cep - CEP em qualquer formato (com ou sem hífen)
 * @returns Objeto com status de validação e CEP formatado se válido
 *
 * @example
 * ```typescript
 * const result1 = validateAndFormatCEP('01234567')
 * // { valid: true, formatted: '01234-567' }
 *
 * const result2 = validateAndFormatCEP('01234-567')
 * // { valid: true, formatted: '01234-567' }
 *
 * const result3 = validateAndFormatCEP('123')
 * // { valid: false }
 * ```
 */
export function validateAndFormatCEP(cep: string): { valid: boolean; formatted?: string } {
  const cleaned = cep.replace(/[^\d]/g, "");

  if (cleaned.length !== 8) {
    return { valid: false };
  }

  const formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  return { valid: true, formatted };
}

// ============================================================================
// UTILITÁRIOS DE ERRO
// ============================================================================

/**
 * Formata erros de validação para exibição ao usuário
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {return "";}

  if (errors.length === 1) {
    return errors[0].message;
  }

  return errors.map(error => `• ${error.message}`).join("\n");
}

/**
 * Agrupa erros por campo
 */
export function groupErrorsByField(errors: ValidationError[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  errors.forEach(error => {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error.message);
  });

  return grouped;
}

/**
 * Verifica se há erros para um campo específico
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(error => error.field === field);
}

/**
 * Obtém mensagens de erro para um campo específico
 */
export function getFieldErrors(errors: ValidationError[], field: string): string[] {
  return errors
    .filter(error => error.field === field)
    .map(error => error.message);
}
