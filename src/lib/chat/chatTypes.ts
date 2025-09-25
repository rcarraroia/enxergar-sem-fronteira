/**
 * Chat System Types
 *
 * Definições de tipos TypeScript para o sistema de chat integrado com n8n
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Tipos de chat disponíveis no sistema
 */
export type ChatType = 'public' | 'admin';

/**
 * Status de uma mensagem individual
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error';

/**
 * Tipos de remetente de mensagem
 */
export type MessageSender = 'user' | 'agent';

/**
 * Tipos de erro específicos do chat
 */
export enum ChatErrorType {
  NETWORK_ERROR = 'network_error',
  WEBHOOK_ERROR = 'webhook_error',
  VALIDATION_ERROR = 'validation_error',
  VOICE_ERROR = 'voice_error',
  SESSION_ERROR = 'session_error',
  TIMEOUT_ERROR = 'timeout_error'
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Estrutura de uma mensagem de chat
 */
export interface ChatMessage {
  /** ID único da mensagem */
  id: string;
  /** Conteúdo da mensagem */
  content: string;
  /** Quem enviou a mensagem */
  sender: MessageSender;
  /** Timestamp de criação */
  timestamp: Date;
  /** Status atual da mensagem */
  status: MessageStatus;
  /** Metadados opcionais */
  metadata?: {
    /** Número de tentativas de reenvio */
    retryCount?: number;
    /** Mensagem de erro se houver */
    errorMessage?: string;
    /** Se foi enviada por voz */
    voiceInput?: boolean;
    /** Tempo de resposta em ms */
    responseTime?: number;
  };
}

/**
 * Ações que podem ser enviadas pelo agente n8n
 */
export interface ChatAction {
  /** Tipo da ação */
  type: 'redirect' | 'form' | 'download' | 'end_session';
  /** Dados da ação */
  payload: Record<string, unknown>;
  /** Texto descritivo da ação */
  description?: string;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Estado de uma sessão de chat
 */
export interface ChatSession {
  /** ID único da sessão */
  id: string;
  /** Tipo de chat */
  type: ChatType;
  /** Lista de mensagens */
  messages: ChatMessage[];
  /** Se a sessão está ativa */
  isActive: boolean;
  /** Se o agente está digitando */
  isTyping: boolean;
  /** URL do webhook para esta sessão */
  webhookUrl: string;
  /** Última atividade */
  lastActivity: Date;
  /** Metadados da sessão */
  metadata?: {
    /** User agent do navegador */
    userAgent?: string;
    /** URL de origem */
    referrer?: string;
    /** Dados adicionais da sessão */
    sessionData?: Record<string, unknown>;
  };
}

// ============================================================================
// N8N INTEGRATION TYPES
// ============================================================================

/**
 * Configuração dos webhooks n8n
 */
export interface N8nWebhookConfig {
  /** URL do webhook para chat público */
  publicCaptureUrl: string;
  /** URL do webhook para chat administrativo */
  adminSupportUrl: string;
  /** Timeout das requisições em ms */
  timeout: number;
  /** Número máximo de tentativas */
  retryAttempts: number;
  /** Headers HTTP padrão */
  headers: Record<string, string>;
  /** Chave de API se necessária */
  apiKey?: string;
}

/**
 * Payload enviado para o webhook n8n
 */
export interface N8nChatRequest {
  /** ID da sessão */
  sessionId: string;
  /** Mensagem do usuário */
  message: string;
  /** Tipo de usuário */
  userType: ChatType;
  /** Timestamp da mensagem */
  timestamp: string;
  /** Metadados opcionais */
  metadata?: {
    /** User agent */
    userAgent?: string;
    /** Referrer */
    referrer?: string;
    /** Dados da sessão */
    sessionData?: Record<string, unknown>;
  };
}

/**
 * Resposta esperada do webhook n8n
 */
export interface N8nChatResponse {
  /** Se a requisição foi bem-sucedida */
  success: boolean;
  /** Mensagem de resposta do agente */
  message?: string;
  /** Dados adicionais */
  data?: {
    /** Resposta do agente */
    response: string;
    /** Ações a serem executadas */
    actions?: ChatAction[];
    /** Se a sessão deve ser encerrada */
    sessionComplete?: boolean;
    /** Dados para próxima interação */
    nextStepData?: Record<string, unknown>;
  };
  /** Informações de erro */
  error?: {
    /** Código do erro */
    code: string;
    /** Mensagem de erro */
    message: string;
    /** Se o erro permite retry */
    retryable: boolean;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Estrutura de erro específica do chat
 */
export interface ChatError {
  /** Tipo do erro */
  type: ChatErrorType;
  /** Mensagem de erro */
  message: string;
  /** Se o erro permite retry */
  retryable: boolean;
  /** ID da sessão relacionada */
  sessionId?: string;
  /** ID da mensagem relacionada */
  messageId?: string;
  /** Erro original */
  originalError?: Error;
  /** Contexto adicional */
  context?: Record<string, unknown>;
}

/**
 * Configuração de tratamento de erros
 */
export interface ErrorHandlingConfig {
  /** Número máximo de tentativas */
  maxRetries: number;
  /** Intervalos de backoff em ms */
  backoffMs: number[];
  /** Mensagem para o usuário */
  userMessage: string;
  /** Se deve logar o erro */
  shouldLog: boolean;
}

// ============================================================================
// VOICE INPUT TYPES
// ============================================================================

/**
 * Configuração de entrada por voz
 */
export interface VoiceConfig {
  /** Se está habilitado */
  enabled: boolean;
  /** Idioma para reconhecimento */
  language: string;
  /** Chave da API externa (se usar) */
  apiKey?: string;
  /** Provedor de speech-to-text */
  provider: 'browser' | 'external';
  /** Configurações específicas */
  settings?: {
    /** Sensibilidade do microfone */
    sensitivity?: number;
    /** Tempo limite de gravação */
    maxRecordingTime?: number;
    /** Se deve usar cancelamento de ruído */
    noiseCancellation?: boolean;
  };
}

/**
 * Estado da entrada por voz
 */
export interface VoiceInputState {
  /** Se está gravando */
  isRecording: boolean;
  /** Se está processando */
  isProcessing: boolean;
  /** Texto transcrito */
  transcript: string;
  /** Nível de confiança da transcrição */
  confidence?: number;
  /** Erro se houver */
  error?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Props do componente principal ChatInterface
 */
export interface ChatInterfaceProps {
  /** Tipo de chat */
  type: ChatType;
  /** URL do webhook */
  webhookUrl: string;
  /** Placeholder do input */
  placeholder?: string;
  /** Altura máxima do chat */
  maxHeight?: number;
  /** Se deve habilitar entrada por voz */
  enableVoice?: boolean;
  /** Callback quando sessão inicia */
  onSessionStart?: (sessionId: string) => void;
  /** Callback quando sessão termina */
  onSessionEnd?: (sessionId: string) => void;
  /** Callback para erros */
  onError?: (error: ChatError) => void;
  /** Callback para métricas */
  onMetrics?: (event: string, data: Record<string, unknown>) => void;
  /** Classes CSS customizadas */
  className?: string;
  /** Tema visual */
  theme?: 'light' | 'dark';
}

/**
 * Props do widget de chat público
 */
export interface PublicChatWidgetProps {
  /** Se está visível */
  isVisible: boolean;
  /** Callback para toggle */
  onToggle: () => void;
  /** Posição do widget */
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  /** Tema visual */
  theme?: 'light' | 'dark';
  /** Classes CSS customizadas */
  className?: string;
}

/**
 * Props do painel de chat administrativo
 */
export interface AdminChatPanelProps {
  /** Classes CSS customizadas */
  className?: string;
  /** Se deve iniciar expandido */
  defaultExpanded?: boolean;
  /** Se permite múltiplas sessões */
  showMultipleSessions?: boolean;
  /** Callback para mudanças de estado */
  onStateChange?: (state: 'expanded' | 'collapsed' | 'minimized') => void;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Valor do contexto de chat
 */
export interface ChatContextValue {
  /** Sessões ativas */
  sessions: Record<string, ChatSession>;
  /** ID da sessão ativa */
  activeSessionId: string | null;
  /** Configuração dos webhooks */
  config: N8nWebhookConfig;
  /** Configuração de voz */
  voiceConfig: VoiceConfig;

  // Actions
  /** Criar nova sessão */
  createSession: (type: ChatType) => string;
  /** Enviar mensagem */
  sendMessage: (sessionId: string, content: string) => Promise<void>;
  /** Receber mensagem do agente */
  receiveMessage: (sessionId: string, content: string) => void;
  /** Definir estado de digitação */
  setTyping: (sessionId: string, isTyping: boolean) => void;
  /** Encerrar sessão */
  endSession: (sessionId: string) => void;
  /** Tentar reenviar mensagem */
  retryMessage: (sessionId: string, messageId: string) => Promise<void>;
  /** Limpar histórico */
  clearHistory: (sessionId: string) => void;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

/**
 * Schema para localStorage
 */
export interface ChatStorageSchema {
  /** Sessões salvas */
  sessions: ChatSession[];
  /** Configuração */
  config: N8nWebhookConfig;
  /** Última limpeza */
  lastCleanup: Date;
  /** Versão do schema */
  version: string;
}

// ============================================================================
// METRICS TYPES
// ============================================================================

/**
 * Métricas de performance do chat
 */
export interface ChatMetrics {
  /** Sessão iniciada */
  sessionStarted: (type: ChatType) => void;
  /** Mensagem enviada */
  messageSent: (sessionId: string, responseTime: number) => void;
  /** Mensagem recebida */
  messageReceived: (sessionId: string, processingTime: number) => void;
  /** Erro ocorrido */
  errorOccurred: (error: ChatError) => void;
  /** Sessão encerrada */
  sessionEnded: (sessionId: string, duration: number, messageCount: number) => void;
  /** Entrada por voz usada */
  voiceInputUsed: (sessionId: string, success: boolean) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Configuração de feature flags
 */
export interface ChatFeatureFlags {
  /** Habilitar chat público */
  enablePublicChat: boolean;
  /** Habilitar chat administrativo */
  enableAdminChat: boolean;
  /** Habilitar entrada por voz */
  enableVoiceInput: boolean;
  /** Habilitar múltiplas sessões */
  enableMultipleSessions: boolean;
  /** Modo debug */
  debugMode: boolean;
}

/**
 * Configuração de ambiente
 */
export interface ChatEnvironmentConfig {
  /** URL do webhook público */
  VITE_N8N_PUBLIC_WEBHOOK_URL: string;
  /** URL do webhook administrativo */
  VITE_N8N_ADMIN_WEBHOOK_URL: string;
  /** Chave da API n8n */
  VITE_N8N_API_KEY?: string;
  /** Chave da API de voz */
  VITE_VOICE_API_KEY?: string;
  /** Modo debug */
  VITE_CHAT_DEBUG_MODE?: string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
    AdminChatPanelProps, ChatAction, ChatContextValue, ChatEnvironmentConfig, ChatError, ChatFeatureFlags, ChatInterfaceProps, ChatMessage, ChatMetrics, ChatSession, ChatStorageSchema, ChatType, ErrorHandlingConfig, MessageSender, MessageStatus, N8nChatRequest,
    N8nChatResponse, N8nWebhookConfig, PublicChatWidgetProps, VoiceConfig,
    VoiceInputState
};
