/**
 * useChatHistory Hook
 *
 * Hook para gerenciamento de estado e histórico de conversas
 */

import {
    ChatMessage,
    ChatSession,
    ChatType,
    MessageSender,
    MessageStatus
} from '@/lib/chat/chatTypes';
import {
    addMessageToSession,
    createChatMessage,
    createChatSession,
    isSessionExpired,
    loadChatSessions,
    removeMessageFromSession,
    saveChatSessions,
    updateMessageInSession
} from '@/lib/chat/chatUtils';
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Estado do histórico de chat
 */
interface ChatHistoryState {
  /** Sessões ativas */
  sessions: Record<string, ChatSession>;
  /** ID da sessão ativa */
  activeSessionId: string | null;
  /** Se está carregando dados */
  isLoading: boolean;
  /** Erro se houver */
  error: string | null;
}

/**
 * Opções para criação de sessão
 */
interface CreateSessionOptions {
  /** Metadados da sessão */
  metadata?: Record<string, unknown>;
  /** Se deve ativar automaticamente */
  autoActivate?: boolean;
}

/**
 * Opções para adição de mensagem
 */
interface AddMessageOptions {
  /** Se deve fazer scroll automático */
  autoScroll?: boolean;
  /** Callback após adicionar */
  onAdded?: (message: ChatMessage) => void;
}

/**
 * Filtros para busca de sessões
 */
interface SessionFilters {
  /** Tipo de chat */
  type?: ChatType;
  /** Se está ativa */
  isActive?: boolean;
  /** Período mínimo de atividade */
  minActivity?: Date;
  /** Período máximo de atividade */
  maxActivity?: Date;
}

/**
 * Retorno do hook useChatHistory
 */
interface UseChatHistoryReturn {
  /** Estado atual */
  state: ChatHistoryState;
  /** Criar nova sessão */
  createSession: (
    type: ChatType,
    webhookUrl: string,
    options?: CreateSessionOptions
  ) => string;
  /** Ativar sessão */
  setActiveSession: (sessionId: string | null) => void;
  /** Adicionar mensagem */
  addMessage: (
    sessionId: string,
    content: string,
    sender: MessageSender,
    options?: AddMessageOptions
  ) => string;
  /** Atualizar mensagem */
  updateMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;
  /** Remover mensagem */
  removeMessage: (sessionId: string, messageId: string) => void;
  /** Atualizar status da mensagem */
  updateMessageStatus: (
    sessionId: string,
    messageId: string,
    status: MessageStatus,
    errorMessage?: string
  ) => void;
  /** Definir estado de digitação */
  setTyping: (sessionId: string, isTyping: boolean) => void;
  /** Encerrar sessão */
  endSession: (sessionId: string) => void;
  /** Limpar histórico da sessão */
  clearSessionHistory: (sessionId: string) => void;
  /** Obter sessão por ID */
  getSession: (sessionId: string) => ChatSession | null;
  /** Obter mensagens da sessão */
  getSessionMessages: (sessionId: string) => ChatMessage[];
  /** Buscar sessões */
  findSessions: (filters: SessionFilters) => ChatSession[];
  /** Limpar sessões expiradas */
  cleanupSessions: () => void;
  /** Exportar dados */
  exportData: () => string;
  /** Importar dados */
  importData: (data: string) => boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'chat_history';
const AUTO_SAVE_INTERVAL = 30000; // 30 segundos
const CLEANUP_INTERVAL = 300000; // 5 minutos
const MAX_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 1000;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook para gerenciamento de histórico de chat
 */
export const useChatHistory = (): UseChatHistoryReturn => {
  // Estado principal
  const [state, setState] = useState<ChatHistoryState>({
    sessions: {},
    activeSessionId: null,
    isLoading: true,
    error: null
  });

  // Referências
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const cleanupRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // ============================================================================
  // INTERNAL FUNCTIONS
  // ============================================================================

  /**
   * Atualiza estado
   */
  const updateState = useCallback((updates: Partial<ChatHistoryState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Salva estado no localStorage
   */
  const saveToStorage = useCallback((sessions: Record<string, ChatSession>) => {
    try {
      const sessionsArray = Object.values(sessions);
      saveChatSessions(sessionsArray);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
      updateState({ error: 'Erro ao salvar histórico' });
    }
  }, [updateState]);

  /**
   * Carrega estado do localStorage
   */
  const loadFromStorage = useCallback(() => {
    try {
      const sessionsArray = loadChatSessions();
      const sessions: Record<string, ChatSession> = {};

      sessionsArray.forEach(session => {
        sessions[session.id] = session;
      });

      updateState({
        sessions,
        isLoading: false,
        error: null
      });

      return sessions;
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      updateState({
        sessions: {},
        isLoading: false,
        error: 'Erro ao carregar histórico'
      });
      return {};
    }
  }, [updateState]);

  /**
   * Atualiza sessão no estado
   */
  const updateSession = useCallback((
    sessionId: string,
    updater: (session: ChatSession) => ChatSession
  ) => {
    setState(prev => {
      const session = prev.sessions[sessionId];
      if (!session) return prev;

      const updatedSession = updater(session);
      const newSessions = {
        ...prev.sessions,
        [sessionId]: updatedSession
      };

      // Auto-save
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      autoSaveRef.current = setTimeout(() => {
        saveToStorage(newSessions);
      }, 1000);

      return {
        ...prev,
        sessions: newSessions
      };
    });
  }, [saveToStorage]);

  /**
   * Limita número de sessões
   */
  const limitSessions = useCallback((sessions: Record<string, ChatSession>) => {
    const sessionsArray = Object.values(sessions);

    if (sessionsArray.length <= MAX_SESSIONS) {
      return sessions;
    }

    // Ordenar por última atividade (mais recentes primeiro)
    const sorted = sessionsArray.sort((a, b) =>
      b.lastActivity.getTime() - a.lastActivity.getTime()
    );

    // Manter apenas as mais recentes
    const limited = sorted.slice(0, MAX_SESSIONS);
    const newSessions: Record<string, ChatSession> = {};

    limited.forEach(session => {
      newSessions[session.id] = session;
    });

    return newSessions;
  }, []);

  /**
   * Limita mensagens por sessão
   */
  const limitMessages = useCallback((session: ChatSession): ChatSession => {
    if (session.messages.length <= MAX_MESSAGES_PER_SESSION) {
      return session;
    }

    // Manter apenas as mensagens mais recentes
    const limitedMessages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);

    return {
      ...session,
      messages: limitedMessages
    };
  }, []);

  // ============================================================================
  // PUBLIC FUNCTIONS
  // ============================================================================

  /**
   * Cria nova sessão
   */
  const createSession = useCallback((
    type: ChatType,
    webhookUrl: string,
    options: CreateSessionOptions = {}
  ): string => {
    const session = createChatSession(type, webhookUrl, options.metadata);

    setState(prev => {
      const newSessions = limitSessions({
        ...prev.sessions,
        [session.id]: session
      });

      return {
        ...prev,
        sessions: newSessions,
        activeSessionId: options.autoActivate !== false ? session.id : prev.activeSessionId
      };
    });

    return session.id;
  }, [limitSessions]);

  /**
   * Define sessão ativa
   */
  const setActiveSession = useCallback((sessionId: string | null) => {
    updateState({ activeSessionId: sessionId });
  }, [updateState]);

  /**
   * Adiciona mensagem à sessão
   */
  const addMessage = useCallback((
    sessionId: string,
    content: string,
    sender: MessageSender,
    options: AddMessageOptions = {}
  ): string => {
    const message = createChatMessage(content, sender);

    updateSession(sessionId, session => {
      const updatedSession = addMessageToSession(session, message);
      return limitMessages(updatedSession);
    });

    // Callback após adicionar
    options.onAdded?.(message);

    return message.id;
  }, [updateSession, limitMessages]);

  /**
   * Atualiza mensagem
   */
  const updateMessage = useCallback((
    sessionId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => {
    updateSession(sessionId, session =>
      updateMessageInSession(session, messageId, updates)
    );
  }, [updateSession]);

  /**
   * Remove mensagem
   */
  const removeMessage = useCallback((
    sessionId: string,
    messageId: string
  ) => {
    updateSession(sessionId, session =>
      removeMessageFromSession(session, messageId)
    );
  }, [updateSession]);

  /**
   * Atualiza status da mensagem
   */
  const updateMessageStatus = useCallback((
    sessionId: string,
    messageId: string,
    status: MessageStatus,
    errorMessage?: string
  ) => {
    updateMessage(sessionId, messageId, {
      status,
      metadata: {
        errorMessage: status === 'error' ? errorMessage : undefined
      }
    });
  }, [updateMessage]);

  /**
   * Define estado de digitação
   */
  const setTyping = useCallback((sessionId: string, isTyping: boolean) => {
    updateSession(sessionId, session => ({
      ...session,
      isTyping,
      lastActivity: new Date()
    }));
  }, [updateSession]);

  /**
   * Encerra sessão
   */
  const endSession = useCallback((sessionId: string) => {
    updateSession(sessionId, session => ({
      ...session,
      isActive: false,
      isTyping: false,
      lastActivity: new Date()
    }));

    // Se era a sessão ativa, desativar
    setState(prev => ({
      ...prev,
      activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId
    }));
  }, [updateSession]);

  /**
   * Limpa histórico da sessão
   */
  const clearSessionHistory = useCallback((sessionId: string) => {
    updateSession(sessionId, session => ({
      ...session,
      messages: [],
      lastActivity: new Date()
    }));
  }, [updateSession]);

  /**
   * Obtém sessão por ID
   */
  const getSession = useCallback((sessionId: string): ChatSession | null => {
    return state.sessions[sessionId] || null;
  }, [state.sessions]);

  /**
   * Obtém mensagens da sessão
   */
  const getSessionMessages = useCallback((sessionId: string): ChatMessage[] => {
    const session = getSession(sessionId);
    return session?.messages || [];
  }, [getSession]);

  /**
   * Busca sessões com filtros
   */
  const findSessions = useCallback((filters: SessionFilters): ChatSession[] => {
    return Object.values(state.sessions).filter(session => {
      if (filters.type && session.type !== filters.type) return false;
      if (filters.isActive !== undefined && session.isActive !== filters.isActive) return false;
      if (filters.minActivity && session.lastActivity < filters.minActivity) return false;
      if (filters.maxActivity && session.lastActivity > filters.maxActivity) return false;
      return true;
    });
  }, [state.sessions]);

  /**
   * Limpa sessões expiradas
   */
  const cleanupSessions = useCallback(() => {
    setState(prev => {
      const activeSessions: Record<string, ChatSession> = {};

      Object.values(prev.sessions).forEach(session => {
        if (!isSessionExpired(session)) {
          activeSessions[session.id] = session;
        }
      });

      // Salvar se houve mudanças
      if (Object.keys(activeSessions).length !== Object.keys(prev.sessions).length) {
        saveToStorage(activeSessions);
        console.log(`Limpeza: ${Object.keys(prev.sessions).length - Object.keys(activeSessions).length} sessões expiradas removidas`);
      }

      return {
        ...prev,
        sessions: activeSessions
      };
    });
  }, [saveToStorage]);

  /**
   * Exporta dados para JSON
   */
  const exportData = useCallback((): string => {
    const exportData = {
      sessions: Object.values(state.sessions),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.sessions]);

  /**
   * Importa dados de JSON
   */
  const importData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);

      if (!parsed.sessions || !Array.isArray(parsed.sessions)) {
        throw new Error('Formato de dados inválido');
      }

      const sessions: Record<string, ChatSession> = {};

      parsed.sessions.forEach((session: any) => {
        // Converter timestamps
        session.lastActivity = new Date(session.lastActivity);
        session.messages = session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        sessions[session.id] = session;
      });

      updateState({ sessions });
      saveToStorage(sessions);

      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      updateState({ error: 'Erro ao importar dados' });
      return false;
    }
  }, [updateState, saveToStorage]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Inicialização
   */
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      loadFromStorage();
    }
  }, [loadFromStorage]);

  /**
   * Auto-save periódico
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(state.sessions).length > 0) {
        saveToStorage(state.sessions);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [state.sessions, saveToStorage]);

  /**
   * Limpeza periódica
   */
  useEffect(() => {
    cleanupRef.current = setInterval(() => {
      cleanupSessions();
    }, CLEANUP_INTERVAL);

    return () => {
      if (cleanupRef.current) {
        clearInterval(cleanupRef.current);
      }
    };
  }, [cleanupSessions]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      if (cleanupRef.current) {
        clearInterval(cleanupRef.current);
      }

      // Salvar estado final
      if (Object.keys(state.sessions).length > 0) {
        saveToStorage(state.sessions);
      }
    };
  }, [state.sessions, saveToStorage]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    state,
    createSession,
    setActiveSession,
    addMessage,
    updateMessage,
    removeMessage,
    updateMessageStatus,
    setTyping,
    endSession,
    clearSessionHistory,
    getSession,
    getSessionMessages,
    findSessions,
    cleanupSessions,
    exportData,
    importData
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook para sessão específica
 */
export const useSessionHistory = (sessionId: string) => {
  const chatHistory = useChatHistory();
  const session = chatHistory.getSession(sessionId);

  const addMessage = useCallback((
    content: string,
    sender: MessageSender,
    options?: AddMessageOptions
  ) => {
    return chatHistory.addMessage(sessionId, content, sender, options);
  }, [chatHistory, sessionId]);

  const updateMessage = useCallback((
    messageId: string,
    updates: Partial<ChatMessage>
  ) => {
    chatHistory.updateMessage(sessionId, messageId, updates);
  }, [chatHistory, sessionId]);

  const setTyping = useCallback((isTyping: boolean) => {
    chatHistory.setTyping(sessionId, isTyping);
  }, [chatHistory, sessionId]);

  return {
    session,
    messages: session?.messages || [],
    addMessage,
    updateMessage,
    setTyping,
    endSession: () => chatHistory.endSession(sessionId),
    clearHistory: () => chatHistory.clearSessionHistory(sessionId)
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useChatHistory;

export type {
    AddMessageOptions, ChatHistoryState,
    CreateSessionOptions, SessionFilters,
    UseChatHistoryReturn
};
