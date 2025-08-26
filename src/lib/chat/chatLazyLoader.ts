/**
 * Chat Lazy Loader
 *
 * Sistema de carregamento lazy para componentes e recursos do chat
 */

import { ComponentType, lazy } from 'react';
import { getChatConfig, isFeatureEnabled } from './chatConfig';

// ============================================================================
// TYPES
// ============================================================================

interface LazyLoadOptions {
  /** Delay antes de carregar em ms */
  delay?: number;
  /** Se deve fazer preload */
  preload?: boolean;
  /** Condição para carregamento */
  condition?: () => boolean;
  /** Fallback durante carregamento */
  fallback?: ComponentType;
  /** Timeout para carregamento */
  timeout?: number;
}

interface LazyComponentCache {
  [key: string]: {
    component: ComponentType<any>;
    loaded: boolean;
    loading: boolean;
    error?: Error;
  };
}

// ============================================================================
// LAZY COMPONENT CACHE
// ============================================================================

const componentCache: LazyComponentCache = {};

/**
 * Cria componente lazy com cache
 */
function createLazyComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  key: string,
  options: LazyLoadOptions = {}
): ComponentType<T> {
  // Verificar se já está no cache
  if (componentCache[key]?.loaded) {
    return componentCache[key].component;
  }

  // Verificar condição se fornecida
  if (options.condition && !options.condition()) {
    return (() => null) as ComponentType<T>;
  }

  // Criar componente lazy
  const LazyComponent = lazy(async () => {
    try {
      // Marcar como carregando
      if (componentCache[key]) {
        componentCache[key].loading = true;
      } else {
        componentCache[key] = {
          component: (() => null) as ComponentType<T>,
          loaded: false,
          loading: true
        };
      }

      // Aplicar delay se especificado
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }

      // Carregar componente
      const module = await importFn();

      // Atualizar cache
      componentCache[key] = {
        component: module.default,
        loaded: true,
        loading: false
      };

      return module;

    } catch (error) {
      // Atualizar cache com erro
      componentCache[key] = {
        component: options.fallback || (() => null) as ComponentType<T>,
        loaded: false,
        loading: false,
        error: error as Error
      };

      throw error;
    }
  });

  return LazyComponent;
}

// ============================================================================
// LAZY CHAT COMPONENTS
// ============================================================================

/**
 * Componente de chat público com lazy loading
 */
export const LazyPublicChatWidget = createLazyComponent(
  () => import('@/components/chat/PublicChatWidget'),
  'PublicChatWidget',
  {
    condition: () => isFeatureEnabled('enablePublicChat'),
    preload: true
  }
);

/**
 * Painel de chat admin com lazy loading
 */
export const LazyAdminChatPanel = createLazyComponent(
  () => import('@/components/chat/AdminChatPanel'),
  'AdminChatPanel',
  {
    condition: () => isFeatureEnabled('enableAdminChat'),
    delay: 100 // Pequeno delay para não bloquear UI principal
  }
);

/**
 * Entrada por voz com lazy loading
 */
export const LazyVoiceInput = createLazyComponent(
  () => import('@/components/chat/VoiceInput'),
  'VoiceInput',
  {
    condition: () => isFeatureEnabled('enableVoiceInput'),
    delay: 200 // Delay maior pois é feature opcional
  }
);

/**
 * Dashboard de métricas com lazy loading
 */
export const LazyChatMetricsDashboard = createLazyComponent(
  () => import('@/components/chat/ChatMetricsDashboard'),
  'ChatMetricsDashboard',
  {
    condition: () => isFeatureEnabled('enableMetrics') && isFeatureEnabled('enableDevMode'),
    delay: 300 // Delay maior pois é ferramenta de desenvolvimento
  }
);

/**
 * Painel de configuração com lazy loading
 */
export const LazyChatConfigPanel = createLazyComponent(
  () => import('@/components/chat/ChatConfigPanel'),
  'ChatConfigPanel',
  {
    condition: () => isFeatureEnabled('enableDevMode'),
    delay: 300
  }
);

// ============================================================================
// PRELOADING SYSTEM
// ============================================================================

/**
 * Precarrega componentes baseado na configuração
 */
export function preloadChatComponents(): void {
  const config = getChatConfig();

  // Precarregar componentes principais se habilitados
  if (config.featureFlags.enablePublicChat) {
    import('@/components/chat/PublicChatWidget').catch(() => {});
  }

  if (config.featureFlags.enableAdminChat) {
    import('@/components/chat/AdminChatPanel').catch(() => {});
  }

  // Precarregar componentes opcionais com delay
  setTimeout(() => {
    if (config.featureFlags.enableVoiceInput) {
      import('@/components/chat/VoiceInput').catch(() => {});
    }

    if (config.featureFlags.enableMetrics && config.featureFlags.enableDevMode) {
      import('@/components/chat/ChatMetricsDashboard').catch(() => {});
    }
  }, 1000);
}

/**
 * Precarrega recursos específicos do chat
 */
export function preloadChatResources(): void {
  // Precarregar bibliotecas pesadas
  if (isFeatureEnabled('enableAdvancedSecurity')) {
    import('isomorphic-dompurify').catch(() => {});
  }

  if (isFeatureEnabled('enableVoiceInput')) {
    // Verificar suporte a speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Precarregar recursos de voz
      setTimeout(() => {
        try {
          const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
          new SpeechRecognition();
        } catch (error) {
          // Ignorar erros de preload
        }
      }, 2000);
    }
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Otimizações de performance para o chat
 */
export class ChatPerformanceOptimizer {
  private static instance: ChatPerformanceOptimizer;
  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  static getInstance(): ChatPerformanceOptimizer {
    if (!ChatPerformanceOptimizer.instance) {
      ChatPerformanceOptimizer.instance = new ChatPerformanceOptimizer();
    }
    return ChatPerformanceOptimizer.instance;
  }

  /**
   * Configura lazy loading baseado em visibilidade
   */
  setupVisibilityBasedLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const componentName = element.dataset.lazyComponent;

            if (componentName && !componentCache[componentName]?.loaded) {
              this.loadComponent(componentName);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Carregar 50px antes de ficar visível
        threshold: 0.1
      }
    );
  }

  /**
   * Observa elemento para lazy loading
   */
  observeElement(element: HTMLElement, componentName: string): void {
    if (this.intersectionObserver) {
      element.dataset.lazyComponent = componentName;
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Para de observar elemento
   */
  unobserveElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   * Carrega componente específico
   */
  private async loadComponent(componentName: string): Promise<void> {
    if (componentCache[componentName]?.loading) return;

    try {
      switch (componentName) {
        case 'PublicChatWidget':
          await import('@/components/chat/PublicChatWidget');
          break;
        case 'AdminChatPanel':
          await import('@/components/chat/AdminChatPanel');
          break;
        case 'VoiceInput':
          await import('@/components/chat/VoiceInput');
          break;
        case 'ChatMetricsDashboard':
          await import('@/components/chat/ChatMetricsDashboard');
          break;
        case 'ChatConfigPanel':
          await import('@/components/chat/ChatConfigPanel');
          break;
      }
    } catch (error) {
      console.warn(`Failed to load component ${componentName}:`, error);
    }
  }

  /**
   * Debounce para funções
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Throttle para funções
   */
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  }

  /**
   * Cleanup de recursos
   */
  cleanup(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * Gerenciador de memória para o chat
 */
export class ChatMemoryManager {
  private static instance: ChatMemoryManager;
  private memoryThreshold = 50 * 1024 * 1024; // 50MB
  private cleanupInterval?: NodeJS.Timeout;

  static getInstance(): ChatMemoryManager {
    if (!ChatMemoryManager.instance) {
      ChatMemoryManager.instance = new ChatMemoryManager();
    }
    return ChatMemoryManager.instance;
  }

  /**
   * Inicia monitoramento de memória
   */
  startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    this.cleanupInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Verificar a cada 30 segundos
  }

  /**
   * Verifica uso de memória
   */
  private checkMemoryUsage(): void {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    const usedMemory = memory.usedJSHeapSize;

    if (usedMemory > this.memoryThreshold) {
      this.performCleanup();
    }
  }

  /**
   * Executa limpeza de memória
   */
  private performCleanup(): void {
    // Limpar cache de componentes não utilizados
    Object.keys(componentCache).forEach(key => {
      const cached = componentCache[key];
      if (cached.loaded && !this.isComponentInUse(key)) {
        delete componentCache[key];
      }
    });

    // Forçar garbage collection se disponível
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Verifica se componente está em uso
   */
  private isComponentInUse(componentName: string): boolean {
    // Verificar se há elementos DOM relacionados ao componente
    const selectors = {
      'PublicChatWidget': '[data-chat-widget="public"]',
      'AdminChatPanel': '[data-chat-panel="admin"]',
      'VoiceInput': '[data-voice-input]',
      'ChatMetricsDashboard': '[data-metrics-dashboard]',
      'ChatConfigPanel': '[data-config-panel]'
    };

    const selector = selectors[componentName as keyof typeof selectors];
    return selector ? document.querySelector(selector) !== null : false;
  }

  /**
   * Para monitoramento
   */
  stopMemoryMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

// ============================================================================
// BUNDLE SPLITTING
// ============================================================================

/**
 * Configuração de code splitting para o chat
 */
export const chatBundleConfig = {
  // Chunk principal do chat
  core: () => import('@/lib/chat/index'),

  // Chunk de componentes de UI
  ui: () => Promise.all([
    import('@/components/chat/ChatInterface'),
    import('@/components/chat/MessageInput'),
    import('@/components/chat/MessageBubble'),
    import('@/components/chat/ChatHistory')
  ]),

  // Chunk de funcionalidades avançadas
  advanced: () => Promise.all([
    import('@/components/chat/VoiceInput'),
    import('@/lib/chat/chatMetrics'),
    import('@/components/chat/ChatMetricsDashboard')
  ]),

  // Chunk de segurança
  security: () => Promise.all([
    import('@/lib/chat/chatSecurity'),
    import('@/lib/chat/securityMiddleware')
  ]),

  // Chunk de desenvolvimento
  dev: () => Promise.all([
    import('@/components/chat/ChatConfigPanel'),
    import('@/components/chat/ChatMetricsDashboard')
  ])
};

/**
 * Carrega chunks baseado na configuração
 */
export async function loadChatChunks(): Promise<void> {
  const config = getChatConfig();
  const chunks: Promise<any>[] = [];

  // Sempre carregar core
  chunks.push(chatBundleConfig.core());

  // Carregar UI se chat estiver habilitado
  if (config.featureFlags.enableChat) {
    chunks.push(chatBundleConfig.ui());
  }

  // Carregar funcionalidades avançadas se habilitadas
  if (config.featureFlags.enableVoiceInput || config.featureFlags.enableMetrics) {
    chunks.push(chatBundleConfig.advanced());
  }

  // Carregar segurança se habilitada
  if (config.featureFlags.enableAdvancedSecurity) {
    chunks.push(chatBundleConfig.security());
  }

  // Carregar desenvolvimento se habilitado
  if (config.featureFlags.enableDevMode) {
    chunks.push(chatBundleConfig.dev());
  }

  try {
    await Promise.all(chunks);
  } catch (error) {
    console.warn('Failed to load some chat chunks:', error);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Inicializa otimizações de performance
 */
export function initializeChatPerformance(): void {
  // Configurar lazy loading
  const optimizer = ChatPerformanceOptimizer.getInstance();
  optimizer.setupVisibilityBasedLoading();

  // Iniciar monitoramento de memória
  const memoryManager = ChatMemoryManager.getInstance();
  memoryManager.startMemoryMonitoring();

  // Precarregar recursos críticos
  preloadChatResources();

  // Carregar chunks necessários
  loadChatChunks();

  // Cleanup ao descarregar página
  window.addEventListener('beforeunload', () => {
    optimizer.cleanup();
    memoryManager.stopMemoryMonitoring();
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    ChatMemoryManager, ChatPerformanceOptimizer, componentCache
};

// Auto-inicializar se chat estiver habilitado
if (isFeatureEnabled('enableChat')) {
  // Inicializar após DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatPerformance);
  } else {
    initializeChatPerformance();
  }
}
