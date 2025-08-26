/**
 * useN8nChat Hook
 *
 * Hook customizado para gerenciamento de comunicação com n8n
 */

import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useChatEventTracking } from '@/hooks/useChatMetrics';
import {
    ChatError,
    ChatType,
    N8nChatResponse,
    N8nWebhookConfig
} from '@/lib/chat/chatTypes';
import {
    N8nHttpClient,
    createN8nClient,
    createN8nRequest,
    logN8nError,
    processN8nResponse
} from '@/lib/chat/n8nClient';\nimport { secureValidateMessage } from '@/lib/chat/securityMiddleware';\nimport { useChatConfig, useChatPerformanceConfig } from '@/hooks/useChatConfig';\nimport { \n  createChatError,\n  fromChatError,\n  CHAT_ERROR_CODES,\n  type ChatAppError \n} from '@/lib/chat/chatErrorFactory';\nimport { logChatError, logSessionActivity } from '@/lib/chat/chatLogger';
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Estado do hook useN8nChat
 */
interface UseN8nChatState {
  /** Se está enviando mensagem */
  isLoading: boolean;
  /** Se está aguardando resposta (digitando) */
  isTyping: boolean;
  /** Erro atual se houver */
  error: ChatError | null;
  /** Última resposta recebida */
  lastResponse: N8nChatResponse | null;
  /** Número de tentativas da mensagem atual */
  retryCount: number;
}

/**
 * Opções para envio de mensagem
 */
interface SendMessageOptions {
  /** Metadados adicionais */
  metadata?: Record<string, unknown>;
  /** URL customizada do webhook */
  customWebhookUrl?: string;
  /** Se deve fazer retry automático */
  autoRetry?: boolean;
  /** Callback de progresso */
  onProgress?: (stage: 'sending' | 'processing' | 'receiving') => void;
}

/**
 * Retorno do hook useN8nChat
 */
interface UseN8nChatReturn {
  /** Estado atual */
  state: UseN8nChatState;
  /** Enviar mensagem */
  sendMessage: (
    sessionId: string,
    message: string,
    userType: ChatType,
    options?: SendMessageOptions
  ) => Promise<N8nChatResponse>;
  /** Tentar reenviar última mensagem */
  retryLastMessage: () => Promise<N8nChatResponse | null>;
  /** Cancelar requisição em andamento */
  cancelRequest: () => void;
  /** Limpar erro */
  clearError: () => void;
  /** Testar conectividade */
  testConnection: (userType: ChatType) => Promise<boolean>;
  /** Atualizar configuração */
  updateConfig: (newConfig: Partial<N8nWebhookConfig>) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook para comunicação com n8n
 */
export const useN8nChat = (
  initialConfig: N8nWebhookConfig
): UseN8nChatReturn => {
  // Estado do hook
  const [state, setState] = useState<UseN8nChatState>({
    isLoading: false,
    isTyping: false,
    error: null,
    lastResponse: null,
    retryCount: 0
  });

  // Referências
  const clientRef = useRef<N8nHttpClient>(createN8nClient(initialConfig));
  const lastRequestRef = useRef<{
    sessionId: string;
    message: string;
    userType: ChatType;
    options?: SendMessageOptions;
  } | null>(null);

  // Hook de tratamento de erros
  const { handleError } = useErrorHandler();\n  const { trackWebhookCall, trackError } = useChatEventTracking();

  // ============================================================================
  // INTERNAL FUNCTIONS
  // ============================================================================

  /**
   * Atualiza estado do hook
   */
  const updateState = useCallback((updates: Partial<UseN8nChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Processa erro e atualiza estado
   */
  const handleChatError = useCallback((error: ChatError) => {
    // Log do erro
    logN8nError(error);

    // Usar sistema de error handling existente
    handleError(error.originalError || new Error(error.message));

    // Atualizar estado
    updateState({
      error,
      isLoading: false,
      isTyping: false
    });
  }, [handleError, updateState]);

  /**
   * Executa envio de mensagem
   */
  const performSendMessage = useCallback(async (
    sessionId: string,
    message: string,
    userType: ChatType,
    options: SendMessageOptions = {}
  ): Promise<N8nChatResponse> => {
    try {
      // Limpar erro anterior
      updateState({ error: null });

      // Notificar progresso
      options.onProgress?.('sending');
      updateState({ isLoading: true, isTyping: false });

      // Criar request
      const request = createN8nRequest(
        sessionId,
        message,
        userType,
        options.metadata
      );

      // Enviar mensagem
      const response = await clientRef.current.sendMessage(
        request,
        options.customWebhookUrl
      );

      // Notificar progresso
      options.onProgress?.('processing');
      updateState({ isTyping: true });

      // Simular delay de processamento se necessário
      if (response.success && response.data?.response) {
        // Delay baseado no tamanho da resposta (simula digitação)
        const typingDelay = Math.min(
          response.data.response.length * 50, // 50ms por caractere
          3000 // máximo 3 segundos
        );
        await new Promise(resolve => setTimeout(resolve, typingDelay));
      }

      // Notificar progresso
      options.onProgress?.('receiving');

      // Processar resposta
      const processedResponse = processN8nResponse(response);

      // Atualizar estado com sucesso
      updateState({
        isLoading: false,
        isTyping: false,
        lastResponse: response,
        retryCount: 0
      });

      return response;

    } catch (error) {
      const chatError = error as ChatError;

      // Incrementar contador de retry
      const newRetryCount = state.retryCount + 1;
      updateState({ retryCount: newRetryCount });

      // Se deve fazer reutomático e o erro permite
      if (options.autoRetry && chatError.retryable && newRetryCount < 3) {
        console.warn(`Auto-retry ${newRetryCount}/3 para mensagem`);

        // Aguardar antes do retry
        await new Promise(resolve => setTimeout(resolve, 1000 * newRetryCount));

        // Tentar novamente
        return performSendMessage(sessionId, message, userType, {
          ...options,
          autoRetry: false // Evitar loop infinito
        });
      }

      // Tratar erro
      handleChatError(chatError);
      throw chatError;
    }
  }, [state.retryCount, updateState, handleChatError]);

  // ============================================================================
  // PUBLIC FUNCTIONS
  // ============================================================================

  /**
   * Envia mensagem para n8n
   */
  const sendMessage = useCallback(async (
    sessionId: string,
    message: string,
    userType: ChatType,
    options: SendMessageOptions = {}
  ): Promise<N8nChatResponse> => {
    // Salvar referência da última requisição
    lastRequestRef.current = { sessionId, message, userType, options };

    // Executar envio
    return performSendMessage(sessionId, message, userType, options);
  }, [performSendMessage]);

  /**
   * Tenta reenviar última mensagem
   */
  const retryLastMessage = useCallback(async (): Promise<N8nChatResponse | null> => {
    const lastRequest = lastRequestRef.current;

    if (!lastRequest) {
      console.warn('Nenhuma mensagem anterior para reenviar');
      return null;
    }

    try {
      return await performSendMessage(
        lastRequest.sessionId,
        lastRequest.message,
        lastRequest.userType,
        lastRequest.options
      );
    } catch (error) {
      console.error('Erro ao reenviar mensagem:', error);
      throw error;
    }
  }, [performSendMessage]);

  /**
   * Cancela requisição em andamento
   */
  const cancelRequest = useCallback(() => {
    clientRef.current.cancelRequest();
    updateState({
      isLoading: false,
      isTyping: false,
      error: null
    });
  }, [updateState]);

  /**
   * Limpa erro atual
   */
  const clearError = useCallback(() => {
    updateState({ error: null, retryCount: 0 });
  }, [updateState]);

  /**
   * Testa conectividade com webhook
   */
  const testConnection = useCallback(async (userType: ChatType): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });

      const isConnected = await clientRef.current.testConnection(userType);

      updateState({ isLoading: false });
      return isConnected;

    } catch (error) {
      const chatError = error as ChatError;
      handleChatError(chatError);
      return false;
    }
  }, [updateState, handleChatError]);

  /**
   * Atualiza configuração do cliente
   */
  const updateConfig = useCallback((newConfig: Partial<N8nWebhookConfig>) => {
    clientRef.current.updateConfig(newConfig);
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Cleanup ao desmontar componente
   */
  useEffect(() => {
    return () => {
      clientRef.current.cancelRequest();
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    state,
    sendMessage,
    retryLastMessage,
    cancelRequest,
    clearError,
    testConnection,
    updateConfig
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook simplificado para chat público
 */
export const usePublicChat = (config: N8nWebhookConfig) => {
  const n8nChat = useN8nChat(config);

  const sendPublicMessage = useCallback((
    sessionId: string,
    message: string,
    options?: SendMessageOptions
  ) => {
    return n8nChat.sendMessage(sessionId, message, 'public', options);
  }, [n8nChat]);

  const testPublicConnection = useCallback(() => {
    return n8nChat.testConnection('public');
  }, [n8nChat]);

  return {
    ...n8nChat,
    sendMessage: sendPublicMessage,
    testConnection: testPublicConnection
  };
};

/**
 * Hook simplificado para chat administrativo
 */
export const useAdminChat = (config: N8nWebhookConfig) => {
  const n8nChat = useN8nChat(config);

  const sendAdminMessage = useCallback((
    sessionId: string,
    message: string,
    options?: SendMessageOptions
  ) => {
    return n8nChat.sendMessage(sessionId, message, 'admin', options);
  }, [n8nChat]);

  const testAdminConnection = useCallback(() => {
    return n8nChat.testConnection('admin');
  }, [n8nChat]);

  return {
    ...n8nChat,
    sendMessage: sendAdminMessage,
    testConnection: testAdminConnection
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useN8nChat;

export type {
    SendMessageOptions,
    UseN8nChatReturn, UseN8nChatState
};
