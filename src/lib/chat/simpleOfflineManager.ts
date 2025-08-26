/**
 * Simple Offline Manager
 *
 * Versão simplificada para testes
 */

interface PendingMessage {
  id: string;
  content: string;
  sessionId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

interface OfflineResponse {
  response: string;
  type: string;
  timestamp: number;
}

interface OfflineManagerConfig {
  fallbackResponses?: {
    greeting?: string;
    general?: string;
    error?: string;
    help?: string;
  };
  enableSmartResponses?: boolean;
  maxAge?: number;
}

export class OfflineManager {
  private config: OfflineManagerConfig;
  private enabled = true;

  constructor(config: OfflineManagerConfig = {}) {
    this.config = {
      fallbackResponses: {
        greeting: "Olá! No momento estou offline, mas sua mensagem foi salva.",
        general: "Desculpe, estou temporariamente offline. Sua mensagem foi registrada.",
        error: "Não foi possível conectar ao servidor. Suas mensagens estão sendo salvas.",
        ...config.fallbackResponses
      },
      enableSmartResponses: config.enableSmartResponses || false,
      maxAge: config.maxAge || 7 * 24 * 60 * 60 * 1000 // 7 dias
    };

    console.log('🔌 Offline manager initialized');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  updateConfig(newConfig: Partial<OfflineManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getPendingMessages(): PendingMessage[] {
    try {
      const stored = (window as any).localStorage?.getItem('chat_pending_messages');
      if (!stored) return [];

      const messages = JSON.parse(stored) as PendingMessage[];

      // Filtrar mensagens antigas
      const now = Date.now();
      const filtered = messages.filter(msg =>
        now - msg.timestamp < (this.config.maxAge || 7 * 24 * 60 * 60 * 1000)
      );

      // Salvar lista filtrada se houve mudanças
      if (filtered.length !== messages.length) {
        this.savePendingMessages(filtered);
      }

      return filtered;
    } catch (error) {
      console.error('Erro ao carregar mensagens pendentes:', error);
      return [];
    }
  }

  storeOfflineMessage(
    content: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): PendingMessage {
    const message: PendingMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      sessionId,
      timestamp: Date.now(),
      metadata
    };

    const messages = this.getPendingMessages();
    messages.push(message);
    this.savePendingMessages(messages);

    return message;
  }

  removePendingMessage(messageId: string): void {
    const messages = this.getPendingMessages();
    const filtered = messages.filter(msg => msg.id !== messageId);
    this.savePendingMessages(filtered);
  }

  clearPendingMessages(): void {
    try {
      (window as any).localStorage?.removeItem('chat_pending_messages');
    } catch (error) {
      console.error('Erro ao limpar mensagens pendentes:', error);
    }
  }

  generateFallbackResponse(content: string): OfflineResponse {
    let responseType = 'general';
    let response = this.config.fallbackResponses?.general || 'Resposta offline padrão';

    if (this.config.enableSmartResponses) {
      const lowerContent = content.toLowerCase().trim();

      // Detectar saudações
      const greetings = ['oi', 'olá', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
      if (greetings.some(greeting => lowerContent.includes(greeting))) {
        responseType = 'greeting';
        response = this.config.fallbackResponses?.greeting || response;
      }
    }

    return {
      response,
      type: responseType,
      timestamp: Date.now()
    };
  }

  getStats() {
    const messages = this.getPendingMessages();
    const sessions = new Set(messages.map(msg => msg.sessionId));

    let oldestMessageAge = 0;
    if (messages.length > 0) {
      const oldest = Math.min(...messages.map(msg => msg.timestamp));
      oldestMessageAge = Date.now() - oldest;
    }

    let storageSize = 0;
    try {
      const stored = (window as any).localStorage?.getItem('chat_pending_messages');
      storageSize = stored ? new Blob([stored]).size : 0;
    } catch (error) {
      // Ignorar erro
    }

    return {
      totalPendingMessages: messages.length,
      sessionCount: sessions.size,
      oldestMessageAge,
      storageSize
    };
  }

  private savePendingMessages(messages: PendingMessage[]): void {
    try {
      (window as any).localStorage?.setItem('chat_pending_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Erro ao salvar mensagens pendentes:', error);
    }
  }
}
