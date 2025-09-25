/**
 * Sistema de Tratamento de Erros - Exports
 *
 * Ponto central de exportação para todas as funcionalidades
 * do sistema de tratamento de erros.
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
    AppError, AuthenticationError,
    AuthorizationError, BusinessLogicError, DatabaseError, ErrorCategory,
    ErrorContext, ErrorHandler, ErrorLoggingConfig, ErrorSeverity, NetworkError, Result, RetryConfig, ValidationError
} from "./types";

export {
    ERROR_CODES,
    ERROR_MESSAGES
} from "./types";

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export {
    createAuthenticationError,
    createAuthorizationError, createBusinessLogicError, createDatabaseError, createError, createInvalidFormatError, createNetworkError, createRequiredFieldError, createValidationError, fromFetchError, fromNativeError,
    fromSupabaseError, withActionContext,
    withRequestContext, withUserContext
} from "./factory";

// ============================================================================
// LOGGING
// ============================================================================

export type { ErrorLogger } from "./logger";

export {
    configureErrorLogger, disableLoggingForTests, enableVerboseLogging, getErrorLogger, logCriticalError, logError, logErrorWithContext,
    setupGlobalErrorHandling
} from "./logger";

// ============================================================================
// SUPABASE UTILITIES
// ============================================================================

export {
    extractConstraintName, extractTableName, handleSupabaseError, isConnectionError, isNotFoundError, isRLSError,
    isUniqueConstraintError, safeMutation, safeSelect
} from "./supabase";

// ============================================================================
// REACT COMPONENTS
// ============================================================================

export {
    EmptyErrorState, ErrorDisplay,
    ErrorList,
    FieldError
} from "@/components/errors/ErrorDisplay";

export {
    ComponentErrorBoundary, ErrorBoundary, PageErrorBoundary,
    SectionErrorBoundary, withErrorBoundary
} from "@/components/errors/ErrorBoundary";

// ============================================================================
// HOOKS
// ============================================================================

export {
    useApiErrorHandler, useErrorHandler, useFormErrorHandler, useSimpleErrorHandler
} from "@/hooks/useErrorHandler";

export type { UseErrorHandlerReturn } from "@/hooks/useErrorHandler";

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Função de conveniência para tratamento rápido de erros
 */
export function quickErrorHandler(error: unknown): AppError {
  if (error && typeof error === "object" && "code" in error && "category" in error) {
    return error as AppError;
  }

  if (error && typeof error === "object" && "message" in error) {
    return fromNativeError(error as Error);
  }

  if (typeof error === "string") {
    return createError("GENERIC_ERROR", error);
  }

  return createError("UNKNOWN_ERROR", "Erro desconhecido");
}

/**
 * Função para verificar se um valor é um AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    value !== null &&
    typeof value === "object" &&
    "code" in value &&
    "message" in value &&
    "category" in value &&
    "severity" in value
  );
}

/**
 * Função para extrair mensagem user-friendly de qualquer erro
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage || error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return (error as Error).message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ocorreu um erro inesperado";
}

/**
 * Função para determinar se um erro é retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.retryable;
  }

  // Por padrão, erros de rede são retryable
  if (error && typeof error === "object" && "name" in error) {
    const errorName = (error as Error).name;
    return errorName === "NetworkError" || errorName === "TimeoutError";
  }

  return false;
}

/**
 * Função para determinar se um erro é actionable pelo usuário
 */
export function isActionableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.actionable;
  }

  // Por padrão, erros de validação são actionable
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as Error).message.toLowerCase();
    return message.includes("validation") ||
           message.includes("required") ||
           message.includes("invalid");
  }

  return false;
}

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

/**
 * Configuração completa do sistema de erros
 */
export function setupErrorSystem(config?: {
  logLevel?: ErrorSeverity
  enableGlobalHandling?: boolean
  enableVerboseLogging?: boolean
}) {
  const {
    logLevel = "medium",
    enableGlobalHandling = true,
    enableVerboseLogging: enableVerbose = process.env.NODE_ENV === "development"
  } = config || {};

  // Configurar logger
  configureErrorLogger({
    logLevel,
    includeStack: process.env.NODE_ENV === "development",
    includeContext: true
  });

  // Configurar tratamento global
  if (enableGlobalHandling) {
    setupGlobalErrorHandling();
  }

  // Habilitar logs verbosos se necessário
  if (enableVerbose) {
    enableVerboseLogging();
  }

  console.log("✅ Sistema de tratamento de erros configurado");
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Core functions
  createError,
  handleSupabaseError,
  quickErrorHandler,

  // Utilities
  isAppError,
  getUserMessage,
  isRetryableError,
  isActionableError,

  // Setup
  setupErrorSystem,

  // Constants
  ERROR_CODES,
  ERROR_MESSAGES
};
