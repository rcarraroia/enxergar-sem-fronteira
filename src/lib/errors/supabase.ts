/**
 * Utilitários para Tratamento de Erros do Supabase
 *
 * Fornece funções especializadas para tratar erros específicos
 * do Supabase de forma consistente e user-friendly.
 */

import type { PostgrestError } from "@supabase/supabase-js";
import { createAuthorizationError, createDatabaseError, createError } from "./factory";
import type { AppError, ErrorSeverity } from "./types";

// ============================================================================
// MAPEAMENTO DE CÓDIGOS DE ERRO DO SUPABASE
// ============================================================================

/**
 * Códigos de erro PostgreSQL comuns
 */
const POSTGRES_ERROR_CODES = {
  // Violações de constraint
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",

  // Permissões
  INSUFFICIENT_PRIVILEGE: "42501",

  // Dados
  INVALID_TEXT_REPRESENTATION: "22P02",
  NUMERIC_VALUE_OUT_OF_RANGE: "22003",

  // Conexão
  CONNECTION_FAILURE: "08006",

  // RLS
  RLS_VIOLATION: "42501"
} as const;

/**
 * Códigos de erro PostgREST
 */
const POSTGREST_ERROR_CODES = {
  // Não encontrado
  NOT_FOUND: "PGRST116",

  // Parsing
  PARSE_ERROR: "PGRST100",

  // Schema
  SCHEMA_CACHE_STALE: "PGRST001"
} as const;

// ============================================================================
// FUNÇÕES DE TRATAMENTO
// ============================================================================

/**
 * Converte erro do Supabase para AppError estruturado
 */
export function handleSupabaseError(error: any): AppError {
  // Se já é um AppError, retornar como está
  if (error && typeof error === "object" && "code" in error && "category" in error) {
    return error as AppError;
  }

  // Erro PostgreSQL
  if (error?.code && typeof error.code === "string") {
    return handlePostgresError(error);
  }

  // Erro PostgREST
  if (error?.message?.includes("PGRST")) {
    return handlePostgrestError(error);
  }

  // Erro de autenticação do Supabase Auth
  if (error?.message && (
    error.message.includes("Invalid login credentials") ||
    error.message.includes("Email not confirmed") ||
    error.message.includes("Token has expired")
  )) {
    return handleAuthError(error);
  }

  // Erro genérico do Supabase
  return createError(
    "SUPABASE_ERROR",
    error?.message || "Erro no banco de dados",
    {
      category: "database",
      severity: "high",
      actionable: false,
      retryable: true,
      originalError: error,
      context: {
        supabaseError: true,
        errorDetails: error?.details,
        errorHint: error?.hint
      }
    }
  );
}

/**
 * Trata erros específicos do PostgreSQL
 */
function handlePostgresError(error: PostgrestError): AppError {
  const {code} = error;
  let {message} = error;
  let userMessage = "Erro no banco de dados";
  let severity: ErrorSeverity = "high";
  let actionable = false;
  let retryable = false;

  switch (code) {
    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION:
      userMessage = "Este registro já existe no sistema";
      message = "Violação de constraint única";
      severity = "medium";
      actionable = true;
      retryable = false;
      break;

    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      userMessage = "Não é possível realizar esta operação devido a dependências";
      message = "Violação de chave estrangeira";
      severity = "medium";
      actionable = true;
      retryable = false;
      break;

    case POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION:
      userMessage = "Campos obrigatórios não foram preenchidos";
      message = "Violação de campo obrigatório";
      severity = "medium";
      actionable = true;
      retryable = false;
      break;

    case POSTGRES_ERROR_CODES.CHECK_VIOLATION:
      userMessage = "Dados fornecidos não atendem aos critérios necessários";
      message = "Violação de constraint de verificação";
      severity = "medium";
      actionable = true;
      retryable = false;
      break;

    case POSTGRES_ERROR_CODES.INSUFFICIENT_PRIVILEGE:
    case POSTGRES_ERROR_CODES.RLS_VIOLATION:
      userMessage = "Você não tem permissão para realizar esta operação";
      message = "Permissões insuficientes";
      severity = "high";
      actionable = false;
      retryable = false;
      return createAuthorizationError(
        error.details || "database_operation",
        "access",
        "required_permission",
        "current_user"
      );

    case POSTGRES_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
      userMessage = "Formato de dados inválido";
      message = "Erro de formato de dados";
      severity = "medium";
      actionable = true;
      retryable = false;
      break;

    case POSTGRES_ERROR_CODES.CONNECTION_FAILURE:
      userMessage = "Problema de conexão com o banco de dados";
      message = "Falha na conexão";
      severity = "high";
      actionable = false;
      retryable = true;
      break;

    default:
      userMessage = "Erro interno do banco de dados";
      message = error.message || "Erro PostgreSQL desconhecido";
      severity = "high";
      actionable = false;
      retryable = true;
  }

  return createDatabaseError(
    undefined, // operation
    undefined, // table
    code,      // constraint
    error      // originalError
  );
}

/**
 * Trata erros específicos do PostgREST
 */
function handlePostgrestError(error: any): AppError {
  let userMessage = "Erro na API do banco de dados";
  let severity: ErrorSeverity = "medium";
  let actionable = false;
  let retryable = true;

  if (error.message?.includes("PGRST116")) {
    userMessage = "Registro não encontrado";
    severity = "medium";
    actionable = true;
    retryable = false;
  } else if (error.message?.includes("PGRST100")) {
    userMessage = "Erro na consulta ao banco de dados";
    severity = "high";
    actionable = false;
    retryable = false;
  }

  return createError(
    "POSTGREST_ERROR",
    error.message || "Erro PostgREST",
    {
      category: "database",
      severity,
      actionable,
      retryable,
      userMessage,
      originalError: error,
      context: {
        postgrestError: true,
        errorCode: error.code
      }
    }
  );
}

/**
 * Trata erros de autenticação do Supabase Auth
 */
function handleAuthError(error: any): AppError {
  let userMessage = "Erro de autenticação";
  let code = "AUTH_ERROR";
  let severity: ErrorSeverity = "high";

  if (error.message?.includes("Invalid login credentials")) {
    userMessage = "Email ou senha incorretos";
    code = "INVALID_CREDENTIALS";
  } else if (error.message?.includes("Email not confirmed")) {
    userMessage = "Por favor, confirme seu email antes de fazer login";
    code = "EMAIL_NOT_CONFIRMED";
    severity = "medium";
  } else if (error.message?.includes("Token has expired")) {
    userMessage = "Sua sessão expirou. Faça login novamente";
    code = "TOKEN_EXPIRED";
  } else if (error.message?.includes("User not found")) {
    userMessage = "Usuário não encontrado";
    code = "USER_NOT_FOUND";
  }

  return createError(
    code,
    error.message || "Erro de autenticação",
    {
      category: "authentication",
      severity,
      actionable: true,
      retryable: code === "TOKEN_EXPIRED",
      userMessage,
      originalError: error,
      context: {
        authError: true,
        supabaseAuth: true
      }
    }
  );
}

// ============================================================================
// UTILITÁRIOS ESPECÍFICOS
// ============================================================================

/**
 * Verifica se é erro de permissão RLS
 */
export function isRLSError(error: any): boolean {
  return error?.code === POSTGRES_ERROR_CODES.INSUFFICIENT_PRIVILEGE ||
         error?.code === POSTGRES_ERROR_CODES.RLS_VIOLATION ||
         error?.message?.includes("RLS") ||
         error?.message?.includes("policy");
}

/**
 * Verifica se é erro de constraint única
 */
export function isUniqueConstraintError(error: any): boolean {
  return error?.code === POSTGRES_ERROR_CODES.UNIQUE_VIOLATION;
}

/**
 * Verifica se é erro de registro não encontrado
 */
export function isNotFoundError(error: any): boolean {
  return error?.code === POSTGREST_ERROR_CODES.NOT_FOUND ||
         error?.message?.includes("PGRST116") ||
         error?.message?.includes("not found");
}

/**
 * Verifica se é erro de conexão
 */
export function isConnectionError(error: any): boolean {
  return error?.code === POSTGRES_ERROR_CODES.CONNECTION_FAILURE ||
         error?.message?.includes("connection") ||
         error?.message?.includes("network");
}

/**
 * Extrai nome da tabela do erro, se disponível
 */
export function extractTableName(error: any): string | undefined {
  if (error?.details) {
    const match = error.details.match(/table "([^"]+)"/);
    return match?.[1];
  }
  return undefined;
}

/**
 * Extrai nome da constraint do erro, se disponível
 */
export function extractConstraintName(error: any): string | undefined {
  if (error?.details) {
    const match = error.details.match(/constraint "([^"]+)"/);
    return match?.[1];
  }
  return undefined;
}

// ============================================================================
// HELPERS PARA OPERAÇÕES COMUNS
// ============================================================================

/**
 * Wrapper para operações de SELECT com tratamento de erro
 */
export async function safeSelect<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const result = await operation();

    if (result.error) {
      return {
        data: null,
        error: handleSupabaseError(result.error)
      };
    }

    return {
      data: result.data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: handleSupabaseError(error)
    };
  }
}

/**
 * Wrapper para operações de INSERT/UPDATE/DELETE com tratamento de erro
 */
export async function safeMutation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationType: "insert" | "update" | "delete" = "insert"
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const result = await operation();

    if (result.error) {
      const appError = handleSupabaseError(result.error);

      // Adicionar contexto da operação
      appError.context = {
        ...appError.context,
        operation: operationType,
        table: extractTableName(result.error),
        constraint: extractConstraintName(result.error)
      };

      return {
        data: null,
        error: appError
      };
    }

    return {
      data: result.data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: handleSupabaseError(error)
    };
  }
}
