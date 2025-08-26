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
    const identifier = `${context.sessionId}_${context.userType}`;\n    const rateLimitResult = checkRateLimit(\n      identifier,\n      this.options.maxRequestsPerMinute,\n      60000 // 1 minuto\n    );\n\n    if (!rateLimitResult.allowed) {\n      this.recordSuspiciousActivity(context, 'rate_limit_exceeded');\n      \n      const error = createSecurityError(\n        'rate_limit',\n        'Rate limit exceeded',\n        context.sessionId,\n        {\n          remaining: rateLimitResult.remaining,\n          resetTime: new Date(rateLimitResult.resetTime).toISOString(),\n          userType: context.userType\n        }\n      );\n\n      if (this.options.enableLogging) {\n        logSecurityThreat('rate_limit', 'Rate limit exceeded', context.sessionId, {\n          userType: context.userType,\n          remaining: rateLimitResult.remaining,\n          resetTime: new Date(rateLimitResult.resetTime).toISOString()\n        });\n      }\n\n      return {\n        success: false,\n        error\n      };\n    }\n\n    return { success: true };\n  }\n\n  /**\n   * Registra atividade suspeita\n   */\n  private recordSuspiciousActivity(\n    context: SecurityContext,\n    type: string\n  ): void {\n    const current = this.suspiciousActivity.get(context.sessionId) || 0;\n    const newCount = current + 1;\n    \n    this.suspiciousActivity.set(context.sessionId, newCount);\n\n    // Bloquear sessão após muitas atividades suspeitas\n    if (newCount >= 5) {\n      this.blockSession(\n        context.sessionId,\n        `Múltiplas violações de segurança (${newCount}): ${type}`\n      );\n    }\n\n    // Limpar atividades antigas\n    setTimeout(() => {\n      const currentCount = this.suspiciousActivity.get(context.sessionId) || 0;\n      if (currentCount > 0) {\n        this.suspiciousActivity.set(context.sessionId, currentCount - 1);\n      }\n    }, 10 * 60 * 1000); // 10 minutos\n  }\n\n  /**\n   * Obtém total de validações (mock)\n   */\n  private getTotalValidations(): number {\n    // Em uma implementação real, isso seria persistido\n    return Array.from(this.suspiciousActivity.values()).reduce((a, b) => a + b, 0);\n  }\n}\n\n// ============================================================================\n// SINGLETON INSTANCE\n// ============================================================================\n\n/**\n * Instância singleton do middleware de segurança\n */\nexport const chatSecurityMiddleware = new ChatSecurityMiddleware({\n  enableRateLimit: true,\n  maxRequestsPerMinute: 20,\n  enableContentValidation: true,\n  enableLogging: true,\n  strictMode: process.env.NODE_ENV === 'production'\n});\n\n// ============================================================================\n// UTILITY FUNCTIONS\n// ============================================================================\n\n/**\n * Cria contexto de segurança\n */\nexport function createSecurityContext(\n  sessionId: string,\n  userType: 'public' | 'admin'\n): SecurityContext {\n  return {\n    sessionId,\n    userType,\n    userAgent: navigator.userAgent,\n    timestamp: new Date()\n  };\n}\n\n/**\n * Wrapper para validação de mensagem\n */\nexport function secureValidateMessage(\n  content: string,\n  sessionId: string,\n  userType: 'public' | 'admin'\n): MiddlewareResult<string> {\n  const context = createSecurityContext(sessionId, userType);\n  return chatSecurityMiddleware.validateIncomingMessage(content, context);\n}\n\n/**\n * Wrapper para validação de requisição\n */\nexport function secureValidateRequest(\n  request: N8nChatRequest,\n  sessionId: string,\n  userType: 'public' | 'admin'\n): MiddlewareResult<N8nChatRequest> {\n  const context = createSecurityContext(sessionId, userType);\n  return chatSecurityMiddleware.validateOutgoingRequest(request, context);\n}\n\n/**\n * Wrapper para validação de resposta\n */\nexport function secureValidateResponse(\n  response: unknown,\n  sessionId: string,\n  userType: 'public' | 'admin'\n): MiddlewareResult<N8nChatResponse> {\n  const context = createSecurityContext(sessionId, userType);\n  return chatSecurityMiddleware.validateIncomingResponse(response, context);\n}\n\n// ============================================================================\n// EXPORTS\n// ============================================================================\n\nexport default ChatSecurityMiddleware;\n\nexport type {\n  SecurityContext,\n  SecurityMiddlewareOptions,\n  MiddlewareResult\n};
