/**
 * Chat Validation Schemas
 *
 * Schemas de validação usando Zod para o sistema de chat
 */

import { z } from 'zod';
import { ChatErrorType } from './chatTypes';

// ============================================================================
// BASIC SCHEMAS
// ============================================================================

/**
 * Schema para validação de conteúdo de mensagem
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Mensagem não pode estar vazia')
  .max(1000, 'Mensagem muito longa (máximo 1000 caracteres)')
  .refine(
    (content) => !containsXSS(content),
    'Conteúdo inválido detectado'
  );

/**
 * Schema para validação de ID de sessão
 */
export const sessionIdSchema = z
  .string()
  .regex(/^chat_[a-z0-9]+_[a-z0-9]+$/, 'ID de sessão inválido');

/**
 * Schema para validação de ID de mensagem
 */
export const messageIdSchema = z
  .string()
  .regex(/^msg_[a-z0-9]+_[a-z0-9]+$/, 'ID de mensagem inválido');

/**
 * Schema para validação de URL de webhook
 */
export const webhookUrlSchema = z
  .string()
  .url('URL inválida')
  .refine(
    (url) => url.startsWith('https://'),
    'Webhook deve usar HTTPS'
  );

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

/**
 * Schema para validação de mensagem de chat
 */
export const chatMessageSchema = z.object({
  id: messageIdSchema,
  content: messageContentSchema,
  sender: z.enum(['user', 'agent'] as const),
  timestamp: z.date(),
  status: z.enum(['sending', 'sent', 'delivered', 'error'] as const),
  metadata: z.object({
    retryCount: z.number().min(0).optional(),
    errorMessage: z.string().optional(),
    voiceInput: z.boolean().optional(),
    responseTime: z.number().min(0).optional()
  }).optional()
});

/**
 * Schema para criação de nova mensagem
 */
export const createMessageSchema = z.object({
  content: messageContentSchema,
  sender: z.enum(['user', 'agent'] as const),
  voiceInput: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
});

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

/**
 * Schema para validação de sessão de chat
 */
export const chatSessionSchema = z.object({
  id: sessionIdSchema,
  type: z.enum(['public', 'admin'] as const),
  messages: z.array(chatMessageSchema),
  isActive: z.boolean(),
  isTyping: z.boolean(),
  webhookUrl: webhookUrlSchema,
  lastActivity: z.date(),
  metadata: z.object({
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    sessionData: z.record(z.unknown()).optional()
  }).optional()
});

/**
 * Schema para criação de nova sessão
 */
export const createSessionSchema = z.object({
  type: z.enum(['public', 'admin'] as const),
  webhookUrl: webhookUrlSchema,
  metadata: z.record(z.unknown()).optional()
});

// ============================================================================
// N8N INTEGRATION SCHEMAS
// ============================================================================

/**
 * Schema para requisição ao n8n
 */
export const n8nRequestSchema = z.object({
  sessionId: sessionIdSchema,
  message: messageContentSchema,
  userType: z.enum(['public', 'admin'] as const),
  timestamp: z.string().datetime(),
  metadata: z.object({
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    sessionData: z.record(z.unknown()).optional()
  }).optional()
});

/**
 * Schema para resposta do n8n
 */
export const n8nResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    response: z.string(),
    actions: z.array(z.object({
      type: z.enum(['redirect', 'form', 'download', 'end_session'] as const),
      payload: z.record(z.unknown()),
      description: z.string().optional()
    })).optional(),
    sessionComplete: z.boolean().optional(),
    nextStepData: z.record(z.unknown()).optional()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean()
  }).optional()
});

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Schema para configuração de webhooks n8n
 */
export const n8nConfigSchema = z.object({
  publicCaptureUrl: webhookUrlSchema,
  adminSupportUrl: webhookUrlSchema,
  timeout: z.number().min(1000).max(60000),
  retryAttempts: z.number().min(0).max(5),
  headers: z.record(z.string()),
  apiKey: z.string().optional()
});

/**
 * Schema para configuração de voz
 */
export const voiceConfigSchema = z.object({
  enabled: z.boolean(),
  language: z.string().min(2).max(10),
  apiKey: z.string().optional(),
  provider: z.enum(['browser', 'external'] as const),
  settings: z.object({
    sensitivity: z.number().min(0).max(1).optional(),
    maxRecordingTime: z.number().min(1000).max(60000).optional(),
    noiseCancellation: z.boolean().optional()
  }).optional()
});

/**
 * Schema para feature flags
 */
export const featureFlagsSchema = z.object({
  enablePublicChat: z.boolean(),
  enableAdminChat: z.boolean(),
  enableVoiceInput: z.boolean(),
  enableMultipleSessions: z.boolean(),
  debugMode: z.boolean()
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

/**
 * Schema para erro de chat
 */
export const chatErrorSchema = z.object({
  type: z.nativeEnum(ChatErrorType),
  message: z.string().min(1),
  retryable: z.boolean(),
  sessionId: sessionIdSchema.optional(),
  messageId: messageIdSchema.optional(),
  context: z.record(z.unknown()).optional()
});

// ============================================================================
// STORAGE SCHEMAS
// ============================================================================

/**
 * Schema para dados do localStorage
 */
export const storageSchema = z.object({
  sessions: z.array(chatSessionSchema),
  version: z.string(),
  timestamp: z.string().datetime()
});

// ============================================================================
// COMPONENT PROPS SCHEMAS
// ============================================================================

/**
 * Schema para props do ChatInterface
 */
export const chatInterfacePropsSchema = z.object({
  type: z.enum(['public', 'admin'] as const),
  webhookUrl: webhookUrlSchema,
  placeholder: z.string().optional(),
  maxHeight: z.number().min(200).max(800).optional(),
  enableVoice: z.boolean().optional(),
  className: z.string().optional(),
  theme: z.enum(['light', 'dark'] as const).optional()
});

/**
 * Schema para props do PublicChatWidget
 */
export const publicChatWidgetPropsSchema = z.object({
  isVisible: z.boolean(),
  position: z.enum(['bottom-right', 'bottom-left', 'inline'] as const).optional(),
  theme: z.enum(['light', 'dark'] as const).optional(),
  className: z.string().optional()
});

/**
 * Schema para props do AdminChatPanel
 */
export const adminChatPanelPropsSchema = z.object({
  className: z.string().optional(),
  defaultExpanded: z.boolean().optional(),
  showMultipleSessions: z.boolean().optional()
});

// ====================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida conteúdo de mensagem
 */
export const validateMessageContent = (content: unknown) => {
  return messageContentSchema.safeParse(content);
};

/**
 * Valida ID de sessão
 */
export const validateSessionId = (id: unknown) => {
  return sessionIdSchema.safeParse(id);
};

/**
 * Valida URL de webhook
 */
export const validateWebhookUrl = (url: unknown) => {
  return webhookUrlSchema.safeParse(url);
};

/**
 * Valida mensagem completa
 */
export const validateChatMessage = (message: unknown) => {
  return chatMessageSchema.safeParse(message);
};

/**
 * Valida sessão completa
 */
export const validateChatSession = (session: unknown) => {
  return chatSessionSchema.safeParse(session);
};

/**
 * Valida requisição para n8n
 */
export const validateN8nRequest = (request: unknown) => {
  return n8nRequestSchema.safeParse(request);
};

/**
 * Valida resposta do n8n
 */
export const validateN8nResponse = (response: unknown) => {
  return n8nResponseSchema.safeParse(response);
};

/**
 * Valida configuração n8n
 */
export const validateN8nConfig = (config: unknown) => {
  return n8nConfigSchema.safeParse(config);
};

/**
 * Valida dados do localStorage
 */
export const validateStorageData = (data: unknown) => {
  return storageSchema.safeParse(data);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verifica se conteúdo contém potencial XSS
 */
function containsXSS(content: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<form\b/gi,
    /<input\b/gi
  ];

  return xssPatterns.some(pattern => pattern.test(content));
}

/**
 * Sanitiza conteúdo removendo caracteres perigosos
 */
export const sanitizeContent = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Valida e sanitiza conteúdo de mensagem
 */
export const validateAndSanitizeMessage = (content: unknown): {
  success: boolean;
  data?: string;
  error?: string;
} => {
  const validation = validateMessageContent(content);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Conteúdo inválido'
    };
  }

  return {
    success: true,
    data: sanitizeContent(validation.data)
  };
};

/**
 * Cria erro de validação formatado
 */
export const createValidationError = (
  field: string,
  message: string,
  value?: unknown
) => {
  return {
    field,
    message,
    value,
    timestamp: new Date().toISOString()
  };
};



// ============================================================================
// EXPORTS
// ============================================================================
