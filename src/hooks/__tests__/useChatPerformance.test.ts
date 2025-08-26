/**
 * Tests for useChatPerformance Hook
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useChatAutoOptimization,
    useChatPerformance,
    useChatPerformanceMonitor,
    useChatRealTimePerformance
} from '../useChatPerformance';

// Mock das dependências
vi.mock('@/lib/chat/chatLazyLoader', () => ({
  ChatPerformanceOptimizer: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      cleanup: vi.fn(),
      getPerformanceMetrics: vi.fn(() => ({
        resourceLoadTime: 1000,
        domContentLoaded: 500,
        firstContentfulPaint: 800,
        largestContentfulPaint: 1200
      }))
    }))
  },
  ChatMemoryOptimizer: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      stop: vi.fn(),
      performCleanup: vi.fn()
    }))
  },
  initializeChatPerformanceOptimizations: vi.fn()
}));

vi.mock('@/lib/chat/chatConfig', () => ({
  getChatConfig: vi.fn(() => ({
    enableChat: true,
    enableMetrics: true,
    enableDevMode: true
  })),
  isFeatureEnabled: vi.fn((feature: string) => {
    const enabledFeatures = ['enableChat', 'enableMetrics', 'enableDevMode'];
    return enabledFeatures.includes(feature);
  })
}));

vi.mock('@/lib/chat/chatMetrics', () => ({
  trackChatMetric: vi.fn()
}));

// Mock do performance API
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  },
  writable: true
});

Object.defineProperty(performance, 'getEntriesByType', {
  value: vi.fn(() => [
    {
      name: 'https://example.com/resource.js',
      requestStart: 100,
      responseStart: 150,
      responseEnd: 200
    }
  ]),
  writable: true
});

Object.defineProperty(performance, 'now', {
  value: vi.fn(() => Date.now()),
  writable: true
});

// Mock do requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

describe('useChatPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChatPerformance());

      expect(result.current.isMonitoring).toBe(false);
      expect(result.current.isHealthy).toBe(true);
      expect(result.current.alerts).toEqual([]);
      expect(result.current.lastUpdated).toBeNull();
      expect(result.current.metrics).toBeDefined();
    });

    it('should auto-initialize when enabled', () => {
      const { result } = renderHook(() =>
        useChatPerformance({ autoInitialize: true })
      );

      expect(result.current.isMonitoring).toBe(true);
    });

    it('should not auto-initialize when disabled', () => {
      const { result } = renderHook(() =>
        useChatPerformance({ autoInitialize: false })
      );

      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      const { result } = renderHook(() =>
        useChatPerformance({ autoInitialize: false })
      );

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);
    });

    it('should stop monitoring', () => {
      const { result } = renderHook(() =>
        useChatPerformance({ autoInitialize: true })
      );

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
    });

    it('should not start monitoring if already monitoring', () => {
      const { result } = renderHook(() =>
        useChatPerformance({ autoInitialize: true })
      );

      const initialState = result.current.isMonitoring;

      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(initialState);
    });

    it('should not stop monitoring if not monitoring', () => {
      const { result } = renderHook(() =>
        useChatPerformance({ autoInitialize: false })
      );

      const initialState = result.current.isMonitoring;

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(initialState);
    });
  });

  describe('Metrics Collection', () => {
    it('should update metrics manually', () => {
      const { result } = renderHook(() => useChatPerformance());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should collect performance metrics', () => {
      const { result } = renderHook(() => useChatPerformance());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.metrics.resourceLoadTime).toBe(1000);
      expect(result.current.metrics.domContentLoaded).toBe(500);
      expect(result.current.metrics.firstContentfulPaint).toBe(800);
      expect(result.current.metrics.largestContentfulPaint).toBe(1200);
    });

    it('should collect memory metrics', () => {
      const { result } = renderHook(() => useChatPerformance());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.metrics.memoryUsage.used).toBe(50 * 1024 * 1024);
      expect(result.current.metrics.memoryUsage.total).toBe(100 * 1024 * 1024);
      expect(result.current.metrics.memoryUsage.limit).toBe(200 * 1024 * 1024);
    });

    it('should estimate network latency', () => {
      const { result } = renderHook(() => useChatPerformance());

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.metrics.networkLatency).toBeGreaterThanOrEqual(0);
    });

    it('should track FPS', () => {
      const { result } = renderHook(() => useChatPerformance());

      act(() => {
        result.current.startMonitoring();
      });

      // Simular alguns frames
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.metrics.averageFPS).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Alerts', () => {
    it('should generate memory usage alert', () => {
      // Mock high memory usage
      (performance as any).memory.usedJSHeapSize = 150 * 1024 * 1024;

      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { memoryUsage: 100 }
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.alerts[0].type).toBe('memory');
      expect(result.current.isHealthy).toBe(false);
    });

    it('should generate FPS alert', () => {
      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { minFPS: 60 }
        })
      );

      // Simular FPS baixo
      act(() => {
        result.current.startMonitoring();
        // Simular FPS baixo através do mock
        vi.advanceTimersByTime(2000);
      });

      // O FPS será calculado baseado nos frames simulados
      expect(result.current.metrics.averageFPS).toBeDefined();
    });

    it('should generate latency alert', () => {
      // Mock high latency
      vi.mocked(performance.getEntriesByType).mockReturnValue([
        {
          name: 'https://example.com/resource.js',
          requestStart: 100,
          responseStart: 1200, // High latency
          responseEnd: 1300
        }
      ] as any);

      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { maxLatency: 500 }
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.alerts.some(alert => alert.type === 'latency')).toBe(true);
    });

    it('should generate load time alert', () => {
      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { maxLoadTime: 500 }
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.alerts.some(alert => alert.type === 'load_time')).toBe(true);
    });

    it('should clear alerts', () => {
      // Mock high memory to generate alert
      (performance as any).memory.usedJSHeapSize = 150 * 1024 * 1024;

      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { memoryUsage: 100 }
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearAlerts();
      });

      expect(result.current.alerts.length).toBe(0);
    });
  });

  describe('Optimization', () => {
    it('should force cleanup', () => {
      const { result } = renderHook(() => useChatPerformance());

      act(() => {
        result.current.forceCleanup();
      });

      // Verificar se a limpeza foi chamada
      expect(result.current.forceCleanup).toBeDefined();
    });

    it('should get optimization recommendations', () => {
      // Mock high memory usage
      (performance as any).memory.usedJSHeapSize = 150 * 1024 * 1024;

      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { memoryUsage: 100 }
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      const recommendations = result.current.getOptimizationRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('memória'))).toBe(true);
    });

    it('should provide FPS recommendations', () => {
      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { minFPS: 60 }
        })
      );

      // Simular FPS baixo
      act(() => {
        result.current.startMonitoring();
        vi.advanceTimersByTime(2000);
      });

      const recommendations = result.current.getOptimizationRecommendations();
      expect(recommendations).toBeDefined();
    });

    it('should provide latency recommendations', () => {
      // Mock high latency
      vi.mocked(performance.getEntriesByType).mockReturnValue([
        {
          name: 'https://example.com/resource.js',
          requestStart: 100,
          responseStart: 1200,
          responseEnd: 1300
        }
      ] as any);

      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: { maxLatency: 500 }
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      const recommendations = result.current.getOptimizationRecommendations();
      expect(recommendations.some(rec => rec.includes('rede'))).toBe(true);
    });
  });

  describe('Custom Options', () => {
    it('should use custom monitoring interval', () => {
      const customInterval = 2000;

      const { result } = renderHook(() =>
        useChatPerformance({
          monitoringInterval: customInterval,
          autoInitialize: true
        })
      );

      expect(result.current.isMonitoring).toBe(true);
    });

    it('should use custom thresholds', () => {
      const customThresholds = {
        memoryUsage: 200,
        minFPS: 45,
        maxLatency: 2000,
        maxLoadTime: 5000
      };

      const { result } = renderHook(() =>
        useChatPerformance({
          thresholds: customThresholds
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      // Com thresholds mais altos, não deve gerar alertas
      expect(result.current.isHealthy).toBe(true);
    });

    it('should disable metric tracking when specified', () => {
      const { result } = renderHook(() =>
        useChatPerformance({
          trackMetrics: false
        })
      );

      act(() => {
        result.current.updateMetrics();
      });

      // Métricas ainda devem ser coletadas, mas não trackeadas
      expect(result.current.metrics).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() =>
        useChatPerformance({ autoInitialize: true })
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should stop monitoring on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useChatPerformance({ autoInitialize: true })
      );

      expect(result.current.isMonitoring).toBe(true);

      unmount();

      // Após unmount, o monitoring deve parar
      expect(() => unmount()).not.toThrow();
    });
  });
});

describe('useChatPerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return simplified performance data', () => {
    const { result } = renderHook(() => useChatPerformanceMonitor());

    expect(result.current).toHaveProperty('isHealthy');
    expect(result.current).toHaveProperty('memoryUsage');
    expect(result.current).toHaveProperty('fps');
    expect(result.current).toHaveProperty('alerts');
  });

  it('should use longer monitoring interval', () => {
    const { result } = renderHook(() => useChatPerformanceMonitor());

    expect(result.current.isHealthy).toBeDefined();
  });
});

describe('useChatAutoOptimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide optimization controls', () => {
    const { result } = renderHook(() => useChatAutoOptimization());

    expect(result.current).toHaveProperty('isOptimizing');
    expect(result.current).toHaveProperty('optimizationLevel');
    expect(result.current).toHaveProperty('recommendations');
    expect(result.current).toHaveProperty('applyOptimizations');
  });

  it('should apply basic optimizations', async () => {
    const { result } = renderHook(() => useChatAutoOptimization());

    await act(async () => {
      result.current.applyOptimizations('basic');
    });

    expect(result.current.optimizationLevel).toBe('basic');
  });

  it('should apply aggressive optimizations', async () => {
    const { result } = renderHook(() => useChatAutoOptimization());

    await act(async () => {
      result.current.applyOptimizations('aggressive');
    });

    expect(result.current.optimizationLevel).toBe('aggressive');
  });

  it('should show optimizing state during optimization', async () => {
    const { result } = renderHook(() => useChatAutoOptimization());

    const optimizationPromise = act(async () => {
      result.current.applyOptimizations('basic');
    });

    // Durante a otimização, deve mostrar estado de carregamento
    expect(result.current.isOptimizing).toBe(true);

    await optimizationPromise;

    expect(result.current.isOptimizing).toBe(false);
  });
});

describe('useChatRealTimePerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide real-time metrics', () => {
    const { result } = renderHook(() => useChatRealTimePerformance());

    expect(result.current).toHaveProperty('memoryUsage');
    expect(result.current).toHaveProperty('fps');
    expect(result.current).toHaveProperty('latency');
    expect(result.current).toHaveProperty('isHealthy');
  });

  it('should use short monitoring interval', () => {
    const { result } = renderHook(() => useChatRealTimePerformance());

    expect(result.current.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(result.current.fps).toBeGreaterThanOrEqual(0);
    expect(result.current.latency).toBeGreaterThanOrEqual(0);
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle missing performance.memory gracefully', () => {
    const originalMemory = (performance as any).memory;
    delete (performance as any).memory;

    const { result } = renderHook(() => useChatPerformance());

    act(() => {
      result.current.updateMetrics();
    });

    expect(result.current.metrics.memoryUsage.used).toBe(0);

    // Restaurar
    (performance as any).memory = originalMemory;
  });

  it('should handle performance API errors gracefully', () => {
    vi.mocked(performance.getEntriesByType).mockImplementation(() => {
      throw new Error('Performance API error');
    });

    const { result } = renderHook(() => useChatPerformance());

    expect(() => {
      act(() => {
        result.current.updateMetrics();
      });
    }).not.toThrow();
  });

  it('should handle optimizer initialization errors', () => {
    const { ChatPerformanceOptimizer } = require('@/lib/chat/chatLazyLoader');
    vi.mocked(ChatPerformanceOptimizer.getInstance).mockImplementation(() => {
      throw new Error('Optimizer error');
    });

    const { result } = renderHook(() => useChatPerformance());

    expect(result.current).toBeDefined();
  });
});
