/**
 * ChatInterface Component
 *
 * Componente principal que orquestra toda a funcionalidade de chat
 */

import { useChatHistory } from "@/hooks/useChatHistory";
import { useN8nChat } from "@/hooks/useN8nChat";
import type {
  ChatError,
  ChatInterfaceProps,
  N8nWebhookConfig
} from "@/lib/chat/chatTypes";
import {
  ChatErrorType
} from "@/lib/chat/chatTypes";
import { validateAndSanitizeMessage } from "@/lib/chat/chatValidation";
import { createDefaultN8nConfig } from "@/lib/chat/n8nClient";
import { cn } from "@/lib/utils";
import React, { lazy, useCallback, useEffect, useRef, useState } from "react";
import ChatHistory from "./ChatHistory";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

// Lazy load do componente de performance monitor
const ChatPerformanceMonitor = lazy(() => import("./ChatPerformanceMonitor"));

// Lazy load da lista virtualizada
const VirtualizedMessageList = lazy(() => import("./VirtualizedMessageList"));

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Interface principal de chat
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
  type,
  webhookUrl,
  placeholder = "Digite sua mensagem...",
  maxHeight = 400,
  enableVoice = false,
  onSessionStart,
  onSessionEnd,
  onError,
  onMetrics,
  className,
  theme = "light"
}) => {
  // Estados locais
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [useVirtualization, setUseVirtualization] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configuração n8n
  const n8nConfig: N8nWebhookConfig = createDefaultN8nConfig(
    type === "public" ? webhookUrl : "",
    type === "admin" ? webhookUrl : "",
    process.env.VITE_N8N_API_KEY
  );

  // Hooks
  const chatHistory = useChatHistory();
  const n8nChat = useN8nChat(n8nConfig);
  const offlineChat = useOfflineChat({
    fallbackResponses: {
      greeting: "Olá! No momento estou offline, mas sua mensagem foi salva e será processada assim que a conexão for restabelecida.",
      general: "Desculpe, estou temporariamente offline. Sua mensagem foi registrada e você receberá uma resposta em breve.",
      error: "Não foi possível conectar ao servidor. Suas mensagens estão sendo salvas localmente."
    },
    enableSmartResponses: true,
    syncOnReconnect: true
  });

  // Dados da sessão atual
  const currentSession = sessionId ? chatHistory.getSession(sessionId) : null;
  const messages = currentSession?.messages || [];

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Inicialização do componente
   */
  useEffect(() => {
    if (!isInitialized) {
      // Criar nova sessão
      const newSessionId = chatHistory.createSession(
        type,
        webhookUrl,
        { autoActivate: true }
      );

      setSessionId(newSessionId);
      setIsInitialized(true);

      // Callback de início de sessão
      onSessionStart?.(newSessionId);

      // Métricas
      onMetrics?.("session_started", { type, sessionId: newSessionId });
    }
  }, [isInitialized, type, webhookUrl, chatHistory, onSessionStart, onMetrics]);

  /**
   * Otimização baseada em performance
   */
  useEffect(() => {
    // Usar virtualização se houver muitas mensagens
    const shouldUseVirtualization = messages.length > 50;
    setUseVirtualization(shouldUseVirtualization);
  }, [messages.length]);

  /**
   * Auto-scroll para última mensagem
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    }
  }, [messages.length, n8nChat.state.isTyping]);

  /**
   * Tratamento de erros do n8n
   */
  useEffect(() => {
    if (n8nChat.state.error) {
      onError?.(n8nChat.state.error);
      onMetrics?.("error_occurred", {
        type: n8nChat.state.error.type,
        message: n8nChat.state.error.message,
        sessionId
      });
    }
  }, [n8nChat.state.error, onError, onMetrics, sessionId]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (sessionId) {
        chatHistory.endSession(sessionId);
        onSessionEnd?.(sessionId);
        onMetrics?.("session_ended", { sessionId });
      }
    };
  }, [sessionId, chatHistory, onSessionEnd, onMetrics]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Envia mensagem do usuário
   */
  const handleSendMessage = useCallback(async (content: string, isVoice = false) => {
    if (!sessionId) {return;}

    // Validar e sanitizar mensagem
    const validation = validateAndSanitizeMessage(content);
    if (!validation.success) {
      const error: ChatError = {
        type: ChatErrorType.VALIDATION_ERROR,
        message: validation.error || "Mensagem inválida",
        retryable: false,
        sessionId
      };
      onError?.(error);
      return;
    }

    const sanitizedContent = validation.data!;

    try {
      // Adicionar mensagem do usuário ao histórico
      const messageId = chatHistory.addMessage(
        sessionId,
        sanitizedContent,
        "user",
        {
          onAdded: (message) => {
            onMetrics?.("message_sent", {
              sessionId,
              messageId: message.id,
              voiceInput: isVoice,
              length: content.length
            });
          }
        }
      );

      // Atualizar status para "enviando"
      chatHistory.updateMessageStatus(sessionId, messageId, "sending");

      // Verificar se está online
      if (!offlineChat.isOnline) {
        // Modo offline - usar fallback
        const offlineResponse = await offlineChat.handleOfflineMessage(
          sanitizedContent,
          sessionId,
          { voiceInput: isVoice }
        );

        // Atualizar status para "offline"
        chatHistory.updateMessageStatus(sessionId, messageId, "sent");

        // Adicionar resposta offline
        chatHistory.addMessage(
          sessionId,
          offlineResponse.response,
          "agent",
          {
            onAdded: (message) => {
              onMetrics?.("offline_response", {
                sessionId,
                messageId: message.id,
                fallbackType: offlineResponse.type
              });
            }
          }
        );

        return;
      }

      // Modo online - enviar para n8n
      const startTime = Date.now();
      const response = await n8nChat.sendMessage(
        sessionId,
        sanitizedContent,
        type,
        {
          metadata: { voiceInput: isVoice },
          onProgress: (stage) => {
            if (stage === "processing") {
              chatHistory.setTyping(sessionId, true);
            }
          }
        }
      );

      const responseTime = Date.now() - startTime;

      // Atualizar status para "enviado"
      chatHistory.updateMessageStatus(sessionId, messageId, "sent");

      // Parar indicador de digitação
      chatHistory.setTyping(sessionId, false);

      // Adicionar resposta do agente
      if (response.data?.response) {
        chatHistory.addMessage(
          sessionId,
          response.data.response,
          "agent",
          {
            onAdded: (message) => {
              onMetrics?.("message_received", {
                sessionId,
                messageId: message.id,
                responseTime,
                agentResponse: true
              });
            }
          }
        );
      }

      // Processar ações se houver
      if (response.data?.actions) {
        console.log("Ações recebidas:", response.data.actions);
      }

      // Verificar se sessão deve ser encerrada
      if (response.data?.sessionComplete) {
        chatHistory.endSession(sessionId);
        onSessionEnd?.(sessionId);
        onMetrics?.("session_completed", { sessionId });
      }

    } catch (error) {
      // Tentar fallback offline em caso de erro
      if (offlineChat.isOnline) {
        try {
          const offlineResponse = await offlineChat.handleOfflineMessage(
            sanitizedContent,
            sessionId,
            { voiceInput: isVoice, isErrorFallback: true }
          );

          // Atualizar status para "fallback"
          chatHistory.updateMessageStatus(sessionId, messageId, "sent");

          // Adicionar resposta de fallback
          chatHistory.addMessage(
            sessionId,
            offlineResponse.response,
            "agent",
            {
              onAdded: (message) => {
                onMetrics?.("fallback_response", {
                  sessionId,
                  messageId: message.id,
                  originalError: error instanceof Error ? error.message : "Unknown error"
                });
              }
            }
          );
        } catch (fallbackError) {
          // Fallback também falhou
          chatHistory.updateMessageStatus(
            sessionId,
            messageId,
            "error",
            "Erro de conexão. Tente novamente."
          );
        }
      } else {
        // Já está offline, marcar como erro
        chatHistory.updateMessageStatus(
          sessionId,
          messageId,
          "error",
          error instanceof Error ? error.message : "Erro ao enviar mensagem"
        );
      }

      // Parar indicador de digitação
      chatHistory.setTyping(sessionId, false);
    }
  }, [sessionId, type, chatHistory, n8nChat, offlineChat, messages, onError, onMetrics]);

  /**
   * Tenta reenviar mensagem com erro
   */
  const handleRetryMessage = useCallback(async (messageId: string) => {
    if (!sessionId) {return;}

    const message = messages.find(m => m.id === messageId);
    if (!message || message.sender !== "user") {return;}

    // Reenviar mensagem
    await handleSendMessage(message.content, message.metadata?.voiceInput);
  }, [sessionId, messages, handleSendMessage]);

  /**
   * Limpa erro atual
   */
  const handleClearError = useCallback(() => {
    n8nChat.clearError();
  }, [n8nChat]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isInitialized || !sessionId) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-4",
          "text-muted-foreground",
          className
        )}
        style={{ maxHeight }}
      >
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Inicializando chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-background border rounded-lg shadow-sm",
        "transition-all duration-200",
        theme === "dark" && "dark",
        className
      )}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            offlineChat.isOnline
              ? "bg-green-500 animate-pulse"
              : "bg-orange-500"
          )}></div>
          <span className="text-sm font-medium">
            {type === "public" ? "Assistente Virtual" : "Suporte Técnico"}
          </span>
          {!offlineChat.isOnline && (
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Offline
            </span>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {n8nChat.state.isLoading && (
            <span className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
              <span>Enviando...</span>
            </span>
          )}
          {offlineChat.pendingMessages.length > 0 && (
            <span className="text-orange-600">
              {offlineChat.pendingMessages.length} pendentes
            </span>
          )}
          {messages.length > 0 && (
            <span>{messages.length} mensagens</span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ChatHistory
          messages={messages}
          isTyping={currentSession?.isTyping || false}
          onRetryMessage={handleRetryMessage}
          className="h-full"
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {currentSession?.isTyping && (
        <div className="px-3 py-2 border-t bg-muted/30">
          <TypingIndicator
            agentName={type === "public" ? "Assistente" : "Suporte"}
          />
        </div>
      )}

      {/* Offline Status */}
      {!offlineChat.isOnline && (
        <div className="px-3 py-2 border-t bg-orange-50 border-orange-200">
          <div className="flex items-center space-x-2 text-sm text-orange-700">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>
              Modo offline ativo. Suas mensagens serão sincronizadas quando a conexão for restabelecida.
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {n8nChat.state.error && (
        <div className="px-3 py-2 border-t">
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-red-700">
                {n8nChat.state.error.message}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {n8nChat.state.error.retryable && (
                <button
                  onClick={n8nChat.retryLastMessage}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Tentar novamente
                </button>
              )}
              <button
                onClick={handleClearError}
                className="text-xs text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background">
        <MessageInput
          placeholder={placeholder}
          onSendMessage={handleSendMessage}
          disabled={n8nChat.state.isLoading || !currentSession?.isActive}
          enableVoice={enableVoice}
          className="border-0 shadow-none"
        />
      </div>


    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default ChatInterface;
