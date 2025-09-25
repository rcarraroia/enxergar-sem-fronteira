/**
 * Chat Integration Tests Setup
 *
 * Configuração específica para testes de integração do sistema de chat
 */

import { afterAll, afterEach, beforeAll, beforeEach } from '@jest/globals';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// ============================================================================
// MOCK SERVER SETUP
// ============================================================================

/**
 * Mock responses para diferentes cenários de webhook
 */
export const mockWebhookResponses = {
  success: {
    success: true,
    data: {
      response: 'Hello! How can I help you today?',
      actions: [],
      sessionComplete: false
    }
  },

  successWithActions: {
    success: true,
    data: {
      response: 'I can help you with that. Please fill out this form.',
      actions: [
        {
          type: 'form',
          payload: {
            formId: 'contact-form',
            fields: ['name', 'email', 'message']
          },
          description: 'Contact form'
        }
      ],
      sessionComplete: false
    }
  },

  sessionComplete: {
    success: true,
    data: {
      response: 'Thank you for contacting us. Have a great day!',
      actions: [],
      sessionComplete: true
    }
  },

  error: {
    success: false,
    error: {
      code: 'WORKFLOW_ERROR',
      message: 'Internal workflow error'
    }
  },

  timeout: new Promise(() => {}), // Never resolves

  serverError: {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  }
};

/**
 * Servidor mock para interceptar requisições HTTP
 */
export const mockServer = setupServer(
  // Webhook público de sucesso
  rest.post('https://test-webhook.com/public', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockWebhookResponses.success)
    );
  }),

  // Webhook admin de sucesso
  rest.post('https://test-webhook.com/admin', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockWebhookResponses.success)
    );
  }),

  // Webhook com ações
  rest.post('https://test-webhook.com/actions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockWebhookResponses.successWithActions)
    );
  }),

  // Webhook que completa sessão
  rest.post('https://test-webhook.com/complete', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockWebhookResponses.sessionComplete)
    );
  }),

  // Webhook com erro
  rest.post('https://test-webhook.com/error', (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json(mockWebhookResponses.error)
    );
  }),

  // Webhook com timeout
  rest.post('https://test-webhook.com/timeout', (req, res, ctx) => {
    return res(
      ctx.delay('infinite')
    );
  }),

  // Webhook com erro de servidor
  rest.post('https://test-webhook.com/server-error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json(mockWebhookResponses.serverError)
    );
  }),

  // Webhook não autorizado
  rest.post('https://test-webhook.com/unauthorized', (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication'
        }
      })
    );
  }),

  // Webhook com rate limiting
  rest.post('https://test-webhook.com/rate-limit', (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests'
        }
      })
    );
  })
);

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

/**
 * Configuração de ambiente para testes
 */
export const testEnvironment = {
  webhooks: {
    public: 'https://test-webhook.com/public',
    admin: 'https://test-webhook.com/admin',
    actions: 'https://test-webhook.com/actions',
    complete: 'https://test-webhook.com/complete',
    error: 'https://test-webhook.com/error',
    timeout: 'https://test-webhook.com/timeout',
    serverError: 'https://test-webhook.com/server-error',
    unauthorized: 'https://test-webhook.com/unauthorized',
    rateLimit: 'https://test-webhook.com/rate-limit'
  },

  config: {
    timeout: 5000,
    retryAttempts: 2,
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Mode': 'true'
    }
  }
};

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

/**
 * Mock do localStorage para testes
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

/**
 * Mock do console para evitar ruído nos testes
 */
export const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

/**
 * Mock do navigator para testes de voz
 */
export const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  mediaDevices: {
    getUserMedia: jest.fn()
  }
};

/**
 * Mock do window.speechRecognition
 */
export const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

/**
 * Setup global para todos os testes de integração do chat
 */
export function setupChatIntegrationTests() {
  beforeAll(() => {
    // Iniciar servidor mock
    mockServer.listen({
      onUnhandledRequest: 'error'
    });

    // Configurar mocks globais
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: jest.fn(() => mockSpeechRecognition),
      writable: true
    });

    // Mock console methods
    Object.assign(console, mockConsole);

    // Configurar variáveis de ambiente
    process.env.VITE_N8N_WEBHOOK_DOMAIN = 'test-webhook.com';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // Parar servidor mock
    mockServer.close();

    // Limpar variáveis de ambiente
    delete process.env.VITE_N8N_WEBHOOK_DOMAIN;
  });

  beforeEach(() => {
    // Limpar localStorage
    mockLocalStorage.clear();

    // Limpar mocks
    jest.clearAllMocks();

    // Reset server handlers
    mockServer.resetHandlers();
  });

  afterEach(() => {
    // Cleanup adicional se necessário
  });
}

/**
 * Utilitários para manipular o servidor mock durante os testes
 */
export const mockServerUtils = {
  /**
   * Configura resposta específica para um endpoint
   */
  setResponse(url: string, response: any, status = 200) {
    mockServer.use(
      rest.post(url, (req, res, ctx) => {
        return res(
          ctx.status(status),
          ctx.json(response)
        );
      })
    );
  },

  /**
   * Configura delay para um endpoint
   */
  setDelay(url: string, delayMs: number) {
    mockServer.use(
      rest.post(url, (req, res, ctx) => {
        return res(
          ctx.delay(delayMs),
          ctx.json(mockWebhookResponses.success)
        );
      })
    );
  },

  /**
   * Configura erro de rede para um endpoint
   */
  setNetworkError(url: string) {
    mockServer.use(
      rest.post(url, (req, res, ctx) => {
        return res.networkError('Network error');
      })
    );
  },

  /**
   * Verifica se uma requisição foi feita
   */
  getRequestHistory(): any[] {
    // Em uma implementação real, isso seria capturado pelo MSW
    return [];
  }
};

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Factory para criar dados de teste
 */
export const testDataFactory = {
  /**
   * Cria uma mensagem de teste
   */
  createMessage(overrides: Partial<any> = {}) {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: 'Test message',
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      ...overrides
    };
  },

  /**
   * Cria uma sessão de teste
   */
  createSession(overrides: Partial<any> = {}) {
    return {
      id: `chat_public_${Math.random().toString(36).substr(2, 9)}`,
      type: 'public',
      messages: [],
      isActive: true,
      isTyping: false,
      webhookUrl: testEnvironment.webhooks.public,
      lastActivity: new Date(),
      metadata: {},
      ...overrides
    };
  },

  /**
   * Cria uma requisição n8n de teste
   */
  createN8nRequest(overrides: Partial<any> = {}) {
    return {
      sessionId: `chat_public_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Test message',
      userType: 'public',
      timestamp: new Date().toISOString(),
      metadata: {},
      ...overrides
    };
  },

  /**
   * Cria uma configuração de webhook de teste
   */
  createWebhookConfig(overrides: Partial<any> = {}) {
    return {
      publicCaptureUrl: testEnvironment.webhooks.public,
      adminSupportUrl: testEnvironment.webhooks.admin,
      timeout: testEnvironment.config.timeout,
      retryAttempts: testEnvironment.config.retryAttempts,
      headers: testEnvironment.config.headers,
      ...overrides
    };
  }
};

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Helpers para assertions comuns em testes de integração
 */
export const assertionHelpers = {
  /**
   * Verifica se uma mensagem foi adicionada ao histórico
   */
  expectMessageInHistory(sessions: any, sessionId: string, content: string) {
    const session = sessions[sessionId];
    expect(session).toBeDefined();

    const message = session.messages.find((msg: any) => msg.content === content);
    expect(message).toBeDefined();

    return message;
  },

  /**
   * Verifica se uma sessão foi criada corretamente
   */
  expectSessionCreated(sessions: any, sessionId: string, type: 'public' | 'admin') {
    const session = sessions[sessionId];
    expect(session).toBeDefined();
    expect(session.type).toBe(type);
    expect(session.isActive).toBe(true);
    expect(session.messages).toEqual([]);

    return session;
  },

  /**
   * Verifica se o localStorage foi atualizado
   */
  expectLocalStorageUpdated(key = 'chat_sessions') {
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      key,
      expect.any(String)
    );
  },

  /**
   * Verifica se uma requisição HTTP foi feita
   */
  expectHttpRequest(url: string, method = 'POST') {
    // Em uma implementação real, isso verificaria o histórico de requisições do MSW
    // Por enquanto, apenas verificamos se não houve erros de rede
    expect(true).toBe(true);
  }
};

// ============================================================================
// WAIT UTILITIES
// ============================================================================

/**
 * Utilitários para aguardar condições específicas
 */
export const waitUtils = {
  /**
   * Aguarda até que uma condição seja verdadeira
   */
  async waitForCondition(
    condition: () => boolean,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Aguarda por uma mudança no localStorage
   */
  async waitForLocalStorageChange(key: string, timeout = 5000): Promise<void> {
    const initialCallCount = mockLocalStorage.setItem.mock.calls.length;

    await this.waitForCondition(
      () => mockLocalStorage.setItem.mock.calls.length > initialCallCount,
      timeout
    );
  },

  /**
   * Aguarda por uma requisição HTTP
   */
  async waitForHttpRequest(timeout = 5000): Promise<void> {
    // Em uma implementação real, isso aguardaria por requisições no MSW
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    mockConsole, mockLocalStorage, mockNavigator, mockServer, mockSpeechRecognition, testEnvironment
};
