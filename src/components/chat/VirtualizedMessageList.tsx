/**
 * Virtualized Message List
 *
 * Lista virtualizada para performance com muitas mensagens
 */

import { useOptimizedResize, useOptimizedScroll } from '@/hooks/useChatPerformance';
import { ChatMessage } from '@/lib/chat/chatTypes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';

// ============================================================================
// TYPES
// ============================================================================

interface VirtualizedMessageListProps {
  /** Lista de mensagens */
  messages: ChatMessage[];
  /** Altura do container */
  height: number;
  /** Altura estimada de cada item */
  itemHeight?: number;
  /** Número de itens extras para renderizar */
  overscan?: number;
  /** Se deve fazer scroll automático para novas mensagens */
  autoScroll?: boolean;
  /** Callback quando scroll atinge o topo */
  onScrollTop?: () => void;
  /** Callback quando scroll atinge o fundo */
  onScrollBottom?: () => void;
  /** Classe CSS customizada */
  className?: string;
  /** Props adicionais para MessageBubble */
  messageBubbleProps?: any;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  height: number;
}

// ============================================================================
// VIRTUALIZATION LOGIC
// ============================================================================

function useVirtualization(
  itemCount: number,
  containerHeight: number,
  itemHeight: number,
  overscan: number,
  scrollTop: number
) {
  return useMemo(() => {
    if (itemCount === 0) {
      return {
        virtualItems: [],
        totalHeight: 0,
        startIndex: 0,
        endIndex: 0
      };
    }

    const totalHeight = itemCount * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const virtualItems: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        height: itemHeight
      });
    }

    return {
      virtualItems,
      totalHeight,
      startIndex,
      endIndex
    };
  }, [itemCount, containerHeight, itemHeight, overscan, scrollTop]);
}

// ============================================================================
// COMPONENT
// ============================================================================

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  height,
  itemHeight = 80,
  overscan = 5,
  autoScroll = true,
  onScrollTop,
  onScrollBottom,
  className = '',
  messageBubbleProps = {}
}) => {
  // Estados
  const [scrollTop, setScrollTop] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // VIRTUALIZATION
  // ============================================================================

  const { virtualItems, totalHeight, startIndex, endIndex } = useVirtualization(
    messages.length,
    height,
    itemHeight,
    overscan,
    scrollTop
  );

  // ============================================================================
  // SCROLL HANDLING
  // ============================================================================

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    const newScrollTop = target.scrollTop;

    setScrollTop(newScrollTop);
    setIsUserScrolling(true);

    // Detectar scroll no topo
    if (newScrollTop <= 10 && onScrollTop) {
      onScrollTop();
    }

    // Detectar scroll no fundo
    const isAtBottom = newScrollTop + target.clientHeight >= target.scrollHeight - 10;
    if (isAtBottom && onScrollBottom) {
      onScrollBottom();
    }

    // Reset user scrolling flag
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }

    autoScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  }, [onScrollTop, onScrollBottom]);

  const { scrollRef } = useOptimizedScroll(handleScroll, 16); // 60fps

  // ============================================================================
  // AUTO SCROLL
  // ============================================================================

  useEffect(() => {
    if (!autoScroll || isUserScrolling) return;

    const newMessageCount = messages.length;
    const hadNewMessage = newMessageCount > lastMessageCountRef.current;

    if (hadNewMessage && containerRef.current) {
      // Scroll para o final quando há nova mensagem
      const container = containerRef.current;
      const isNearBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 100;

      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }

    lastMessageCountRef.current = newMessageCount;
  }, [messages.length, autoScroll, isUserScrolling]);

  // ============================================================================
  // RESIZE HANDLING
  // ============================================================================

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    // Recalcular virtualização quando container muda de tamanho
    if (containerRef.current) {
      const newHeight = entries[0]?.contentRect.height || height;
      // Atualizar altura se necessário
    }
  }, [height]);

  const { resizeRef } = useOptimizedResize(handleResize, 100);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Combinar refs
  useEffect(() => {
    if (containerRef.current) {
      scrollRef.current = containerRef.current;
      resizeRef.current = containerRef.current;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  const containerStyles: React.CSSProperties = {
    height: `${height}px`,
    overflow: 'auto',
    position: 'relative'
  };

  const contentStyles: React.CSSProperties = {
    height: `${totalHeight}px`,
    position: 'relative'
  };

  const itemStyles = (item: VirtualItem): React.CSSProperties => ({
    position: 'absolute',
    top: `${item.start}px`,
    left: 0,
    right: 0,
    height: `${item.height}px`
  });

  return (
    <div
      ref={containerRef}
      className={`virtualized-message-list ${className}`}
      style={containerStyles}
      role="log"
      aria-label="Chat conversation"
      aria-live="polite"
    >
      <div ref={contentRef} style={contentStyles}>
        {virtualItems.map((item) => {
          const message = messages[item.index];
          if (!message) return null;

          return (
            <div
              key={message.id}
              style={itemStyles(item)}
              data-index={item.index}
            >
              <MessageBubble
                message={message}
                {...messageBubbleProps}
              />
            </div>
          );
        })}
      </div>

      {/* Indicador de loading para scroll infinito */}
      {startIndex > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            fontSize: '12px',
            color: '#666'
          }}
        >
          Carregando mensagens anteriores...
        </div>
      )}

      {/* Indicador de nova mensagem */}
      {isUserScrolling && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }}
        >
          ↓ Nova mensagem
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PERFORMANCE OPTIMIZED VERSION
// ============================================================================

/**
 * Versão otimizada com memoização
 */
export const OptimizedVirtualizedMessageList = React.memo(
  VirtualizedMessageList,
  (prevProps, nextProps) => {
    // Comparação otimizada para evitar re-renders desnecessários
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    if (prevProps.height !== nextProps.height) {
      return false;
    }

    if (prevProps.autoScroll !== nextProps.autoScroll) {
      return false;
    }

    // Comparar apenas as últimas mensagens se a lista cresceu
    const lastPrevMessage = prevProps.messages[prevProps.messages.length - 1];
    const lastNextMessage = nextProps.messages[nextProps.messages.length - 1];

    if (lastPrevMessage?.id !== lastNextMessage?.id) {
      return false;
    }

    return true;
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export default VirtualizedMessageList;
