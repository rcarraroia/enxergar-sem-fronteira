/**
 * Factory para Criação de Erros Estruturados
 *
 * Fornece funções utilitárias para criar erros estruturados
 * de forma consistente em toda a aplicação.
 */

import type {
    AppError,
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    DatabaseError,
    ErrorSeverity,
    NetworkError,
    ValidationError
} from "./types";
import {
    ERROR_CODES,
    ERROR_MESSAGES
} from "./types";

// ============================================================================
// FACTORY PRINCIPAL
// ============================================================================

/**
 * Cria um erro estruturado básico
 */
export function createError(
  code: string,
  message?: string,
  options: Partial<AppError> = {}
): AppError {
  const userMessage = message || ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || message || "Erro desconhecido";

  return {
    code,
    message: message || userMessage,
    userMessage,
    severity: options.severity || "medium",
    category: options.category || "system",
    timestamp: new Date(),
    actionable: options.actionable ?? false,
    retryable: options.retryable ?? false,
    context: options.context,
    originalError: options.originalError,
    stack: process.env.NODE_ENV === "development" ? new Error().stack : undefined,
    ...options
  };
}

// ============================================================================
// FACTORIES ESPECÍFICOS POR CATEGORIA
// ============================================================================

/**
 * Cria erro de validação
 */
export function createValidationError(
  message: string,
  field?: string,
  value?: any,
  constraint?: string
): ValidationError {
  return {
    ...createError(ERROR_CODES.VALIDATION_FAILED, message, {
      category: "validation",
      severity: "medium",
      actionable: true,
      retryable: false
    }),
    category: "validation",
    field,
    value,
    constraint
  };
}

/**
 * Cria erro de campo obrigatório
 */
export function createRequiredFieldError(field: string): ValidationError {
  return createValidationError(
    `O campo "${field}" é obrigatório`,
    field,
    undefined,
    "required"
  );
}

/**
 * Cria erro de formato inválido
 */
export function createInvalidFormatError(
  field: string,
  expectedFormat: string,
  value?: any
): ValidationError {
  return createValidationError(
    `O campo "${field}" deve estar no formato: ${expectedFormat}`,
    field,
    value,
    "format"
  );
}

/**
 * Cria erro de autenticação
 */
export function createAuthenticationError(
  reason: AuthenticationError["reason"] = "invalid_credentials",
  authMethod?: string
): AuthenticationError {
  const messages = {
    invalid_credentials: "Credenciais inválidas",
    expired_token: "Sessão expirada. Faça login novamente",
    missing_token: "Token de acesso não fornecido",
    invalid_token: "Token de acesso inválido"
  };

  return {
    ...createError(ERROR_CODES.INVALID_CREDENTIALS, messages[reason], {
      category: "authentication",
      severity: "high",
      actionable: true,
      retryable: reason === "expired_token"
    }),
    category: "authentication",
    authMethod,
    reason
  };
}

/**
 * Cria erro de autorização
 */
export function createAuthorizationError(
  resource?: string,
  action?: string,
  requiredRole?: string,
  userRole?: string
): AuthorizationError {
  const message = resource && action
    ? `Você não tem permissão para ${action} em ${resource}`
    : "Acesso negado";

  return {
    ...createError(ERROR_CODES.ACCESS_DENIED, message, {
      category: "authorization",
      severity: "high",
      actionable: false,
      retryable: false
    }),
    category: "authorization",
    requiredRole,
    userRole,
    resource,
    action
  };
}

/**
 * Cria erro de rede
 */
export function createNetworkError(
  statusCode?: number,
  endpoint?: string,
  method?: string,
  timeout = false
): NetworkError {
  let message = "Erro de conexão";
  let severity: ErrorSeverity = "medium";
  let retryable = true;

  if (timeout) {
    message = "A operação demorou muito para responder";
    severity = "medium";
  } else if (statusCode) {
    if (statusCode >= 500) {
      message = "Erro interno do servidor";
      severity = "high";
    } else if (statusCode >= 400) {
      message = "Erro na requisição";
      severity = "medium";
      retryable = false;
    }
  }

  return {
    ...createError(ERROR_CODES.NETWORK_ERROR, message, {
      category: "network",
      severity,
      actionable: true,
      retryable
    }),
    category: "network",
    statusCode,
    endpoint,
    method,
    timeout
  };
}

/**
 * Cria erro de banco de dados
 */
export function createDatabaseError(
  operation?: DatabaseError["operation"],
  table?: string,
  constraint?: string,
  originalError?: Error
): DatabaseError {
  let message = "Erro no banco de dados";

  if (constraint) {
    message = `Violação de regra: ${constraint}`;
  } else if (operation && table) {
    message = `Erro ao ${operation} na tabela ${table}`;
  }

  return {
    ...createError(ERROR_CODES.DATABASE_ERROR, message, {
      category: "database",
      severity: "high",
      actionable: false,
      retryable: true,
      originalError
    }),
    category: "database",
    operation,
    table,
    constraint
  };
}

/**
 * Cria erro de regra de negócio
 */
export function createBusinessLogicError(
  rule: string,
  message?: string,
  expectedValue?: any,
  actualValue?: any
): BusinessLogicError {
  const errorMessage = message || `Regra de negócio violada: ${rule}`;

  return {
    ...createError(ERROR_CODES.BUSINESS_RULE_VIOLATION, errorMessage, {
      category: "business_logic",
      severity: "medium",
      actionable: true,
      retryable: false
    }),
    category: "business_logic",
    rule,
    expectedValue,
    actualValue
  };
}

// ============================================================================
// UTILITÁRIOS DE CONVERSÃO
// ============================================================================

/**
 * Converte erro nativo do JavaScript para AppError
 */
export function fromNativeError(
  error: Error,
  category: AppError["category"] = "system",
  severity: ErrorSeverity = "high"
): AppError {
  return createError(
    ERROR_CODES.SYSTEM_ERROR,
    error.message,
    {
      category,
      severity,
      actionable: false,
      retryable: false,
      originalError: error,
      stack: error.stack
    }
  );
}

/**
 * Converte erro do Supabase para AppError
 */
export function fromSupabaseError(error: any): AppError {
  const code = error.code || ERROR_CODES.DATABASE_ERROR;
  let category: AppError["category"] = "database";
  let severity: ErrorSeverity = "high";
  let retryable = false;

  // Mapear códigos específicos do Supabase
  if (error.code === "PGRST116") {
    // Nenhum resultado encontrado
    category = "database";
    severity = "medium";
    retryable = false;
  } else if (error.code === "23505") {
    // Violação de unique constraint
    category = "database";
    severity = "medium";
    retryable = false;
  } else if (error.code === "23503") {
    // Violação de foreign key
    category = "database";
    severity = "medium";
    retryable = false;
  } else if (error.code === "42501") {
    // Permissão insuficiente
    category = "authorization";
    severity = "high";
    retryable = false;
  }

  return createError(
    code,
    error.message || "Erro no banco de dados",
    {
      category,
      severity,
      actionable: category === "authorization",
      retryable,
      originalError: error,
      context: {
        supabaseCode: error.code,
        details: error.details,
        hint: error.hint
      }
    }
  );
}

/**
 * Converte erro de fetch para NetworkError
 */
export function fromFetchError(
  error: any,
  endpoint?: string,
  method?: string
): NetworkError {
  let statusCode: number | undefined;
  let timeout = false;

  if (error.name === "AbortError") {
    timeout = true;
  } else if (error.status) {
    statusCode = error.status;
  }

  return createNetworkError(statusCode, endpoint, method, timeout);
}

// ============================================================================
// HELPERS DE CONTEXTO
// ============================================================================

/**
 * Adiciona contexto do usuário ao erro
 */
export function withUserContext(error: AppError, userId?: string, userRole?: string): AppError {
  return {
    ...error,
    context: {
      ...error.context,
      userId,
      userRole,
      timestamp: new Date()
    }
  };
}

/**
 * Adiciona contexto da ação ao erro
 */
export function withActionContext(
  error: AppError,
  action: string,
  resource?: string
): AppError {
  return {
    ...error,
    context: {
      ...error.context,
      action,
      resource,
      timestamp: new Date()
    }
  };
}

/**
 * Adiciona contexto da requisição ao erro
 */
export function withRequestContext(
  error: AppError,
  url?: string,
  method?: string,
  userAgent?: string
): AppError {
  return {
    ...error,
    context: {
      ...error.context,
      url,
      method,
      userAgent,
      timestamp: new Date()
    }
  };
}
