/**
 * Configuração para Testes de Acessibilidade
 *
 * Setup e configurações globais para testes de acessibilidade
 */

import { cleanup } from '@testing-library/react';
import { configureAxe } from 'jest-axe';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

// ============================================================================
// AXE CONFIGURATION
// ============================================================================

/**
 * Configuração do axe-core para testes de acessibilidade
 */
export const axeConfig = configureAxe({
  rules: {
    // Regras habilitadas
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
    'semantic-markup': { enabled: true },
    'live-regions': { enabled: true },

    // Regras específicas para componentes de chat
    'aria-live-region': { enabled: true },
    'aria-expanded': { enabled: true },
    'aria-pressed': { enabled: true },
    'aria-describedby': { enabled: true },
    'aria-labelledby': { enabled: true },

    // Regras de formulário
    'form-labels': { enabled: true },
    'form-validation': { enabled: true },
    'required-fields': { enabled: true },

    // Regras de navegação
    'tab-order': { enabled: true },
    'focus-visible': { enabled: true },
    'skip-links': { enabled: true },

    // Regras desabilitadas para casos específicos
    'color-contrast-enhanced': { enabled: false }, // AAA não é obrigatório
    'region': { enabled: false }, // Pode conflitar com componentes dinâmicos
  },

  tags: [
    'wcag2a',
    'wcag2aa',
    'wcag21aa',
    'best-practice'
  ],

  // Configurações específicas para componentes React
  reporter: 'v2',
  resultTypes: ['violations', 'incomplete', 'passes'],

  // Timeout para testes assíncronos
  timeout: 5000
});

// ============================================================================
// MOCK CONFIGURATIONS
// ============================================================================

/**
 * Mock das APIs do browser para testes
 */
export function setupBrowserMocks(): void {
  // Mock do IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    private callback: IntersectionObserverCallback;

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };

  // Mock do ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    private callback: ResizeObserverCallback;

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };

  // Mock do MutationObserver
  global.MutationObserver = class MutationObserver {
    constructor(callback: MutationCallback) {
      this.callback = callback;
    }

    private callback: MutationCallback;

    observe = vi.fn();
    disconnect = vi.fn();
  };

  // Mock do Web Speech API
  Object.defineProperty(window, 'SpeechRecognition', {
    value: class SpeechRecognition {
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();

      continuous = false;
      interimResults = false;
      lang = 'pt-BR';
      maxAlternatives = 1;
    },
    writable: true
  });

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: window.SpeechRecognition,
    writable: true
  });

  // Mock do matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true
  });

  // Mock do getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn().mockImplementation(() => ({
      getPropertyValue: vi.fn().mockReturnValue(''),
      color: '#000000',
      backgroundColor: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif'
    })),
    writable: true
  });

  // Mock do requestAnimationFrame
  global.requestAnimationFrame = vi.fn().mockImplementation(callback => {
    setTimeout(callback, 16);
    return 1;
  });

  global.cancelAnimationFrame = vi.fn();

  // Mock do requestIdleCallback
  global.requestIdleCallback = vi.fn().mockImplementation(callback => {
    setTimeout(callback, 0);
    return 1;
  });

  global.cancelIdleCallback = vi.fn();

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
    value: vi.fn(() => []),
    writable: true
  });

  Object.defineProperty(performance, 'now', {
    value: vi.fn(() => Date.now()),
    writable: true
  });
}

/**
 * Mock de elementos DOM para testes
 */
export function setupDOMMocks(): void {
  // Mock do focus/blur
  HTMLElement.prototype.focus = vi.fn();
  HTMLElement.prototype.blur = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();

  // Mock do getBoundingClientRect
  HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 100,
    height: 44,
    top: 0,
    left: 0,
    bottom: 44,
    right: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  }));

  // Mock do clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('')
    },
    writable: true
  });

  // Mock do userAgent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    writable: true
  });

  // Mock do language
  Object.defineProperty(navigator, 'language', {
    value: 'pt-BR',
    writable: true
  });

  // Mock do permissions API
  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: vi.fn().mockResolvedValue({ state: 'granted' })
    },
    writable: true
  });
}

/**
 * Configuração de acessibilidade para testes
 */
export function setupAccessibilityDefaults(): void {
  // Configurar preferências de acessibilidade
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(query => {
      const matches = {
        '(prefers-reduced-motion: reduce)': false,
        '(prefers-color-scheme: dark)': false,
        '(prefers-contrast: high)': false,
        '(forced-colors: active)': false
      };

      return {
        matches: matches[query as keyof typeof matches] || false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
    writable: true
  });

  // Configurar document.activeElement
  Object.defineProperty(document, 'activeElement', {
    value: document.body,
    writable: true,
    configurable: true
  });

  // Configurar direção do texto
  Object.defineProperty(document.documentElement, 'dir', {
    value: 'ltr',
    writable: true,
    configurable: true
  });

  // Configurar idioma
  Object.defineProperty(document.documentElement, 'lang', {
    value: 'pt-BR',
    writable: true,
    configurable: true
  });
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Utilitário para aguardar mudanças de foco
 */
export async function waitForFocusChange(
  expectedElement?: HTMLElement,
  timeout = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkFocus = () => {
      if (expectedElement && document.activeElement === expectedElement) {
        resolve();
        return;
      }

      if (!expectedElement && document.activeElement !== document.body) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Focus change timeout'));
        return;
      }

      setTimeout(checkFocus, 10);
    };

    checkFocus();
  });
}

/**
 * Utilitário para simular eventos de teclado
 */
export function createKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  key: string,
  options: KeyboardEventInit = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ...options
  });
}

/**
 * Utilitário para simular mudanças de viewport
 */
export function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });

  window.dispatchEvent(new Event('resize'));
}

/**
 * Utilitário para simular preferências do usuário
 */
export function setUserPreferences(preferences: {
  reducedMotion?: boolean;
  darkMode?: boolean;
  highContrast?: boolean;
  forcedColors?: boolean;
}): void {
  const { reducedMotion, darkMode, highContrast, forcedColors } = preferences;

  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(query => {
      const matches = {
        '(prefers-reduced-motion: reduce)': reducedMotion || false,
        '(prefers-color-scheme: dark)': darkMode || false,
        '(prefers-contrast: high)': highContrast || false,
        '(forced-colors: active)': forcedColors || false
      };

      return {
        matches: matches[query as keyof typeof matches] || false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
    writable: true
  });
}

// ============================================================================
// SETUP HOOKS
// ============================================================================

beforeAll(() => {
  setupBrowserMocks();
  setupDOMMocks();
  setupAccessibilityDefaults();
});

beforeEach(() => {
  // Reset do document.activeElement
  if (document.body) {
    document.body.focus();
  }

  // Limpar timers
  vi.clearAllTimers();

  // Reset de mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup do React Testing Library
  cleanup();

  // Reset de preferências
  setUserPreferences({});

  // Reset de viewport
  setViewport(1024, 768);
});

afterAll(() => {
  // Restaurar mocks globais
  vi.restoreAllMocks();
});

// ============================================================================
// EXPORTS
// ============================================================================

export {
    createKeyboardEvent, setupAccessibilityDefaults, setupBrowserMocks,
    setupDOMMocks, setUserPreferences, setViewport, waitForFocusChange
};
