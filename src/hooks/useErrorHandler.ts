/**
 * useErrorHandler - Hook para tratamento centralizado de erros
 *
 * Fornece funcionalidades para capturar, processar e exibir erros
 * de forma consistente em toda a aplicação.
 */

import { useAuth } from "@/hooks/useAuth";
import {
    createError,
    fromFetchError,
    fromNativeError,
    fromSupabaseError,
    withActionContext,
    withUserContext
} from "@/lib/errors/factory";
import { logError } from "@/lib/errors/logger";
import type {
    AppError,
    ErrorContext,
    Result
} from "@/lib/errors/types";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface UseErrorHandlerOptions {
  /** Se deve mostrar toast automaticamente */
  showToast?: boolean
  /** Se deve logar erros automaticamente */
  logErrors?: boolean
  /** Contexto padrão para adicionar aos erros */
  defaultContext?: ErrorContext
  /** Callback chamado quando erro é tratado */
  onError?: (error: AppError) => void
}

interface UseErrorHandlerReturn {
  /** Lista de erros ativos */
  errors: AppError[]
  /** Se há erros ativos */
  hasErrors: boolean
  /** Limpar todos os erros */
  clearErrors: () => void
  /** Limpar erro específico */
  clearError: (index: number) => void
  /** Tratar erro genérico */
  handleError: (error: unknown, context?: ErrorContext) => Promise<AppError>
  /** Tratar erro de validação */
  handleValidationError: (message: string, field?: string) => AppError
  /** Tratar erro de rede */
  handleNetworkError: (error: unknown, endpoint?: string) => AppError
  /** Tratar erro do Supabase */
  handleSupabaseError: (error: unknown) => AppError
  /** Executar operação com tratamento de erro */
  withErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ) => Promise<Result<T, AppError>>
  /** Executar operação com retry automático */
  withRetry: <T>(
    operation: () => Promise<T>,
    maxAttempts?: number,
    context?: ErrorContext
  ) => Promise<Result<T, AppError>>
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showToast = true,
    logErrors = true,
    defaultContext = {},
    onError
  } = options;

  const { user } = useAuth();
  const [errors, setErrors] = useState<AppError[]>([]);
  const retryAttempts = useRef<Map<string, number>>(new Map());

  // ============================================================================
  // CORE ERROR HANDLING
  // ============================================================================

  const processError = useCallback((error: AppError): AppError => {
    // Adicionar contexto do usuário
    const errorWithContext = withUserContext(error, user?.id, user?.email);

    // Adicionar contexto padrão
    const finalError = {
      ...errorWithContext,
      context: {
        ...defaultContext,
        ...errorWithContext.context
      }
    };

    // Adicionar à lista de erros
    setErrors(prev => [...prev, finalError]);

    // Logar erro se configurado
    if (logErrors) {
      logError(finalError);
    }

    // Mostrar toast se configurado
    if (showToast) {
      showErrorToast(finalError);
    }

    // Chamar callback se fornecido
    onError?.(finalError);

    return finalError;
  }, [user, defaultContext, logErrors, showToast, onError]);

  const handleError = useCallback(async (
    error: unknown,
    context?: ErrorContext
  ): Promise<AppError> => {
    let appError: AppError;

    // Converter diferentes tipos de erro para AppError
    if (error && typeof error === "object" && "code" in error && "category" in error) {
      // Já é um AppError
      appError = error as AppError;
    } else if (error && typeof error === "object" && "message" in error) {
      // Erro do Supabase ou similar
      if ("code" in error && typeof (error as any).code === "string") {
        appError = fromSupabaseError(error);
      } else {
        appError = fromNativeError(error as Error);
      }
    } else if (typeof error === "string") {
      // String de erro
      appError = createError("GENERIC_ERROR", error);
    } else {
      // Erro desconhecido
      appError = createError("UNKNOWN_ERROR", "Erro desconhecido ocorreu");
    }

    // Adicionar contexto se fornecido
    if (context) {
      appError = withActionContext(appError, context.action || "", context.resource);
      appError.context = { ...appError.context, ...context };
    }

    return processError(appError);
  }, [processError]);

  // ============================================================================
  // SPECIALIZED ERROR HANDLERS
  // ============================================================================

  const handleValidationError = useCallback((
    message: string,
    field?: string
  ): AppError => {
    const error = createError("VALIDATION_FAILED", message, {
      category: "validation",
      severity: "medium",
      actionable: true,
      retryable: false,
      context: { field }
    });

    return processError(error);
  }, [processError]);

  const handleNetworkError = useCallback((
    error: unknown,
    endpoint?: string
  ): AppError => {
    const networkError = fromFetchError(error, endpoint);
    return processError(networkError);
  }, [processError]);

  const handleSupabaseError = useCallback((error: unknown): AppError => {
    const supabaseError = fromSupabaseError(error);
    return processError(supabaseError);
  }, [processError]);

  // ============================================================================
  // OPERATION WRAPPERS
  // ============================================================================

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<Result<T, AppError>> => {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      const appError = await handleError(error, context);
      return { success: false, error: appError };
    }
  }, [handleError]);

  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    context?: ErrorContext
  ): Promise<Result<T, AppError>> => {
    const operationId = Math.random().toString(36).substr(2, 9);
    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        // Limpar contador de tentativas em caso de sucesso
        retryAttempts.current.delete(operationId);
        return { success: true, data: result };
      } catch (error) {
        lastError = await handleError(error, {
          ...context,
          attempt,
          maxAttempts,
          operationId
        });

        // Se não é retryable ou é a última tentativa, falhar
        if (!lastError.retryable || attempt === maxAttempts) {
          break;
        }

        // Aguardar antes da próxima tentativa (backoff exponencial)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    retryAttempts.current.delete(operationId);
    return { success: false, error: lastError! };
  }, [handleError]);

  // ============================================================================
  // ERROR MANAGEMENT
  // ============================================================================

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ============================================================================
  // TOAST HELPERS
  // ============================================================================

  const showErrorToast = useCallback((error: AppError) => {
    const message = error.userMessage || error.message;

    switch (error.severity) {
      case "critical":
        toast.error(message, {
          description: "Este é um erro crítico que requer atenção imediata.",
          duration: 10000
        });
        break;
      case "high":
        toast.error(message, {
          duration: 8000
        });
        break;
      case "medium":
        toast.warning(message, {
          duration: 5000
        });
        break;
      case "low":
        toast.info(message, {
          duration: 3000
        });
        break;
    }
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasErrors = errors.length > 0;

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    errors,
    hasErrors,
    clearErrors,
    clearError,
    handleError,
    handleValidationError,
    handleNetworkError,
    handleSupabaseError,
    withErrorHandling,
    withRetry
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook simplificado para tratamento básico de erros
 */
export function useSimpleErrorHandler() {
  const { handleError } = useErrorHandler({
    showToast: true,
    logErrors: true
  });

  return handleError;
}

/**
 * Hook para tratamento de erros de formulário
 */
export function useFormErrorHandler() {
  const { handleValidationError, clearErrors } = useErrorHandler({
    showToast: false, // Não mostrar toast para erros de validação
    logErrors: false  // Não logar erros de validação
  });

  return {
    handleValidationError,
    clearErrors
  };
}

/**
 * Hook para tratamento de erros de API
 */
export function useApiErrorHandler() {
  const {
    handleError,
    handleNetworkError,
    handleSupabaseError,
    withErrorHandling,
    withRetry
  } = useErrorHandler({
    showToast: true,
    logErrors: true,
    defaultContext: {
      source: "api"
    }
  });

  return {
    handleError,
    handleNetworkError,
    handleSupabaseError,
    withErrorHandling,
    withRetry
  };
}

export default useErrorHandler;
