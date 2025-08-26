/**
 * Testes de Integração - Sistema de Autenticação
 *
 * Testa fluxos completos de autenticação incluindo:
 * - Login/logout
 * - Verificação de roles
 * - Proteção de rotas
 * - Persistência de sessão
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock do Supabase
const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    })),
    insert: vi.fn(),
    update: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Componente de teste para rotas protegidas
const TestProtectedComponent = () => <div>Protected Content</div>;
const TestAdminComponent = () => <div>Admin Panel</div>;

// Wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe("Testes de Integração - Autenticação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Fluxo de Login", () => {
    it("deve permitir login com credenciais válidas", async () => {
      // Arrange
      const mockUser = {
        id: "user-123",
        email: "admin@test.com",
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: "token-123"
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      // Mock para role de admin
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "user-123", role: "admin", status: "active" },
                error: null
              })
            }))
          }))
        }))
      });

      // Act & Assert
      render(
        <TestWrapper>
          <ProtectedRoute requireAdmin>
            <TestAdminComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Aguardar carregamento
      await waitFor(() => {
        expect(screen.queryByText("Verificando permissões...")).not.toBeInTheDocument();
      });

      // Verificar se o conteúdo admin é exibido
      await waitFor(() => {
        expect(screen.getByText("Painel Admin")).toBeInTheDocument();
      });
    });

    it("deve bloquear acesso para usuários não autenticados", async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute>
            <TestProtectedComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByText("Conteúdo Protegido")).not.toBeInTheDocument();
      });
    });

    it("deve bloquear acesso admin para usuários comuns", async () => {
      // Arrange
      const mockUser = {
        id: "user-456",
        email: "user@test.com",
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: "token-456"
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Mock para usuário comum (não encontrado na tabela organizers)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            }))
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute requireAdmin>
            <TestAdminComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Acesso Negado")).toBeInTheDocument();
        expect(screen.getByText("Você não tem permissão para acessar esta página.")).toBeInTheDocument();
      });
    });
  });

  describe("Verificação de Roles", () => {
    it("deve permitir acesso para organizadores em rotas de organizador", async () => {
      // Arrange
      const mockUser = {
        id: "org-123",
        email: "organizer@test.com",
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: "token-org"
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Mock para organizador
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "org-123", role: "organizer", status: "active" },
                error: null
              })
            }))
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute requireOrganizer>
            <div>Painel Organizador</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Painel Organizador")).toBeInTheDocument();
      });
    });

    it("deve permitir acesso admin em rotas de organizador", async () => {
      // Arrange
      const mockUser = {
        id: "admin-123",
        email: "admin@test.com",
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: "token-admin"
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Mock para admin
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "admin-123", role: "admin", status: "active" },
                error: null
              })
            }))
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute requireOrganizer>
            <div>Painel Organizador</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Painel Organizador")).toBeInTheDocument();
      });
    });
  });

  describe("Persistência de Sessão", () => {
    it("deve manter usuário logado após recarregar página", async () => {
      // Arrange
      const mockUser = {
        id: "user-persistent",
        email: "persistent@test.com",
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: "persistent-token"
      };

      // Simular sessão existente
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "user-persistent", role: "organizer", status: "active" },
                error: null
              })
            }))
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute>
            <TestProtectedComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Conteúdo Protegido")).toBeInTheDocument();
      });

      // Verificar se getSession foi chamado
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve tratar erro de sessão graciosamente", async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" }
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute>
            <TestProtectedComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByText("Conteúdo Protegido")).not.toBeInTheDocument();
      });
    });

    it("deve tratar erro de verificação de role", async () => {
      // Arrange
      const mockUser = {
        id: "user-error",
        email: "error@test.com",
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: "error-token"
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Mock erro na verificação de role
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error" }
              })
            }))
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <ProtectedRoute requireAdmin>
            <TestAdminComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      // Assert - deve tratar como usuário comum em caso de erro
      await waitFor(() => {
        expect(screen.getByText("Acesso Negado")).toBeInTheDocument();
      });
    });
  });
});
