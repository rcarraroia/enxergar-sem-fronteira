/**
 * Chat Security - Validação e Sanitização
 *
 * Sistema de segurança para validação e sanitização de dados do chat
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import {
    CHAT_ERROR_CODES,
    createChatError,
    createSecurityError,
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
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /eval\s*\(/gi,
  /Function\s*\(/gi
];

/**
 * Limites de segurança
 */
const SECURITY_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_LINES: 50,
  MAX_SPECIAL_CHARS_RATIO: 0.3,
  MAX_REPETITION_LENGTH: 10
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Verifica se contém padrões perigosos
 */
function containsDangerousPatterns(content: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Verifica proporção de caracteres especiais
 */
function exceedsSpecialCharsRatio(content: string): boolean {
  const specialChars = content.match(/[^a-zA-Z0-9\s\.,!?;:\-]/g) || [];
  const ratio = specialChars.length / content.length;
  return ratio > SECURITY_LIMITS.MAX_SPECIAL_CHARS_RATIO;
}

/**
 * Verifica repetição excessiva
 */
function hasExcessiveRepetition(content: string): boolean {
  const repetitionPattern = /(.)\1{9,}/;
  return repetitionPattern.test(content);
}

/**
 * Verifica se excede limite de linhas
 */
function exceedsLineLimit(content: string): boolean {
  const lines = content.split('\n').length;
  return lines > SECURITY_LIMITS.MAX_LINES;
}

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema para validação segura de mensagem
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
 * Valida e sanitiza mensagem de chat
 */
export const validateAndSanitizeChatMessage = (
  content: unknown,
  sessionId: string,
  userType: 'public' | 'admin'
): { success: boolean; data?: string; error?: ChatAppError } => {
  try {
    // Validação do schema
    const validation = secureMessageSchema.safeParse({
      content,
      sessionId,
      userType
    });

    if (!validation.success) {
      const error = createSecurityError(
        'validation_failed',
        validation.error.errors[0]?.message || 'Validação falhou',
        sessionId,
        { userType, errors: validation.error.errors }
      );

      logSecurityThreat('validation_failed', error.message, sessionId, {
        userType,
        content: typeof content === 'string' ? content.substring(0, 100) : String(content)
      });

      return { success: false, error };
    }

    // Sanitização
    const sanitizedContent = sanitizeMessageContent(validation.data.content);

    return {
      success: true,
      data: sanitizedContent
    };

  } catch (error) {
    const chatError = createChatError(
      CHAT_ERROR_CODES.VALIDATION_ERROR,
      'Erro interno na validação de segurança'
    );

    logChatError('Security validation error', { sessionId, userType, error });

    return { success: false, error: chatError };
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  sanitizeMessageContent,
  validateAndSanitizeChatMessage,
  SECURITY_LIMITS
};
