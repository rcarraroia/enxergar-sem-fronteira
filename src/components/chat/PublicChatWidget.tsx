/**
 * PublicChatWidget Component
 *
 * Widget de chat para site público com botão flutuante
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicChatWidgetProps } from '@/lib/chat/chatTypes';
import { cn } from '@/lib/utils';
import {
  ArrowsPointingOutIcon,
  ChatBubbleLeftRightIcon,
  MinusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatInterface from './ChatInterface';

// ============================================================================
// TYPES
// ============================================================================

interface PublicChatWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  hasNewMessages: boolean;
  unreadCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WIDGET_POSITIONS = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'inline': 'relative'
};

const ANIMATION_DURATION = 300;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Widget de chat público flutuante
 */
const PublicChatWidget: React.FC<PublicChatWidgetProps> = ({
  isVisible,
  onToggle,
  position = 'bottom-right',
  theme = 'light',
  className
}) => {
  // Estados
  const [widgetState, setWidgetState] = useState<PublicChatWidgetState>({
    isOpen: false,
    isMinimized: false,
    hasNewMessages: false,
    unreadCount: 0
  });

  // Refs
  const widgetRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Configuração do webhook (deve vir de variáveis de ambiente)
  const webhookUrl = process.env.VITE_N8N_PUBLIC_WEBHOOK_URL || '';

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Controla visibilidade baseada na prop
   */
  useEffect(() => {
    if (!isVisible && widgetState.isOpen) {
      setWidgetState(prev => ({ ...prev, isOpen: false }));
    }
  }, [isVisible, widgetState.isOpen]);

  /**
   * Detecta cliques fora do widget
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node) &&
        widgetState.isOpen &&
        position !== 'inline'
      ) {
        handleMinimize();
      }
    };

    if (widgetState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [widgetState.isOpen, position]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC para fechar
      if (event.key === 'Escape' && widgetState.isOpen) {
        handleClose();
      }
    };

    if (widgetState.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [widgetState.isOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Abre o chat
   */
  const handleOpen = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      hasNewMessages: false,
      unreadCount: 0
    }));
    onToggle?.();
  }, [onToggle]);

  /**
   * Fecha o chat
   */
  const handleClose = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isOpen: false,
      isMinimized: false
    }));
    onToggle?.();
  }, [onToggle]);

  /**
   * Minimiza o chat
   */
  const handleMinimize = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isMinimized: true
    }));
  }, []);

  /**
   * Restaura o chat minimizado
   */
  const handleRestore = useCallback(() => {
    setWidgetState(prev => ({
      ...prev,
      isMinimized: false
    }));
  }, []);

  /**
   * Toggle do widget
   */
  const handleToggle = useCallback(() => {
    if (widgetState.isOpen) {
      if (widgetState.isMinimized) {
        handleRestore();
      } else {
        handleClose();
      }
    } else {
      handleOpen();
    }
  }, [widgetState.isOpen, widgetState.isMinimized, handleOpen, handleClose, handleRestore]);

  /**
   * Callback quando sessão inicia
   */
  const handleSessionStart = useCallback((sessionId: string) => {
    console.log('Chat público iniciado:', sessionId);
  }, []);

  /**
   * Callback quando sessão termina
   */
  const handleSessionEnd = useCallback((sessionId: string) => {
    console.log('Chat público finalizado:', sessionId);
  }, []);

  /**
   * Callback para erros
   */
  const handleError = useCallback((error: any) => {
    console.error('Erro no chat público:', error);
  }, []);

  /**
   * Callback para métricas
   */
  const handleMetrics = useCallback((event: string, data: Record<string, unknown>) => {
    console.log('Métrica do chat público:', event, data);

    // Atualizar contador de mensagens não lidas se minimizado
    if (event === 'message_received' && widgetState.isMinimized) {
      setWidgetState(prev => ({
        ...prev,
        hasNewMessages: true,
        unreadCount: prev.unreadCount + 1
      }));
    }
  }, [widgetState.isMinimized]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza botão flutuante
   */
  const renderFloatingButton = () => {
    if (position === 'inline') return null;

    return (
      <Button
        onClick={handleToggle}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-300 transform hover:scale-105",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "relative overflow-hidden"
        )}
        title="Abrir chat de suporte"
      >
        {/* Icon */}
        <div className={cn(
          "transition-transform duration-300",
          widgetState.isOpen ? "rotate-180" : "rotate-0"
        )}>
          {widgetState.isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          )}
        </div>

        {/* Notification Badge */}
        {widgetState.hasNewMessages && widgetState.unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {widgetState.unreadCount > 9 ? '9+' : widgetState.unreadCount}
          </Badge>
        )}

        {/* Pulse animation for new messages */}
        {widgetState.hasNewMessages && (
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        )}
      </Button>
    );
  };

  /**
   * Renderiza header do chat
   */
  const renderChatHeader = () => {
    return (
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistente Virtual</h3>
            <p className="text-xs opacity-90">Como posso ajudar?</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Minimize Button */}
          {position !== 'inline' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              title="Minimizar"
            >
              <MinusIcon className="h-4 w-4" />
            </Button>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            title="Fechar"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renderiza chat minimizado
   */
  const renderMinimizedChat = () => {
    return (
      <Card className="w-80 shadow-xl border-primary/20">
        <div
          className="flex items-center justify-between p-3 bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
          onClick={handleRestore}
        >
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Assistente Virtual</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Unread Badge */}
            {widgetState.unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {widgetState.unreadCount}
              </Badge>
            )}

            {/* Restore Icon */}
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </div>
        </div>
      </Card>
    );
  };

  /**
   * Renderiza chat completo
   */
  const renderFullChat = () => {
    return (
      <Card className="w-80 h-96 shadow-xl border-primary/20 flex flex-col overflow-hidden">
        {/* Header */}
        {renderChatHeader()}

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            type="public"
            webhookUrl={webhookUrl}
            placeholder="Digite sua mensagem..."
            maxHeight={320}
            enableVoice={true}
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
            onError={handleError}
            onMetrics={handleMetrics}
            theme={theme}
            className="h-full border-0 shadow-none rounded-none"
          />
        </div>
      </Card>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isVisible) {
    return null;
  }

  // Render inline
  if (position === 'inline') {
    return (
      <div ref={widgetRef} className={cn("w-full", className)}>
        {renderFullChat()}
      </div>
    );
  }

  // Render floating widget
  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 transition-all duration-300",
        WIDGET_POSITIONS[position],
        className
      )}
      style={{
        transform: `translateY(${widgetState.isOpen ? '0' : '10px'})`,
        opacity: isVisible ? 1 : 0
      }}
    >
      {/* Chat Window */}
      {widgetState.isOpen && (
        <div
          ref={chatRef}
          className={cn(
            "mb-4 transition-all duration-300 transform origin-bottom-right",
            widgetState.isMinimized ? "scale-95 opacity-90" : "scale-100 opacity-100"
          )}
        >
          {widgetState.isMinimized ? renderMinimizedChat() : renderFullChat()}
        </div>
      )}

      {/* Floating Button */}
      {renderFloatingButton()}

      {/* Welcome Message (when closed) */}
      {!widgetState.isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 mr-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-xs border animate-bounce">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              👋 Precisa de ajuda? Clique aqui para conversar!
            </p>
            <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800 border-r border-b"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default PublicChatWidget;
