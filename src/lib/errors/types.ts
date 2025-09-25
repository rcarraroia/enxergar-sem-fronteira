/**
 * Sistema de Tipos de Erro
 *
 * Define tipos e interfaces para o sistema de tratamento de erros
 * estruturado e user-friendly da aplicação.
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

/**
 * Níveis de severidade dos erros
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical"

/**
 * Categorias de erro para classificação
 */
export type ErrorCategory =
  | "validation"
  | "authentication"
  | "authorization"
  | "network"
  | "database"
  | "business_logic"
  | "system"
  | "user_input"
  | "external_api"
  | "file_operation"

/**
 * Contexto adicional do erro
 */
export interface ErrorContext {
  [key: string]: any
  userId?: string
  action?: string
  resource?: string
  timestamp?: Date
  userAgent?: string
  url?: string
}

// ============================================================================
// INTERFACE PRINCIPAL DE ERRO
// ============================================================================

/**
 * Interface principal para erros estruturados da aplicação
 */
export interface AppError {
  /** Código único do erro para identificação */
  code: string

  /** Mensagem técnica do erro (para logs) */
  message: string

  /** Mensagem amigável para o usuário */
  userMessage?: string

  /** Nível de severidade do erro */
  severity: ErrorSeverity

  /** Categoria do erro */
  category: ErrorCategory

  /** Timestamp de quando o erro ocorreu */
  timestamp: Date

  /** Se o erro pode ser resolvido pelo usuário */
  actionable: boolean

  /** Se a operação pode ser tentada novamente */
  retryable: boolean

  /** Contexto adicional do erro */
  context?: ErrorContext

  /** Erro original que causou este erro */
  originalError?: Error

  /** Stack trace do erro (apenas em desenvolvimento) */
  stack?: string
}

// ============================================================================
// TIPOS DE ERRO ESPECÍFICOS
// ============================================================================

/**
 * Erro de validação de dados
 */
export interface ValidationError extends AppError {
  category: "validation"
  field?: string
  value?: any
  constraint?: string
}

/**
 * Erro de autenticação
 */
export interface AuthenticationError extends AppError {
  category: "authentication"
  authMethod?: string
  reason?: "invalid_credentials" | "expired_token" | "missing_token" | "invalid_token"
}

/**
 * Erro de autorização
 */
export interface AuthorizationError extends AppError {
  category: "authorization"
  requiredRole?: string
  userRole?: string
  resource?: string
  action?: string
}

/**
 * Erro de rede
 */
export interface NetworkError extends AppError {
  category: "network"
  statusCode?: number
  endpoint?: string
  method?: string
  timeout?: boolean
}

/**
 * Erro de banco de dados
 */
export interface DatabaseError extends AppError {
  category: "database"
  operation?: "select" | "insert" | "update" | "delete"
  table?: string
  constraint?: string
}

/**
 * Erro de regra de negócio
 */
export interface BusinessLogicError extends AppError {
  category: "business_logic"
  rule?: string
  expectedValue?: any
  actualValue?: any
}

// ============================================================================
// TIPOS UTILITÁRIOS
// ============================================================================

/**
 * Resultado de operação que pode falhar
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Função que pode lançar erro estruturado
 */
export type ErrorHandler<T = void> = (error: AppError) => T

/**
 * Configuração de retry para operações
 */
export interface RetryConfig {
  maxAttempts: number
  delayMs: number
  backoffMultiplier?: number
  retryableErrors?: ErrorCategory[]
}

/**
 * Configuração de logging de erros
 */
export interface ErrorLoggingConfig {
  logLevel: ErrorSeverity
  includeStack: boolean
  includeContext: boolean
  sensitiveFields?: string[]
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Códigos de erro padrão
 */
export const ERROR_CODES = {
  // Validação
  VALIDATION_FAILED: "VALIDATION_FAILED",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Autenticação
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",

  // Autorização
  ACCESS_DENIED: "ACCESS_DENIED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Rede
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  SERVER_ERROR: "SERVER_ERROR",

  // Banco de dados
  DATABASE_ERROR: "DATABASE_ERROR",
  CONSTRAINT_VIOLATION: "CONSTRAINT_VIOLATION",
  RECORD_NOT_FOUND: "RECORD_NOT_FOUND",

  // Sistema
  SYSTEM_ERROR: "SYSTEM_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",

  // Regras de negócio
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  INVALID_OPERATION: "INVALID_OPERATION"
} as const;

/**
 * Mensagens de erro padrão em português
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_FAILED]: "Dados inválidos fornecidos",
  [ERROR_CODES.REQUIRED_FIELD]: "Campo obrigatório não preenchido",
  [ERROR_CODES.INVALID_FORMAT]: "Formato inválido",

  [ERROR_CODES.INVALID_CREDENTIALS]: "Credenciais inválidas",
  [ERROR_CODES.TOKEN_EXPIRED]: "Sessão expirada. Faça login novamente",
  [ERROR_CODES.TOKEN_INVALID]: "Token de acesso inválido",

  [ERROR_CODES.ACCESS_DENIED]: "Acesso negado",
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: "Permissões insuficientes",

  [ERROR_CODES.NETWORK_ERROR]: "Erro de conexão. Verifique sua internet",
  [ERROR_CODES.TIMEOUT_ERROR]: "Operação demorou muito para responder",
  [ERROR_CODES.SERVER_ERROR]: "Erro interno do servidor",

  [ERROR_CODES.DATABASE_ERROR]: "Erro no banco de dados",
  [ERROR_CODES.CONSTRAINT_VIOLATION]: "Violação de regra do banco de dados",
  [ERROR_CODES.RECORD_NOT_FOUND]: "Registro não encontrado",

  [ERROR_CODES.SYSTEM_ERROR]: "Erro interno do sistema",
  [ERROR_CODES.CONFIGURATION_ERROR]: "Erro de configuração",

  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: "Regra de negócio violada",
  [ERROR_CODES.INVALID_OPERATION]: "Operação inválida"
} as const;
