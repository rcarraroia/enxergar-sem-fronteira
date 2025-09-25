/**
 * useChatPerformance Hook
 *
 * Hook para otimizações de performance do chat
 */

import { ChatMemoryManager, ChatPerformanceOptimizer } from '@/lib/chat/chatLazyLoader';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useChatConfig } from './useChatConfig';

// ============================================================================
// TYPES
// ============================================================================

interface UseChatPerformanceOptions {
  /** Se deve habilitar lazy loading */
  enableLazyLoading?: boolean;
  /** Se deve monitorar memória */
  enableMemoryMonitoring?: boolean;
  /** Delay para debounce em ms */
  debounceDelay?: number;
  /** Delay para throttle em ms */
  throttleDelay?: number;
  /** Se deve fazer preload de componentes */
  enablePreload?: boolean;
}

interface ChatPerformanceMetrics {
  /** Uso de memória atual */
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  /** Componentes carregados */
  loadedComponents: string[];
  /** Tempo de carregamento */
  loadTime: number;
  /** Se está otimizado */
  isOptimized: boolean;
}

interface UseChatPerformanceReturn {
  /** Métricas de performance */
  metrics: ChatPerformanceMetrics;
  /** Observa elemento para lazy loading */
  observeElement: (element: HTMLElement, componentName: string) => void;
  /** Para de observar elemento */
  unobserveElement: (element: HTMLElement) => void;
  /** Função com debounce */
  debounce: <T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay?: number
  ) => (...args: Parameters<T>) => void;
  /** Função com throttle */
  throttle: <T extends (...args: any[]) => any>(
    fn: T,
    delay?: number
  ) => (...args: Parameters<T>) => void;
  /** Força limpeza de memória */
  forceCleanup: () => void;
  /** Verifica se componente deve ser carregado */
  shouldLoadComponent: (componentName: string) => boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useChatPerformance(
  options: UseChatPerformanceOptions = {}
): UseChatPerformanceReturn {
  const {
    enableLazyLoading = true,
    enableMemoryMonitoring = true,
    debounceDelay = 300,
    throttleDelay = 100,
    enablePreload = true
  } = options;

  const { config } = useChatConfig();
  const optimizerRef = useRef<ChatPerformanceOptimizer>();
  const memoryManagerRef = useRef<ChatMemoryManager>();
  const loadTimeRef = useRef<number>(Date.now());
  const loadedComponentsRef = useRef<Set<string>>(new Set());

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    // Inicializar otimizador de performance
    if (enableLazyLoading) {
      optimizerRef.current = ChatPerformanceOptimizer.getInstance();
      optimizerRef.current.setupVisibilityBasedLoading();
    }

    // Inicializar gerenciador de memória
    if (enableMemoryMonitoring) {
      memoryManagerRef.current = ChatMemoryManager.getInstance();
      memoryManagerRef.current.startMemoryMonitoring();
    }

    return () => {
      // Cleanup
      optimizerRef.current?.cleanup();
      memoryManagerRef.current?.stopMemoryMonitoring();
    };
  }, [enableLazyLoading, enableMemoryMonitoring]);

  // ============================================================================
  // PERFORMANCE FUNCTIONS
  // ============================================================================

  const observeElement = useCallback((element: HTMLElement, componentName: string) => {
    if (optimizerRef.current && enableLazyLoading) {
      optimizerRef.current.observeElement(element, componentName);
      loadedComponentsRef.current.add(componentName);
    }
  }, [enableLazyLoading]);

  const unobserveElement = useCallback((element: HTMLElement) => {
    if (optimizerRef.current) {
      optimizerRef.current.unobserveElement(element);
    }
  }, []);

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = debounceDelay
  ) => {
    if (optimizerRef.current) {
      return optimizerRef.current.debounce(key, fn, delay);
    }
    return fn;
  }, [debounceDelay]);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = throttleDelay
  ) => {
    if (optimizerRef.current) {
      return optimizerRef.current.throttle(fn, delay);
    }
    return fn;
  }, [throttleDelay]);

  const forceCleanup = useCallback(() => {
    optimizerRef.current?.cleanup();
    memoryManagerRef.current?.stopMemoryMonitoring();

    // Forçar garbage collection se disponível
    if ('gc' in window) {
      (window as any).gc();
    }
  }, []);

  const shouldLoadComponent = useCallback((componentName: string): boolean => {
    // Verificar se feature está habilitada
    const featureMap: Record<string, keyof typeof config.featureFlags> = {
      'PublicChatWidget': 'enablePublicChat',
      'AdminChatPanel': 'enableAdminChat',
      'VoiceInput': 'enableVoiceInput',
      'ChatMetricsDashboard': 'enableMetrics',
      'ChatConfigPanel': 'enableDevMode'
    };

    const featureFlag = featureMap[componentName];
    if (featureFlag && !config.featureFlags[featureFlag]) {
      return false;
    }

    // Verificar se já foi carregado
    if (loadedComponentsRef.current.has(componentName)) {
      return false;
    }

    return true;
  }, [config.featureFlags]);

  // ============================================================================
  // METRICS CALCULATION
  // ============================================================================

  const metrics = useMemo((): ChatPerformanceMetrics => {
    let memoryUsage;

    // Obter uso de memória se disponível
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }

    const loadTime = Date.now() - loadTimeRef.current;
    const loadedComponents = Array.from(loadedComponentsRef.current);

    // Determinar se está otimizado
    const isOptimized =
      loadTime < 1000 && // Carregamento rápido
      (!memoryUsage || memoryUsage.used < memoryUsage.limit * 0.7) && // Uso de memória OK
      loadedComponents.length > 0; // Componentes carregados

    return {
      memoryUsage,
      loadedComponents,
      loadTime,
      isOptimized
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    metrics,
    observeElement,
    unobserveElement,
    debounce,
    throttle,
    forceCleanup,
    shouldLoadComponent
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook para lazy loading de componentes
 */
export function useLazyComponent(componentName: string): {
  shouldLoad: boolean;
  isLoaded: boolean;
  observe: (element: HTMLElement) => void;
  unobserve: (element: HTMLElement) => void;
} {
  const { shouldLoadComponent, observeElement, unobserveElement } = useChatPerformance({
    enableLazyLoading: true,
    enableMemoryMonitoring: false
  });

  const shouldLoad = shouldLoadComponent(componentName);
  const isLoaded = !shouldLoad; // Se não deve carregar, assume que já está carregado

  const observe = useCallback((element: HTMLElement) => {
    observeElement(element, componentName);
  }, [observeElement, componentName]);

  const unobserve = useCallback((element: HTMLElement) => {
    unobserveElement(element);
  }, [unobserveElement]);

  return {
    shouldLoad,
    isLoaded,
    observe,
    unobserve
  };
}

/**
 * Hook para debounce otimizado
 */
export function useOptimizedDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  key?: string
): (...args: Parameters<T>) => void {
  const { debounce } = useChatPerformance({
    enableLazyLoading: false,
    enableMemoryMonitoring: false,
    debounceDelay: delay
  });

  return useMemo(() => {
    return debounce(key || 'default', fn, delay);
  }, [debounce, fn, delay, key]);
}

/**
 * Hook para throttle otimizado
 */
export function useOptimizedThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  const { throttle } = useChatPerformance({
    enableLazyLoading: false,
    enableMemoryMonitoring: false,
    throttleDelay: delay
  });

  return useMemo(() => {
    return throttle(fn, delay);
  }, [throttle, fn, delay]);
}

/**
 * Hook para monitoramento de memória
 */
export function useMemoryMonitoring(): {
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
  isMemoryHigh: boolean;
  forceCleanup: () => void;
} {
  const { metrics, forceCleanup } = useChatPerformance({
    enableLazyLoading: false,
    enableMemoryMonitoring: true
  });

  const memoryUsage = metrics.memoryUsage ? {
    ...metrics.memoryUsage,
    percentage: (metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100
  } : undefined;

  const isMemoryHigh = memoryUsage ? memoryUsage.percentage > 70 : false;

  return {
    memoryUsage,
    isMemoryHigh,
    forceCleanup
  };
}

/**
 * Hook para otimização de scroll
 */
export function useOptimizedScroll(
  onScroll: (event: Event) => void,
  delay: number = 16 // ~60fps
): {
  scrollRef: React.RefObject<HTMLElement>;
  isScrolling: boolean;
} {
  const scrollRef = useRef<HTMLElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const { throttle } = useChatPerformance({
    enableLazyLoading: false,
    enableMemoryMonitoring: false,
    throttleDelay: delay
  });

  const optimizedScrollHandler = useMemo(() => {
    return throttle((event: Event) => {
      isScrollingRef.current = true;
      onScroll(event);

      // Reset scrolling state after delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    }, delay);
  }, [throttle, onScroll, delay]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', optimizedScrollHandler, { passive: true });

    return () => {
      element.removeEventListener('scroll', optimizedScrollHandler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [optimizedScrollHandler]);

  return {
    scrollRef,
    isScrolling: isScrollingRef.current
  };
}

/**
 * Hook para otimização de resize
 */
export function useOptimizedResize(
  onResize: (entries: ResizeObserverEntry[]) => void,
  delay: number = 100
): {
  resizeRef: React.RefObject<HTMLElement>;
  isResizing: boolean;
} {
  const resizeRef = useRef<HTMLElement>(null);
  const isResizingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<ResizeObserver>();

  const { debounce } = useChatPerformance({
    enableLazyLoading: false,
    enableMemoryMonitoring: false,
    debounceDelay: delay
  });

  const optimizedResizeHandler = useMemo(() => {
    return debounce('resize', (entries: ResizeObserverEntry[]) => {
      isResizingRef.current = true;
      onResize(entries);

      // Reset resizing state after delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isResizingRef.current = false;
      }, 200);
    }, delay);
  }, [debounce, onResize, delay]);

  useEffect(() => {
    const element = resizeRef.current;
    if (!element || !('ResizeObserver' in window)) return;

    observerRef.current = new ResizeObserver(optimizedResizeHandler);
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [optimizedResizeHandler]);

  return {
    resizeRef,
    isResizing: isResizingRef.current
  };
}
