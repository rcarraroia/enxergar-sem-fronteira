/**
 * Security Middleware for Chat
 *
 * Middleware para interceptar e validar comunicações do chat
 * Integrado com o sistema de error handling existente
 */

import {
  validateAndSanitizeMessage,
  validateAndSanitizeN8nRequest,
  validateN8nResponse,
  checkRateLimit
} from './chatSecurity';
import {
  createSecurityError,
  createChatError,
  createSessionError,
  CHAT_ERROR_CODES,
  type ChatAppError
} from './chatErrorFactory';
import { logChatError, logSecurityThreat } from './chatLogger';
import {
  ChatError,
  ChatErrorType,
  N8nChatRequest,
  N8nChatResponse
} from './chatTypes';

// ============================================================================
// TYPES
// ============================================================================

interface SecurityContext {
  sessionId: string;
  userType: 'public' | 'admin';
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
}

interface SecurityMiddlewareOptions {
  enableRateLimit?: boolean;
  maxRequestsPerMinute?: number;
  enableContentValidation?: boolean;
  enableLogging?: boolean;
  strictMode?: boolean;
}

interface MiddlewareResult<T> {
  success: boolean;
  data?: T;
  error?: ChatAppError;
  blocked?: boolean;
  reason?: string;
}

// ============================================================================
// SECURITY MIDDLEWARE CLASS
// ============================================================================

export class ChatSecurityMiddleware {
  private options: Required<SecurityMiddlewareOptions>;
  private blockedSessions = new Set<string>();
  private suspiciousActivity = new Map<string, number>();

  constructor(options: SecurityMiddlewareOptions = {}) {
    this.options = {
      enableRateLimit: true,
      maxRequestsPerMinute: 20,
      enableContentValidation: true,
      enableLogging: true,
      strictMode: false,
      ...options
    };
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Valida mensagem de entrada
   */
  validateIncomingMessage(
    content: string,
    context: SecurityContext
  ): MiddlewareResult<string> {
    try {
      // Verificar se sessão está bloqueada
      if (this.isSessionBlocked(context.sessionId)) {
        const error = createSessionError('expired', context.sessionId, {
          reason: 'Sessão bloqueada por atividade suspeita',
          blockedAt: new Date().toISOString()
        });

        if (this.options.enableLogging) {
          logChatError(error, {
            component: 'SecurityMiddleware',
            method: 'validateIncomingMessage',
            context
          });
        }

        return {
          success: false,
          blocked: true,
          reason: 'Sessão bloqueada por violações de segurança',
          error
        };
      }

      // Rate limiting
      if (this.options.enableRateLimit) {
        const rateLimitResult = this.checkRateLimit(context);
        if (!rateLimitResult.success) {
          return rateLimitResult;
        }
      }

      // Validação de conteúdo
      if (this.options.enableContentValidation) {
        const validationResult = validateAndSanitizeMessage(content);
        if (!validationResult.success) {
          this.recordSuspiciousActivity(context, 'invalid_content');

          const error = createSecurityError(
            'suspicious_content',
            content,
            context.sessionId,
            {
              validationError: validationResult.error,
              userType: context.userType
            }
          );

          if (this.options.enableLogging) {
            logSecurityThreat('suspicious_content', content, context.sessionId, {
              userType: context.userType,
              error: validationResult.error
            });
          }

          return {
            success: false,
            error
          };
        }

        return {
          success: true,
          data: validationResult.data
        };
      }

      return {
        success: true,
        data: content
      };

    } catch (error) {
      const chatError = createChatError(
        CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR,
        'Erro interno na validação de segurança',
        {
          category: 'system',
          severity: 'high',
          sessionId: context.sessionId,
          originalError: error as Error,
          context: {
            component: 'SecurityMiddleware',
            method: 'validateIncomingMessage'
          }
        }
      );

      if (this.options.enableLogging) {
        logChatError(chatError);
      }

      return {
        success: false,
        error: chatError
      };
    }
  }

  /**
   * Valida requisição para n8n
   */
  validateOutgoingRequest(
    request: N8nChatRequest,
    context: SecurityContext
  ): MiddlewareResult<N8nChatRequest> {
    try {
      // Verificar se sessão está bloqueada
      if (this.isSessionBlocked(context.sessionId)) {
        const error = createSessionError('expired', context.sessionId, {
          reason: 'Sessão bloqueada por atividade suspeita'
        });

        return {
          success: false,
          blocked: true,
          reason: 'Sessão bloqueada',
          error
        };
      }

      // Validar estrutura da requisição
      const validationResult = validateAndSanitizeN8nRequest(request);
      if (!validationResult.success) {
        this.recordSuspiciousActivity(context, 'invalid_request');

        const error = createChatError(
          CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT,
          validationResult.error || 'Requisição inválida',
          {
            category: 'validation',
            severity: 'medium',
            sessionId: context.sessionId,
            requestData: request,
            context: {
              validationError: validationResult.error
            }
          }
        );

        if (this.options.enableLogging) {
          logSecurityThreat('suspicious_content', JSON.stringify(request), context.sessionId, {
            userType: context.userType,
            error: validationResult.error
          });
        }

        return {
          success: false,
          error
        };
      }

      return {
        success: true,
        data: validationResult.data
      };

    } catch (error) {
      const chatError = createChatError(
        CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR,
        'Erro interno na validação de requisição',
        {
          category: 'system',
          severity: 'high',
          sessionId: context.sessionId,
          originalError: error as Error,
          requestData: request
        }
      );

      if (this.options.enableLogging) {
        logChatError(chatError);
      }

      return {
        success: false,
        error: chatError
      };
    }
  }

  /**
   * Valida resposta do n8n
   */
  validateIncomingResponse(
    response: unknown,
    context: SecurityContext
  ): MiddlewareResult<N8nChatResponse> {
    try {
      const validationResult = validateN8nResponse(response);
      if (!validationResult.success) {
        const error = createChatError(
          CHAT_ERROR_CODES.WEBHOOK_INVALID_RESPONSE,
          'Resposta do servidor inválida',
          {
            category: 'external_api',
            severity: 'medium',
            sessionId: context.sessionId,
            responseData: response,
            context: {
              validationError: validationResult.error,
              source: 'n8n_response'
            }
          }
        );

        if (this.options.enableLogging) {
          logSecurityThreat('suspicious_content', JSON.stringify(response), context.sessionId, {
            userType: context.userType,
            error: validationResult.error,
            source: 'n8n_response'
          });
        }

        return {
          success: false,
          error
        };
      }

      return {
        success: true,
        data: validationResult.data
      };

    } catch (error) {
      const chatError = createChatError(
        CHAT_ERROR_CODES.WEBHOOK_INVALID_RESPONSE,
        'Erro interno na validação de resposta',
        {
          category: 'external_api',
          severity: 'high',
          sessionId: context.sessionId,
          originalError: error as Error,
          responseData: response
        }
      );

      if (this.options.enableLogging) {
        logChatError(chatError);
      }

      return {
        success: false,
        error: chatError
      };
    }
  }

  /**
   * Bloqueia sessão por atividade suspeita
   */
  blockSession(sessionId: string, reason: string): void {
    this.blockedSessions.add(sessionId);

    if (this.options.enableLogging) {
      const error = createSessionError('expired', sessionId, {
        reason,
        blockedAt: new Date().toISOString(),
        action: 'session_blocked'
      });

      logChatError(error, {
        component: 'SecurityMiddleware',
        action: 'blockSession',
        reason
      });
    }

    // Auto-desbloqueio após 1 hora
    setTimeout(() => {
      this.blockedSessions.delete(sessionId);
    }, 60 * 60 * 1000);
  }

  /**
   * Desbloqueia sessão
   */
  unblockSession(sessionId: string): void {
    this.blockedSessions.delete(sessionId);
    this.suspiciousActivity.delete(sessionId);
  }

  /**
   * Verifica se sessão está bloqueada
   */
  isSessionBlocked(sessionId: string): boolean {
    return this.blockedSessions.has(sessionId);
  }

  /**
   * Obtém estatísticas de segurança
   */
  getSecurityStats(): {
    blockedSessions: number;
    suspiciousActivities: number;
    totalValidations: number;
  } {
    return {
      blockedSessions: this.blockedSessions.size,
      suspiciousActivities: this.suspiciousActivity.size,
      totalValidations: this.getTotalValidations()
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Verifica rate limiting
   */
  private checkRateLimit(context: SecurityContext): MiddlewareResult<void> {
    const identifier = `${context.sessionId}_${context.userType}`;
    const rateLimitResult = checkRateLimit(
      identifier,
      this.options.maxRequestsPerMinute,
      60000 // 1 minuto
    );

    if (!rateLimitResult.allowed) {
      this.recordSuspiciousActivity(context, 'rate_limit_exceeded');

      const error = createSecurityError(
        'rate_limit',
        'Rate limit exceeded',
        context.sessionId,
        {
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
          userType: context.userType
        }
      );

      if (this.options.enableLogging) {
        logSecurityThreat('rate_limit', 'Rate limit exceeded', context.sessionId, {
          userType: context.userType,
          remaining: rateLimitResult.remaining,
          resetTime: new Date(rateLimitResult.resetTime).toISOString()
        });
      }

      return {
        success: false,
        error
      };
    }

    return { success: true };
  }

  /**
   * Registra atividade suspeita
   */
  private recordSuspiciousActivity(
    context: SecurityContext,
    type: string
  ): void {
    const current = this.suspiciousActivity.get(context.sessionId) || 0;
    const newCount = current + 1;
    
    this.suspiciousActivity.set(context.sessionId, newCount);

    // Bloquear sessão após muitas atividades suspeitas
    if (newCount >= 5) {
      this.blockSession(
        context.sessionId,
        `Múltiplas violações de segurança (${newCount}): ${type}`
      );
    }

    // Limpar atividades antigas
    setTimeout(() => {
      const currentCount = this.suspiciousActivity.get(context.sessionId) || 0;
      if (currentCount > 0) {
        this.suspiciousActivity.set(context.sessionId, currentCount - 1);
      }
    }, 10 * 60 * 1000); // 10 minutos
  }

  /**
   * Obtém total de validações (mock)
   */
  private getTotalValidations(): number {
    // Em uma implementação real, isso seria persistido
    return Array.from(this.suspiciousActivity.values()).reduce((a, b) => a + b, 0);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Instância singleton do middleware de segurança
 */
export const chatSecurityMiddleware = new ChatSecurityMiddleware({
  enableRateLimit: true,
  maxRequestsPerMinute: 20,
  enableContentValidation: true,
  enableLogging: true,
  strictMode: process.env.NODE_ENV === 'production'
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Cria contexto de segurança
 */
export function createSecurityContext(
  sessionId: string,
  userType: 'public' | 'admin'
): SecurityContext {
  return {
    sessionId,
    userType,
    userAgent: navigator.userAgent,
    timestamp: new Date()
  };
}

/**
 * Wrapper para validação de mensagem
 */
export function secureValidateMessage(
  content: string,
  sessionId: string,
  userType: 'public' | 'admin'
): MiddlewareResult<string> {
  const context = createSecurityContext(sessionId, userType);
  return chatSecurityMiddleware.validateIncomingMessage(content, context);
}

/**
 * Wrapper para validação de requisição
 */
export function secureValidateRequest(
  request: N8nChatRequest,
  sessionId: string,
  userType: 'public' | 'admin'
): MiddlewareResult<N8nChatRequest> {
  const context = createSecurityContext(sessionId, userType);
  return chatSecurityMiddleware.validateOutgoingRequest(request, context);
}

/**
 * Wrapper para validação de resposta
 */
export function secureValidateResponse(
  response: unknown,
  sessionId: string,
  userType: 'public' | 'admin'
): MiddlewareResult<N8nChatResponse> {
  const context = createSecurityContext(sessionId, userType);
  return chatSecurityMiddleware.validateIncomingResponse(response, context);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ChatSecurityMiddleware;

export type {
  SecurityContext,
  SecurityMiddlewareOptions,
  MiddlewareResult
};
