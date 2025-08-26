/**
 * MessageBubble Component
 *
 * Componente para renderizar mensagens individuais do chat
 */

import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/lib/chat/chatTypes';
import { formatMessageTime } from '@/lib/chat/chatUtils';
import { cn } from '@/lib/utils';
import React, { memo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface MessageBubbleProps {
  /** Dados da mensagem */
  message: ChatMessage;
  /** Se deve mostrar avatar */
  showAvatar?: boolean;
  /** Se deve mostrar timestamp */
  showTimestamp?: boolean;
  /** Callback para retry de mensagem */
  onRetry?: (messageId: string) => void;
  /** Classes CSS customizadas */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Bolha de mensagem individual
 */
const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  message,
  showAvatar = true,
  showTimestamp = true,
  onRetry,
  className
}) => {
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza ícone de status da mensagem
   */
  const renderStatusIcon = () => {
    if (!isUser) return null;

    switch (message.status) {
      case 'sending':
        return (
          <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />
        );
      case 'sent':
        return (
          <Check className="w-3 h-3 text-muted-foreground" />
        );
      case 'delivered':
        return (
          <div className="flex">
            <Check className="w-3 h-3 text-primary -mr-1" />
            <Check className="w-3 h-3 text-primary" />
          </div>
        );
      case 'error':
        return (
          <AlertTriangle className="w-3 h-3 text-destructive" />
        );
      default:
        return null;
    }
  };

  /**
   * Renderiza botão de retry
   */
  const renderRetryButton = () => {
    if (message.status !== 'error' || !onRetry) return null;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRetry(message.id)}
        className="h-6 px-2 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Tentar novamente
      </Button>
    );
  };

  /**
   * Renderiza avatar
   */
  const renderAvatar = () => {
    if (!showAvatar) return null;

    return (
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      )}>
        {isUser ? 'U' : 'A'}
      </div>
    );
  };

  /**
   * Renderiza indicadores especiais
   */
  const renderIndicators = () => {
    const indicators = [];

    // Indicador de entrada por voz
    if (message.metadata?.voiceInput) {
      indicators.push(
        <div
          key="voice"
          className="flex items-center text-xs text-muted-foreground"
          title="Mensagem enviada por voz"
        >
          <Volume2 className="w-3 h-3" />
        </div>
      );
    }

    // Tempo de resposta (para mensagens do agente)
    if (isAgent && message.metadata?.responseTime) {
      const responseTime = message.metadata.responseTime;
      indicators.push(
        <div
          key="response-time"
          className="text-xs text-muted-foreground"
          title={`Tempo de resposta: ${responseTime}ms`}
        >
          {responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`}
        </div>
      );
    }

    return indicators.length > 0 ? (
      <div className="flex items-center space-x-2 mt-1">
        {indicators}
      </div>
    ) : null;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn(
      "flex gap-3 max-w-[80%]",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto",
      className
    )}>
      {/* Avatar */}
      {renderAvatar()}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "relative px-4 py-2 rounded-2xl max-w-full break-words",
          "transition-all duration-200",
          // Styling baseado no sender
          isUser ? [
            "bg-primary text-primary-foreground",
            "rounded-br-md",
            message.status === 'error' && "bg-destructive"
          ] : [
            "bg-muted text-foreground",
            "rounded-bl-md",
            "border border-border"
          ],
          // Estados especiais
          message.status === 'sending' && "opacity-70",
          message.status === 'error' && "ring-1 ring-destructive/50"
        )}>
          {/* Message Text */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Error Message */}
          {message.status === 'error' && message.metadata?.errorMessage && (
            <div className="mt-2 pt-2 border-t border-current/20">
              <div className="text-xs opacity-90">
                {message.metadata.errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Message Footer */}
        <div className={cn(
          "flex items-center gap-2 mt-1 px-1",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Timestamp */}
          {showTimestamp && (
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.timestamp)}
            </span>
          )}

          {/* Status Icon */}
          {renderStatusIcon()}

          {/* Retry Count */}
          {message.metadata?.retryCount && message.metadata.retryCount > 0 && (
            <span className="text-xs text-muted-foreground">
              (tentativa {message.metadata.retryCount + 1})
            </span>
          )}
        </div>

        {/* Special Indicators */}
        {renderIndicators()}

        {/* Retry Button */}
        {renderRetryButton()}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// ============================================================================
// EXPORT
// ============================================================================

export default MessageBubble;
