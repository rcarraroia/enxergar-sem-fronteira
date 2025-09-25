/**
 * useChatMetrics Hook
 *
 * Hook para acessar e gerenciar métricas do chat
 */

import { isFeatureEnabled } from '@/lib/chat/chatConfig';
import {
    ChatEvent,
    ChatEventType,
    ChatMetric,
    ChatMetricsSnapshot,
    getChatMetricsSnapshot,
    getRecentChatEvents,
    getRecentChatMetrics,
    trackChatError,
    trackChatEvent,
    trackChatMetric,
    trackMessageSent,
    trackResponseReceived,
    trackSecurityViolation,
    trackSessionEnd,
    trackSessionStart,
    trackWebhookCall
} from '@/lib/chat/chatMetrics';
import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface UseChatMetricsOptions {
  /** Intervalo de atualização em ms */
  updateInterval?: number;
  /** Período de dados em ms */
  dataPeriod?: number;
  /** Se deve atualizar automaticamente */
  autoUpdate?: boolean;
  /** Se deve incluir eventos detalhados */
  includeEvents?: boolean;
  /** Se deve incluir métricas customizadas */
  includeCustomMetrics?: boolean;
}

interface ChatMetricsState {
  /** Snapshot atual das métricas */
  snapshot: ChatMetricsSnapshot | null;
  /** Eventos recentes */
  events: ChatEvent[];
  /** Métricas customizadas recentes */
  customMetrics: ChatMetric[];
  /** Se está carregando */
  isLoading: boolean;
  /** Último erro */
  error: Error | null;
  /** Timestamp da última atualização */
  lastUpdated: Date | null;
}

interface UseChatMetricsReturn extends ChatMetricsState {
  /** Atualiza métricas manualmente */
  refresh: () => void;
  /** Registra evento */
  trackEvent: (event: Omit<ChatEvent, 'timestamp'>) => void;
  /** Registra métrica customizada */
  trackMetric: (metric: Omit<ChatMetric, 'timestamp'>) => void;
  /** Helpers para eventos comuns */
  helpers: {
    trackSessionStart: (sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) => void;
    trackSessionEnd: (sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) => void;
    trackMessageSent: (sessionId: string, messageId: string, userType: 'public' | 'admin', messageLength: number, metadata?: Record<string, any>) => void;
    trackResponseReceived: (sessionId: string, messageId: string, userType: 'public' | 'admin', responseTime: number, responseLength: number, metadata?: Record<string, any>) => void;
    trackError: (errorType: string, sessionId?: string, messageId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) => void;
    trackSecurityViolation: (violationType: string, sessionId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) => void;
    trackWebhookCall: (sessionId: string, userType: 'public' | 'admin', endpoint: string, success: boolean, responseTime: number, statusCode?: number, metadata?: Record<string, any>) => void;
  };
  /** Estatísticas calculadas */
  stats: {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useChatMetrics(options: UseChatMetricsOptions = {}): UseChatMetricsReturn {
  const {
    updateInterval = 30000, // 30 segundos
    dataPeriod = 300000, // 5 minutos
    autoUpdate = true,
    includeEvents = true,
    includeCustomMetrics = true
  } = options;

  // Estados
  const [state, setState] = useState<ChatMetricsState>({
    snapshot: null,
    events: [],
    customMetrics: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  // Refs
  const updateTimerRef = useRef<NodeJS.Timeout>();
  const isEnabledRef = useRef(isFeatureEnabled('enableMetrics'));

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Atualização inicial
  useEffect(() => {
    if (isEnabledRef.current) {
      loadMetrics();
    }
  }, []);

  // Timer de atualização automática
  useEffect(() => {
    if (!autoUpdate || !isEnabledRef.current) return;

    updateTimerRef.current = setInterval(() => {
      loadMetrics();
    }, updateInterval);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [autoUpdate, updateInterval]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  const loadMetrics = useCallback(async () => {
    if (!isEnabledRef.current) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: new Error('Metrics are disabled')
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [snapshot, events, customMetrics] = await Promise.all([
        Promise.resolve(getChatMetricsSnapshot(dataPeriod)),
        includeEvents ? Promise.resolve(getRecentChatEvents(dataPeriod)) : Promise.resolve([]),
        includeCustomMetrics ? Promise.resolve(getRecentChatMetrics(dataPeriod)) : Promise.resolve([])
      ]);

      setState({
        snapshot,
        events,
        customMetrics,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
    }
  }, [dataPeriod, includeEvents, includeCustomMetrics]);

  const refresh = useCallback(() => {
    loadMetrics();
  }, [loadMetrics]);

  // ============================================================================
  // EVENT TRACKING HELPERS
  // ============================================================================

  const handleTrackEvent = useCallback((event: Omit<ChatEvent, 'timestamp'>) => {
    if (!isEnabledRef.current) return;
    trackChatEvent(event);
  }, []);

  const handleTrackMetric = useCallback((metric: Omit<ChatMetric, 'timestamp'>) => {
    if (!isEnabledRef.current) return;
    trackChatMetric(metric);
  }, []);

  const helpers = {
    trackSessionStart: useCallback((sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackSessionStart(sessionId, userType, metadata);
    }, []),

    trackSessionEnd: useCallback((sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackSessionEnd(sessionId, userType, metadata);
    }, []),

    trackMessageSent: useCallback((sessionId: string, messageId: string, userType: 'public' | 'admin', messageLength: number, metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackMessageSent(sessionId, messageId, userType, messageLength, metadata);
    }, []),

    trackResponseReceived: useCallback((sessionId: string, messageId: string, userType: 'public' | 'admin', responseTime: number, responseLength: number, metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackResponseReceived(sessionId, messageId, userType, responseTime, responseLength, metadata);
    }, []),

    trackError: useCallback((errorType: string, sessionId?: string, messageId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackChatError(errorType, sessionId, messageId, userType, metadata);
    }, []),

    trackSecurityViolation: useCallback((violationType: string, sessionId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackSecurityViolation(violationType, sessionId, userType, metadata);
    }, []),

    trackWebhookCall: useCallback((sessionId: string, userType: 'public' | 'admin', endpoint: string, success: boolean, responseTime: number, statusCode?: number, metadata?: Record<string, any>) => {
      if (!isEnabledRef.current) return;
      trackWebhookCall(sessionId, userType, endpoint, success, responseTime, statusCode, metadata);
    }, [])
  };

  // ============================================================================
  // CALCULATED STATS
  // ============================================================================

  const stats = {
    totalSessions: state.snapshot?.sessions.total || 0,
    activeSessions: state.snapshot?.sessions.active || 0,
    totalMessages: state.snapshot?.messages.total || 0,
    averageResponseTime: state.snapshot?.performance.averageResponseTime || 0,
    errorRate: state.snapshot ?
      (state.snapshot.errors.total / Math.max(state.snapshot.messages.total, 1)) : 0,
    successRate: state.snapshot?.performance.webhookSuccessRate || 0
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    ...state,
    refresh,
    trackEvent: handleTrackEvent,
    trackMetric: handleTrackMetric,
    helpers,
    stats
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook simplificado para tracking de eventos
 */
export function useChatEventTracking(): {
  trackEvent: (event: Omit<ChatEvent, 'timestamp'>) => void;
  trackSessionStart: (sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) => void;
  trackSessionEnd: (sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) => void;
  trackMessageSent: (sessionId: string, messageId: string, userType: 'public' | 'admin', messageLength: number, metadata?: Record<string, any>) => void;
  trackResponseReceived: (sessionId: string, messageId: string, userType: 'public' | 'admin', responseTime: number, responseLength: number, metadata?: Record<string, any>) => void;
  trackError: (errorType: string, sessionId?: string, messageId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) => void;
} {
  const { trackEvent, helpers } = useChatMetrics({
    autoUpdate: false,
    includeEvents: false,
    includeCustomMetrics: false
  });

  return {
    trackEvent,
    ...helpers
  };
}

/**
 * Hook para métricas em tempo real
 */
export function useChatRealTimeMetrics(updateInterval: number = 5000): {
  activeSessions: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  isLoading: boolean;
} {
  const { snapshot, isLoading } = useChatMetrics({
    updateInterval,
    dataPeriod: 60000, // 1 minuto
    includeEvents: false,
    includeCustomMetrics: false
  });

  return {
    activeSessions: snapshot?.sessions.active || 0,
    messagesPerMinute: snapshot?.messages.total || 0,
    averageResponseTime: snapshot?.performance.averageResponseTime || 0,
    errorRate: snapshot ?
      (snapshot.errors.total / Math.max(snapshot.messages.total, 1)) : 0,
    isLoading
  };
}

/**
 * Hook para métricas de performance
 */
export function useChatPerformanceMetrics(): {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  webhookSuccessRate: number;
  validationSuccessRate: number;
  isLoading: boolean;
  refresh: () => void;
} {
  const { snapshot, isLoading, refresh } = useChatMetrics({
    dataPeriod: 300000, // 5 minutos
    includeEvents: false,
    includeCustomMetrics: false
  });

  return {
    averageResponseTime: snapshot?.performance.averageResponseTime || 0,
    p95ResponseTime: snapshot?.performance.p95ResponseTime || 0,
    p99ResponseTime: snapshot?.performance.p99ResponseTime || 0,
    webhookSuccessRate: snapshot?.performance.webhookSuccessRate || 0,
    validationSuccessRate: snapshot?.performance.validationSuccessRate || 0,
    isLoading,
    refresh
  };
}

/**
 * Hook para métricas de segurança
 */
export function useChatSecurityMetrics(): {
  violationsDetected: number;
  sessionsBlocked: number;
  rateLimitHits: number;
  suspiciousActivity: number;
  isLoading: boolean;
  refresh: () => void;
} {
  const { snapshot, isLoading, refresh } = useChatMetrics({
    dataPeriod: 3600000, // 1 hora
    includeEvents: false,
    includeCustomMetrics: false
  });

  return {
    violationsDetected: snapshot?.security.violationsDetected || 0,
    sessionsBlocked: snapshot?.security.sessionsBlocked || 0,
    rateLimitHits: snapshot?.security.rateLimitHits || 0,
    suspiciousActivity: snapshot?.security.suspiciousActivity || 0,
    isLoading,
    refresh
  };
}

/**
 * Hook para análise de eventos
 */
export function useChatEventAnalysis(eventTypes?: ChatEventType[]): {
  events: ChatEvent[];
  eventsByType: Record<string, ChatEvent[]>;
  eventCounts: Record<string, number>;
  timelineData: Array<{ timestamp: Date; count: number; type: string }>;
  isLoading: boolean;
  refresh: () => void;
} {
  const { events, isLoading, refresh } = useChatMetrics({
    dataPeriod: 3600000, // 1 hora
    includeEvents: true,
    includeCustomMetrics: false
  });

  const filteredEvents = eventTypes
    ? events.filter(event => eventTypes.includes(event.type))
    : events;

  const eventsByType = filteredEvents.reduce((acc, event) => {
    if (!acc[event.type]) acc[event.type] = [];
    acc[event.type].push(event);
    return acc;
  }, {} as Record<string, ChatEvent[]>);

  const eventCounts = Object.keys(eventsByType).reduce((acc, type) => {
    acc[type] = eventsByType[type].length;
    return acc;
  }, {} as Record<string, number>);

  const timelineData = filteredEvents.map(event => ({
    timestamp: event.timestamp,
    count: 1,
    type: event.type
  }));

  return {
    events: filteredEvents,
    eventsByType,
    eventCounts,
    timelineData,
    isLoading,
    refresh
  };
}
