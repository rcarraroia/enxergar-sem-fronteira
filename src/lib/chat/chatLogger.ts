/**
 * Chat Logger
 *
 * Sistema de logging específico para o chat que integra com o sistema de error handling existente
 */

import {
    logCriticalError,
    logErrorWithContext
} from '@/lib/errors/logger';
import {
    CHAT_ERROR_CODES,
    ChatAppError,
    createChatError
} from './chatErrorFactory';
import {
    N8nChatRequest
} from './chatTypes';

// ============================================================================
// CHAT LOGGING CONFIGURATION
// ============================================================================

interface ChatLoggingConfig {
  /** Se deve logar mensagens de debug */
  enableDebugLogs: boolean;
  /** Se deve logar métricas de performance */
  enablePerformanceLogs: boolean;
  /** Se deve logar dados de requisição/resposta */
  enableDataLogs: boolean;
  /** Campos sensíveis a serem removidos dos logs */
  sensitiveFields: string[];
  /** Nível mínimo para logging */
  minLogLevel: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CHAT_CONFIG: ChatLoggingConfig = {
  enableDebugLogs: process.env.NODE_ENV === 'development',
  enablePerformanceLogs: true,
  enableDataLogs: process.env.NODE_ENV === 'development',
  sensitiveFields: ['token', 'apiKey', 'password', 'secret'],
  minLogLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
};

// ============================================================================
// CHAT LOGGER CLASS
// ============================================================================

class ChatLogger {
  private config: ChatLoggingConfig;
  private sessionMetrics = new Map<string, {
    messagesCount: number;
    errorsCount: number;
    startTime: number;
    lastActivity: number;
  }>();

  constructor(config: Partial<ChatLoggingConfig> = {}) {
    this.config = { ...DEFAULT_CHAT_CONFIG, ...config };
  }

  // ============================================================================
  // ERROR LOGGING
  // ============================================================================

  /**
   * Log de erro de chat
   */
  logChatError(error: ChatAppError, additionalContext?: Record<string, any>): void {
    const context = {
      component: 'Chat',
      ...this.sanitizeContext({
        sessionId: error.sessionId,
        messageId: error.messageId,
        chatType: error.chatType,
        ...error.context,
        ...additionalContext
      })
    };

    if (error.severity === 'critical' || error.severity === 'high') {
      logCriticalError({ ...error, context });
    } else {
      logErrorWithContext(error, context);
    }

    // Atualizar métricas da sessão
    if (error.sessionId) {
      this.updateSessionMetrics(error.sessionId, 'error');
    }
  }

  /**
   * Log de erro de validação
   */
  logValidationError(
    field: string,
    value: any,
    sessionId?: string,
    messageId?: string,
    additionalContext?: Record<string, any>
  ): void {
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
          value: this.sanitizeValue(value),
          ...additionalContext
        }
      }
    );

    this.logChatError(error);
  }

  /**
   * Log de erro de segurança
   */
  logSecurityError(
    type: string,
    content: string,
    sessionId?: string,
    additionalContext?: Record<string, any>
  ): void {
    const error = createChatError(
      CHAT_ERROR_CODES.SUSPICIOUS_CONTENT,
      `Violação de segurança detectada: ${type}`,
      {
        category: 'validation',
        severity: 'high',
        sessionId,
        context: {
          securityThreatType: type,
          suspiciousContent: content.substring(0, 100),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...additionalContext
        }
      }
    );

    this.logChatError(error);
  }

  /**
   * Log de erro de webhook
   */
  logWebhookError(
    endpoint: string,
    statusCode?: number,
    requestData?: Partial<N8nChatRequest>,
    responseData?: any,
    error?: Error
  ): void {
    const chatError = createChatError(
      CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE,
      `Erro na comunicação com webhook: ${endpoint}`,
      {
        category: 'external_api',
        severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
        sessionId: requestData?.sessionId,
        originalError: error,
        context: {
          endpoint,
          statusCode,
          method: 'POST',
          requestData: this.sanitizeRequestData(requestData),
          responseData: this.sanitizeResponseData(responseData)
        }
      }
    );

    this.logChatError(chatError);
  }

  // ============================================================================
  // ACTIVITY LOGGING
  // ============================================================================

  /**
   * Log de início de sessão
   */
  logSessionStart(sessionId: string, userType: 'public' | 'admin', context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;

    this.sessionMetrics.set(sessionId, {
      messagesCount: 0,
      errorsCount: 0,
      startTime: Date.now(),
      lastActivity: Date.now()
    });

    console.info('💬 Chat session started:', {
      sessionId,
      userType,
      timestamp: new Date().toISOString(),
      ...this.sanitizeContext(context)
    });
  }

  /**
   * Log de fim de sessão
   */
  logSessionEnd(sessionId: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;

    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics) {
      const duration = Date.now() - metrics.startTime;
      console.info('💬 Chat session ended:', {
        sessionId,
        duration: `${Math.round(duration / 1000)}s`,
        messagesCount: metrics.messagesCount,
        errorsCount: metrics.errorsCount,
        timestamp: new Date().toISOString(),
        ...this.sanitizeContext(context)
      });

      this.sessionMetrics.delete(sessionId);
    }
  }

  /**
   * Log de mensagem enviada
   */
  logMessageSent(
    sessionId: string,
    messageId: string,
    messageLength: number,
    userType: 'public' | 'admin',
    context?: Record<string, any>
  ): void {
    if (!this.shouldLog('debug')) return;

    this.updateSessionMetrics(sessionId, 'message');

    if (this.config.enableDebugLogs) {
      console.debug('📤 Message sent:', {
        sessionId,
        messageId,
        messageLength,
        userType,
        timestamp: new Date().toISOString(),
        ...this.sanitizeContext(context)
      });
    }
  }

  /**
   * Log de resposta recebida
   */
  logResponseReceived(
    sessionId: string,
    messageId: string,
    responseTime: number,
    success: boolean,
    context?: Record<string, any>
  ): void {
    if (!this.shouldLog('debug')) return;

    if (this.config.enableDebugLogs) {
      console.debug('📥 Response received:', {
        sessionId,
        messageId,
        responseTime: `${responseTime}ms`,
        success,
        timestamp: new Date().toISOString(),
        ...this.sanitizeContext(context)
      });
    }
  }

  // ============================================================================
  // PERFORMANCE LOGGING
  // ============================================================================

  /**
   * Log de métricas de performance
   */
  logPerformanceMetrics(
    operation: string,
    duration: number,
    sessionId?: string,
    context?: Record<string, any>
  ): void {
    if (!this.config.enablePerformanceLogs || !this.shouldLog('info')) return;

    const level = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug';
    const emoji = duration > 5000 ? '🐌' : duration > 2000 ? '⏱️' : '⚡';

    console[level](`${emoji} Chat performance:`, {
      operation,
      duration: `${duration}ms`,
      sessionId,
      timestamp: new Date().toISOString(),
      ...this.sanitizeContext(context)
    });

    // Log crítico se muito lento
    if (duration > 10000) {
      const error = createChatError(
        CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR,
        `Operação muito lenta: ${operation} (${duration}ms)`,
        {
          category: 'system',
          severity: 'high',
          sessionId,
          context: {
            operation,
            duration,
            performanceIssue: true,
            ...context
          }
        }
      );

      this.logChatError(error);
    }
  }

  /**
   * Log de uso de memória
   */
  logMemoryUsage(sessionId?: string): void {
    if (!this.config.enablePerformanceLogs || !this.shouldLog('debug')) return;

    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.debug('🧠 Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
        sessionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // SECURITY LOGGING
  // ============================================================================

  /**
   * Log de tentativa de ataque
   */
  logSecurityThreat(
    type: 'xss' | 'sql_injection' | 'suspicious_content' | 'rate_limit' | 'invalid_domain',
    content: string,
    sessionId?: string,
    context?: Record<string, any>
  ): void {
    const error = createChatError(
      CHAT_ERROR_CODES.SUSPICIOUS_CONTENT,
      `Ameaça de segurança detectada: ${type}`,
      {
        category: 'validation',
        severity: 'high',
        sessionId,
        context: {
          securityThreatType: type,
          suspiciousContent: content.substring(0, 100),
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          requiresAttention: true,
          ...this.sanitizeContext(context)
        }
      }
    );

    this.logChatError(error);

    // Log adicional no console para visibilidade imediata
    console.warn('🚨 Security threat detected:', {
      type,
      sessionId,
      content: content.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log de sessão bloqueada
   */
  logSessionBlocked(sessionId: string, reason: string, context?: Record<string, any>): void {
    const error = createChatError(
      CHAT_ERROR_CODES.SESSION_BLOCKED,
      `Sessão bloqueada: ${reason}`,
      {
        category: 'validation',
        severity: 'high',
        sessionId,
        context: {
          blockReason: reason,
          timestamp: new Date().toISOString(),
          requiresAttention: true,
          ...this.sanitizeContext(context)
        }
      }
    );

    this.logChatError(error);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Verifica se deve logar baseado no nível
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.config.minLogLevel];
  }

  /**
   * Sanitiza contexto removendo campos sensíveis
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> {
    if (!context) return {};

    const sanitized = { ...context };

    for (const field of this.config.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitiza valor para log
   */
  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 100) + '...' : value;
    }
    return value;
  }

  /**
   * Sanitiza dados de requisição
   */
  private sanitizeRequestData(requestData?: Partial<N8nChatRequest>): any {
    if (!requestData) return undefined;

    return {
      sessionId: requestData.sessionId,
      userType: requestData.userType,
      messageLength: requestData.message?.length,
      hasMetadata: !!requestData.metadata,
      timestamp: requestData.timestamp
    };
  }

  /**
   * Sanitiza dados de resposta
   */
  private sanitizeResponseData(responseData?: any): any {
    if (!responseData) return undefined;

    return {
      success: responseData.success,
      hasData: !!responseData.data,
      responseLength: typeof responseData.data?.response === 'string'
        ? responseData.data.response.length
        : undefined,
      hasActions: Array.isArray(responseData.data?.actions) && responseData.data.actions.length > 0
    };
  }

  /**
   * Atualiza métricas da sessão
   */
  private updateSessionMetrics(sessionId: string, type: 'message' | 'error'): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics) {
      if (type === 'message') {
        metrics.messagesCount++;
      } else {
        metrics.errorsCount++;
      }
      metrics.lastActivity = Date.now();
    }
  }

  /**
   * Obtém métricas da sessão
   */
  getSessionMetrics(sessionId: string): {
    messagesCount: number;
    errorsCount: number;
    duration: number;
    lastActivity: number;
  } | null {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return null;

    return {
      messagesCount: metrics.messagesCount,
      errorsCount: metrics.errorsCount,
      duration: Date.now() - metrics.startTime,
      lastActivity: metrics.lastActivity
    };
  }

  /**
   * Limpa métricas antigas
   */
  cleanupOldMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [sessionId, metrics] of this.sessionMetrics.entries()) {
      if (now - metrics.lastActivity > maxAgeMs) {
        this.sessionMetrics.delete(sessionId);
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let chatLoggerInstance: ChatLogger | null = null;

/**
 * Obtém instância singleton do chat logger
 */
export function getChatLogger(config?: Partial<ChatLoggingConfig>): ChatLogger {
  if (!chatLoggerInstance) {
    chatLoggerInstance = new ChatLogger(config);
  }
  return chatLoggerInstance;
}

/**
 * Configura o chat logger global
 */
export function configureChatLogger(config: Partial<ChatLoggingConfig>): void {
  chatLoggerInstance = new ChatLogger(config);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log rápido de erro de chat
 */
export function logChatError(error: ChatAppError, context?: Record<string, any>): void {
  getChatLogger().logChatError(error, context);
}

/**
 * Log rápido de ameaça de segurança
 */
export function logSecurityThreat(
  type: 'xss' | 'sql_injection' | 'suspicious_content' | 'rate_limit' | 'invalid_domain',
  content: string,
  sessionId?: string,
  context?: Record<string, any>
): void {
  getChatLogger().logSecurityThreat(type, content, sessionId, context);
}

/**
 * Log rápido de performance
 */
export function logChatPerformance(
  operation: string,
  duration: number,
  sessionId?: string,
  context?: Record<string, any>
): void {
  getChatLogger().logPerformanceMetrics(operation, duration, sessionId, context);
}

/**
 * Log rápido de atividade de sessão
 */
export function logSessionActivity(
  type: 'start' | 'end' | 'message_sent' | 'response_received',
  sessionId: string,
  context?: Record<string, any>
): void {
  const logger = getChatLogger();

  switch (type) {
    case 'start':
      logger.logSessionStart(sessionId, context?.userType || 'public', context);
      break;
    case 'end':
      logger.logSessionEnd(sessionId, context);
      break;
    case 'message_sent':
      logger.logMessageSent(
        sessionId,
        context?.messageId || '',
        context?.messageLength || 0,
        context?.userType || 'public',
        context
      );
      break;
    case 'response_received':
      logger.logResponseReceived(
        sessionId,
        context?.messageId || '',
        context?.responseTime || 0,
        context?.success || false,
        context
      );
      break;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ChatLogger };
export type { ChatLoggingConfig };
