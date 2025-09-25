/**
 * Configuração para Testes de Integração
 *
 * Setup global para testes de integração, incluindo:
 * - Configuração de ambiente de teste
 * - Mocks globais
 * - Utilitários de teste
 * - Limpeza entre testes
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

// ============================================================================
// CONFIGURAÇÃO GLOBAL
// ============================================================================

beforeAll(() => {
  // Configurar variáveis de ambiente para testes
  process.env.NODE_ENV = "test";
  process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
  process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";

  // Configurar timezone para testes consistentes
  process.env.TZ = "America/Sao_Paulo";

  // Suprimir warnings específicos durante testes
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      (
        args[0].includes("React Router") ||
        args[0].includes("validateDOMNesting") ||
        args[0].includes("Warning: ReactDOM.render")
      )
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  // Restaurar console.warn
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Limpar todos os mocks antes de cada teste
  vi.clearAllMocks();

  // Configurar mocks padrão para cada teste
  setupDefaultMocks();
});

afterEach(() => {
  // Limpar DOM após cada teste
  cleanup();

  // Limpar timers
  vi.clearAllTimers();

  // Restaurar implementações reais
  vi.restoreAllMocks();
});

// ============================================================================
// MOCKS PADRÃO
// ============================================================================

function setupDefaultMocks() {
  // Mock do IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock do ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock do matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
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
  });

  // Mock do localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock
  });

  // Mock do sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorageMock
  });

  // Mock do fetch
  global.fetch = vi.fn();

  // Mock do URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => "mocked-url");
  global.URL.revokeObjectURL = vi.fn();
}

// ============================================================================
// UTILITÁRIOS DE TESTE
// ============================================================================

/**
 * Cria um mock do Supabase com configurações específicas
 */
export function createSupabaseMock(config: {
  user?: any;
  session?: any;
  error?: any;
  data?: any;
}) {
  return {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn().mockResolvedValue({
        data: { session: config.session || null },
        error: config.error || null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: config.user || null },
        error: config.error || null
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: config.data || null,
              error: config.error || null
            }),
            single: vi.fn().mockResolvedValue({
              data: config.data || null,
              error: config.error || null
            })
          })),
          maybeSingle: vi.fn().mockResolvedValue({
            data: config.data || null,
            error: config.error || null
          }),
          single: vi.fn().mockResolvedValue({
            data: config.data || null,
            error: config.error || null
          })
        })),
        maybeSingle: vi.fn().mockResolvedValue({
          data: config.data || null,
          error: config.error || null
        }),
        single: vi.fn().mockResolvedValue({
          data: config.data || null,
          error: config.error || null
        })
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: config.data || null,
            error: config.error || null
          })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: config.data || null,
              error: config.error || null
            })
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: config.data || null,
          error: config.error || null
        })
      }))
    }))
  };
}

/**
 * Cria dados de teste para usuários
 */
export function createTestUser(role: "admin" | "organizer" | "user" = "user", id = "test-user") {
  return {
    id,
    email: `${role}@test.com`,
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Cria dados de teste para eventos
 */
export function createTestEvent(overrides: any = {}) {
  return {
    id: "test-event",
    title: "Evento de Teste",
    description: "Descrição do evento de teste",
    status: "active",
    is_public: true,
    registration_open: true,
    max_participants: 100,
    current_participants: 0,
    organizer_id: "test-organizer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Cria dados de teste para pacientes
 */
export function createTestPatient(overrides: any = {}) {
  return {
    id: "test-patient",
    nome: "João Silva",
    cpf: "12345678900",
    email: "joao@test.com",
    telefone: "11999887766",
    data_nascimento: "1990-01-01",
    consentimento_lgpd: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Cria dados de teste para registrações
 */
export function createTestRegistration(overrides: any = {}) {
  return {
    id: "test-registration",
    patient_id: "test-patient",
    event_id: "test-event",
    organizer_id: "test-organizer",
    status: "confirmed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Aguarda por um período específico (útil para testes assíncronos)
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simula erro de rede
 */
export function createNetworkError(message = "Network error") {
  const error = new Error(message);
  error.name = "NetworkError";
  return error;
}

/**
 * Simula erro do Supabase
 */
export function createSupabaseError(code: string, message: string) {
  return {
    code,
    message,
    details: null,
    hint: null
  };
}

/**
 * Utilitário para testar acessibilidade básica
 */
export function expectAccessibleElement(element: HTMLElement) {
  // Verificar se tem role ou aria-label
  const hasRole = element.getAttribute("role");
  const hasAriaLabel = element.getAttribute("aria-label");
  const hasAriaLabelledBy = element.getAttribute("aria-labelledby");

  if (!hasRole && !hasAriaLabel && !hasAriaLabelledBy) {
    throw new Error("Element should have role, aria-label, or aria-labelledby for accessibility");
  }
}

/**
 * Utilitário para verificar se elemento está visível
 */
export function expectVisible(element: HTMLElement) {
  expect(element).toBeVisible();
  expect(element).not.toHaveStyle("display: none");
  expect(element).not.toHaveStyle("visibility: hidden");
}

/**
 * Utilitário para verificar se elemento está oculto
 */
export function expectHidden(element: HTMLElement) {
  expect(element).not.toBeVisible();
}

// ============================================================================
// CONFIGURAÇÕES DE TESTE ESPECÍFICAS
// ============================================================================

/**
 * Configuração para testes que precisam de autenticação
 */
export function setupAuthenticatedTest(userRole: "admin" | "organizer" | "user" = "user") {
  const user = createTestUser(userRole);
  const session = {
    user,
    access_token: `token-${user.id}`,
    expires_at: Date.now() + 3600000 // 1 hora
  };

  return createSupabaseMock({
    user,
    session,
    data: userRole === "admin" || userRole === "organizer" ? {
      id: user.id,
      role: userRole,
      status: "active"
    } : null
  });
}

/**
 * Configuração para testes que precisam de dados específicos
 */
export function setupDataTest(data: any) {
  return createSupabaseMock({ data });
}

/**
 * Configuração para testes de erro
 */
export function setupErrorTest(error: any) {
  return createSupabaseMock({ error });
}
