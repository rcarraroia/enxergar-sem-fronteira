/**
 * useOfflineChat Hook
 *
 * Hook para gerenciar funcionalidades offline do chat
 */

import { OfflineManager } from '@/lib/chat/simpleOfflineManager';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PendingMessage {
  id: string;
  content: string;
  sessionId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

interface OfflineResponse {
  response: string;
  type: string;
  timestamp: number;
}

interface UseOfflineChatOptions {
  fallbackResponses?: {
    greeting?: string;
    general?: string;
    error?: string;
    help?: string;
  };
  enableSmartResponses?: boolean;
  syncOnReconnect?: boolean;
  onSync?: (pendingMessages: PendingMessage[]) => Promise<{ success: boolean; syncedCount?: number; errorCount?: number; error?: string }>;
}

interface UseOfflineChatReturn {
  isOnline: boolean;
  pendingMessages: PendingMessage[];
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
  handleOfflineMessage: (content: string, sessionId: string, metadata?: Record<string, any>) => Promise<OfflineResponse>;
  clearPendingMessages: () => void;
  removePendingMessage: (messageId: string) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useOfflineChat(
  options: UseOfflineChatOptions = {}
): UseOfflineChatReturn {
  const {
    fallbackResponses = {
      greeting: "Olá! No momento estou offline, mas sua mensagem foi salva.",
      general: "Desculpe, estou temporariamente offline. Sua mensagem foi registrada.",
      error: "Não foi possível conectar ao servidor. Suas mensagens estão sendo salvas."
    },
    enableSmartResponses = false,
    syncOnReconnect = false,
    onSync
  } = options;

  // Estados
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');

  // Instância do offline manager
  const [offlineManager] = useState(() => new OfflineManager({
    fallbackResponses,
    enableSmartResponses
  }));

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  const updatePendingMessages = useCallback(() => {
    const pending = offlineManager.getPendingMessages();
    setPendingMessages(pending);
  }, [offlineManager]);

  const handleSync = useCallback(async () => {
    const currentPending = offlineManager.getPendingMessages();
    if (!onSync || currentPending.length === 0) return;

    setSyncStatus('syncing');
    console.log('[SUCCESS] Conexão restabelecida! Processando mensagens...');

    try {
      const result = await onSync(currentPending);

      if (result.success) {
        setSyncStatus('completed');
        offlineManager.clearPendingMessages();
        updatePendingMessages();
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Erro na sincronização:', error);
    }
  }, [onSync, offlineManager, updatePendingMessages]);

  const handleOfflineMessage = useCallback(async (
    content: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<OfflineResponse> => {
    // Armazenar mensagem como pendente
    const message = offlineManager.storeOfflineMessage(content, sessionId, metadata);

    // Atualizar estado local
    updatePendingMessages();

    // Gerar resposta de fallback
    const response = offlineManager.generateFallbackResponse(content);

    return response;
  }, [offlineManager, updatePendingMessages]);

  const clearPendingMessages = useCallback(() => {
    offlineManager.clearPendingMessages();
    updatePendingMessages();
  }, [offlineManager, updatePendingMessages]);

  const removePendingMessage = useCallback((messageId: string) => {
    offlineManager.removePendingMessage(messageId);
    updatePendingMessages();
  }, [offlineManager, updatePendingMessages]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Inicialização
  useEffect(() => {
    // Carregar mensagens pendentes
    updatePendingMessages();

    // Event listeners para online/offline
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Connection restored');

      if (syncOnReconnect && onSync) {
        // Usar setTimeout para garantir que o estado seja atualizado
        setTimeout(() => {
          handleSync();
        }, 0);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📱 Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnReconnect, onSync, handleSync, updatePendingMessages]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    isOnline,
    pendingMessages,
    syncStatus,
    handleOfflineMessage,
    clearPendingMessages,
    removePendingMessage
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  OfflineResponse, PendingMessage, UseOfflineChatOptions,
  UseOfflineChatReturn
};
