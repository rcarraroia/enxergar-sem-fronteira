/**
 * Testes para OfflineManager
 */

import { vi } from 'vitest';
import { OfflineManager } from '../offlineManager';

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    offlineManager = new OfflineManager();
  });

  describe('Inicialização', () => {
    it('deve inicializar com configurações padrão', () => {
      expect(offlineManager.isEnabled()).toBe(true);
      expect(offlineManager.getPendingMessages()).toEqual([]);
    });

    it('deve carregar mensagens pendentes do localStorage', () => {
      const pendingMessages = [
        {
          id: '1',
          content: 'Test message',
          sessionId: 'session1',
          timestamp: Date.now(),
          metadata: {}
        }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(pendingMessages));

      const manager = new OfflineManager();
      expect(manager.getPendingMessages()).toEqual(pendingMessages);
    });

    it('deve tratar JSON inválido no localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const manager = new OfflineManager();
      expect(manager.getPendingMessages()).toEqual([]);
    });
  });

  describe('Armazenamento de mensagens', () => {
    it('deve armazenar mensagem offline', () => {
      const message = offlineManager.storeOfflineMessage(
        'Test message',
        'session1',
        { voiceInput: true }
      );

      expect(message).toMatchObject({
        content: 'Test message',
        sessionId: 'session1',
        metadata: { voiceInput: true }
      });

      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();

      const pendingMessages = offlineManager.getPendingMessages();
      expect(pendingMessages).toHaveLength(1);
      expect(pendingMessages[0]).toEqual(message);
    });

    it('deve salvar no localStorage ao armazenar mensagem', () => {
      offlineManager.storeOfflineMessage('Test', 'session1');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chat_pending_messages',
        expect.stringContaining('Test')
      );
    });

    it('deve tratar erro ao salvar no localStorage', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Não deve quebrar mesmo com erro no localStorage
      const message = offlineManager.storeOfflineMessage('Test', 'session1');
      expect(message).toBeDefined();
    });
  });

  describe('Remoção de mensagens', () => {
    it('deve remover mensagem específica', () => {
      const message1 = offlineManager.storeOfflineMessage('Test 1', 'session1');
      const message2 = offlineManager.storeOfflineMessage('Test 2', 'session1');

      expect(offlineManager.getPendingMessages()).toHaveLength(2);

      offlineManager.removePendingMessage(message1.id);

      const remaining = offlineManager.getPendingMessages();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(message2.id);
    });

    it('deve limpar todas as mensagens pendentes', () => {
      offlineManager.storeOfflineMessage('Test 1', 'session1');
      offlineManager.storeOfflineMessage('Test 2', 'session1');

      expect(offlineManager.getPendingMessages()).toHaveLength(2);

      offlineManager.clearPendingMessages();

      expect(offlineManager.getPendingMessages()).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chat_pending_messages');
    });
  });

  describe('Geração de respostas', () => {
    it('deve gerar resposta de fallback padrão', () => {
      const response = offlineManager.generateFallbackResponse('Test message');

      expect(response).toMatchObject({
        response: expect.stringContaining('offline'),
        type: 'general',
        timestamp: expect.any(Number)
      });
    });

    it('deve usar respostas personalizadas', () => {
      const customResponses = {
        greeting: 'Olá! Estou offline.',
        general: 'Resposta personalizada'
      };

      const manager = new OfflineManager({
        fallbackResponses: customResponses
      });

      const response = manager.generateFallbackResponse('Test message');
      expect(response.response).toBe('Resposta personalizada');
    });

    it('deve detectar saudações quando respostas inteligentes estão habilitadas', () => {
      const manager = new OfflineManager({
        enableSmartResponses: true,
        fallbackResponses: {
          greeting: 'Olá! Estou offline.',
          general: 'Resposta geral'
        }
      });

      const greetings = ['oi', 'olá', 'hello', 'hi', 'bom dia'];

      greetings.forEach(greeting => {
        const response = manager.generateFallbackResponse(greeting);
        expect(response.type).toBe('greeting');
        expect(response.response).toBe('Olá! Estou offline.');
      });
    });

    it('deve usar resposta geral para mensagens não reconhecidas', () => {
      const manager = new OfflineManager({
        enableSmartResponses: true,
        fallbackResponses: {
          greeting: 'Olá! Estou offline.',
          general: 'Resposta geral'
        }
      });

      const response = manager.generateFallbackResponse('Mensagem complexa não reconhecida');
      expect(response.type).toBe('general');
      expect(response.response).toBe('Resposta geral');
    });
  });

  describe('Configuração', () => {
    it('deve permitir habilitar/desabilitar', () => {
      expect(offlineManager.isEnabled()).toBe(true);

      offlineManager.setEnabled(false);
      expect(offlineManager.isEnabled()).toBe(false);

      offlineManager.setEnabled(true);
      expect(offlineManager.isEnabled()).toBe(true);
    });

    it('deve atualizar configurações', () => {
      const newConfig = {
        fallbackResponses: {
          greeting: 'Nova saudação',
          general: 'Nova resposta geral'
        },
        enableSmartResponses: false
      };

      offlineManager.updateConfig(newConfig);

      const response = offlineManager.generateFallbackResponse('Test');
      expect(response.response).toBe('Nova resposta geral');
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas corretas', () => {
      // Adicionar algumas mensagens
      offlineManager.storeOfflineMessage('Test 1', 'session1');
      offlineManager.storeOfflineMessage('Test 2', 'session1');
      offlineManager.storeOfflineMessage('Test 3', 'session2');

      const stats = offlineManager.getStats();

      expect(stats).toEqual({
        totalPendingMessages: 3,
        sessionCount: 2,
        oldestMessageAge: expect.any(Number),
        storageSize: expect.any(Number)
      });
    });

    it('deve retornar estatísticas vazias quando não há mensagens', () => {
      const stats = offlineManager.getStats();

      expect(stats).toEqual({
        totalPendingMessages: 0,
        sessionCount: 0,
        oldestMessageAge: 0,
        storageSize: 0
      });
    });
  });

  describe('Limpeza automática', () => {
    it('deve limpar mensagens antigas automaticamente', () => {
      // Mock de mensagens antigas (mais de 7 dias)
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 dias atrás
      const recentTimestamp = Date.now() - (1 * 60 * 60 * 1000); // 1 hora atrás

      const oldMessages = [
        {
          id: '1',
          content: 'Old message',
          sessionId: 'session1',
          timestamp: oldTimestamp,
          metadata: {}
        },
        {
          id: '2',
          content: 'Recent message',
          sessionId: 'session1',
          timestamp: recentTimestamp,
          metadata: {}
        }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldMessages));

      const manager = new OfflineManager({
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });

      // Deve manter apenas a mensagem recente
      const pendingMessages = manager.getPendingMessages();
      expect(pendingMessages).toHaveLength(1);
      expect(pendingMessages[0].content).toBe('Recent message');
    });
  });
});
