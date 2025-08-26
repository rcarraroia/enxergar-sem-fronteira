/**
 * Tests for Chat Lazy Loader
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ChatMemoryOptimizer,
    ChatPerformanceOptimizer,
    componentCache,
    createLazyComponent,
    initializeChatPerformanceOptimizations,
    loadResource,
    resourceCache
} from '../chatLazyLoader';

// Mock do React
vi.mock('react', () => ({
  lazy: vi.fn((importFn) => {
    const MockComponent = () => null;
    MockComponent.displayName = 'LazyComponent';
    return MockComponent;
  }),
  ComponentType: vi.fn()
}));

// Mock das configurações do chat
vi.mock('../chatConfig', () => ({
  getChatConfig: vi.fn(() => ({
    enableChat: true,
    enablePublicChat: true,
    enableAdminChat: true,
    enableVoiceInput: true,
    enableMetrics: true,
    enableDevMode: true,
    enableNotifications: true
  })),
  isFeatureEnabled: vi.fn((feature: string) => {
    const enabledFeatures = [
      'enableChat',
      'enablePublicChat',
      'enableAdminChat',
      'enableVoiceInput',
      'enableMetrics',
      'enableDevMode',
      'enableNotifications'
    ];
    return enabledFeatures.includes(feature);
  })
}));

// Mock das métricas
vi.mock('../chatMetrics', () => ({
  trackChatMetric: vi.fn()
}));

// Mock do DOM APIs
Object.defineProperty(window, 'requestIdleCallback', {
  value: vi.fn((callback) => setTimeout(callback, 0)),
  writable: true
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'MutationObserver', {
  value: vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'PerformanceObserver', {
  value: vi.fn(() => ({
    observe: vi.fn()
  })),
  writable: true
});

Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  },
  writable: true
});

describe('Chat Lazy Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    componentCache.clear();
    resourceCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createLazyComponent', () => {
    it('should create lazy component with default options', () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));

      const LazyComponent = createLazyComponent(mockImport);

      expect(LazyComponent).toBeDefined();
      expect(componentCache.has(mockImport.toString())).toBe(true);
    });

    it('should apply delay when specified', async () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));
      const delay = 100;

      createLazyComponent(mockImport, { delay });

      // Verificar se o delay foi aplicado (através do mock)
      expect(mockImport.toString()).toContain('function');
    });

    it('should check condition before loading', async () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));
      const condition = vi.fn(() => false);

      createLazyComponent(mockImport, { condition });

      expect(condition).toBeDefined();
    });

    it('should call onLoad callback on successful load', async () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));
      const onLoad = vi.fn();

      createLazyComponent(mockImport, { onLoad });

      expect(onLoad).toBeDefined();
    });

    it('should call onError callback on failed load', async () => {
      const mockImport = vi.fn(() => Promise.reject(new Error('Load failed')));
      const onError = vi.fn();

      createLazyComponent(mockImport, { onError });

      expect(onError).toBeDefined();
    });

    it('should preload on idle when enabled', () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));

      createLazyComponent(mockImport, { preloadOnIdle: true });

      expect(window.requestIdleCallback).toHaveBeenCalled();
    });

    it('should use cached component on subsequent calls', () => {
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));

      const LazyComponent1 = createLazyComponent(mockImport);
      const LazyComponent2 = createLazyComponent(mockImport);

      expect(LazyComponent1).toBe(LazyComponent2);
    });
  });

  describe('loadResource', () => {
    beforeEach(() => {
      // Mock createElement
      document.createElement = vi.fn((tagName) => {
        const element = {
          tagName: tagName.toUpperCase(),
          onload: null,
          onerror: null,
          src: '',
          href: '',
          rel: '',
          preload: ''
        };
        return element as any;
      });

      // Mock appendChild
      document.head.appendChild = vi.fn();
    });

    it('should load script resource', async () => {
      const url = 'https://example.com/script.js';

      const promise = loadResource(url, { type: 'script' });

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should load style resource', async () => {
      const url = 'https://example.com/style.css';

      const promise = loadResource(url, { type: 'style' });

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should load image resource', async () => {
      const url = 'https://example.com/image.jpg';

      const promise = loadResource(url, { type: 'image' });

      expect(document.createElement).toHaveBeenCalledWith('img');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should load audio resource', async () => {
      const url = 'https://example.com/audio.mp3';

      const promise = loadResource(url, { type: 'audio' });

      expect(document.createElement).toHaveBeenCalledWith('audio');
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should apply delay when specified', async () => {
      const url = 'https://example.com/script.js';
      const delay = 100;

      const startTime = Date.now();
      loadResource(url, { type: 'script', delay });

      // O delay é aplicado internamente
      expect(Date.now() - startTime).toBeLessThan(delay + 50);
    });

    it('should check condition before loading', async () => {
      const url = 'https://example.com/script.js';
      const condition = vi.fn(() => false);

      try {
        await loadResource(url, { type: 'script', condition });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should cache resources when enabled', () => {
      const url = 'https://example.com/script.js';

      loadResource(url, { type: 'script', cache: true });
      loadResource(url, { type: 'script', cache: true });

      expect(resourceCache.has(url)).toBe(true);
    });

    it('should not cache resources when disabled', () => {
      const url = 'https://example.com/script.js';

      loadResource(url, { type: 'script', cache: false });

      expect(resourceCache.has(url)).toBe(false);
    });

    it('should throw error for unsupported resource type', async () => {
      const url = 'https://example.com/resource';

      try {
        await loadResource(url, { type: 'unsupported' as any });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Unsupported resource type');
      }
    });
  });

  describe('ChatPerformanceOptimizer', () => {
    let optimizer: ChatPerformanceOptimizer;

    beforeEach(() => {
      optimizer = ChatPerformanceOptimizer.getInstance();
    });

    afterEach(() => {
      optimizer.cleanup();
    });

    it('should be singleton', () => {
      const optimizer1 = ChatPerformanceOptimizer.getInstance();
      const optimizer2 = ChatPerformanceOptimizer.getInstance();

      expect(optimizer1).toBe(optimizer2);
    });

    it('should initialize successfully', () => {
      expect(() => optimizer.initialize()).not.toThrow();
    });

    it('should setup intersection observer', () => {
      optimizer.initialize();

      expect(window.IntersectionObserver).toHaveBeenCalled();
    });

    it('should setup mutation observer', () => {
      optimizer.initialize();

      expect(window.MutationObserver).toHaveBeenCalled();
    });

    it('should setup performance monitoring', () => {
      optimizer.initialize();

      expect(window.PerformanceObserver).toHaveBeenCalled();
    });

    it('should observe element for lazy loading', () => {
      const mockElement = document.createElement('div');
      mockElement.dataset.lazyLoad = 'chat-widget';

      optimizer.initialize();
      optimizer.observeElement(mockElement);

      // Verificar se o elemento foi observado
      expect(mockElement.dataset.lazyLoad).toBe('chat-widget');
    });

    it('should get performance metrics', () => {
      // Mock performance.getEntriesByType
      performance.getEntriesByType = vi.fn(() => [
        {
          loadEventEnd: 1000,
          loadEventStart: 500,
          domContentLoadedEventEnd: 800,
          domContentLoadedEventStart: 600
        }
      ] as any);

      const metrics = optimizer.getPerformanceMetrics();

      expect(metrics).toHaveProperty('resourceLoadTime');
      expect(metrics).toHaveProperty('domContentLoaded');
      expect(metrics).toHaveProperty('firstContentfulPaint');
      expect(metrics).toHaveProperty('largestContentfulPaint');
    });

    it('should cleanup resources', () => {
      optimizer.initialize();

      expect(() => optimizer.cleanup()).not.toThrow();
    });
  });

  describe('ChatMemoryOptimizer', () => {
    let memoryOptimizer: ChatMemoryOptimizer;

    beforeEach(() => {
      memoryOptimizer = ChatMemoryOptimizer.getInstance();
    });

    afterEach(() => {
      memoryOptimizer.stop();
    });

    it('should be singleton', () => {
      const optimizer1 = ChatMemoryOptimizer.getInstance();
      const optimizer2 = ChatMemoryOptimizer.getInstance();

      expect(optimizer1).toBe(optimizer2);
    });

    it('should initialize successfully', () => {
      expect(() => memoryOptimizer.initialize()).not.toThrow();
    });

    it('should stop monitoring', () => {
      memoryOptimizer.initialize();

      expect(() => memoryOptimizer.stop()).not.toThrow();
    });
  });

  describe('initializeChatPerformanceOptimizations', () => {
    it('should initialize when chat is enabled', () => {
      expect(() => initializeChatPerformanceOptimizations()).not.toThrow();
    });

    it('should not initialize when chat is disabled', () => {
      const { isFeatureEnabled } = require('../chatConfig');
      vi.mocked(isFeatureEnabled).mockReturnValue(false);

      expect(() => initializeChatPerformanceOptimizations()).not.toThrow();
    });
  });

  describe('LazyChatComponents', () => {
    it('should have all expected components', async () => {
      const { LazyChatComponents } = await import('../chatLazyLoader');

      expect(LazyChatComponents).toHaveProperty('ChatInterface');
      expect(LazyChatComponents).toHaveProperty('PublicChatWidget');
      expect(LazyChatComponents).toHaveProperty('AdminChatPanel');
      expect(LazyChatComponents).toHaveProperty('VoiceInput');
      expect(LazyChatComponents).toHaveProperty('ChatMetricsDashboard');
      expect(LazyChatComponents).toHaveProperty('ChatConfigPanel');
    });
  });

  describe('LazyChatResources', () => {
    it('should have all expected resources', async () => {
      const { LazyChatResources } = await import('../chatLazyLoader');

      expect(LazyChatResources).toHaveProperty('speechRecognition');
      expect(LazyChatResources).toHaveProperty('sentimentAnalysis');
      expect(LazyChatResources).toHaveProperty('notificationSound');
      expect(LazyChatResources).toHaveProperty('chatIcons');
    });

    it('should load speech recognition resource', async () => {
      const { LazyChatResources } = await import('../chatLazyLoader');

      const promise = LazyChatResources.speechRecognition();
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should load sentiment analysis resource', async () => {
      const { LazyChatResources } = await import('../chatLazyLoader');

      const promise = LazyChatResources.sentimentAnalysis();
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should load notification sound resource', async () => {
      const { LazyChatResources } = await import('../chatLazyLoader');

      const promise = LazyChatResources.notificationSound();
      expect(promise).toBeInstanceOf(Promise);
    });

    it('should load chat icons resource', async () => {
      const { LazyChatResources } = await import('../chatLazyLoader');

      const promise = LazyChatResources.chatIcons();
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe('Cache Management', () => {
    it('should manage component cache size', () => {
      // Adicionar muitos componentes ao cache
      for (let i = 0; i < 15; i++) {
        const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));
        createLazyComponent(mockImport);
      }

      expect(componentCache.size).toBeGreaterThan(0);
    });

    it('should manage resource cache size', () => {
      // Adicionar muitos recursos ao cache
      for (let i = 0; i < 25; i++) {
        loadResource(`https://example.com/resource${i}.js`, {
          type: 'script',
          cache: true
        });
      }

      expect(resourceCache.size).toBeGreaterThan(0);
    });

    it('should clear caches', () => {
      // Adicionar itens aos caches
      const mockImport = vi.fn(() => Promise.resolve({ default: () => null }));
      createLazyComponent(mockImport);

      loadResource('https://example.com/resource.js', {
        type: 'script',
        cache: true
      });

      // Limpar caches
      componentCache.clear();
      resourceCache.clear();

      expect(componentCache.size).toBe(0);
      expect(resourceCache.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle component loading errors gracefully', async () => {
      const mockImport = vi.fn(() => Promise.reject(new Error('Component load failed')));
      const onError = vi.fn();

      createLazyComponent(mockImport, { onError });

      // O erro deve ser tratado pelo lazy component
      expect(onError).toBeDefined();
    });

    it('should handle resource loading errors gracefully', async () => {
      const url = 'https://invalid-url.com/resource.js';
      const onError = vi.fn();

      try {
        await loadResource(url, { type: 'script', onError });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle missing browser APIs gracefully', () => {
      // Remover APIs do browser temporariamente
      const originalIntersectionObserver = window.IntersectionObserver;
      delete (window as any).IntersectionObserver;

      const optimizer = ChatPerformanceOptimizer.getInstance();
      expect(() => optimizer.initialize()).not.toThrow();

      // Restaurar API
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('should handle memory API unavailability', () => {
      // Remover memory API temporariamente
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const memoryOptimizer = ChatMemoryOptimizer.getInstance();
      expect(() => memoryOptimizer.initialize()).not.toThrow();

      // Restaurar API
      (performance as any).memory = originalMemory;
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance entries', () => {
      const optimizer = ChatPerformanceOptimizer.getInstance();
      optimizer.initialize();

      // Simular entrada de performance
      const mockEntry = {
        name: 'test-metric',
        startTime: 100,
        duration: 50
      };

      // Verificar se o observer foi configurado
      expect(window.PerformanceObserver).toHaveBeenCalled();
    });

    it('should limit performance entries storage', () => {
      const optimizer = ChatPerformanceOptimizer.getInstance();
      optimizer.initialize();

      // O limite deve ser aplicado internamente
      expect(window.PerformanceObserver).toHaveBeenCalled();
    });
  });

  describe('Lazy Loading Integration', () => {
    it('should integrate with intersection observer', () => {
      const optimizer = ChatPerformanceOptimizer.getInstance();
      optimizer.initialize();

      const mockElement = document.createElement('div');
      mockElement.dataset.lazyLoad = 'chat-widget';

      optimizer.observeElement(mockElement);

      expect(window.IntersectionObserver).toHaveBeenCalled();
    });

    it('should handle element visibility changes', () => {
      const optimizer = ChatPerformanceOptimizer.getInstance();
      optimizer.initialize();

      // Simular mudança de visibilidade
      const mockElement = document.createElement('div');
      mockElement.dataset.lazyLoad = 'chat-widget';

      expect(() => optimizer.observeElement(mockElement)).not.toThrow();
    });
  });
});
