/**
 * Chat Configuration System
 *
 * Sistema centralizado de configuração para o chat com suporte a feature flags
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ChatFeatureFlags {
  /** Habilitar sistema de chat */
  enableChat: boolean;
  /** Habilitar chat público na página de captação */
  enablePublicChat: boolean;
  /** Habilitar chat admin no painel */
  enableAdminChat: boolean;
  /** Habilitar entrada por voz */
  enableVoiceInput: boolean;
  /** Habilitar sistema de segurança avançado */
  enableAdvancedSecurity: boolean;
  /** Habilitar rate limiting */
  enableRateLimit: boolean;
  /** Habilitar logging detalhado */
  enableDetailedLogging: boolean;
  /** Habilitar métricas e analytics */
  enableMetrics: boolean;
  /** Habilitar modo de desenvolvimento */
  enableDevMode: boolean;
  /** Habilitar retry automático */
  enableAutoRetry: boolean;
  /** Habilitar notificações */
  enableNotifications: boolean;
  /** Habilitar persistência de histórico */
  enableHistoryPersistence: boolean;
}

export interface ChatEnvironmentConfig {
  /** URLs dos webhooks n8n */
  webhooks: {
    publicCaptureUrl?: string;
    adminSupportUrl?: string;
    testUrl?: string;
  };

  /** Configurações de segurança */
  security: {
    allowedDomains: string[];
    maxMessageLength: number;
    rateLimitPerMinute: number;
    sessionTimeoutMs: number;
  };

  /** Configurações de performance */
  performance: {
    requestTimeoutMs: number;
    maxRetryAttempts: number;
    maxConcurrentSessions: number;
    maxMessagesPerSession: number;
    debounceDelayMs: number;
  };

  /** Configurações de UI */
  ui: {
    theme: 'light' | 'dark' | 'auto';
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    showTypingIndicator: boolean;
    showTimestamps: boolean;
    enableAnimations: boolean;
  };

  /** Configurações de logging */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
  };
}

export interface ChatConfig extends ChatEnvironmentConfig {
  featureFlags: ChatFeatureFlags;
  environment: 'development' | 'staging' | 'production' | 'test';
  version: string;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_FEATURE_FLAGS: ChatFeatureFlags = {
  enableChat: true,
  enablePublicChat: true,
  enableAdminChat: true,
  enableVoiceInput: false,
  enableAdvancedSecurity: true,
  enableRateLimit: true,
  enableDetailedLogging: false,
  enableMetrics: true,
  enableDevMode: false,
  enableAutoRetry: true,
  enableNotifications: true,
  enableHistoryPersistence: true
};

const DEFAULT_ENVIRONMENT_CONFIG: ChatEnvironmentConfig = {
  webhooks: {
    publicCaptureUrl: undefined,
    adminSupportUrl: undefined,
    testUrl: undefined
  },

  security: {
    allowedDomains: [],
    maxMessageLength: 1000,
    rateLimitPerMinute: 20,
    sessionTimeoutMs: 24 * 60 * 60 * 1000 // 24 horas
  },

  performance: {
    requestTimeoutMs: 30000,
    maxRetryAttempts: 3,
    maxConcurrentSessions: 5,
    maxMessagesPerSession: 100,
    debounceDelayMs: 300
  },

  ui: {
    theme: 'auto',
    position: 'bottom-right',
    showTypingIndicator: true,
    showTimestamps: true,
    enableAnimations: true
  },

  logging: {
    level: 'warn',
    enableConsole: true,
    enableRemote: false,
    remoteEndpoint: undefined
  }
};

// ============================================================================
// ENVIRONMENT VARIABLE MAPPING
// ============================================================================

/**
 * Mapeia variáveis de ambiente para configuração
 */
function loadEnvironmentConfig(): Partial<ChatEnvironmentConfig> {
  return {
    webhooks: {
      publicCaptureUrl: import.meta.env.VITE_CHAT_PUBLIC_WEBHOOK_URL,
      adminSupportUrl: import.meta.env.VITE_CHAT_ADMIN_WEBHOOK_URL,
      testUrl: import.meta.env.VITE_CHAT_TEST_WEBHOOK_URL
    },

    security: {
      allowedDomains: import.meta.env.VITE_CHAT_ALLOWED_DOMAINS?.split(',') || [],
      maxMessageLength: parseInt(import.meta.env.VITE_CHAT_MAX_MESSAGE_LENGTH || '1000'),
      rateLimitPerMinute: parseInt(import.meta.env.VITE_CHAT_RATE_LIMIT_PER_MINUTE || '20'),
      sessionTimeoutMs: parseInt(import.meta.env.VITE_CHAT_SESSION_TIMEOUT_MS || '86400000')
    },

    performance: {
      requestTimeoutMs: parseInt(import.meta.env.VITE_CHAT_REQUEST_TIMEOUT_MS || '30000'),
      maxRetryAttempts: parseInt(import.meta.env.VITE_CHAT_MAX_RETRY_ATTEMPTS || '3'),
      maxConcurrentSessions: parseInt(import.meta.env.VITE_CHAT_MAX_CONCURRENT_SESSIONS || '5'),
      maxMessagesPerSession: parseInt(import.meta.env.VITE_CHAT_MAX_MESSAGES_PER_SESSION || '100'),
      debounceDelayMs: parseInt(import.meta.env.VITE_CHAT_DEBOUNCE_DELAY_MS || '300')
    },

    ui: {
      theme: (import.meta.env.VITE_CHAT_THEME as 'light' | 'dark' | 'auto') || 'auto',
      position: (import.meta.env.VITE_CHAT_POSITION as any) || 'bottom-right',
      showTypingIndicator: import.meta.env.VITE_CHAT_SHOW_TYPING_INDICATOR !== 'false',
      showTimestamps: import.meta.env.VITE_CHAT_SHOW_TIMESTAMPS !== 'false',
      enableAnimations: import.meta.env.VITE_CHAT_ENABLE_ANIMATIONS !== 'false'
    },

    logging: {
      level: (import.meta.env.VITE_CHAT_LOG_LEVEL as any) || 'warn',
      enableConsole: import.meta.env.VITE_CHAT_ENABLE_CONSOLE_LOGGING !== 'false',
      enableRemote: import.meta.env.VITE_CHAT_ENABLE_REMOTE_LOGGING === 'true',
      remoteEndpoint: import.meta.env.VITE_CHAT_REMOTE_LOG_ENDPOINT
    }
  };
}

/**
 * Mapeia variáveis de ambiente para feature flags
 */
function loadFeatureFlags(): Partial<ChatFeatureFlags> {
  const environment = import.meta.env.NODE_ENV || 'development';

  return {
    enableChat: import.meta.env.VITE_CHAT_ENABLE_CHAT !== 'false',
    enablePublicChat: import.meta.env.VITE_CHAT_ENABLE_PUBLIC_CHAT !== 'false',
    enableAdminChat: import.meta.env.VITE_CHAT_ENABLE_ADMIN_CHAT !== 'false',
    enableVoiceInput: import.meta.env.VITE_CHAT_ENABLE_VOICE_INPUT === 'true',
    enableAdvancedSecurity: import.meta.env.VITE_CHAT_ENABLE_ADVANCED_SECURITY !== 'false',
    enableRateLimit: import.meta.env.VITE_CHAT_ENABLE_RATE_LIMIT !== 'false',
    enableDetailedLogging: import.meta.env.VITE_CHAT_ENABLE_DETAILED_LOGGING === 'true' || environment === 'development',
    enableMetrics: import.meta.env.VITE_CHAT_ENABLE_METRICS !== 'false',
    enableDevMode: import.meta.env.VITE_CHAT_ENABLE_DEV_MODE === 'true' || environment === 'development',
    enableAutoRetry: import.meta.env.VITE_CHAT_ENABLE_AUTO_RETRY !== 'false',
    enableNotifications: import.meta.env.VITE_CHAT_ENABLE_NOTIFICATIONS !== 'false',
    enableHistoryPersistence: import.meta.env.VITE_CHAT_ENABLE_HISTORY_PERSISTENCE !== 'false'
  };
}

// ============================================================================
// CONFIGURATION BUILDER
// ============================================================================

/**
 * Constrói configuração completa do chat
 */
function buildChatConfig(): ChatConfig {
  const environment = (import.meta.env.NODE_ENV || 'development') as ChatConfig['environment'];
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  // Carregar configurações das variáveis de ambiente
  const envConfig = loadEnvironmentConfig();
  const envFeatureFlags = loadFeatureFlags();

  // Mesclar com configurações padrão
  const config: ChatConfig = {
    ...DEFAULT_ENVIRONMENT_CONFIG,
    ...envConfig,
    featureFlags: {
      ...DEFAULT_FEATURE_FLAGS,
      ...envFeatureFlags
    },
    environment,
    version
  };

  // Aplicar configurações específicas por ambiente
  if (environment === 'development') {
    config.featureFlags.enableDevMode = true;
    config.featureFlags.enableDetailedLogging = true;
    config.logging.level = 'debug';
    config.logging.enableConsole = true;
  } else if (environment === 'production') {
    config.featureFlags.enableDevMode = false;
    config.featureFlags.enableDetailedLogging = false;
    config.logging.level = 'error';
    config.logging.enableConsole = false;
  } else if (environment === 'test') {
    config.featureFlags.enableMetrics = false;
    config.featureFlags.enableNotifications = false;
    config.logging.enableConsole = false;
  }

  return config;
}

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

class ChatConfigManager {
  private config: ChatConfig;
  private listeners: Array<(config: ChatConfig) => void> = [];

  constructor() {
    this.config = buildChatConfig();
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): ChatConfig {
    return { ...this.config };
  }

  /**
   * Obtém feature flags
   */
  getFeatureFlags(): ChatFeatureFlags {
    return { ...this.config.featureFlags };
  }

  /**
   * Verifica se uma feature está habilitada
   */
  isFeatureEnabled(feature: keyof ChatFeatureFlags): boolean {
    return this.config.featureFlags[feature];
  }

  /**
   * Obtém configuração de webhook para um tipo específico
   */
  getWebhookUrl(type: 'public' | 'admin' | 'test'): string | undefined {
    switch (type) {
      case 'public':
        return this.config.webhooks.publicCaptureUrl;
      case 'admin':
        return this.config.webhooks.adminSupportUrl;
      case 'test':
        return this.config.webhooks.testUrl;
      default:
        return undefined;
    }
  }

  /**
   * Atualiza configuração (apenas em desenvolvimento)
   */
  updateConfig(updates: Partial<ChatConfig>): void {
    if (this.config.environment !== 'development' && !this.config.featureFlags.enableDevMode) {
      console.warn('Configuration updates are only allowed in development mode');
      return;
    }

    this.config = {
      ...this.config,
      ...updates,
      featureFlags: {
        ...this.config.featureFlags,
        ...updates.featureFlags
      }
    };

    // Notificar listeners
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * Atualiza feature flags (apenas em desenvolvimento)
   */
  updateFeatureFlags(updates: Partial<ChatFeatureFlags>): void {
    this.updateConfig({ featureFlags: updates });
  }

  /**
   * Adiciona listener para mudanças de configuração
   */
  addConfigListener(listener: (config: ChatConfig) => void): () => void {
    this.listeners.push(listener);

    // Retorna função para remover listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Valida configuração atual
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar URLs de webhook
    if (this.config.featureFlags.enablePublicChat && !this.config.webhooks.publicCaptureUrl) {
      errors.push('Public chat is enabled but no webhook URL is configured');
    }

    if (this.config.featureFlags.enableAdminChat && !this.config.webhooks.adminSupportUrl) {
      errors.push('Admin chat is enabled but no webhook URL is configured');
    }

    // Validar configurações de segurança
    if (this.config.security.maxMessageLength < 1) {
      errors.push('Max message length must be greater than 0');
    }

    if (this.config.security.rateLimitPerMinute < 1) {
      errors.push('Rate limit must be greater than 0');
    }

    // Validar configurações de performance
    if (this.config.performance.requestTimeoutMs < 1000) {
      errors.push('Request timeout must be at least 1000ms');
    }

    if (this.config.performance.maxRetryAttempts < 0) {
      errors.push('Max retry attempts cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtém informações de debug da configuração
   */
  getDebugInfo(): Record<string, any> {
    return {
      environment: this.config.environment,
      version: this.config.version,
      featureFlags: this.config.featureFlags,
      validation: this.validateConfig(),
      loadedAt: new Date().toISOString()
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const chatConfigManager = new ChatConfigManager();

// ============================================================================
// EXPORTS
// ============================================================================

export { chatConfigManager };

export const getChatConfig = () => chatConfigManager.getConfig();
export const getChatFeatureFlags = () => chatConfigManager.getFeatureFlags();
export const isFeatureEnabled = (feature: keyof ChatFeatureFlags) => chatConfigManager.isFeatureEnabled(feature);
export const getChatWebhookUrl = (type: 'public' | 'admin' | 'test') => chatConfigManager.getWebhookUrl(type);
export const updateChatConfig = (updates: Partial<ChatConfig>) => chatConfigManager.updateConfig(updates);
export const updateChatFeatureFlags = (updates: Partial<ChatFeatureFlags>) => chatConfigManager.updateFeatureFlags(updates);
export const addChatConfigListener = (listener: (config: ChatConfig) => void) => chatConfigManager.addConfigListener(listener);
export const validateChatConfig = () => chatConfigManager.validateConfig();
export const getChatConfigDebugInfo = () => chatConfigManager.getDebugInfo();

// Exportar configuração atual como padrão
export default getChatConfig();
