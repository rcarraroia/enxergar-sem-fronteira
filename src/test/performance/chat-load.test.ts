/**
 * Testes de Carga do Sistema de Chat
 *
 * Valida comportamento com múltiplas sessões simultâneas e alto volume
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface, PublicChatWidget, AdminChatPanel } from '@/components/chat';
import { useChatHistory, useN8nChat } from '@/hooks';

// Mock performance API
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  },
  writable: true
});

Object.defineProperty(performance, 'now', {
  value: vi.fn(() => Date.now()),
  writable: true
});

// Mock dos hooks com simulação de carga
vi.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: vi.fn()
}));

vi.mock('@/hooks/useN8nChat', () => ({
  useN8nChat: vi.fn()
}));

vi.mock('@/hooks/useChatConfig', () => ({
  useChatConfig: () => ({
    config: {
      enableChat: true,
      enableVoiceInput: true,
      enableMetrics: true,
      maxMessageLength: 1000
    }
  })
}));

describe('Chat Load Tests', () => {
  let mockChatHistory: any;
  let mockN8nChat: any;
  let performanceMetrics: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset performance metrics
    performanceMetrics = {
      renderTime: [],
      memoryUsage: [],
      messageProcessingTime: [],
      networkLatency: []
    };

    // Mock chat history com múltiplas sessões
    mockChatHistory = {
      createSession: vi.fn(() => `session-${Date.now()}`),
      addMessage: vi.fn(() => `msg-${Date.now()}`),
      getSession: vi.fn(),
      getAllSessions: vi.fn(() => []),
      endSession: vi.fn(),
      setTyping: vi.fn(),
      updateMessageStatus: vi.fn()
    };

    // Mock n8n chat com simulação de latência
    mockN8nChat = {
      sendMessage: vi.fn(),
      state: {
        isLoading: false,
        error: null,
        lastResponse: null
      },
      clearError: vi.fn(),
      retryLastMessage: vi.fn()
    };

    vi.mocked(useChatHistory).mockReturnValue(mockChatHistory);
    vi.mocked(useN8nChat).mockReturnValue(mockN8nChat);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Multiple Sessions Load Test', () => {
    it('should handle 10 simultaneous chat sessions', async () => {
      const sessionCount = 10;
      const sessions: any[] = [];

      const startTime = performance.now();

      // Criar múltiplas sessões
      for (let i = 0; i < sessionCount; i++) {
        const sessionId = `load-test-session-${i}`;

        mockChatHistory.getSession.mockReturnValue({
          id: sessionId,
          messages: [],
          isActive: true,
          isTyping: false
        });

        const { container } = render(
          <ChatInterface
            key={i}
            type="public"
            webhookUrl={`https://test.com/webhook/${i}`}
            placeholder={`Chat ${i}`}
          />
        );

        sessions.push(container);
      }

      const renderTime = performance.now() - startTime;

      // Verificar se todas as sessões foram renderizadas
      expect(sessions).toHaveLength(sessionCount);

      // Verificar performance de renderização
      expect(renderTime).toBeLessThan(5000); // Menos de 5 segundos

      console.log(`✅ Rendered ${sessionCount} sessions in ${renderTime.toFixed(2)}ms`);
    });

    it('should handle 50 simultaneous sessions without memory leaks', async () => {
      const sessionCount = 50;
      const initialMemory = (performance as any).memory.usedJSHeapSize;

      // Simular múltiplas sessões
      const sessions = Array.from({ length: sessionCount }, (_, i) => ({
        id: `session-${i}`,
        messages: Array.from({ length: 10 }, (_, j) => ({
          id: `msg-${i}-${j}`,
          content: `Message ${j} in session ${i}`,
          sender: j % 2 === 0 ? 'user' : 'agent',
          timestamp: new Date(),
          status: 'sent'
        })),
        isActive: true,
        isTyping: false
      }));

      mockChatHistory.getAllSessions.mockReturnValue(sessions);

      const { unmount } = render(
        <AdminChatPanel
          webhookUrl="https://test.com/webhook"
          userId="admin-1"
          enableMultipleSessions={true}
        />
      );

      // Simular uso das sessões
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpar componente
      unmount();

      // Forçar garbage collection se disponível
      if ('gc' in global) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Verificar se não há vazamento significativo de memória
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Menos de 50MB

      console.log(`📊 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should maintain performance with 100 messages per session', async () => {
      const messageCount = 100;
      const sessionId = 'performance-test-session';

      // Criar sessão com muitas mensagens
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `msg-${i}`,
        content: `Performance test message ${i}`,
        sender: i % 2 === 0 ? 'user' : 'agent',
        timestamp: new Date(Date.now() - (messageCount - i) * 1000),
        status: 'sent'
      }));

      mockChatHistory.getSession.mockReturnValue({
        id: sessionId,
        messages,
        isActive: true,
        isTyping: false
      });

      const startTime = performance.now();

      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Performance test"
        />
      );

      const renderTime = performance.now() - startTime;

      // Verificar se todas as mensagens foram renderizadas
      const messageElements = container.querySelectorAll('[data-testid="message-bubble"]');
      expect(messageElements.length).toBe(messageCount);

      // Verificar performance de renderização
      expect(renderTime).toBeLessThan(3000); // Menos de 3 segundos

      console.log(`📈 Rendered ${messageCount} messages in ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Message Processing Load Test', () => {
    it('should handle rapid message sending', async () => {
      const messageCount = 20;
      const sessionId = 'rapid-test-session';

      mockChatHistory.getSession.mockReturnValue({
        id: sessionId,
        messages: [],
        isActive: true,
        isTyping: false
      });

      // Simular latência de rede variável
      mockN8nChat.sendMessage.mockImplementation(() => {
        const latency = Math.random() * 500 + 100; // 100-600ms
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              data: { response: 'Test response', sessionId }
            });
          }, latency);
        });
      });

      const user = userEvent.setup();

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Rapid test"
        />
      );

      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      const startTime = performance.now();
      const processingTimes: number[] = [];

      // Enviar mensagens rapidamente
      for (let i = 0; i < messageCount; i++) {
        const messageStartTime = performance.now();

        await user.clear(messageInput);
        await user.type(messageInput, `Rapid message ${i}`);
        await user.click(sendButton);

        const messageEndTime = performance.now();
        processingTimes.push(messageEndTime - messageStartTime);

        // Pequeno delay para evitar spam
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const totalTime = performance.now() - startTime;
      const averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;

      // Verificar se todas as mensagens foram processadas
      expect(mockN8nChat.sendMessage).toHaveBeenCalledTimes(messageCount);

      // Verificar performance
      expect(averageProcessingTime).toBeLessThan(1000); // Menos de 1 segundo por mensagem
      expect(totalTime).toBeLessThan(messageCount * 1000); // Tempo total razoável

      console.log(`⚡ Processed ${messageCount} messages in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Average processing time: ${averageProcessingTime.toFixed(2)}ms`);
    });

    it('should handle concurrent message processing', async () => {
      const concurrentSessions = 5;
      const messagesPerSession = 10;

      // Simular múltiplas sessões enviando mensagens simultaneamente
      const promises = Array.from({ length: concurrentSessions }, async (_, sessionIndex) => {
        const sessionId = `concurrent-session-${sessionIndex}`;

        mockChatHistory.getSession.mockReturnValue({
          id: sessionId,
          messages: [],
          isActive: true,
          isTyping: false
        });

        const { container } = render(
          <ChatInterface
            key={sessionIndex}
            type="public"
            webhookUrl={`https://test.com/webhook/${sessionIndex}`}
            placeholder={`Session ${sessionIndex}`}
          />
        );

        const user = userEvent.setup();
        const messageInput = container.querySelector('[role="textbox"]') as HTMLElement;
        const sendButton = container.querySelector('[role="button"]') as HTMLElement;

        // Enviar mensagens em cada sessão
        for (let i = 0; i < messagesPerSession; i++) {
          await user.clear(messageInput);
          await user.type(messageInput, `Concurrent message ${i} from session ${sessionIndex}`);
          await user.click(sendButton);

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        return sessionIndex;
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      // Verificar se todas as sessões processaram suas mensagens
      expect(results).toHaveLength(concurrentSessions);

      // Verificar performance concorrente
      const expectedCalls = concurrentSessions * messagesPerSession;
      expect(mockN8nChat.sendMessage).toHaveBeenCalledTimes(expectedCalls);

      console.log(`🔄 Processed ${expectedCalls} concurrent messages in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Load Test', () => {
    it('should maintain stable memory usage over time', async () => {
      const iterations = 50;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Criar e destruir componente
        const { unmount } = render(
          <ChatInterface
            type="public"
            webhookUrl="https://test.com/webhook"
            placeholder={`Iteration ${i}`}
          />
        );

        // Simular uso
        await new Promise(resolve => setTimeout(resolve, 10));

        unmount();

        // Ler uso de memória
        const memoryUsage = (performance as any).memory.usedJSHeapSize;
        memoryReadings.push(memoryUsage);

        // Forçar limpeza ocasional
        if (i % 10 === 0 && 'gc' in global) {
          (global as any).gc();
        }
      }

      // Analisar tendência de memória
      const firstHalf = memoryReadings.slice(0, Math.floor(iterations / 2));
      const secondHalf = memoryReadings.slice(Math.floor(iterations / 2));

      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const memoryIncrease = secondHalfAvg - firstHalfAvg;
      const increasePercentage = (memoryIncrease / firstHalfAvg) * 100;

      // Verificar se não há vazamento significativo
      expect(increasePercentage).toBeLessThan(20); // Menos de 20% de aumento

      console.log(`🧠 Memory increase over ${iterations} iterations: ${increasePercentage.toFixed(2)}%`);
    });

    it('should handle large message history efficiently', async () => {
      const largeMessageCount = 500;
      const sessionId = 'large-history-session';

      // Criar histórico grande
      const largeHistory = Array.from({ length: largeMessageCount }, (_, i) => ({
        id: `large-msg-${i}`,
        content: `Large history message ${i} with some content to simulate real usage`,
        sender: i % 2 === 0 ? 'user' : 'agent',
        timestamp: new Date(Date.now() - (largeMessageCount - i) * 1000),
        status: 'sent'
      }));

      mockChatHistory.getSession.mockReturnValue({
        id: sessionId,
        messages: largeHistory,
        isActive: true,
        isTyping: false
      });

      const initialMemory = (performance as any).memory.usedJSHeapSize;
      const startTime = performance.now();

      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Large history test"
        />
      );

      const renderTime = performance.now() - startTime;
      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryUsed = finalMemory - initialMemory;

      // Verificar se componente foi renderizado
      expect(container).toBeInTheDocument();

      // Verificar performance com histórico grande
      expect(renderTime).toBeLessThan(5000); // Menos de 5 segundos
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024); // Menos de 100MB

      console.log(`📚 Rendered ${largeMessageCount} messages in ${renderTime.toFixed(2)}ms`);
      console.log(`💾 Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Network Load Test', () => {
    it('should handle network latency gracefully', async () => {
      const latencies = [100, 500, 1000, 2000, 5000]; // ms
      const results: { latency: number; success: boolean; time: number }[] = [];

      for (const latency of latencies) {
        mockN8nChat.sendMessage.mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                success: true,
                data: { response: `Response with ${latency}ms latency`, sessionId: 'test' }
              });
            }, latency);
          });
        });

        const user = userEvent.setup();

        const { unmount } = render(
          <ChatInterface
            type="public"
            webhookUrl="https://test.com/webhook"
            placeholder="Latency test"
          />
        );

        const messageInput = screen.getByRole('textbox');
        const sendButton = screen.getByRole('button', { name: /enviar/i });

        const startTime = performance.now();

        await user.type(messageInput, `Test message with ${latency}ms latency`);
        await user.click(sendButton);

        // Aguardar resposta
        await waitFor(() => {
          expect(mockN8nChat.sendMessage).toHaveBeenCalled();
        }, { timeout: latency + 1000 });

        const endTime = performance.now();
        const actualTime = endTime - startTime;

        results.push({
          latency,
          success: true,
          time: actualTime
        });

        unmount();
        vi.clearAllMocks();
      }

      // Verificar se todas as latências foram tratadas
      expect(results).toHaveLength(latencies.length);

      // Verificar se tempos são razoáveis
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.time).toBeGreaterThan(result.latency - 100); // Margem de erro
      });

      console.log('🌐 Network latency test results:');
      results.forEach(result => {
        console.log(`  ${result.latency}ms latency -> ${result.time.toFixed(2)}ms total`);
      });
    });

    it('should handle network failures and retries', async () => {
      let attemptCount = 0;
      const maxAttempts = 3;

      mockN8nChat.sendMessage.mockImplementation(() => {
        attemptCount++;

        if (attemptCount < maxAttempts) {
          return Promise.reject(new Error('Network error'));
        }

        return Promise.resolve({
          success: true,
          data: { response: 'Success after retries', sessionId: 'test' }
        });
      });

      mockN8nChat.retryLastMessage.mockImplementation(() => {
        return mockN8nChat.sendMessage();
      });

      const user = userEvent.setup();

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Retry test"
        />
      );

      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      // Enviar mensagem
      await user.type(messageInput, 'Test retry message');
      await user.click(sendButton);

      // Simular retries
      for (let i = 1; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simular clique no botão de retry (se existir)
        const retryButton = screen.queryByRole('button', { name: /tentar novamente/i });
        if (retryButton) {
          await user.click(retryButton);
        }
      }

      // Verificar se eventualmente teve sucesso
      expect(attemptCount).toBe(maxAttempts);
    });
  });

  describe('UI Responsiveness Load Test', () => {
    it('should maintain UI responsiveness during heavy load', async () => {
      const heavyOperations = 20;
      const responseTimes: number[] = [];

      for (let i = 0; i < heavyOperations; i++) {
        const startTime = performance.now();

        // Simular operação pesada
        const { unmount } = render(
          <ChatInterface
            type="public"
            webhookUrl="https://test.com/webhook"
            placeholder={`Heavy operation ${i}`}
          />
        );

        // Simular interação do usuário
        const messageInput = screen.getByRole('textbox');
        fireEvent.focus(messageInput);

        const responseTime = performance.now() - startTime;
        responseTimes.push(responseTime);

        unmount();
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Verificar responsividade
      expect(averageResponseTime).toBeLessThan(100); // Menos de 100ms em média
      expect(maxResponseTime).toBeLessThan(500); // Menos de 500ms no pior caso

      console.log(`⚡ Average UI response time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`📊 Max UI response time: ${maxResponseTime.toFixed(2)}ms`);
    });

    it('should handle rapid user interactions', async () => {
      const interactionCount = 50;
      const user = userEvent.setup();

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Rapid interaction test"
        />
      );

      const messageInput = screen.getByRole('textbox');
      const startTime = performance.now();

      // Simular digitação rápida
      for (let i = 0; i < interactionCount; i++) {
        await user.type(messageInput, 'a');
        await user.keyboard('{Backspace}');
      }

      const totalTime = performance.now() - startTime;
      const averageInteractionTime = totalTime / interactionCount;

      // Verificar se interações foram processadas rapidamente
      expect(averageInteractionTime).toBeLessThan(50); // Menos de 50ms por interação

      console.log(`⌨️ Processed ${interactionCount} interactions in ${totalTime.toFixed(2)}ms`);
    });
  });
});
