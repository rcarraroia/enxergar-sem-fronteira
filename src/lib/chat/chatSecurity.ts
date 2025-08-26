/**
 * Chat Security - Validação e Sanitização
 *
 * Sistema de segurança para validação e sanitização de dados do chat
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import {
    N8nChatResponse
} from './chatTypes';
import {
  createSecurityError,
  createChatError,
  CHAT_ERROR_CODES,
  type ChatAppError
} from './chatErrorFactory';
import { logChatError, logSecurityThreat } from './chatLogger';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Configuração do DOMPurify para sanitização
 */
const PURIFY_CONFIG = {
  // Permitir apenas texto puro, sem HTML
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
  // Configurações específicas para chat
  FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Padrões de conteúdo perigoso
 */
const DANGEROUS_PATTERNS = [
  // JavaScript
  /javascript:/gi,
  /data:text\/html/gi,
  /vbscript:/gi,

  // Event handlers
  /on\w+\s*=/gi,

  // HTML entities suspeitas
  /&#x?[0-9a-f]+;?/gi,

  // URLs suspeitas
  /https?:\/\/[^\s<>"']+/gi,

  // Tentativas de injeção
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,

  // SQL Injection básica
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,

  // Command injection
  /(\||&|;|\$\(|\`)/g
];

/**
 * Palavras proibidas (pode ser configurado)
 */
const FORBIDDEN_WORDS = [
  // Adicionar palavras específicas se necessário
];

/**
 * Limites de segurança
 */
const SECURITY_LIMITS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_URL_COUNT: 3,
  MAX_SPECIAL_CHARS_RATIO: 0.3,
  MAX_REPEATED_CHARS: 10,
  MAX_LINES: 20
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema para validação de mensagem segura
 */
const secureMessageSchema = z.object({
  content: z.string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(SECURITY_LIMITS.MAX_MESSAGE_LENGTH, `Mensagem muito longa (máximo ${SECURITY_LIMITS.MAX_MESSAGE_LENGTH} caracteres)`)
    .refine(
      (content) => !containsDangerousPatterns(content),
      'Conteúdo contém elementos não permitidos'
    )
    .refine(
      (content) => !exceedsSpecialCharsRatio(content),
      'Muitos caracteres especiais detectados'
    )
    .refine(
      (content) => !hasExcessiveRepetition(content),
      'Repetição excessiva de caracteres detectada'
    )
    .refine(
      (content) => !exceedsLineLimit(content),
      `Muitas linhas (máximo ${SECURITY_LIMITS.MAX_LINES})`
    ),
  sessionId: z.string().uuid('ID de sessão inválido'),
  userType: z.enum(['public', 'admin'])
});

/**
 * Schema para validação de resposta n8n
 */
const secureN8nResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    response: z.string()
      .max(SECURITY_LIMITS.MAX_MESSAGE_LENGTH * 2, 'Resposta muito longa')
      .refine(
        (content) => !containsDangerousPatterns(content),
        'Resposta contém elementos não permitidos'
      ),
    actions: z.array(z.object({
      type: z.enum(['redirect', 'form', 'download', 'end_session']),
      payload: z.record(z.unknown()),
      description: z.string().optional()
    })).optional(),
    sessionComplete: z.boolean().optional()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean()
  }).optional()
});

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitiza conteúdo de mensagem
 */
export const sanitizeMessageContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Primeira passada: DOMPurify
  let sanitized = DOMPurify.sanitize(content, PURIFY_CONFIG);

  // Segunda passada: limpeza manual adicional
  sanitized = sanitized
    // Remover caracteres de controle
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalizar espaços em branco
    .replace(/\s+/g, ' ')
    // Remover espaços no início e fim
    .trim()
    // Limitar quebras de linha consecutivas
    .replace(/\n{3,}/g, '\n\n')
    // Remover URLs suspeitas (opcional, pode ser configurado)
    .replace(/https?:\/\/[^\s<>"']+/gi, '[URL removida]');

  return sanitized;
};

/**
 * Sanitiza dados de sessão
 */
export const sanitizeSessionData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Sanitizar chave
    const cleanKey = DOMPurify.sanitize(key, PURIFY_CONFIG);

    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeMessageContent(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[cleanKey] = value;
    } else if (value && typeof value === 'object') {
      // Recursivo para objetos aninhados (com limite de profundidade)
      sanitized[cleanKey] = sanitizeSessionData(value as Record<string, unknown>);
    }
    // Ignorar outros tipos (functions, symbols, etc.)
  }

  return sanitized;
};

/**
 * Sanitiza resposta do n8n
 */
export const sanitizeN8nResponse = (response: N8nChatResponse): N8nChatResponse => {
  const sanitized: N8nChatResponse = {
    success: response.success
  };

  if (response.message) {
    sanitized.message = sanitizeMessageContent(response.message);
  }

  if (response.data) {
    sanitized.data = {
      response: sanitizeMessageContent(response.data.response || ''),
      sessionComplete: response.data.sessionComplete
    };

    if (response.data.actions) {
      sanitized.data.actions = response.data.actions.map(action => ({
        type: action.type,
        payload: sanitizeSessionData(action.payload),
        description: action.description ? sanitizeMessageContent(action.description) : undefined
      }));
    }
  }

  if (response.error) {
    sanitized.error = {
      code: DOMPurify.sanitize(response.error.code, PURIFY_CONFIG),
      message: sanitizeMessageContent(response.error.message),
      retryable: response.error.retryable
    };
  }

  return sanitized;
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida e sanitiza mensagem de chat
 */
export const validateAndSanitizeChatMessage = (
  content: string,
  sessionId: string,
  userType: 'public' | 'admin'
): { success: true; data: string } | { success: false; error: string } => {
  try {
    // Sanitizar primeiro
    const sanitizedContent = sanitizeMessageContent(content);

    // Validar com schema
    const validation = secureMessageSchema.safeParse({
      content: sanitizedContent,
      sessionId,
      userType
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Dados inválidos'
      };
    }

    return {
      success: true,
      data: sanitizedContent
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro na validação de segurança'
    };
  }
};

/**
 * Valida resposta do n8n
 */
export const validateN8nResponse = (response: unknown): {
  success: true;
  data: N8nChatResponse;
} | {
  success: false;
  error: string;
} => {
  try {
    const validation = secureN8nResponseSchema.safeParse(response);

    if (!validation.success) {
      return {
        success: false,
        error: 'Resposta do servidor inválida'
      };
    }

    // Sanitizar resposta validada
    const sanitizedResponse = sanitizeN8nResponse(validation.data);

    return {
      success: true,
      data: sanitizedResponse
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro na validação da resposta'
    };
  }
};

/**
 * Valida URL de webhook
 */
export const validateWebhookUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);

    // Deve ser HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Verificar domínios permitidos (configurável)
    const allowedDomains = process.env.VITE_ALLOWED_WEBHOOK_DOMAINS?.split(',') || [];
    if (allowedDomains.length > 0 && !allowedDomains.includes(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// SECURITY CHECKS
// ============================================================================

/**
 * Verifica se contém padrões perigosos
 */
function containsDangerousPatterns(content: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Verifica se excede a proporção de caracteres especiais
 */
function exceedsSpecialCharsRatio(content: string): boolean {
  const specialChars = content.match(/[^a-zA-Z0-9\s\u00C0-\u017F]/g) || [];
  const ratio = specialChars.length / content.length;
  return ratio > SECURITY_LIMITS.MAX_SPECIAL_CHARS_RATIO;
}

/**
 * Verifica repetição excessiva de caracteres
 */
function hasExcessiveRepetition(content: string): boolean {
  const matches = content.match(/(.)\1+/g) || [];
  return matches.some(match => match.length > SECURITY_LIMITS.MAX_REPEATED_CHARS);
}

/**
 * Verifica se excede limite de linhas
 */
function exceedsLineLimit(content: string): boolean {
  const lines = content.split('
').length;
  return lines > SECURITY_LIMITS.MAX_LINES;
}

/**
 * Verifica palavras proibidas
 */
function containsForbiddenWords(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return FORBIDDEN_WORDS.some(word => lowerContent.includes(word.toLowerCase()));
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limiter simples baseado em sessão
 */
class SessionRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 10, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Verifica se sessão pode enviar mensagem
   */
  canSendMessage(sessionId: string): boolean {
    const now = Date.now();
    const sessionData = this.attempts.get(sessionId);

    if (!sessionData || now > sessionData.resetTime) {
      // Reset ou primeira tentativa
      this.attempts.set(sessionId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (sessionData.count >= this.maxAttempts) {
      return false;
    }

    sessionData.count++;
    return true;
  }

  /**
   * Limpa dados expirados
   */
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.attempts.entries()) {
      if (now > data.resetTime) {
        this.attempts.delete(sessionId);
      }
    }
  }
}

// Instância global do rate limiter
export const chatRateLimiter = new SessionRateLimiter();

// Limpeza periódica
setInterval(() => {
  chatRateLimiter.cleanup();
}, 300000); // 5 minutos

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Middleware de segurança para mensagens
 */
export const securityMiddleware = {
  /**
   * Valida mensagem antes do envio
   */
  validateMessage: (
    content: string,
    sessionId: string,
    userType: 'public' | 'admin'
  ): { allowed: boolean; sanitizedContent?: string; error?: string } => {
    // Rate limiting
    if (!chatRateLimiter.canSendMessage(sessionId)) {
      return {
        allowed: false,
        error: 'Muitas mensagens enviadas. Aguarde um momento.'
      };
    }

    // Validação e sanitização
    const validation = validateAndSanitizeChatMessage(content, sessionId, userType);

    if (!validation.success) {
      return {
        allowed: false,
        error: validation.error
      };
    }

    return {
      allowed: true,
      sanitizedContent: validation.data
    };
  },

  /**
   * Valida resposta do servidor
   */
  validateResponse: (response: unknown) => {
    return validateN8nResponse(response);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    PURIFY_CONFIG, sanitizeMessageContent, sanitizeN8nResponse, sanitizeSessionData, SECURITY_LIMITS, validateAndSanitizeChatMessage,
    validateN8nResponse,
    validateWebhookUrl
};
