/**
 * useChatConfig Hook
 *
 * Hook para gerenciar configuração do chat com reatividade
 */

import {
    addChatConfigListener,
    ChatConfig,
    ChatFeatureFlags,
    getChatConfig,
    getChatConfigDebugInfo,
    getChatFeatureFlags,
    getChatWebhookUrl,
    isFeatureEnabled,
    updateChatConfig,
    updateChatFeatureFlags,
    validateChatConfig
} from '@/lib/chat/chatConfig';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface UseChatConfigReturn {
  /** Configuração completa do chat */
  config: ChatConfig;
  /** Feature flags do chat */
  featureFlags: ChatFeatureFlags;
  /** Verifica se uma feature está habilitada */
  isEnabled: (feature: keyof ChatFeatureFlags) => boolean;
  /** Obtém URL do webhook para um tipo específico */
  getWebhookUrl: (type: 'public' | 'admin' | 'test') => string | undefined;
  /** Atualiza configuração (apenas em dev) */
  updateConfig: (updates: Partial<ChatConfig>) => void;
  /** Atualiza feature flags (apenas em dev) */
  updateFeatureFlags: (updates: Partial<ChatFeatureFlags>) => void;
  /** Valida configuração atual */
  validateConfig: () => { valid: boolean; errors: string[] };
  /** Obtém informações de debug */
  getDebugInfo: () => Record<string, any>;
  /** Indica se está em modo de desenvolvimento */
  isDevMode: boolean;
  /** Indica se a configuração é válida */
  isValid: boolean;
  /** Erros de validação */
  validationErrors: string[];
}

interface UseChatConfigOptions {
  /** Se deve revalidar automaticamente */
  autoValidate?: boolean;
  /** Intervalo de revalidação em ms */
  revalidateInterval?: number;
  /** Se deve logar mudanças de configuração */
  logChanges?: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useChatConfig(options: UseChatConfigOptions = {}): UseChatConfigReturn {
  const {
    autoValidate = true,
    revalidateInterval = 30000, // 30 segundos
    logChanges = false
  } = options;

  // Estados
  const [config, setConfig] = useState<ChatConfig>(getChatConfig);
  const [featureFlags, setFeatureFlags] = useState<ChatFeatureFlags>(getChatFeatureFlags);
  const [validationResult, setValidationResult] = useState(() => validateChatConfig());

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Listener para mudanças de configuração
  useEffect(() => {
    const removeListener = addChatConfigListener((newConfig) => {
      if (logChanges) {
        console.log('Chat config updated:', newConfig);
      }

      setConfig(newConfig);
      setFeatureFlags(newConfig.featureFlags);

      if (autoValidate) {
        setValidationResult(validateChatConfig());
      }
    });

    return removeListener;
  }, [autoValidate, logChanges]);

  // Revalidação automática
  useEffect(() => {
    if (!autoValidate || revalidateInterval <= 0) return;

    const interval = setInterval(() => {
      const result = validateChatConfig();
      setValidationResult(result);

      if (!result.valid && logChanges) {
        console.warn('Chat config validation failed:', result.errors);
      }
    }, revalidateInterval);

    return () => clearInterval(interval);
  }, [autoValidate, revalidateInterval, logChanges]);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const isEnabled = useCallback((feature: keyof ChatFeatureFlags): boolean => {
    return isFeatureEnabled(feature);
  }, []);

  const getWebhookUrl = useCallback((type: 'public' | 'admin' | 'test'): string | undefined => {
    return getChatWebhookUrl(type);
  }, []);

  const handleUpdateConfig = useCallback((updates: Partial<ChatConfig>) => {
    try {
      updateChatConfig(updates);

      if (logChanges) {
        console.log('Chat config updated:', updates);
      }
    } catch (error) {
      console.error('Failed to update chat config:', error);
    }
  }, [logChanges]);

  const handleUpdateFeatureFlags = useCallback((updates: Partial<ChatFeatureFlags>) => {
    try {
      updateChatFeatureFlags(updates);

      if (logChanges) {
        console.log('Chat feature flags updated:', updates);
      }
    } catch (error) {
      console.error('Failed to update chat feature flags:', error);
    }
  }, [logChanges]);

  const handleValidateConfig = useCallback(() => {
    const result = validateChatConfig();
    setValidationResult(result);
    return result;
  }, []);

  const getDebugInfo = useCallback(() => {
    return getChatConfigDebugInfo();
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isDevMode = config.featureFlags.enableDevMode || config.environment === 'development';
  const isValid = validationResult.valid;
  const validationErrors = validationResult.errors;

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    config,
    featureFlags,
    isEnabled,
    getWebhookUrl,
    updateConfig: handleUpdateConfig,
    updateFeatureFlags: handleUpdateFeatureFlags,
    validateConfig: handleValidateConfig,
    getDebugInfo,
    isDevMode,
    isValid,
    validationErrors
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook simplificado para verificar feature flags
 */
export function useChatFeatureFlags(): {
  isEnabled: (feature: keyof ChatFeatureFlags) => boolean;
  featureFlags: ChatFeatureFlags;
  updateFeatureFlags: (updates: Partial<ChatFeatureFlags>) => void;
} {
  const { isEnabled, featureFlags, updateFeatureFlags } = useChatConfig();

  return {
    isEnabled,
    featureFlags,
    updateFeatureFlags
  };
}

/**
 * Hook para obter URLs de webhook
 */
export function useChatWebhooks(): {
  getWebhookUrl: (type: 'public' | 'admin' | 'test') => string | undefined;
  publicUrl?: string;
  adminUrl?: string;
  testUrl?: string;
} {
  const { getWebhookUrl, config } = useChatConfig();

  return {
    getWebhookUrl,
    publicUrl: config.webhooks.publicCaptureUrl,
    adminUrl: config.webhooks.adminSupportUrl,
    testUrl: config.webhooks.testUrl
  };
}

/**
 * Hook para configurações de desenvolvimento
 */
export function useChatDevConfig(): {
  isDevMode: boolean;
  debugInfo: Record<string, any>;
  updateConfig: (updates: Partial<ChatConfig>) => void;
  updateFeatureFlags: (updates: Partial<ChatFeatureFlags>) => void;
  validateConfig: () => { valid: boolean; errors: string[] };
  isValid: boolean;
  validationErrors: string[];
} {
  const {
    isDevMode,
    getDebugInfo,
    updateConfig,
    updateFeatureFlags,
    validateConfig,
    isValid,
    validationErrors
  } = useChatConfig({ logChanges: true });

  const debugInfo = getDebugInfo();

  return {
    isDevMode,
    debugInfo,
    updateConfig,
    updateFeatureFlags,
    validateConfig,
    isValid,
    validationErrors
  };
}

/**
 * Hook para configurações de UI
 */
export function useChatUIConfig(): {
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showTypingIndicator: boolean;
  showTimestamps: boolean;
  enableAnimations: boolean;
  updateUIConfig: (updates: Partial<ChatConfig['ui']>) => void;
} {
  const { config, updateConfig } = useChatConfig();

  const updateUIConfig = useCallback((updates: Partial<ChatConfig['ui']>) => {
    updateConfig({
      ui: {
        ...config.ui,
        ...updates
      }
    });
  }, [config.ui, updateConfig]);

  return {
    theme: config.ui.theme,
    position: config.ui.position,
    showTypingIndicator: config.ui.showTypingIndicator,
    showTimestamps: config.ui.showTimestamps,
    enableAnimations: config.ui.enableAnimations,
    updateUIConfig
  };
}

/**
 * Hook para configurações de performance
 */
export function useChatPerformanceConfig(): {
  requestTimeoutMs: number;
  maxRetryAttempts: number;
  maxConcurrentSessions: number;
  maxMessagesPerSession: number;
  debounceDelayMs: number;
  updatePerformanceConfig: (updates: Partial<ChatConfig['performance']>) => void;
} {
  const { config, updateConfig } = useChatConfig();

  const updatePerformanceConfig = useCallback((updates: Partial<ChatConfig['performance']>) => {
    updateConfig({
      performance: {
        ...config.performance,
        ...updates
      }
    });
  }, [config.performance, updateConfig]);

  return {
    requestTimeoutMs: config.performance.requestTimeoutMs,
    maxRetryAttempts: config.performance.maxRetryAttempts,
    maxConcurrentSessions: config.performance.maxConcurrentSessions,
    maxMessagesPerSession: config.performance.maxMessagesPerSession,
    debounceDelayMs: config.performance.debounceDelayMs,
    updatePerformanceConfig
  };
}

/**
 * Hook para configurações de segurança
 */
export function useChatSecurityConfig(): {
  allowedDomains: string[];
  maxMessageLength: number;
  rateLimitPerMinute: number;
  sessionTimeoutMs: number;
  updateSecurityConfig: (updates: Partial<ChatConfig['security']>) => void;
} {
  const { config, updateConfig } = useChatConfig();

  const updateSecurityConfig = useCallback((updates: Partial<ChatConfig['security']>) => {
    updateConfig({
      security: {
        ...config.security,
        ...updates
      }
    });
  }, [config.security, updateConfig]);

  return {
    allowedDomains: config.security.allowedDomains,
    maxMessageLength: config.security.maxMessageLength,
    rateLimitPerMinute: config.security.rateLimitPerMinute,
    sessionTimeoutMs: config.security.sessionTimeoutMs,
    updateSecurityConfig
  };
}
