/**
 * Chat Utility Functions
 *
 * Funções utilitárias para o sistema de chat
 */

import { ChatMessage, ChatSession, ChatType, MessageSender } from './chatTypes';

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Gera um ID único para sessão de chat
 */
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `chat_${timestamp}_${random}`;
};

/**
 * Gera um ID único para mensagem
 */
export const generateMessageId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `msg_${timestamp}_${random}`;
};

// ============================================================================
// MESSAGE UTILITIES
// ============================================================================

/**
 * Cria uma nova mensagem de chat
 */
export const createChatMessage = (
  content: string,
  sender: MessageSender,
  options?: {
    voiceInput?: boolean;
    metadata?: Record<string, unknown>;
  }
): ChatMessage => {
  return {
    id: generateMessageId(),
    content: content.trim(),
    sender,
    timestamp: new Date(),
    status: sender === 'user' ? 'sending' : 'delivered',
    metadata: {
      voiceInput: options?.voiceInput || false,
      ...options?.metadata
    }
  };
};

/**
 * Atualiza o status de uma mensagem
 */
export const updateMessageStatus = (
  message: ChatMessage,
  status: ChatMessage['status'],
  errorMessage?: string
): ChatMessage => {
  return {
    ...message,
    status,
    metadata: {
      ...message.metadata,
      errorMessage: status === 'error' ? errorMessage : undefined,
      retryCount: status === 'error'
        ? (message.metadata?.retryCount || 0) + 1
        : message.metadata?.retryCount
    }
  };
};

/**
 * Verifica se uma mensagem pode ser reenviada
 */
export const canRetryMessage = (message: ChatMessage): boolean => {
  return message.status === 'error' &&
         message.sender === 'user' &&
         (message.metadata?.retryCount || 0) < 3;
};

// ============================================================================
// SESSION UTILITIES
// ============================================================================

/**
 * Cria uma nova sessão de chat
 */
export const createChatSession = (
  type: ChatType,
  webhookUrl: string,
  metadata?: Record<string, unknown>
): ChatSession => {
  return {
    id: generateSessionId(),
    type,
    messages: [],
    isActive: true,
    isTyping: false,
    webhookUrl,
    lastActivity: new Date(),
    metadata: {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      ...metadata
    }
  };
};

/**
 * Adiciona mensagem a uma sessão
 */
export const addMessageToSession = (
  session: ChatSession,
  message: ChatMessage
): ChatSession => {
  return {
    ...session,
    messages: [...session.messages, message],
    lastActivity: new Date()
  };
};

/**
 * Atualiza mensagem em uma sessão
 */
export const updateMessageInSession = (
  session: ChatSession,
  messageId: string,
  updates: Partial<ChatMessage>
): ChatSession => {
  return {
    ...session,
    messages: session.messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
    lastActivity: new Date()
  };
};

/**
 * Remove mensagem de uma sessão
 */
export const removeMessageFromSession = (
  session: ChatSession,
  messageId: string
): ChatSession => {
  return {
    ...session,
    messages: session.messages.filter(msg => msg.id !== messageId),
    lastActivity: new Date()
  };
};

/**
 * Verifica se uma sessão está expirada
 */
export const isSessionExpired = (
  session: ChatSession,
  maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 horas
): boolean => {
  const now = new Date().getTime();
  const lastActivity = session.lastActivity.getTime();
  return (now - lastActivity) > maxAgeMs;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Valida conteúdo de mensagem
 */
export const validateMessageContent = (content: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Mensagem não pode estar vazia' };
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Mensagem não pode estar vazia' };
  }

  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Mensagem muito longa (máximo 1000 caracteres)' };
  }

  // Verificação básica de XSS
  if (containsPotentialXSS(trimmed)) {
    return { isValid: false, error: 'Conteúdo inválido detectado' };
  }

  return { isValid: true };
};

/**
 * Verifica se o conteúdo pode conter XSS
 */
const containsPotentialXSS = (content: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi
  ];

  return xssPatterns.some(pattern => pattern.test(content));
};

/**
 * Sanitiza conteúdo de mensagem
 */
export const sanitizeMessageContent = (content: string): string => {
  return content
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formata timestamp para exibição
 */
export const formatMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();

  // Menos de 1 minuto
  if (diff < 60000) {
    return 'agora';
  }

  // Menos de 1 hora
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}min`;
  }

  // Menos de 24 horas
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h`;
  }

  // Mais de 24 horas
  return timestamp.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Trunca texto longo para preview
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + '...';
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Chave para localStorage das sessões
 */
export const CHAT_STORAGE_KEY = 'chat_sessions';

/**
 * Chave para localStorage da configuração
 */
export const CHAT_CONFIG_KEY = 'chat_config';

/**
 * Versão atual do schema de storage
 */
export const STORAGE_VERSION = '1.0.0';

/**
 * Salva sessões no localStorage
 */
export const saveChatSessions = (sessions: ChatSession[]): void => {
  try {
    const data = {
      sessions,
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Erro ao salvar sessões de chat:', error);
  }
};

/**
 * Carrega sessões do localStorage
 */
export const loadChatSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);

    // Verificar versão do schema
    if (data.version !== STORAGE_VERSION) {
      console.warn('Versão do storage incompatível, limpando dados');
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return [];
    }

    // Converter timestamps de volta para Date
    return data.sessions.map((session: any) => ({
      ...session,
      lastActivity: new Date(session.lastActivity),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.warn('Erro ao carregar sessões de chat:', error);
    return [];
  }
};

/**
 * Limpa sessões expiradas do localStorage
 */
export const cleanupExpiredSessions = (maxAgeMs?: number): void => {
  const sessions = loadChatSessions();
  const activeSessions = sessions.filter(session =>
    !isSessionExpired(session, maxAgeMs)
  );

  if (activeSessions.length !== sessions.length) {
    saveChatSessions(activeSessions);
    console.log(`Limpeza: ${sessions.length - activeSessions.length} sessões expiradas removidas`);
  }
};

// ============================================================================
// WEBHOOK UTILITIES
// ============================================================================

/**
 * Valida URL de webhook
 */
export const validateWebhookUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

/**
 * Constrói headers padrão para requisições
 */
export const buildRequestHeaders = (apiKey?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ChatInterface/1.0'
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function para evitar chamadas excessivas
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function para limitar frequência de chamadas
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
