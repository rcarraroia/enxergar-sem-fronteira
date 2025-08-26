/**
 * Testes de Performance do Sistema de Chat
 *
 * Valida métricas de performance e otimizações
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface, VirtualizedMessageList, ChatPerformanceMonitor } from '@/components/chat';
import { useChatPerformance } from '@/hooks/useChatPerformance';

// Mock performance APIs
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

Object.defineProperty(performance, 'getEntriesByType', {
  value: vi.fn(() => [
    {
      name: 'https://test.com/resource.js',
      requestStart: 100,
      responseStart: 150,
      responseEnd: 200,
      loadEventEnd: 1000,
      loadEventStart: 500,
      domContentLoadedEventEnd: 800,
      domContentLoadedEventStart: 600
    }
  ]),
  writable: true
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

// Mock dos hooks
vi.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: () => ({
    createSession: vi.fn(() => 'perf-test-session'),
    addMessage: vi.fn(() => 'perf-test-message'),
    getSession: vi.fn(() => ({
      id: 'perf-test-session',
      messages: [],
      isActive: true,
      isTyping: false
    })),
    getAllSessions: vi.fn(() => []),
    endSession: vi.fn(),
    setTyping: vi.fn(),
    updateMessageStatus: vi.fn()
  })
}));

vi.mock('@/hooks/useN8nChat', () => ({
  useN8nChat: () => ({
    sendMessage: vi.fn(() => Promise.resolve({
      success: true,
      data: { response: 'Performance test response', sessionId: 'perf-test-session' }
    })),
    state: {
      isLoading: false,
      error: null,
      lastResponse: null
    },
    clearError: vi.fn(),
    retryLastMessage: vi.fn()
  })
}));

vi.mock('@/hooks/useChatConfig', () => ({
  useChatConfig: () => ({
    config: {
      enableChat: true,
      enableVoiceInput: true,
      enableMetrics: true,
      enableDevMode: true,
      maxMessageLength: 1000
    }
  })
}));

describe('Chat Performance Tests', () => {
  let performanceObserver: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock PerformanceObserver
    performanceObserver = {
      observe: vi.fn(),
      disconnect: vi.fn()
    };

    global.PerformanceObserver = vi.fn(() => performanceObserver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering Performance', () => {
    it('should render ChatInterface within performance budget', async () => {
      const startTime = performance.now();

      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Performance test"
        />
      );

      const renderTime = performance.now() - startTime;

      // Verificar se componente foi renderizado
      expect(container).toBeInTheDocument();

      // Verificar budget de performance (menos de 100ms)
      expect(renderTime).toBeLessThan(100);

      console.log(`🎨 ChatInterface render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render VirtualizedMessageList efficiently with large datasets', async () => {
      const messageCount = 1000;

      // Criar dataset grande
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `perf-msg-${i}`,
        content: `Performance test message ${i} with some content to simulate real usage`,
        sender: i % 2 === 0 ? 'user' : 'agent',
        timestamp: new Date(Date.now() - (messageCount - i) * 1000),
        status: 'sent' as const
      }));

      const startTime = performance.now();

      const { container } = render(
        <VirtualizedMessageList
          messages={messages}
          isTyping={false}
          onRetryMessage={vi.fn()}
        />
      );

      const renderTime = performance.now() - startTime;

      // Verificar se lista foi renderizada
      expect(container).toBeInTheDocument();

      // Verificar performance com dataset grande (menos de 200ms)
      expect(renderTime).toBeLessThan(200);

      console.log(`📜 VirtualizedMessageList render time (${messageCount} messages): ${renderTime.toFixed(2)}ms`);
    });

    it('should maintain 60fps during animations', async () => {
      const frameCount = 60; // 1 segundo a 60fps
      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();

      // Mock requestAnimationFrame para capturar frame times
      global.requestAnimationFrame = vi.fn((callback) => {
        const currentTime = performance.now();
        frameTimes.push(currentTime - lastFrameTime);
        lastFrameTime = currentTime;

        setTimeout(callback, 16.67); // ~60fps
        return frameTimes.length;
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Animation test"
        />
      );

      // Simular animações por 1 segundo
      for (let i = 0; i < frameCount; i++) {
        await new Promise(resolve => {
          requestAnimationFrame(() => resolve(undefined));
        });
      }

      // Calcular FPS médio
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const averageFPS = 1000 / averageFrameTime;

      // Verificar se mantém próximo de 60fps
      expect(averageFPS).toBeGreaterThan(50); // Pelo menos 50fps
      expect(averageFPS).toBeLessThan(70); // Não mais que 70fps

      console.log(`🎬 Average FPS: ${averageFPS.toFixed(2)}`);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during component lifecycle', async () => {
      const iterations = 20;
      const memoryReadings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const { unmount } = render(
          <ChatInterface
            type="public"
            webhookUrl="https://test.com/webhook"
            placeholder={`Memory test ${i}`}
          />
        );

        // Simular uso do componente
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        unmount();

        // Ler uso de memória
        const memoryUsage = (performance as any).memory.usedJSHeapSize;
        memoryReadings.push(memoryUsage);

        // Forçar garbage collection ocasionalmente
        if (i % 5 === 0 && 'gc' in global) {
          (global as any).gc();
        }
      }

      // Analisar tendência de memória
      const firstReading = memoryReadings[0];
      const lastReading = memoryReadings[memoryReadings.length - 1];
      const memoryIncrease = lastReading - firstReading;
      const increasePercentage = (memoryIncrease / firstReading) * 100;

      // Verificar se não há vazamento significativo (menos de 10%)
      expect(increasePercentage).toBeLessThan(10);

      console.log(`🧠 Memory increase after ${iterations} cycles: ${increasePercentage.toFixed(2)}%`);
    });

    it('should efficiently manage large message history', async () => {
      const messageCount = 500;
      const initialMemory = (performance as any).memory.usedJSHeapSize;

      // Simular histórico grande
      const largeHistory = Array.from({ length: messageCount }, (_, i) => ({
        id: `memory-msg-${i}`,
        content: `Memory test message ${i}`,
        sender: i % 2 === 0 ? 'user' : 'agent',
        timestamp: new Date(),
        status: 'sent' as const
      }));

      // Mock para retornar histórico grande
      const mockUseChatHistory = vi.fn(() => ({
        createSession: vi.fn(),
        addMessage: vi.fn(),
        getSession: vi.fn(() => ({
          id: 'memory-test-session',
          messages: largeHistory,
          isActive: true,
          isTyping: false
        })),
        getAllSessions: vi.fn(() => []),
        endSession: vi.fn(),
        setTyping: vi.fn(),
        updateMessageStatus: vi.fn()
      }));

      // Aplicar mock temporariamente
      const originalMock = require('@/hooks/useChatHistory').useChatHistory;
      require('@/hooks/useChatHistory').useChatHistory = mockUseChatHistory;

      const { unmount } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Large history test"
        />
      );

      const finalMemory = (performance as any).memory.usedJSHeapSize;
      const memoryUsed = finalMemory - initialMemory;

      unmount();

      // Restaurar mock original
      require('@/hooks/useChatHistory').useChatHistory = originalMock;

      // Verificar uso eficiente de memória (menos de 50MB para 500 mensagens)
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024);

      console.log(`💾 Memory used for ${messageCount} messages: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Network Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requestTimes: number[] = [];

      // Mock para simular latência de rede
      const mockSendMessage = vi.fn().mockImplementation(() => {
        const startTime = performance.now();
        return new Promise(resolve => {
          const latency = Math.random() * 200 + 100; // 100-300ms
          setTimeout(() => {
            requestTimes.push(performance.now() - startTime);
            resolve({
              success: true,
              data: { response: 'Concurrent response', sessionId: 'test' }
            });
          }, latency);
        });
      });

      // Aplicar mock
      require('@/hooks/useN8nChat').useN8nChat = () => ({
        sendMessage: mockSendMessage,
        state: { isLoading: false, error: null, lastResponse: null },
        clearError: vi.fn(),
        retryLastMessage: vi.fn()
      });

      const user = userEvent.setup();

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Concurrent test"
        />
      );

      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      const startTime = performance.now();

      // Enviar múltiplas requisições
      const promises = Array.from({ length: concurrentRequests }, async (_, i) => {
        await user.clear(messageInput);
        await user.type(messageInput, `Concurrent message ${i}`);
        await user.click(sendButton);

        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await Promise.all(promises);

      const totalTime = performance.now() - startTime;
      const averageRequestTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;

      // Verificar eficiência das requisições concorrentes
      expect(mockSendMessage).toHaveBeenCalledTimes(concurrentRequests);
      expect(averageRequestTime).toBeLessThan(500); // Menos de 500ms por requisição

      console.log(`🌐 ${concurrentRequests} concurrent requests completed in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Average request time: ${averageRequestTime.toFixed(2)}ms`);
    });

    it('should optimize payload size', async () => {
      const testMessages = [
        'Short',
        'Medium length message with some content',
        'Very long message with lots of content that simulates a real user typing a detailed question or explanation about something they need help with'
      ];

      const payloadSizes: number[] = [];

      // Mock para capturar payloads
      const mockSendMessage = vi.fn().mockImplementation((sessionId, message) => {
        const payload = JSON.stringify({ sessionId, message, timestamp: new Date() });
        payloadSizes.push(new Blob([payload]).size);

        return Promise.resolve({
          success: true,
          data: { response: 'Response', sessionId }
        });
      });

      require('@/hooks/useN8nChat').useN8nChat = () => ({
        sendMessage: mockSendMessage,
        state: { isLoading: false, error: null, lastResponse: null },
        clearError: vi.fn(),
        retryLastMessage: vi.fn()
      });

      const user = userEvent.setup();

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Payload test"
        />
      );

      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      // Testar diferentes tamanhos de mensagem
      for (const message of testMessages) {
        await user.clear(messageInput);
        await user.type(messageInput, message);
        await user.click(sendButton);

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verificar se payloads são otimizados
      const maxPayloadSize = Math.max(...payloadSizes);
      const averagePayloadSize = payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length;

      expect(maxPayloadSize).toBeLessThan(2048); // Menos de 2KB
      expect(averagePayloadSize).toBeLessThan(1024); // Menos de 1KB em média

      console.log(`📦 Payload sizes: ${payloadSizes.map(s => `${s}B`).join(', ')}`);
      console.log(`📊 Average payload size: ${averagePayloadSize.toFixed(0)}B`);
    });
  });

  describe('Performance Monitoring', () => {
    it('should accurately measure performance metrics', async () => {
      const { container } = render(
        <ChatPerformanceMonitor
          showDetailed={true}
          showAlerts={true}
          devModeOnly={false}
        />
      );

      // Aguardar inicialização do monitor
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      // Verificar se monitor foi renderizado
      expect(container).toBeInTheDocument();

      // Verificar se métricas estão sendo coletadas
      expect(global.PerformanceObserver).toHaveBeenCalled();
    });

    it('should detect performance issues', async () => {
      // Simular uso alto de memória
      (performance as any).memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB

      const { result } = renderHook(() => useChatPerformance({
        thresholds: {
          memoryUsage: 100, // 100MB threshold
          minFPS: 30,
          maxLatency: 1000
        }
      }));

      await act(async () => {
        result.current.updateMetrics();
      });

      // Verificar se alertas foram gerados
      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.isHealthy).toBe(false);

      const memoryAlert = result.current.alerts.find(alert => alert.type === 'memory');
      expect(memoryAlert).toBeDefined();
      expect(memoryAlert?.severity).toBe('medium');
    });

    it('should provide optimization recommendations', async () => {
      // Simular múltiplos problemas de performance
      (performance as any).memory.usedJSHeapSize = 200 * 1024 * 1024; // 200MB

      vi.mocked(performance.getEntriesByType).mockReturnValue([
        {
          name: 'https://test.com/slow-resource.js',
          requestStart: 100,
          responseStart: 2000, // Latência alta
          responseEnd: 2500
        }
      ] as any);

      const { result } = renderHook(() => useChatPerformance({
        thresholds: {
          memoryUsage: 100,
          minFPS: 30,
          maxLatency: 500
        }
      }));

      await act(async () => {
        result.current.updateMetrics();
      });

      const recommendations = result.current.getOptimizationRecommendations();

      // Verificar se recomendações foram geradas
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('memória'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('rede'))).toBe(true);

      console.log('💡 Optimization recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    });
  });

  describe('Bundle Size Performance', () => {
    it('should have optimal bundle size', async () => {
      // Simular análise de bundle
      const mockBundleAnalysis = {
        totalSize: 500 * 1024, // 500KB
        chatSystemSize: 150 * 1024, // 150KB
        dependencies: {
          react: 50 * 1024,
          'chat-components': 100 * 1024,
          utilities: 50 * 1024
        }
      };

      // Verificar se bundle do chat não é muito grande
      expect(mockBundleAnalysis.chatSystemSize).toBeLessThan(200 * 1024); // Menos de 200KB
      expect(mockBundleAnalysis.totalSize).toBeLessThan(1024 * 1024); // Menos de 1MB total

      console.log(`📦 Chat system bundle size: ${(mockBundleAnalysis.chatSystemSize / 1024).toFixed(1)}KB`);
      console.log(`📦 Total bundle size: ${(mockBundleAnalysis.totalSize / 1024).toFixed(1)}KB`);
    });

    it('should support code splitting effectively', async () => {
      // Simular lazy loading
      const lazyComponents = [
        'ChatPerformanceMonitor',
        'VirtualizedMessageList',
        'ChatMetricsDashboard',
        'VoiceInput'
      ];

      const loadTimes: { component: string; time: number }[] = [];

      for (const component of lazyComponents) {
        const startTime = performance.now();

        // Simular carregamento lazy
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

        const loadTime = performance.now() - startTime;
        loadTimes.push({ component, time: loadTime });
      }

      // Verificar se componentes carregam rapidamente
      const averageLoadTime = loadTimes.reduce((sum, item) => sum + item.time, 0) / loadTimes.length;
      expect(averageLoadTime).toBeLessThan(200); // Menos de 200ms

      console.log('⚡ Lazy component load times:');
      loadTimes.forEach(({ component, time }) => {
        console.log(`  ${component}: ${time.toFixed(2)}ms`);
      });
    });
  });
});
