/**
 * Chat Error Integration
 *
 * Integração centralizada do sistema de chat com o sistema de error handling existente
 */

import {
    logCriticalError
} from '@/lib/errors/logger';
import {
    CHAT_ERROR_CODES,
    ChatAppError,
    createChatError,
    createSecurityError,
    createSessionError,
    createWebhookError,
    fromChatError
} from './chatErrorFactory';
import {
    logChatError,
    logChatPerformance,
    logSecurityThreat
} from './chatLogger';
import {
    ChatError,
    ChatErrorType,
    N8nChatRequest
} from './chatTypes';

// ============================================================================
// ERROR CONVERSION UTILITIES
// ============================================================================

/**
 * Converte ChatError legado para o novo sistema
 */
export function convertLegacyChatError(chatError: ChatError): ChatAppError {
  return fromChatError(chatError);
}

/**
 * Converte ChatAppError para ChatError legado (para compatibilidade)
 */
export function convertToLegacyChatError(chatAppError: ChatAppError): ChatError {
  let type = ChatErrorType.SYSTEM_ERROR;

  // Mapear códigos para tipos legados
  switch (chatAppError.code) {
    case CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT:
    case CHAT_ERROR_CODES.MESSAGE_TOO_LONG:
    case CHAT_ERROR_CODES.EMPTY_MESSAGE:
    case CHAT_ERROR_CODES.XSS_DETECTED:
    case CHAT_ERROR_CODES.SQL_INJECTION_DETECTED:
    case CHAT_ERROR_CODES.SUSPICIOUS_CONTENT:
      type = ChatErrorType.VALIDATION_ERROR;
      break;

    case CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE:
    case CHAT_ERROR_CODES.WEBHOOK_TIMEOUT:
    case CHAT_ERROR_CODES.WEBHOOK_INVALID_RESPONSE:
    case CHAT_ERROR_CODES.WEBHOOK_AUTH_FAILED:
    case CHAT_ERROR_CODES.N8N_WORKFLOW_ERROR:
      type = ChatErrorType.WEBHOOK_ERROR;
      break;

    case CHAT_ERROR_CODES.SESSION_EXPIRED:
    case CHAT_ERROR_CODES.SESSION_NOT_FOUND:
    case CHAT_ERROR_CODES.SESSION_BLOCKED:
      type = ChatErrorType.SESSION_ERROR;
      break;

    case CHAT_ERROR_CODES.RATE_LIMIT_EXCEEDED:
      type = ChatErrorType.NETWORK_ERROR;
      break;
  }

  return {
    type,
    message: chatAppError.userMessage || chatAppError.message,
    retryable: chatAppError.retryable,
    sessionId: chatAppError.sessionId,
    messageId: chatAppError.messageId,
    originalError: chatAppError.originalError,
    context: chatAppError.context
  };
}

// ============================================================================
// UNIFIED ERROR HANDLING
// ============================================================================

/**
 * Handler unificado para erros de chat
 */
export class ChatErrorHandler {
  private static instance: ChatErrorHandler | null = null;

  static getInstance(): ChatErrorHandler {
    if (!ChatErrorHandler.instance) {
      ChatErrorHandler.instance = new ChatErrorHandler();
    }
    return ChatErrorHandler.instance;
  }

  /**
   * Processa erro de chat de forma unificada
   */
  handleChatError(
    error: ChatAppError | ChatError | Error,
    context?: {
      sessionId?: string;
      messageId?: string;
      userType?: 'public' | 'admin';
      operation?: string;
      component?: string;
    }
  ): ChatAppError {
    let chatAppError: ChatAppError;

    // Converter para ChatAppError se necessário
    if (error instanceof Error) {
      chatAppError = createChatError(
        CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR,
        error.message,
        {
          category: 'system',
          severity: 'high',
          originalError: error,
          sessionId: context?.sessionId,
          context: {
            component: context?.component,
            operation: context?.operation
          }
        }
      );
    } else if ('type' in error) {
      // É um ChatError legado
      chatAppError = fromChatError(error);
    } else {
      // Já é um ChatAppError
      chatAppError = error;
    }

    // Adicionar contexto adicional
    if (context) {
      chatAppError = {
        ...chatAppError,
        sessionId: context.sessionId || chatAppError.sessionId,
        messageId: context.messageId || chatAppError.messageId,
        chatType: context.userType || chatAppError.chatType,
        context: {
          ...chatAppError.context,
          component: context.component,
          operation: context.operation,
          userType: context.userType
        }
      };
    }

    // Log do erro
    logChatError(chatAppError, context);

    // Log adicional no sistema geral se for crítico
    if (chatAppError.severity === 'critical' || chatAppError.severity === 'high') {
      logCriticalError(chatAppError);
    }

    return chatAppError;
  }

  /**
   * Cria e processa erro de validação
   */
  handleValidationError(
    field: string,
    value: any,
    sessionId?: string,
    messageId?: string,
    context?: Record<string, any>
  ): ChatAppError {
    const error = createChatError(
      CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT,
      `Validação falhou para o campo: ${field}`,
      {
        category: 'validation',
        severity: 'medium',
        sessionId,
        messageId,
        context: {
          field,
          value: typeof value === 'string' ? value.substring(0, 100) : value,
          ...context
        }
      }
    );

    return this.handleChatError(error, { sessionId, messageId });
  }

  /**
   * Cria e processa erro de segurança
   */
  handleSecurityError(
    type: 'xss' | 'sql_injection' | 'suspicious_content' | 'rate_limit' | 'session_blocked' | 'invalid_domain',
    content: string,
    sessionId?: string,
    context?: Record<string, any>
  ): ChatAppError {
    const error = createSecurityError(type, content, sessionId, context);

    // Log específico de segurança
    logSecurityThreat(type, content, sessionId, context);

    return this.handleChatError(error, { sessionId });
  }

  /**
   * Cria e processa erro de webhook
   */
  handleWebhookError(
    type: 'unreachable' | 'timeout' | 'invalid_response' | 'auth_failed' | 'workflow_error',
    statusCode?: number,
    endpoint?: string,
    sessionId?: string,
    requestData?: Partial<N8nChatRequest>,
    responseData?: any
  ): ChatAppError {
    const error = createWebhookError(
      type,
      statusCode,
      endpoint,
      sessionId,
      requestData,
      responseData
    );

    return this.handleChatError(error, {
      sessionId,
      component: 'WebhookClient',
      operation: 'sendRequest'
    });
  }

  /**
   * Cria e processa erro de sessão
   */
  handleSessionError(
    type: 'expired' | 'not_found' | 'limit_reached',
    sessionId?: string,
    context?: Record<string, any>
  ): ChatAppError {
    const error = createSessionError(type, sessionId, context);

    return this.handleChatError(error, { sessionId });
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Instância singleton do handler
 */
const errorHandler = ChatErrorHandler.getInstance();

/**
 * Processa erro de chat
 */
export function handleChatError(
  error: ChatAppError | ChatError | Error,
  context?: {
    sessionId?: string;
    messageId?: string;
    userType?: 'public' | 'admin';
    operation?: string;
    component?: string;
  }
): ChatAppError {
  return errorHandler.handleChatError(error, context);
}

/**
 * Processa erro de validação
 */
export function handleValidationError(
  field: string,
  value: any,
  sessionId?: string,
  messageId?: string,
  context?: Record<string, any>
): ChatAppError {
  return errorHandler.handleValidationError(field, value, sessionId, messageId, context);
}

/**
 * Processa erro de segurança
 */
export function handleSecurityError(
  type: 'xss' | 'sql_injection' | 'suspicious_content' | 'rate_limit' | 'session_blocked' | 'invalid_domain',
  content: string,
  sessionId?: string,
  context?: Record<string, any>
): ChatAppError {
  return errorHandler.handleSecurityError(type, content, sessionId, context);
}

/**
 * Processa erro de webhook
 */
export function handleWebhookError(
  type: 'unreachable' | 'timeout' | 'invalid_response' | 'auth_failed' | 'workflow_error',
  statusCode?: number,
  endpoint?: string,
  sessionId?: string,
  requestData?: Partial<N8nChatRequest>,
  responseData?: any
): ChatAppError {
  return errorHandler.handleWebhookError(
    type,
    statusCode,
    endpoint,
    sessionId,
    requestData,
    responseData
  );
}

/**
 * Processa erro de sessão
 */
export function handleSessionError(
  type: 'expired' | 'not_found' | 'limit_reached',
  sessionId?: string,
  context?: Record<string, any>
): ChatAppError {
  return errorHandler.handleSessionError(type, sessionId, context);
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Monitor de performance para operações de chat
 */
export class ChatPerformanceMonitor {
  private static instance: ChatPerformanceMonitor | null = null;
  private operations = new Map<string, { start: number; context?: any }>();

  static getInstance(): ChatPerformanceMonitor {
    if (!ChatPerformanceMonitor.instance) {
      ChatPerformanceMonitor.instance = new ChatPerformanceMonitor();
    }
    return ChatPerformanceMonitor.instance;
  }

  /**
   * Inicia monitoramento de operação
   */
  startOperation(operationId: string, context?: any): void {
    this.operations.set(operationId, {
      start: Date.now(),
      context
    });
  }

  /**
   * Finaliza monitoramento de operação
   */
  endOperation(operationId: string, sessionId?: string): number {
    const operation = this.operations.get(operationId);
    if (!operation) return 0;

    const duration = Date.now() - operation.start;
    this.operations.delete(operationId);

    // Log de performance
    logChatPerformance(operationId, duration, sessionId, operation.context);

    // Criar erro se muito lento
    if (duration > 10000) {
      handleChatError(
        createChatError(
          CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR,
          `Operação muito lenta: ${operationId} (${duration}ms)`,
          {
            category: 'system',
            severity: 'high',
            sessionId,
            context: {
              operation: operationId,
              duration,
              performanceIssue: true,
              ...operation.context
            }
          }
        ),
        { sessionId, operation: operationId, component: 'PerformanceMonitor' }
      );
    }

    return duration;
  }

  /**
   * Limpa operações antigas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, operation] of this.operations.entries()) {
      if (now - operation.start > 60000) { // 1 minuto
        this.operations.delete(id);
      }
    }
  }
}

/**
 * Monitor de performance singleton
 */
const performanceMonitor = ChatPerformanceMonitor.getInstance();

/**
 * Inicia monitoramento de performance
 */
export function startPerformanceMonitoring(operationId: string, context?: any): void {
  performanceMonitor.startOperation(operationId, context);
}

/**
 * Finaliza monitoramento de performance
 */
export function endPerformanceMonitoring(operationId: string, sessionId?: string): number {
  return performanceMonitor.endOperation(operationId, sessionId);
}

// ============================================================================
// EXPORTS
// ============================================================================



// Limpar operações antigas a cada 5 minutos
setInterval(() => {
  performanceMonitor.cleanup();
}, 5 * 60 * 1000);
