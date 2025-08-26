/**
 * n8n HTTP Client
 *
 * Cliente HTTP para comunicação com webhooks do n8n
 */

import { createError, ErrorType } from '@/lib/errors/factory';
import { logError } from '@/lib/errors/logger';
import { getChatConfig, isFeatureEnabled } from './chatConfig';
import {
    createChatError
} from './chatErrorFactory';
import {
    ChatError,
    ChatErrorType,
    N8nChatRequest,
    N8nChatResponse,
    N8nWebhookConfig
} from './chatTypes';
import { validateN8nRequest, validateN8nResponse } from './chatValidation';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuração padrão para requisições
 */
const DEFAULT_CONFIG: Partial<N8nWebhookConfig> = {
  timeout: 30000, // 30 segundos
  retryAttempts: 3,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ChatInterface/1.0'
  }
};

/**
 * Configuração de retry com backoff exponencial
 */
const RETRY_CONFIG = {
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffFactor: 2
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Cria erro específico do chat
 */
const createChatError = (
  type: ChatErrorType,
  message: string,
  originalError?: Error,
  context?: Record<string, unknown>
): ChatError => {
  return {
    type,
    message,
    retryable: isRetryableError(type),
    originalError,
    context
  };
};

/**
 * Verifica se um erro permite retry
 */
const isRetryableError = (type: ChatErrorType): boolean => {
  return [
    ChatErrorType.NETWORK_ERROR,
    ChatErrorType.TIMEOUT_ERROR,
    ChatErrorType.WEBHOOK_ERROR
  ].includes(type);
};

/**
 * Categoriza erro HTTP
 */
const categorizeHttpError = (status: number): ChatErrorType => {
  if (status >= 500) {
    return ChatErrorType.WEBHOOK_ERROR;
  }
  if (status === 408 || status === 504) {
    return ChatErrorType.TIMEOUT_ERROR;
  }
  if (status >= 400) {
    return ChatErrorType.VALIDATION_ERROR;
  }
  return ChatErrorType.NETWORK_ERROR;
};

// ============================================================================
// HTTP CLIENT CLASS
// ============================================================================

/**
 * Cliente HTTP para comunicação com n8n
 */
export class N8nHttpClient {
  private config: N8nWebhookConfig;
  private abortController: AbortController | null = null;

  constructor(config: N8nWebhookConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Envia mensagem para webhook n8n
   */
  async sendMessage(
    request: N8nChatRequest,
    webhookUrl?: string
  ): Promise<N8nChatResponse> {
    // Validar request
    const requestValidation = validateN8nRequest(request);
    if (!requestValidation.success) {
      throw createChatError(
        ChatErrorType.VALIDATION_ERROR,
        'Dados de requisição inválidos',
        undefined,
        { validationErrors: requestValidation.error.errors }
      );
    }

    const url = webhookUrl || this.getWebhookUrl(request.userType);

    // Tentar envio com retry
    return this.sendWithRetry(request, url);
  }

  /**
   * Envia requisição com retry automático
   */
  private async sendWithRetry(
    request: N8nChatRequest,
    url: string,
    attempt: number = 1
  ): Promise<N8nChatResponse> {
    try {
      return await this.performRequest(request, url);
    } catch (error) {
      const chatError = error as ChatError;

      // Se não é retryable ou excedeu tentativas, propagar erro
      if (!chatError.retryable || attempt >= this.config.retryAttempts) {
        throw chatError;
      }

      // Calcular delay para próxima tentativa
      const delay = this.calculateRetryDelay(attempt);

      console.warn(
        `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`,
        chatError.message
      );

      // Aguardar antes da próxima tentativa
      await this.sleep(delay);

      // Tentar novamente
      return this.sendWithRetry(request, url, attempt + 1);
    }
  }

  /**
   * Executa a requisição HTTP
   */
  private async performRequest(
    request: N8nChatRequest,
    url: string
  ): Promise<N8nChatResponse> {
    // Criar novo AbortController para esta requisição
    this.abortController = new AbortController();

    // Configurar timeout
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeout);

    try {
      // Fazer requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(request),
        signal: this.abortController.signal
      });

      clearTimeout(timeoutId);

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        throw createChatError(
          categorizeHttpError(response.status),
          `Erro HTTP ${response.status}: ${response.statusText}`,
          undefined,
          {
            status: response.status,
            statusText: response.statusText,
            url
          }
        );
      }

      // Processar resposta
      const responseData = await response.json();

      // Validar resposta
      const responseValidation = validateN8nResponse(responseData);
      if (!responseValidation.success) {
        throw createChatError(
          ChatErrorType.VALIDATION_ERROR,
          'Resposta do n8n inválida',
          undefined,
          {
            validationErrors: responseValidation.error.errors,
            responseData
          }
        );
      }

      return responseValidation.data;

    } catch (error) {
      clearTimeout(timeoutId);

      // Tratar diferentes tipos de erro
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw createChatError(
          ChatErrorType.NETWORK_ERROR,
          'Erro de rede: Não foi possível conectar ao servidor',
          error,
          { url }
        );
      }

      if (error.name === 'AbortError') {
        throw createChatError(
          ChatErrorType.TIMEOUT_ERROR,
          'Timeout: Servidor não respondeu no tempo esperado',
          error,
          { timeout: this.config.timeout, url }
        );
      }

      // Se já é um ChatError, propagar
      if (error instanceof Error && 'type' in error) {
        throw error;
      }

      // Erro genérico
      throw createChatError(
        ChatErrorType.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Erro desconhecido',
        error instanceof Error ? error : undefined,
        { url }
      );
    }
  }

  /**
   * Constrói headers da requisição
   */
  private buildHeaders(): Record<string, string> {
    const headers = { ...this.config.headers };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Obtém URL do webhook baseado no tipo
   */
  private getWebhookUrl(userType: 'public' | 'admin'): string {
    return userType === 'public'
      ? this.config.publicCaptureUrl
      : this.config.adminSupportUrl;
  }

  /**
   * Calcula delay para retry com backoff exponencial
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
  }

  /**
   * Utilitário para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancela requisição em andamento
   */
  public cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Atualiza configuração do cliente
   */
  public updateConfig(newConfig: Partial<N8nWebhookConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Testa conectividade com webhook
   */
  async testConnection(userType: 'public' | 'admin'): Promise<boolean> {
    try {
      const testRequest: N8nChatRequest = {
        sessionId: 'test_connection',
        message: 'ping',
        userType,
        timestamp: new Date().toISOString(),
        metadata: {
          test: true
        }
      };

      await this.sendMessage(testRequest);
      return true;
    } catch (error) {
      console.warn('Teste de conexão falhou:', error);
      return false;
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Cria instância do cliente n8n
 */
export const createN8nClient = (config: N8nWebhookConfig): N8nHttpClient => {
  return new N8nHttpClient(config);
};

/**
 * Cria configuração padrão do n8n
 */
export const createDefaultN8nConfig = (
  publicUrl: string,
  adminUrl: string,
  apiKey?: string
): N8nWebhookConfig => {
  return {
    publicCaptureUrl: publicUrl,
    adminSupportUrl: adminUrl,
    timeout: DEFAULT_CONFIG.timeout!,
    retryAttempts: DEFAULT_CONFIG.retryAttempts!,
    headers: { ...DEFAULT_CONFIG.headers! },
    apiKey
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Valida URLs de webhook
 */
export const validateWebhookUrls = (
  publicUrl: string,
  adminUrl: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    const publicParsed = new URL(publicUrl);
    if (publicParsed.protocol !== 'https:') {
      errors.push('URL pública deve usar HTTPS');
    }
  } catch {
    errors.push('URL pública inválida');
  }

  try {
    const adminParsed = new URL(adminUrl);
    if (adminParsed.protocol !== 'https:') {
      errors.push('URL administrativa deve usar HTTPS');
    }
  } catch {
    errors.push('URL administrativa inválida');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Cria request padrão para n8n
 */
export const createN8nRequest = (
  sessionId: string,
  message: string,
  userType: 'public' | 'admin',
  metadata?: Record<string, unknown>
): N8nChatRequest => {
  return {
    sessionId,
    message: message.trim(),
    userType,
    timestamp: new Date().toISOString(),
    metadata: {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      ...metadata
    }
  };
};

/**
 * Processa resposta do n8n
 */
export const processN8nResponse = (
  response: N8nChatResponse
): {
  message: string;
  actions: any[];
  shouldEndSession: boolean;
} => {
  if (!response.success) {
    throw createChatError(
      ChatErrorType.WEBHOOK_ERROR,
      response.error?.message || 'Erro no processamento do n8n',
      undefined,
      { response }
    );
  }

  return {
    message: response.data?.response || response.message || '',
    actions: response.data?.actions || [],
    shouldEndSession: response.data?.sessionComplete || false
  };
};

/**
 * Log de erro integrado com sistema existente
 */
export const logN8nError = (error: ChatError, context?: Record<string, unknown>): void => {
  const errorToLog = createError(
    ErrorType.INTEGRATION_ERROR,
    error.message,
    {
      component: 'N8nHttpClient',
      chatErrorType: error.type,
      retryable: error.retryable,
      ...error.context,
      ...context
    }
  );

  logError(error.originalError || errorToLog, {
    component: 'N8nHttpClient',
    chatErrorType: error.type,
    sessionId: error.sessionId,
    messageId: error.messageId
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export default N8nHttpClient;

export {
    categorizeHttpError, createChatError, DEFAULT_CONFIG, isRetryableError, RETRY_CONFIG
};

// ============================================================================
// CONFIGURATION INTEGRATION
// ============================================================================

/**
 * Cria cliente n8n com configurações globais
 */
export function createConfiguredN8nClient(): N8nHttpClient {
  const config = getChatConfig();

  const webhookConfig: N8nWebhookConfig = {
    publicCaptureUrl: config.webhooks.publicCaptureUrl || '',
    adminSupportUrl: config.webhooks.adminSupportUrl || '',
    timeout: config.performance.requestTimeoutMs,
    retryAttempts: config.performance.maxRetryAttempts,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `ChatInterface/${config.version}`,
      'X-Chat-Environment': config.environment,
      'X-Chat-Features': Object.entries(config.featureFlags)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature)
        .join(',')
    }
  };

  return createN8nClient(webhookConfig);
}

/**
 * Obtém URL de webhook baseada na configuração
 */
export function getConfiguredWebhookUrl(type: 'public' | 'admin' | 'test'): string {
  const config = getChatConfig();

  switch (type) {
    case 'public':
      return config.webhooks.publicCaptureUrl || '';
    case 'admin':
      return config.webhooks.adminSupportUrl || '';
    case 'test':
      return config.webhooks.testUrl || '';
    default:
      return '';
  }
}

/**
 * Verifica se o chat está habilitado
 */
export function isChatEnabled(): boolean {
  return isFeatureEnabled('enableChat');
}

/**
 * Verifica se um tipo específico de chat está habilitado
 */
export function isChatTypeEnabled(type: 'public' | 'admin'): boolean {
  if (!isFeatureEnabled('enableChat')) return false;

  switch (type) {
    case 'public':
      return isFeatureEnabled('enablePublicChat');
    case 'admin':
      return isFeatureEnabled('enableAdminChat');
    default:
      return false;
  }
}
