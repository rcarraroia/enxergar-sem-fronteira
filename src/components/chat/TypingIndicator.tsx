/**
 * TypingIndicator Component
 *
 * Componente para indicar quando o agente está digitando
 */

import { cn } from '@/lib/utils';
import React, { memo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TypingIndicatorProps {
  /** Nome do agente que está digitando */
  agentName?: string;
  /** Se deve mostrar avatar */
  showAvatar?: boolean;
  /** Variante do indicador */
  variant?: 'default' | 'minimal' | 'dots-only';
  /** Classes CSS customizadas */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Indicador de digitação do agente
 */
const TypingIndicator: React.FC<TypingIndicatorProps> = memo(({
  agentName = 'Agente',
  showAvatar = true,
  variant = 'default',
  className
}) => {
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza avatar do agente
   */
  const renderAvatar = () => {
    if (!showAvatar || variant === 'dots-only') return null;

    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
        A
      </div>
    );
  };

  /**
   * Renderiza pontos animados
   */
  const renderTypingDots = () => {
    return (
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-current rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 bg-current rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-2 h-2 bg-current rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    );
  };

  /**
   * Renderiza texto de digitação
   */
  const renderTypingText = () => {
    if (variant === 'dots-only') return null;

    return (
      <span className="text-sm text-muted-foreground">
        {agentName} está digitando
      </span>
    );
  };

  /**
   * Renderiza bolha de digitação
   */
  const renderTypingBubble = () => {
    return (
      <div className={cn(
        "bg-muted text-muted-foreground px-4 py-2 rounded-2xl rounded-bl-md",
        "border border-border",
        "transition-all duration-200",
        "animate-pulse"
      )}>
        {renderTypingDots()}
      </div>
    );
  };

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  if (variant === 'dots-only') {
    return (
      <div className={cn("flex items-center justify-center py-2", className)}>
        <div className="text-muted-foreground">
          {renderTypingDots()}
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center space-x-2 py-1", className)}>
        <div className="text-muted-foreground text-xs">
          {renderTypingDots()}
        </div>
        {renderTypingText()}
      </div>
    );
  }

  // Default variant - similar ao MessageBubble
  return (
    <div className={cn("flex gap-3 max-w-[80%] mr-auto", className)}>
      {/* Avatar */}
      {renderAvatar()}

      {/* Typing Content */}
      <div className="flex flex-col items-start">
        {/* Typing Bubble */}
        {renderTypingBubble()}

        {/* Typing Text */}
        <div className="flex items-center space-x-2 mt-1 px-1">
          {renderTypingText()}
        </div>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// ============================================================================
// EXPORT
// ============================================================================

export default TypingIndicator;
