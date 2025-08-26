/**
 * ChatHistory Component
 *
 * Componente para exibir histórico de mensagens com virtualização
 */

import { ChatMessage } from '@/lib/chat/chatTypes';
import { cn } from '@/lib/utils';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

// ============================================================================
// TYPES
// ============================================================================

interface ChatHistoryProps {
  /** Lista de mensagens */
  messages: ChatMessage[];
  /** Se o agente está digitando */
  isTyping?: boolean;
  /** Nome do agente */
  agentName?: string;
  /** Se deve fazer scroll automático */
  autoScroll?: boolean;
  /** Se deve mostrar avatares */
  showAvatars?: boolean;
  /** Se deve mostrar timestamps */
  showTimestamps?: boolean;
  /** Callback para retry de mensagem */
  onRetryMessage?: (messageId: string) => void;
  /** Classes CSS customizadas */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VIRTUALIZATION_THRESHOLD = 50; // Número de mensagens para ativar virtualização
const MESSAGE_HEIGHT_ESTIMATE = 80; // Altura estimada por mensagem em pixels
const SCROLL_THRESHOLD = 100; // Distância do bottom para considerar "no final"

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Histórico de mensagens com scroll automático e virtualização
 */
const ChatHistory: React.FC<ChatHistoryProps> = memo(({
  messages,
  isTyping = false,
  agentName = 'Agente',
  autoScroll = true,
  showAvatars = true,
  showTimestamps = true,
  onRetryMessage,
  className
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const isUserScrolling = useRef<boolean>(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Determina se deve usar virtualização
   */
  const shouldVirtualize = useMemo(() => {
    return messages.length > VIRTUALIZATION_THRESHOLD;
  }, [messages.length]);

  /**
   * Verifica se está próximo do final
   */
  const isNearBottom = useMemo(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Auto-scroll para o final quando há novas mensagens
   */
  useEffect(() => {
    if (autoScroll && !isUserScrolling.current && (isNearBottom || messages.length === 1)) {
      scrollToBottom();
    }
  }, [messages.length, isTyping, autoScroll, isNearBottom]);

  /**
   * Detectar scroll do usuário
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;

      // Detectar se o usuário está fazendo scroll manual
      if (Math.abs(currentScrollTop - lastScrollTop.current) > 5) {
        isUserScrolling.current = true;

        // Reset após um tempo
        setTimeout(() => {
          isUserScrolling.current = false;
        }, 1000);
      }

      lastScrollTop.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  /**
   * Faz scroll para o final
   */
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };

  /**
   * Renderiza mensagem individual
   */
  const renderMessage = (message: ChatMessage, index: number) => {
    return (
      <MessageBubble
        key={message.id}
        message={message}
        showAvatar={showAvatars}
        showTimestamp={showTimestamps}
        onRetry={onRetryMessage}
        className="mb-4"
      />
    );
  };

  /**
   * Renderiza lista de mensagens (sem virtualização)
   */
  const renderMessageList = () => {
    return (
      <div className="space-y-4 p-4">
        {messages.map((message, index) => renderMessage(message, index))}

        {/* Typing Indicator */}
        {isTyping && (
          <TypingIndicator
            agentName={agentName}
            showAvatar={showAvatars}
            className="mb-4"
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  /**
   * Renderiza lista virtualizada (para muitas mensagens)
   */
  const renderVirtualizedList = () => {
    // Para implementação futura com react-window ou similar
    // Por enquanto, usar lista normal mesmo com muitas mensagens
    return renderMessageList();
  };

  /**
   * Renderiza estado vazio
   */
  const renderEmptyState = () => {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm">
            Inicie uma conversa enviando uma mensagem
          </p>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (messages.length === 0 && !isTyping) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(203 213 225) transparent'
        }}
      >
        {shouldVirtualize ? renderVirtualizedList() : renderMessageList()}
      </div>

      {/* Scroll to Bottom Button */}
      {!isNearBottom && messages.length > 5 && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => scrollToBottom()}
            className={cn(
              "w-10 h-10 rounded-full bg-primary text-primary-foreground",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "flex items-center justify-center",
              "hover:scale-105 active:scale-95"
            )}
            title="Ir para o final"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

ChatHistory.displayName = 'ChatHistory';

// ============================================================================
// EXPORT
// ============================================================================

export default ChatHistory;
