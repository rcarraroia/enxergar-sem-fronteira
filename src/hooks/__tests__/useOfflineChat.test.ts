/**
 * Testes para useOfflineChat hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useOfflineChat } from '../useOfflineChat';

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

// Mock do navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('useOfflineChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    (navigator as any).onLine = true;
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado online', () => {
      const { result } = renderHook(() => useOfflineChat());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.pendingMessages).toEqual([]);
      expect(result.current.syncStatus).toBe('idle');
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

      const { result } = renderHook(() => useOfflineChat());

      expect(result.current.pendingMessages).toEqual(pendingMessages);
    });
  });

  describe('Detecção de status offline', () => {
    it('deve detectar quando fica offline', async () => {
      const { result } = renderHook(() => useOfflineChat());

      expect(result.current.isOnline).toBe(true);

      // Simular ficar offline
      act(() => {
        (navigator as any).onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('deve detectar quando volta online', async () => {
      // Começar offline
      (navigator as any).onLine = false;

      const { result } = renderHook(() => useOfflineChat({
        syncOnReconnect: true
      }));

      expect(result.current.isOnline).toBe(false);

      // Simular voltar online
      act(() => {
        (navigator as any).onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });
    });
  });

  describe('Mensagens offline', () => {
    it('deve gerar resposta de fallback para mensagem offline', async () => {
      const { result } = renderHook(() => useOfflineChat({
        fallbackResponses: {
          general: 'Resposta offline padrão'
        }
      }));

      let response;
      await act(async () => {
        response = await result.current.handleOfflineMessage(
          'Olá',
          'session1'
        );
      });

      expect(response).toEqual({
        response: 'Resposta offline padrão',
        type: 'general',
        timestamp: expect.any(Number)
      });
    });

    it('deve usar resposta inteligente quando habilitada', async () => {
      const { result } = renderHook(() => useOfflineChat({
        enableSmartResponses: true,
        fallbackResponses: {
          greeting: 'Olá! Estou offline no momento.',
          general: 'Resposta offline padrão'
        }
      }));

      let response;
      await act(async () => {
        response = await result.current.handleOfflineMessage(
          'oi',
          'session1'
        );
      });

      expect(response).toEqual({
        response: 'Olá! Estou offline no momento.',
        type: 'greeting',
        timestamp: expect.any(Number)
      });
    });

    it('deve armazenar mensagem como pendente', async () => {
      const { result } = renderHook(() => useOfflineChat());

      await act(async () => {
        await result.current.handleOfflineMessage(
          'Mensagem teste',
          'session1',
          { voiceInput: true }
        );
      });

      expect(result.current.pendingMessages).toHaveLength(1);
      expect(result.current.pendingMessages[0]).toMatchObject({
        content: 'Mensagem teste',
        sessionId: 'session1',
        metadata: { voiceInput: true }
      });
    });
  });

  describe('Sincronização', () => {
    it('deve sincronizar mensagens pendentes quando volta online', async () => {
      const mockSyncCallback = vi.fn().mockResolvedValue({ success: true });

      // Começar offline com mensagens pendentes
      (navigator as any).onLine = false;
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        {
          id: '1',
          content: 'Mensagem pendente',
          sessionId: 'session1',
          timestamp: Date.now(),
          metadata: {}
        }
      ]));

      const { result } = renderHook(() => useOfflineChat({
        syncOnReconnect: true,
        onSync: mockSyncCallback
      }));

      expect(result.current.pendingMessages).toHaveLength(1);

      // Voltar online
      act(() => {
        (navigator as any).onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.syncStatus).toBe('syncing');
      });

      await waitFor(() => {
        expect(mockSyncCallback).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              content: 'Mensagem pendente'
            })
          ])
        );
      });

      await waitFor(() => {
        expect(result.current.syncStatus).toBe('completed');
        expect(result.current.pendingMessages).toHaveLength(0);
      });
    });

    it('deve tratar erro na sincronização', async () => {
      const mockSyncCallback = vi.fn().mockRejectedValue(new Error('Sync failed'));

      // Começar offline com mensagens pendentes
      (navigator as any).onLine = false;
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        {
          id: '1',
          content: 'Mensagem pendente',
          sessionId: 'session1',
          timestamp: Date.now(),
          metadata: {}
        }
      ]));

      const { result } = renderHook(() => useOfflineChat({
        syncOnReconnect: true,
        onSync: mockSyncCallback
      }));

      // Voltar online
      act(() => {
        (navigator as any).onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.syncStatus).toBe('error');
        expect(result.current.pendingMessages).toHaveLength(1); // Mensagens não foram removidas
      });
    });
  });

  describe('Gerenciamento de mensagens pendentes', () => {
    it('deve limpar mensagens pendentes', async () => {
      const { result } = renderHook(() => useOfflineChat());

      // Adicionar mensagem pendente
      await act(async () => {
        await result.current.handleOfflineMessage('Test', 'session1');
      });

      expect(result.current.pendingMessages).toHaveLength(1);

      // Limpar mensagens
      act(() => {
        result.current.clearPendingMessages();
      });

      expect(result.current.pendingMessages).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chat_pending_messages');
    });

    it('deve remover mensagem pendente específica', async () => {
      const { result } = renderHook(() => useOfflineChat());

      // Adicionar duas mensagens pendentes
      await act(async () => {
        await result.current.handleOfflineMessage('Test 1', 'session1');
        await result.current.handleOfflineMessage('Test 2', 'session1');
      });

      expect(result.current.pendingMessages).toHaveLength(2);

      const messageId = result.current.pendingMessages[0].id;

      // Remover primeira mensagem
      act(() => {
        result.current.removePendingMessage(messageId);
      });

      expect(result.current.pendingMessages).toHaveLength(1);
      expect(result.current.pendingMessages[0].content).toBe('Test 2');
    });
  });

  describe('Respostas inteligentes', () => {
    it('deve detectar saudações', async () => {
      const { result } = renderHook(() => useOfflineChat({
        enableSmartResponses: true,
        fallbackResponses: {
          greeting: 'Olá! Estou offline.',
          general: 'Resposta padrão'
        }
      }));

      const greetings = ['oi', 'olá', 'hello', 'hi', 'bom dia'];

      for (const greeting of greetings) {
        let response;
        await act(async () => {
          response = await result.current.handleOfflineMessage(greeting, 'session1');
        });

        expect(response.type).toBe('greeting');
        expect(response.response).toBe('Olá! Estou offline.');
      }
    });

    it('deve usar resposta geral para mensagens não reconhecidas', async () => {
      const { result } = renderHook(() => useOfflineChat({
        enableSmartResponses: true,
        fallbackResponses: {
          greeting: 'Olá! Estou offline.',
          general: 'Resposta padrão'
        }
      }));

      let response;
      await act(async () => {
        response = await result.current.handleOfflineMessage(
          'Esta é uma mensagem complexa que não deve ser reconhecida',
          'session1'
        );
      });

      expect(response.type).toBe('general');
      expect(response.response).toBe('Resposta padrão');
    });
  });

  describe('Persistência', () => {
    it('deve salvar mensagens pendentes no localStorage', async () => {
      const { result } = renderHook(() => useOfflineChat());

      await act(async () => {
        await result.current.handleOfflineMessage('Test message', 'session1');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chat_pending_messages',
        expect.stringContaining('Test message')
      );
    });

    it('deve tratar erro ao salvar no localStorage', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const { result } = renderHook(() => useOfflineChat());

      // Não deve quebrar mesmo com erro no localStorage
      await act(async () => {
        await result.current.handleOfflineMessage('Test message', 'session1');
      });

      expect(result.current.pendingMessages).toHaveLength(1);
    });
  });
});
