/**
 * Chat Error Factory
 *
 * Extensão do sistema de error handling para tipos específicos de chat
 */

import {
    createError
} from '@/lib/errors/factory';
import {
    AppError
} from '@/lib/errors/types';
import {
    ChatError,
    ChatErrorType,
    N8nChatRequest,
    N8nChatResponse
} from './chatTypes';

// ============================================================================
// CHAT ERROR CODES
// ============================================================================

export const CHAT_ERROR_CODES = {
  // Validação de chat
  INVALID_MESSAGE_CONTENT: 'CHAT_INVALID_MESSAGE_CONTENT',
  MESSAGE_TOO_LONG: 'CHAT_MESSAGE_TOO_LONG',
  EMPTY_MESSAGE: 'CHAT_EMPTY_MESSAGE',
  INVALID_SESSION_ID: 'CHAT_INVALID_SESSION_ID',
  INVALID_USER_TYPE: 'CHAT_INVALID_USER_TYPE',

  // Segurança
  XSS_DETECTED: 'CHAT_XSS_DETECTED',
  SQL_INJECTION_DETECTED: 'CHAT_SQL_INJECTION_DETECTED',
  SUSPICIOUS_CONTENT: 'CHAT_SUSPICIOUS_CONTENT',
  RATE_LIMIT_EXCEEDED: 'CHAT_RATE_LIMIT_EXCEEDED',
  SESSION_BLOCKED: 'CHAT_SESSION_BLOCKED',
  INVALID_DOMAIN: 'CHAT_INVALID_DOMAIN',

  // Webhook/N8n
  WEBHOOK_UNREACHABLE: 'CHAT_WEBHOOK_UNREACHABLE',
  WEBHOOK_TIMEOUT: 'CHAT_WEBHOOK_TIMEOUT',
  WEBHOOK_INVALID_RESPONSE: 'CHAT_WEBHOOK_INVALID_RESPONSE',
  WEBHOOK_AUTH_FAILED: 'CHAT_WEBHOOK_AUTH_FAILED',
  N8N_WORKFLOW_ERROR: 'CHAT_N8N_WORKFLOW_ERROR',

  // Sessão
  SESSION_EXPIRED: 'CHAT_SESSION_EXPIRED',
  SESSION_NOT_FOUND: 'CHAT_SESSION_NOT_FOUND',
  SESSION_LIMIT_REACHED: 'CHAT_SESSION_LIMIT_REACHED',

  // Histórico
  HISTORY_LOAD_FAILED: 'CHAT_HISTORY_LOAD_FAILED',
  HISTORY_SAVE_FAILED: 'CHAT_HISTORY_SAVE_FAILED',
  HISTORY_CORRUPTED: 'CHAT_HISTORY_CORRUPTED',

  // Voz
  VOICE_NOT_SUPPORTED: 'CHAT_VOICE_NOT_SUPPORTED',
  MICROPHONE_ACCESS_DENIED: 'CHAT_MICROPHONE_ACCESS_DENIED',
  VOICE_RECOGNITION_FAILED: 'CHAT_VOICE_RECOGNITION_FAILED',

  // Sistema
  CHAT_SYSTEM_ERROR: 'CHAT_SYSTEM_ERROR',
  CHAT_CONFIG_ERROR: 'CHAT_CONFIG_ERROR'
} as const;

export const CHAT_ERROR_MESSAGES = {
  [CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT]: 'Conteúdo da mensagem inválido',
  [CHAT_ERROR_CODES.MESSAGE_TOO_LONG]: 'Mensagem muito longa',
  [CHAT_ERROR_CODES.EMPTY_MESSAGE]: 'Mensagem não pode estar vazia',
  [CHAT_ERROR_CODES.INVALID_SESSION_ID]: 'ID de sessão inválido',
  [CHAT_ERROR_CODES.INVALID_USER_TYPE]: 'Tipo de usuário inválido',

  [CHAT_ERROR_CODES.XSS_DETECTED]: 'Conteúdo potencialmente perigoso detectado',
  [CHAT_ERROR_CODES.SQL_INJECTION_DETECTED]: 'Padrão de injeção SQL detectado',
  [CHAT_ERROR_CODES.SUSPICIOUS_CONTENT]: 'Conteúdo suspeito detectado',
  [CHAT_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Muitas mensagens enviadas. Aguarde um momento.',
  [CHAT_ERROR_CODES.SESSION_BLOCKED]: 'Sessão bloqueada por violação de segurança',
  [CHAT_ERROR_CODES.INVALID_DOMAIN]: 'Domínio não autorizado',

  [CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE]: 'Não foi possível conectar ao serviço de chat',
  [CHAT_ERROR_CODES.WEBHOOK_TIMEOUT]: 'O serviço de chat demorou para responder',
  [CHAT_ERROR_CODES.WEBHOOK_INVALID_RESPONSE]: 'Resposta inválida do serviço de chat',
  [CHAT_ERROR_CODES.WEBHOOK_AUTH_FAILED]: 'Falha na autenticação com o serviço de chat',
  [CHAT_ERROR_CODES.N8N_WORKFLOW_ERROR]: 'Erro no fluxo de trabalho do chat',

  [CHAT_ERROR_CODES.SESSION_EXPIRED]: 'Sessão de chat expirada',
  [CHAT_ERROR_CODES.SESSION_NOT_FOUND]: 'Sessão de chat não encontrada',
  [CHAT_ERROR_CODES.SESSION_LIMIT_REACHED]: 'Limite de sessões simultâneas atingido',

  [CHAT_ERROR_CODES.HISTORY_LOAD_FAILED]: 'Falha ao carregar histórico do chat',
  [CHAT_ERROR_CODES.HISTORY_SAVE_FAILED]: 'Falha ao salvar histórico do chat',
  [CHAT_ERROR_CODES.HISTORY_CORRUPTED]: 'Histórico do chat corrompido',

  [CHAT_ERROR_CODES.VOICE_NOT_SUPPORTED]: 'Entrada por voz não suportada neste navegador',
  [CHAT_ERROR_CODES.MICROPHONE_ACCESS_DENIED]: 'Acesso ao microfone negado',
  [CHAT_ERROR_CODES.VOICE_RECOGNITION_FAILED]: 'Falha no reconhecimento de voz',

  [CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR]: 'Erro interno do sistema de chat',
  [CHAT_ERROR_CODES.CHAT_CONFIG_ERROR]: 'Erro de configuração do chat'
} as const;

// ============================================================================
// CHAT ERROR INTERFACE EXTENSION
// ============================================================================

export interface ChatAppError extends AppError {
  /** ID da sessão relacionada */
  sessionId?: string;
  /** ID da mensagem relacionada */
  messageId?: string;
  /** Tipo de chat (public/admin) */
  chatType?: 'public' | 'admin';
  /** Dados da requisição que causou o erro */
  requestData?: Partial<N8nChatRequest>;
  /** Dados da resposta que causou o erro */
  responseData?: Partial<N8nChatResponse>;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Cria erro específico de chat
 */
export function createChatError(
  code: string,
  message?: string,
  options: Partial<ChatAppError> = {}
): ChatAppError {
  const userMessage = message || CHAT_ERROR_MESSAGES[code as keyof typeof CHAT_ERROR_MESSAGES] || message || 'Erro no chat';

  return {
    ...createError(code, message, {
      category: 'external_api',
      severity: 'medium',
      actionable: true,
      retryable: false,
      ...options
    }),
    sessionId: options.sessionId,
    messageId: options.messageId,
    chatType: options.chatType,
    requestData: options.requestData,
    responseData: options.responseData
  };
}

/**
 * Cria erro de validação de mensagem
 */
export function createMessageValidationError(
  field: string,
  value: any,
  sessionId?: string,
  messageId?: string
): ChatAppError {
  let code = CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT;
  let message = 'Conteúdo da mensagem inválido';

  if (field === 'content') {
    if (!value || value.trim() === '') {
      code = CHAT_ERROR_CODES.EMPTY_MESSAGE;
      message = 'Mensagem não pode estar vazia';
    } else if (value.length > 1000) {
      code = CHAT_ERROR_CODES.MESSAGE_TOO_LONG;
      message = 'Mensagem muito longa (máximo 1000 caracteres)';
    }
  } else if (field === 'sessionId') {
    code = CHAT_ERROR_CODES.INVALID_SESSION_ID;
    message = 'ID de sessão inválido';
  }

  return createChatError(code, message, {
    category: 'validation',
    severity: 'medium',
    actionable: true,
    retryable: false,
    sessionId,
    messageId,
    context: {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value
    }
  });
}

/**
 * Cria erro de segurança
 */
export function createSecurityError(
  type: 'xss' | 'sql_injection' | 'suspicious_content' | 'rate_limit' | 'session_blocked' | 'invalid_domain',
  content?: string,
  sessionId?: string,
  context?: Record<string, unknown>
): ChatAppError {
  const codeMap = {
    xss: CHAT_ERROR_CODES.XSS_DETECTED,
    sql_injection: CHAT_ERROR_CODES.SQL_INJECTION_DETECTED,
    suspicious_content: CHAT_ERROR_CODES.SUSPICIOUS_CONTENT,
    rate_limit: CHAT_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    session_blocked: CHAT_ERROR_CODES.SESSION_BLOCKED,
    invalid_domain: CHAT_ERROR_CODES.INVALID_DOMAIN
  };

  const code = codeMap[type];
  const message = CHAT_ERROR_MESSAGES[code];

  return createChatError(code, message, {
    category: 'validation',
    severity: type === 'session_blocked' ? 'high' : 'medium',
    actionable: type === 'rate_limit',
    retryable: type === 'rate_limit',
    sessionId,
    context: {
      securityThreatType: type,
      suspiciousContent: content ? content.substring(0, 100) : undefined,
      ...context
    }
  });
}

/**
 * Cria erro de webhook/n8n
 */
export function createWebhookError(
  type: 'unreachable' | 'timeout' | 'invalid_response' | 'auth_failed' | 'workflow_error',
  statusCode?: number,
  endpoint?: string,
  sessionId?: string,
  requestData?: Partial<N8nChatRequest>,
  responseData?: any
): ChatAppError {
  const codeMap = {
    unreachable: CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE,
    timeout: CHAT_ERROR_CODES.WEBHOOK_TIMEOUT,
    invalid_response: CHAT_ERROR_CODES.WEBHOOK_INVALID_RESPONSE,
    auth_failed: CHAT_ERROR_CODES.WEBHOOK_AUTH_FAILED,
    workflow_error: CHAT_ERROR_CODES.N8N_WORKFLOW_ERROR
  };

  const code = codeMap[type];
  const message = CHAT_ERROR_MESSAGES[code];

  return createChatError(code, message, {
    category: 'external_api',
    severity: type === 'auth_failed' ? 'high' : 'medium',
    actionable: type === 'timeout' || type === 'unreachable',
    retryable: type === 'timeout' || type === 'unreachable',
    sessionId,
    requestData,
    responseData,
    context: {
      webhookType: type,
      statusCode,
      endpoint,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Cria erro de sessão
 */
export function createSessionError(
  type: 'expired' | 'not_found' | 'limit_reached',
  sessionId?: string,
  context?: Record<string, unknown>
): ChatAppError {
  const codeMap = {
    expired: CHAT_ERROR_CODES.SESSION_EXPIRED,
    not_found: CHAT_ERROR_CODES.SESSION_NOT_FOUND,
    limit_reached: CHAT_ERROR_CODES.SESSION_LIMIT_REACHED
  };

  const code = codeMap[type];
  const message = CHAT_ERROR_MESSAGES[code];

  return createChatError(code, message, {
    category: 'business_logic',
    severity: 'medium',
    actionable: type === 'expired',
    retryable: type === 'expired',
    sessionId,
    context: {
      sessionErrorType: type,
      ...context
    }
  });
}

/**
 * Cria erro de histórico
 */
export function createHistoryError(
  type: 'load_failed' | 'save_failed' | 'corrupted',
  sessionId?: string,
  error?: Error
): ChatAppError {
  const codeMap = {
    load_failed: CHAT_ERROR_CODES.HISTORY_LOAD_FAILED,
    save_failed: CHAT_ERROR_CODES.HISTORY_SAVE_FAILED,
    corrupted: CHAT_ERROR_CODES.HISTORY_CORRUPTED
  };

  const code = codeMap[type];
  const message = CHAT_ERROR_MESSAGES[code];

  return createChatError(code, message, {
    category: 'system',
    severity: 'medium',
    actionable: false,
    retryable: type !== 'corrupted',
    sessionId,
    originalError: error,
    context: {
      historyErrorType: type,
      storageType: 'localStorage'
    }
  });
}

/**
 * Cria erro de voz
 */
export function createVoiceError(
  type: 'not_supported' | 'access_denied' | 'recognition_failed',
  error?: Error,
  context?: Record<string, unknown>
): ChatAppError {
  const codeMap = {
    not_supported: CHAT_ERROR_CODES.VOICE_NOT_SUPPORTED,
    access_denied: CHAT_ERROR_CODES.MICROPHONE_ACCESS_DENIED,
    recognition_failed: CHAT_ERROR_CODES.VOICE_RECOGNITION_FAILED
  };

  const code = codeMap[type];
  const message = CHAT_ERROR_MESSAGES[code];

  return createChatError(code, message, {
    category: 'system',
    severity: 'medium',
    actionable: type === 'access_denied',
    retryable: type === 'recognition_failed',
    originalError: error,
    context: {
      voiceErrorType: type,
      browserSupport: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      ...context
    }
  });
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Converte ChatError para ChatAppError
 */
export function fromChatError(chatError: ChatError): ChatAppError {
  let code = CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR;
  let category: AppError['category'] = 'system';

  // Mapear tipos de ChatError para códigos específicos
  switch (chatError.type) {
    case ChatErrorType.VALIDATION_ERROR:
      code = CHAT_ERROR_CODES.INVALID_MESSAGE_CONTENT;
      category = 'validation';
      break;
    case ChatErrorType.WEBHOOK_ERROR:
      code = CHAT_ERROR_CODES.WEBHOOK_UNREACHABLE;
      category = 'external_api';
      break;
    case ChatErrorType.SESSION_ERROR:
      code = CHAT_ERROR_C.SESSION_EXPIRED;
      category = 'business_logic';
      break;
    case ChatErrorType.NETWORK_ERROR:
      code = CHAT_ERROR_CODES.WEBHOOK_TIMEOUT;
      category = 'network';
      break;
  }

  return createChatError(code, chatError.message, {
    category,
    severity: 'medium',
    actionable: chatError.retryable,
    retryable: chatError.retryable,
    sessionId: chatError.sessionId,
    messageId: chatError.messageId,
    originalError: chatError.originalError,
    context: chatError.context
  });
}

/**
 * Converte erro de fetch específico para chat
 */
export function fromChatFetchError(
  error: any,
  endpoint?: string,
  sessionId?: string,
  requestData?: Partial<N8nChatRequest>
): ChatAppError {
  if (error.name === 'AbortError') {
    return createWebhookError('timeout', undefined, endpoint, sessionId, requestData);
  }

  if (error.status) {
    if (error.status >= 500) {
      return createWebhookError('unreachable', error.status, endpoint, sessionId, requestData);
    } else if (error.status === 401 || error.status === 403) {
      return createWebhookError('auth_failed', error.status, endpoint, sessionId, requestData);
    } else {
      return createWebhookError('invalid_response', error.status, endpoint, sessionId, requestData);
    }
  }

  return createWebhookError('unreachable', undefined, endpoint, sessionId, requestData);
}

// ============================================================================
// CONTEXT HELPERS
// ============================================================================

/**
 * Adiciona contexto de chat ao erro
 */
export function withChatContext(
  error: ChatAppError,
  sessionId?: string,
  messageId?: string,
  chatType?: 'public' | 'admin'
): ChatAppError {
  return {
    ...error,
    sessionId: sessionId || error.sessionId,
    messageId: messageId || error.messageId,
    chatType: chatType || error.chatType,
    context: {
      ...error.context,
      chatContext: {
        sessionId,
        messageId,
        chatType,
        timestamp: new Date().toISOString()
      }
    }
  };
}

/**
 * Adiciona dados de requisição ao erro
 */
export function withRequestData(
  error: ChatAppError,
  requestData: Partial<N8nChatRequest>
): ChatAppError {
  return {
    ...error,
    requestData,
    context: {
      ...error.context,
      requestData: {
        sessionId: requestData.sessionId,
        userType: requestData.userType,
        messageLength: requestData.message?.length,
        hasMetadata: !!requestData.metadata
      }
    }
  };
}

/**
 * Adiciona dados de resposta ao erro
 */
export function withResponseData(
  error: ChatAppError,
  responseData: any
): ChatAppError {
  return {
    ...error,
    responseData,
    context: {
      ...error.context,
      responseData: {
        success: responseData?.success,
        hasData: !!responseData?.data,
        responseType: typeof responseData
      }
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    CHAT_ERROR_CODES,
    CHAT_ERROR_MESSAGES
};

    export type { ChatAppError };
