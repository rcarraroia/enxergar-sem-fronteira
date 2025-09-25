/**
 * Offline Manager
 *
 * Gerencia modo offline, queue de mensagens e fallbacks
 */

import { getChatConfig } from './chatConfig';
import { trackChatMetric } from './chatMetrics';
import type { N8nResponse } from './chatTypes';

// ============================================================================
// TYPES
// ============================================================================

interface QueuedMessage {
  id: string;
  sessionId: string;
  content: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

interface OfflineState {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  queueSize: number;
  failedAttempts: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

interface FallbackResponse {
  success: boolean;
  data: {
    response: string;
    sessionId: string;
    sessionComplete: boolean;
    source: 'offline' | 'cache' | 'fallback';
    timestamp: string;
  };
  error?: string;
}

// ============================================================================
// OFFLINE MANAGER CLASS
// ============================================================================

export class OfflineManager {
  private static instance: OfflineManager;
  private messageQueue: QueuedMessage[] = [];
  private state: OfflineState;
  private reconnectTimer?: NodeJS.Timeout;
  private onlineCheckInterval?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();
  private responseCache: Map<string, FallbackResponse> = new Map();
  private fallbackResponses: Map<string, string[]> = new Map();

  private constructor() {
    this.state = {
      isOnline: navigator.onLine,
      lastOnlineTime: navigator.onLine ? new Date() : null,
      queueSize: 0,
      failedAttempts: 0,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5
    };

    this.initializeFallbackResponses();
    this.setupEventListeners();
    this.startOnlineMonitoring();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeFallbackResponses(): void {
    // Respostas padrão por categoria
    this.fallbackResponses.set('greeting', [
      'Olá! Estou temporariamente offline, mas sua mensagem foi salva.',
      'Oi! No momento estou sem conexão, mas vou responder assim que possível.',
      'Bem-vindo! Estou em modo offline, mas sua mensagem está na fila.'
    ]);

    this.fallbackResponses.set('pricing', [
      'Sobre preços: Nossos planos começam em R$ 99/mês. Quando voltar online, posso dar mais detalhes.',
      'Preços: Temos opções a partir de R$ 99. Aguarde a reconexão para informações completas.',
      'Valores: Entre R$ 99 e R$ 299 mensais. Mais detalhes quando a conexão for restabelecida.'
    ]);

    this.fallbackResponses.set('contact', [
      'Contato: (11) 1234-5678 ou contato@empresa.com. Sua mensagem foi salva para resposta posterior.',
      'Entre em contato: telefone (11) 1234-5678. Responderei sua mensagem quando voltar online.',
      'Nossos canais: (11) 1234-5678 e contato@empresa.com. Mensagem salva para processamento.'
    ]);

    this.fallbackResponses.set('default', [
      'Sua mensagem foi recebida e salva. Responderei assim que a conexão for restabelecida.',
      'Obrigado pela mensagem! Estou temporariamente offline, mas vou responder em breve.',
      'Mensagem salva com sucesso. Aguarde a reconexão para uma resposta completa.',
      'Recebi sua mensagem. No momento estou offline, mas ela está na fila para processamento.'
    ]);
  }

  private setupEventListeners(): void {
    // Monitorar status de conexão
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Monitorar visibilidade da página
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Cleanup ao fechar página
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private startOnlineMonitoring(): void {
    // Verificar conexão a cada 30 segundos
    this.onlineCheckInterval = setInterval(() => {
      this.checkConnectionStatus();
    }, 30000);
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  private async checkConnectionStatus(): Promise<void> {
    try {
      // Tentar fazer uma requisição simples
      const response = await fetch('/health', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      } as any);

      const isOnline = response.ok;

      if (isOnline !== this.state.isOnline) {
        if (isOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    } catch (error) {
      if (this.state.isOnline) {
        this.handleOffline();
      }
    }
  }

  private handleOnline(): void {
    console.log('🌐 Connection restored');

    this.state.isOnline = true;
    this.state.lastOnlineTime = new Date();
    this.state.reconnectAttempts = 0;

    // Limpar timer de reconexão
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    // Processar fila de mensagens
    this.processMessageQueue();

    // Emitir evento
    this.emit('online', { timestamp: new Date() });

    // Trackear métrica
    trackChatMetric({
      name: 'connection_restored',
      value: 1,
      tags: {
        queueSize: this.messageQueue.length.toString(),
        offlineDuration: this.getOfflineDuration().toString()
      }
    });
  }

  private handleOffline(): void {
    console.log('📴 Connection lost');

    this.state.isOnline = false;
    this.state.failedAttempts++;

    // Iniciar tentativas de reconexão
    this.scheduleReconnect();

    // Emitir evento
    this.emit('offline', { timestamp: new Date() });

    // Trackear métrica
    trackChatMetric({
      name: 'connection_lost',
      value: 1,
      tags: {
        failedAttempts: this.state.failedAttempts.toString()
      }
    });
  }

  private handleVisibilityChange(): void {
    if (!document.hidden && !this.state.isOnline) {
      // Página ficou visível e estamos offline, tentar reconectar
      this.checkConnectionStatus();
    }
  }

  private handleBeforeUnload(): void {
    // Salvar fila no localStorage antes de fechar
    this.persistQueue();
  }

  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.state.maxReconnectAttempts) {
      console.log('🚫 Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.reconnectAttempts), 30000); // Exponential backoff, max 30s

    this.reconnectTimer = setTimeout(() => {
      this.state.reconnectAttempts++;
      console.log(`🔄 Reconnect attempt ${this.state.reconnectAttempts}/${this.state.maxReconnectAttempts}`);

      this.checkConnectionStatus();
    }, delay);
  }

  // ============================================================================
  // MESSAGE QUEUE MANAGEMENT
  // ============================================================================

  queueMessage(
    sessionId: string,
    content: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
    metadata?: Record<string, any>
  ): string {
    const messageId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedMessage: QueuedMessage = {
      id: messageId,
      sessionId,
      content,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      priority,
      metadata
    };

    // Inserir na fila baseado na prioridade
    const insertIndex = this.findInsertIndex(priority);
    this.messageQueue.splice(insertIndex, 0, queuedMessage);

    this.state.queueSize = this.messageQueue.length;

    // Persistir fila
    this.persistQueue();

    // Emitir evento
    this.emit('messageQueued', { messageId, queueSize: this.state.queueSize });

    console.log(`📥 Message queued: ${messageId} (priority: ${priority})`);

    return messageId;
  }

  private findInsertIndex(priority: 'low' | 'normal' | 'high'): number {
    const priorityOrder = { high: 3, normal: 2, low: 1 };
    const targetPriority = priorityOrder[priority];

    for (let i = 0; i < this.messageQueue.length; i++) {
      const currentPriority = priorityOrder[this.messageQueue[i].priority];
      if (currentPriority < targetPriority) {
        return i;
      }
    }

    return this.messageQueue.length;
  }

  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Processing ${this.messageQueue.length} queued messages`);

    const config = getChatConfig();
    const processedMessages: string[] = [];

    for (const queuedMessage of [...this.messageQueue]) {
      try {
        // Tentar enviar mensagem
        const response = await this.sendQueuedMessage(queuedMessage);

        if (response.success) {
          processedMessages.push(queuedMessage.id);

          // Emitir evento de sucesso
          this.emit('messageProcessed', {
            messageId: queuedMessage.id,
            success: true,
            response: response.data
          });
        } else {
          // Incrementar contador de retry
          queuedMessage.retryCount++;

          if (queuedMessage.retryCount >= queuedMessage.maxRetries) {
            processedMessages.push(queuedMessage.id);

            // Emitir evento de falha
            this.emit('messageProcessed', {
              messageId: queuedMessage.id,
              success: false,
              error: response.error
            });
          }
        }
      } catch (error) {
        console.error(`Failed to process queued message ${queuedMessage.id}:`, error);

        queuedMessage.retryCount++;

        if (queuedMessage.retryCount >= queuedMessage.maxRetries) {
          processedMessages.push(queuedMessage.id);

          this.emit('messageProcessed', {
            messageId: queuedMessage.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Remover mensagens processadas da fila
    this.messageQueue = this.messageQueue.filter(
      msg => !processedMessages.includes(msg.id)
    );

    this.state.queueSize = this.messageQueue.length;
    this.persistQueue();

    console.log(`✅ Processed ${processedMessages.length} messages, ${this.messageQueue.length} remaining`);
  }

  private async sendQueuedMessage(queuedMessage: QueuedMessage): Promise<N8nResponse> {
    // Implementar envio real da mensagem
    // Por enquanto, simular sucesso
    return {
      success: true,
      data: {
        response: 'Mensagem processada com sucesso após reconexão.',
        sessionId: queuedMessage.sessionId,
        sessionComplete: false
      }
    };
  }

  // ============================================================================
  // FALLBACK RESPONSES
  // ============================================================================

  generateFallbackResponse(sessionId: string, message: string): FallbackResponse {
    const category = this.categorizeMessage(message);
    const responses = this.fallbackResponses.get(category) || this.fallbackResponses.get('default')!;
    const response = responses[Math.floor(Math.random() * responses.length)];

    const fallbackResponse: FallbackResponse = {
      success: true,
      data: {
        response,
        sessionId,
        sessionComplete: false,
        source: 'fallback',
        timestamp: new Date().toISOString()
      }
    };

    // Cachear resposta
    const cacheKey = `${sessionId}-${message.substring(0, 50)}`;
    this.responseCache.set(cacheKey, fallbackResponse);

    return fallbackResponse;
  }

  private categorizeMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('hello')) {
      return 'greeting';
    }

    if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo')) {
      return 'pricing';
    }

    if (lowerMessage.includes('contato') || lowerMessage.includes('telefone') || lowerMessage.includes('email')) {
      return 'contact';
    }

    return 'default';
  }

  getCachedResponse(sessionId: string, message: string): FallbackResponse | null {
    const cacheKey = `${sessionId}-${message.substring(0, 50)}`;
    return this.responseCache.get(cacheKey) || null;
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  private persistQueue(): void {
    try {
      const queueData = {
        messages: this.messageQueue,
        timestamp: new Date().toISOString(),
        state: this.state
      };

      localStorage.setItem('chat-offline-queue', JSON.stringify(queueData));
    } catch (error) {
      console.warn('Failed to persist message queue:', error);
    }
  }

  loadPersistedQueue(): void {
    try {
      const queueData = localStorage.getItem('chat-offline-queue');

      if (queueData) {
        const parsed = JSON.parse(queueData);

        // Carregar mensagens que não são muito antigas (máximo 24 horas)
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        const now = Date.now();

        this.messageQueue = parsed.messages.filter((msg: QueuedMessage) => {
          const messageAge = now - new Date(msg.timestamp).getTime();
          return messageAge < maxAge;
        });

        this.state.queueSize = this.messageQueue.length;

        console.log(`📂 Loaded ${this.messageQueue.length} persisted messages`);
      }
    } catch (error) {
      console.warn('Failed to load persisted queue:', error);
    }
  }

  clearPersistedQueue(): void {
    try {
      localStorage.removeItem('chat-offline-queue');
      this.messageQueue = [];
      this.state.queueSize = 0;
    } catch (error) {
      console.warn('Failed to clear persisted queue:', error);
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  isOnline(): boolean {
    return this.state.isOnline;
  }

  getQueueSize(): number {
    return this.state.queueSize;
  }

  getState(): OfflineState {
    return { ...this.state };
  }

  getOfflineDuration(): number {
    if (this.state.isOnline || !this.state.lastOnlineTime) {
      return 0;
    }
    return Date.now() - this.state.lastOnlineTime.getTime();
  }

  forceReconnect(): void {
    this.state.reconnectAttempts = 0;
    this.checkConnectionStatus();
  }

  clearQueue(): void {
    this.messageQueue = [];
    this.state.queueSize = 0;
    this.persistQueue();
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    // Limpar timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.onlineCheckInterval) {
      clearInterval(this.onlineCheckInterval);
    }

    // Remover event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Persistir fila final
    this.persistQueue();

    // Limpar listeners
    this.eventListeners.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const offlineManager = OfflineManager.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verifica se está online
 */
export function isOnline(): boolean {
  return offlineManager.isOnline();
}

/**
 * Adiciona mensagem à fila offline
 */
export function queueOfflineMessage(
  sessionId: string,
  content: string,
  priority?: 'low' | 'normal' | 'high'
): string {
  return offlineManager.queueMessage(sessionId, content, priority);
}

/**
 * Gera resposta de fallback
 */
export function generateFallbackResponse(sessionId: string, message: string): FallbackResponse {
  return offlineManager.generateFallbackResponse(sessionId, message);
}

/**
 * Obtém estado offline
 */
export function getOfflineState(): OfflineState {
  return offlineManager.getState();
}

/**
 * Inicializa gerenciador offline
 */
export function initializeOfflineManager(): void {
  offlineManager.loadPersistedQueue();

  console.log('🔌 Offline manager initialized');
}
