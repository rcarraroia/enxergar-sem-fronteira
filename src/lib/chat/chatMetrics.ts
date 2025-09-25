/**
 * Chat Metrics System
 *
 * Sistema de coleta e análise de métricas para o chat
 */

import { getChatConfig, isFeatureEnabled } from './chatConfig';
import { CHAT_ERROR_CODES, createChatError } from './chatErrorFactory';
import { logChatError } from './chatLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMetric {
  /** Nome da métrica */
  name: string;
  /** Valor da métrica */
  value: number;
  /** Timestamp da coleta */
  timestamp: Date;
  /** Metadados adicionais */
  metadata?: Record<string, any>;
  /** Tags para categorização */
  tags?: Record<string, string>;
}

export interface ChatEvent {
  /** Tipo do evento */
  type: ChatEventType;
  /** ID da sessão */
  sessionId?: string;
  /** ID da mensagem */
  messageId?: string;
  /** Tipo de usuário */
  userType?: 'public' | 'admin';
  /** Timestamp do evento */
  timestamp: Date;
  /** Duração em ms (para eventos com duração) */
  duration?: number;
  /** Dados específicos do evento */
  data?: Record<string, any>;
  /** Tags para categorização */
  tags?: Record<string, string>;
}

export type ChatEventType =
  | 'session_started'
  | 'session_ended'
  | 'message_sent'
  | 'message_received'
  | 'response_received'
  | 'error_occurred'
  | 'retry_attempted'
  | 'validation_failed'
  | 'security_violation'
  | 'rate_limit_exceeded'
  | 'webhook_called'
  | 'webhook_failed'
  | 'voice_input_used'
  | 'typing_started'
  | 'typing_stopped'
  | 'session_timeout'
  | 'config_changed'
  | 'feature_toggled';

export interface ChatMetricsSnapshot {
  /** Timestamp do snapshot */
  timestamp: Date;
  /** Período de coleta em ms */
  period: number;
  /** Métricas de sessão */
  sessions: {
    total: number;
    active: number;
    completed: number;
    abandoned: number;
    averageDuration: number;
    byUserType: Record<'public' | 'admin', number>;
  };
  /** Métricas de mensagens */
  messages: {
    total: number;
    sent: number;
    received: number;
    averageLength: number;
    averageResponseTime: number;
    byUserType: Record<'public' | 'admin', number>;
  };
  /** Métricas de erros */
  errors: {
    total: number;
    byType: Record<string, number>;
    retryRate: number;
    resolutionRate: number;
  };
  /** Métricas de performance */
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    webhookSuccessRate: number;
    validationSuccessRate: number;
  };
  /** Métricas de segurança */
  security: {
    violationsDetected: number;
    sessionsBlocked: number;
    rateLimitHits: number;
    suspiciousActivity: number;
  };
}

export interface MetricsCollectorOptions {
  /** Intervalo de coleta em ms */
  collectionInterval: number;
  /** Tamanho máximo do buffer de eventos */
  maxBufferSize: number;
  /** Se deve enviar métricas para endpoint remoto */
  enableRemoteReporting: boolean;
  /** Endpoint para envio de métricas */
  remoteEndpoint?: string;
  /** Chave de API para autenticação */
  apiKey?: string;
  /** Se deve persistir métricas localmente */
  enableLocalPersistence: boolean;
  /** Período de retenção de dados em ms */
  retentionPeriod: number;
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

class ChatMetricsCollector {
  private events: ChatEvent[] = [];
  private metrics: ChatMetric[] = [];
  private options: MetricsCollectorOptions;
  private collectionTimer?: NodeJS.Timeout;
  private sessionStartTimes = new Map<string, Date>();
  private responseTimeBuffer: number[] = [];

  constructor(options: Partial<MetricsCollectorOptions> = {}) {
    this.options = {
      collectionInterval: 60000, // 1 minuto
      maxBufferSize: 1000,
      enableRemoteReporting: false,
      enableLocalPersistence: true,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 dias
      ...options
    };

    this.startCollection();
  }

  // ============================================================================
  // EVENT TRACKING
  // ============================================================================

  /**
   * Registra um evento do chat
   */
  trackEvent(event: Omit<ChatEvent, 'timestamp'>): void {
    if (!isFeatureEnabled('enableMetrics')) return;

    const fullEvent: ChatEvent = {
      ...event,
      timestamp: new Date()
    };

    this.events.push(fullEvent);

    // Processar eventos específicos
    this.processEvent(fullEvent);

    // Limitar tamanho do buffer
    if (this.events.length > this.options.maxBufferSize) {
      this.events = this.events.slice(-this.options.maxBufferSize);
    }
  }

  /**
   * Registra uma métrica customizada
   */
  trackMetric(metric: Omit<ChatMetric, 'timestamp'>): void {
    if (!isFeatureEnabled('enableMetrics')) return;

    const fullMetric: ChatMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);

    // Limitar tamanho do buffer
    if (this.metrics.length > this.options.maxBufferSize) {
      this.metrics = this.metrics.slice(-this.options.maxBufferSize);
    }
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Registra início de sessão
   */
  trackSessionStart(sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>): void {
    this.sessionStartTimes.set(sessionId, new Date());

    this.trackEvent({
      type: 'session_started',
      sessionId,
      userType,
      data: metadata,
      tags: { userType }
    });
  }

  /**
   * Registra fim de sessão
   */
  trackSessionEnd(sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>): void {
    const startTime = this.sessionStartTimes.get(sessionId);
    const duration = startTime ? Date.now() - startTime.getTime() : undefined;

    this.trackEvent({
      type: 'session_ended',
      sessionId,
      userType,
      duration,
      data: metadata,
      tags: { userType }
    });

    this.sessionStartTimes.delete(sessionId);
  }

  /**
   * Registra envio de mensagem
   */
  trackMessageSent(
    sessionId: string,
    messageId: string,
    userType: 'public' | 'admin',
    messageLength: number,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      type: 'message_sent',
      sessionId,
      messageId,
      userType,
      data: { messageLength, ...metadata },
      tags: { userType, messageType: 'user' }
    });
  }

  /**
   * Registra resposta recebida
   */
  trackResponseReceived(
    sessionId: string,
    messageId: string,
    userType: 'public' | 'admin',
    responseTime: number,
    responseLength: number,
    metadata?: Record<string, any>
  ): void {
    this.responseTimeBuffer.push(responseTime);

    // Manter apenas os últimos 100 tempos de resposta
    if (this.responseTimeBuffer.length > 100) {
      this.responseTimeBuffer = this.responseTimeBuffer.slice(-100);
    }

    this.trackEvent({
      type: 'response_received',
      sessionId,
      messageId,
      userType,
      duration: responseTime,
      data: { responseLength, ...metadata },
      tags: { userType, messageType: 'agent' }
    });
  }

  /**
   * Registra erro
   */
  trackError(
    errorType: string,
    sessionId?: string,
    messageId?: string,
    userType?: 'public' | 'admin',
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      type: 'error_occurred',
      sessionId,
      messageId,
      userType,
      data: { errorType, ...metadata },
      tags: { errorType, userType: userType || 'unknown' }
    });
  }

  /**
   * Registra violação de segurança
   */
  trackSecurityViolation(
    violationType: string,
    sessionId?: string,
    userType?: 'public' | 'admin',
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      type: 'security_violation',
      sessionId,
      userType,
      data: { violationType, ...metadata },
      tags: { violationType, userType: userType || 'unknown' }
    });
  }

  /**
   * Registra chamada de webhook
   */
  trackWebhookCall(
    sessionId: string,
    userType: 'public' | 'admin',
    endpoint: string,
    success: boolean,
    responseTime: number,
    statusCode?: number,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent({
      type: success ? 'webhook_called' : 'webhook_failed',
      sessionId,
      userType,
      duration: responseTime,
      data: { endpoint, statusCode, ...metadata },
      tags: {
        userType,
        endpoint: new URL(endpoint).hostname,
        success: success.toString()
      }
    });
  }

  // ============================================================================
  // METRICS CALCULATION
  // ============================================================================

  /**
   * Gera snapshot das métricas atuais
   */
  generateSnapshot(periodMs: number = this.options.collectionInterval): ChatMetricsSnapshot {
    const now = new Date();
    const cutoff = new Date(now.getTime() - periodMs);

    const recentEvents = this.events.filter(event => event.timestamp >= cutoff);

    return {
      timestamp: now,
      period: periodMs,
      sessions: this.calculateSessionMetrics(recentEvents),
      messages: this.calculateMessageMetrics(recentEvents),
      errors: this.calculateErrorMetrics(recentEvents),
      performance: this.calculatePerformanceMetrics(recentEvents),
      security: this.calculateSecurityMetrics(recentEvents)
    };
  }

  /**
   * Calcula métricas de sessão
   */
  private calculateSessionMetrics(events: ChatEvent[]) {
    const sessionEvents = events.filter(e =>
      e.type === 'session_started' || e.type === 'session_ended'
    );

    const started = sessionEvents.filter(e => e.type === 'session_started');
    const ended = sessionEvents.filter(e => e.type === 'session_ended');

    const durations = ended
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const byUserType = {
      public: started.filter(e => e.userType === 'public').length,
      admin: started.filter(e => e.userType === 'admin').length
    };

    return {
      total: started.length,
      active: started.length - ended.length,
      completed: ended.length,
      abandoned: 0, // Calculado baseado em timeout
      averageDuration,
      byUserType
    };
  }

  /**
   * Calcula métricas de mensagens
   */
  private calculateMessageMetrics(events: ChatEvent[]) {
    const messageEvents = events.filter(e =>
      e.type === 'message_sent' || e.type === 'response_received'
    );

    const sent = messageEvents.filter(e => e.type === 'message_sent');
    const received = messageEvents.filter(e => e.type === 'response_received');

    const responseTimes = received
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    const messageLengths = sent
      .filter(e => e.data?.messageLength !== undefined)
      .map(e => e.data!.messageLength);

    const averageLength = messageLengths.length > 0
      ? messageLengths.reduce((sum, l) => sum + l, 0) / messageLengths.length
      : 0;

    const byUserType = {
      public: sent.filter(e => e.userType === 'public').length,
      admin: sent.filter(e => e.userType === 'admin').length
    };

    return {
      total: messageEvents.length,
      sent: sent.length,
      received: received.length,
      averageLength,
      averageResponseTime,
      byUserType
    };
  }

  /**
   * Calcula métricas de erros
   */
  private calculateErrorMetrics(events: ChatEvent[]) {
    const errorEvents = events.filter(e => e.type === 'error_occurred');
    const retryEvents = events.filter(e => e.type === 'retry_attempted');

    const byType: Record<string, number> = {};
    errorEvents.forEach(event => {
      const errorType = event.data?.errorType || 'unknown';
      byType[errorType] = (byType[errorType] || 0) + 1;
    });

    const retryRate = errorEvents.length > 0
      ? retryEvents.length / errorEvents.length
      : 0;

    return {
      total: errorEvents.length,
      byType,
      retryRate,
      resolutionRate: 0 // Calculado baseado em sucessos após retry
    };
  }

  /**
   * Calcula métricas de performance
   */
  private calculatePerformanceMetrics(events: ChatEvent[]) {
    const responseTimes = this.responseTimeBuffer.slice().sort((a, b) => a - b);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    const webhookEvents = events.filter(e =>
      e.type === 'webhook_called' || e.type === 'webhook_failed'
    );
    const successfulWebhooks = webhookEvents.filter(e => e.type === 'webhook_called');

    const webhookSuccessRate = webhookEvents.length > 0
      ? successfulWebhooks.length / webhookEvents.length
      : 1;

    const validationEvents = events.filter(e => e.type === 'validation_failed');
    const totalMessages = events.filter(e => e.type === 'message_sent').length;

    const validationSuccessRate = totalMessages > 0
      ? (totalMessages - validationEvents.length) / totalMessages
      : 1;

    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      webhookSuccessRate,
      validationSuccessRate
    };
  }

  /**
   * Calcula métricas de segurança
   */
  private calculateSecurityMetrics(events: ChatEvent[]) {
    const securityEvents = events.filter(e => e.type === 'security_violation');
    const rateLimitEvents = events.filter(e => e.type === 'rate_limit_exceeded');

    return {
      violationsDetected: securityEvents.length,
      sessionsBlocked: 0, // Calculado baseado em eventos de bloqueio
      rateLimitHits: rateLimitEvents.length,
      suspiciousActivity: securityEvents.length + rateLimitEvents.length
    };
  }

  // ============================================================================
  // DATA MANAGEMENT
  // ============================================================================

  /**
   * Processa evento específico
   */
  private processEvent(event: ChatEvent): void {
    // Processar eventos específicos para métricas em tempo real
    switch (event.type) {
      case 'session_started':
        this.trackMetric({
          name: 'active_sessions',
          value: this.sessionStartTimes.size,
          tags: { userType: event.userType || 'unknown' }
        });
        break;

      case 'response_received':
        if (event.duration) {
          this.trackMetric({
            name: 'response_time',
            value: event.duration,
            tags: { userType: event.userType || 'unknown' }
          });
        }
        break;

      case 'error_occurred':
        this.trackMetric({
          name: 'error_count',
          value: 1,
          tags: {
            errorType: event.data?.errorType || 'unknown',
            userType: event.userType || 'unknown'
          }
        });
        break;
    }
  }

  /**
   * Inicia coleta automática
   */
  private startCollection(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }

    this.collectionTimer = setInterval(() => {
      this.collectAndReport();
    }, this.options.collectionInterval);
  }

  /**
   * Coleta e reporta métricas
   */
  private async collectAndReport(): Promise<void> {
    try {
      const snapshot = this.generateSnapshot();

      // Persistir localmente se habilitado
      if (this.options.enableLocalPersistence) {
        this.persistSnapshot(snapshot);
      }

      // Enviar para endpoint remoto se habilitado
      if (this.options.enableRemoteReporting && this.options.remoteEndpoint) {
        await this.reportToRemote(snapshot);
      }

      // Limpar dados antigos
      this.cleanup();

    } catch (error) {
      logChatError(createChatError(
        CHAT_ERROR_CODES.CHAT_SYSTEM_ERROR,
        'Falha na coleta de métricas',
        {
          category: 'system',
          severity: 'medium',
          originalError: error as Error
        }
      ));
    }
  }

  /**
   * Persiste snapshot localmente
   */
  private persistSnapshot(snapshot: ChatMetricsSnapshot): void {
    try {
      const key = `chat_metrics_${snapshot.timestamp.toISOString().split('T')[0]}`;
      const existing = localStorage.getItem(key);
      const snapshots = existing ? JSON.parse(existing) : [];

      snapshots.push(snapshot);
      localStorage.setItem(key, JSON.stringify(snapshots));

    } catch (error) {
      console.warn('Failed to persist metrics snapshot:', error);
    }
  }

  /**
   * Envia métricas para endpoint remoto
   */
  private async reportToRemote(snapshot: ChatMetricsSnapshot): Promise<void> {
    if (!this.options.remoteEndpoint) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.options.apiKey) {
      headers['Authorization'] = `Bearer ${this.options.apiKey}`;
    }

    await fetch(this.options.remoteEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'chat_metrics',
        snapshot,
        source: 'chat_system',
        version: getChatConfig().version
      })
    });
  }

  /**
   * Limpa dados antigos
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.options.retentionPeriod);

    this.events = this.events.filter(event => event.timestamp >= cutoff);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Obtém eventos recentes
   */
  getRecentEvents(periodMs: number = 60000): ChatEvent[] {
    const cutoff = new Date(Date.now() - periodMs);
    return this.events.filter(event => event.timestamp >= cutoff);
  }

  /**
   * Obtém métricas recentes
   */
  getRecentMetrics(periodMs: number = 60000): ChatMetric[] {
    const cutoff = new Date(Date.now() - periodMs);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Para a coleta
   */
  stop(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }
  }

  /**
   * Reinicia a coleta
   */
  restart(): void {
    this.stop();
    this.startCollection();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const chatMetricsCollector = new ChatMetricsCollector({
  collectionInterval: 60000, // 1 minuto
  maxBufferSize: 1000,
  enableRemoteReporting: getChatConfig().logging.enableRemote,
  remoteEndpoint: getChatConfig().logging.remoteEndpoint,
  enableLocalPersistence: true,
  retentionPeriod: 7 * 24 * 60 * 60 * 1000 // 7 dias
});

// ============================================================================
// EXPORTS
// ============================================================================

export { chatMetricsCollector };

export const trackChatEvent = (event: Omit<ChatEvent, 'timestamp'>) =>
  chatMetricsCollector.trackEvent(event);

export const trackChatMetric = (metric: Omit<ChatMetric, 'timestamp'>) =>
  chatMetricsCollector.trackMetric(metric);

export const trackSessionStart = (sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) =>
  chatMetricsCollector.trackSessionStart(sessionId, userType, metadata);

export const trackSessionEnd = (sessionId: string, userType: 'public' | 'admin', metadata?: Record<string, any>) =>
  chatMetricsCollector.trackSessionEnd(sessionId, userType, metadata);

export const trackMessageSent = (sessionId: string, messageId: string, userType: 'public' | 'admin', messageLength: number, metadata?: Record<string, any>) =>
  chatMetricsCollector.trackMessageSent(sessionId, messageId, userType, messageLength, metadata);

export const trackResponseReceived = (sessionId: string, messageId: string, userType: 'public' | 'admin', responseTime: number, responseLength: number, metadata?: Record<string, any>) =>
  chatMetricsCollector.trackResponseReceived(sessionId, messageId, userType, responseTime, responseLength, metadata);

export const trackChatError = (errorType: string, sessionId?: string, messageId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) =>
  chatMetricsCollector.trackError(errorType, sessionId, messageId, userType, metadata);

export const trackSecurityViolation = (violationType: string, sessionId?: string, userType?: 'public' | 'admin', metadata?: Record<string, any>) =>
  chatMetricsCollector.trackSecurityViolation(violationType, sessionId, userType, metadata);

export const trackWebhookCall = (sessionId: string, userType: 'public' | 'admin', endpoint: string, success: boolean, responseTime: number, statusCode?: number, metadata?: Record<string, any>) =>
  chatMetricsCollector.trackWebhookCall(sessionId, userType, endpoint, success, responseTime, statusCode, metadata);

export const getChatMetricsSnapshot = (periodMs?: number) =>
  chatMetricsCollector.generateSnapshot(periodMs);

export const getRecentChatEvents = (periodMs?: number) =>
  chatMetricsCollector.getRecentEvents(periodMs);

export const getRecentChatMetrics = (periodMs?: number) =>
  chatMetricsCollector.getRecentMetrics(periodMs);

export default chatMetricsCollector;
