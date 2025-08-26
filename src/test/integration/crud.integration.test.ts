/**
 * Testes de Integração - Operações CRUD
 *
 * Testa operações CRUD principais do sistema:
 * - Criação de pacientes
 * - Criação de eventos
 * - Registrações
 * - Validações de dados
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/hooks/useAuth";
import { PatientRegistrationForm } from "@/components/forms/PatientRegistrationForm";

// Mock do Supabase
const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    getSession: vi.fn(),
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn()
        })),
        maybeSingle: vi.fn(),
        single: vi.fn()
      })),
      maybeSingle: vi.fn(),
      single: vi.fn()
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    delete: vi.fn(() => ({
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
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}));

// Mock do router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ eventId: "event-123" })
  };
});

// Wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe("Testes de Integração - Operações CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock sessão de usuário padrão
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-123", email: "test@test.com" },
          access_token: "token-123"
        }
      },
      error: null
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Criação de Pacientes", () => {
    it("deve criar paciente com dados válidos", async () => {
      // Arrange
      const user = userEvent.setup();

      // Mock evento válido
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "event-123",
                title: "Evento Teste",
                status: "active",
                registration_open: true
              },
              error: null
            })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "patient-123",
                nome: "João Silva",
                cpf: "123.456.789-00",
                email: "joao@test.com"
              },
              error: null
            })
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/cpf/i), "12345678900");
      await user.type(screen.getByLabelText(/email/i), "joao@test.com");
      await user.type(screen.getByLabelText(/telefone/i), "11999887766");

      // Aceitar termos
      const consentCheckbox = screen.getByRole("checkbox", { name: /aceito os termos/i });
      await user.click(consentCheckbox);

      // Submeter formulário
      const submitButton = screen.getByRole("button", { name: /confirmar inscrição/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith("patients");
      });

      // Verificar se insert foi chamado com dados corretos
      const insertCall = mockSupabase.from().insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: "João Silva",
          cpf: "12345678900",
          email: "joao@test.com",
          telefone: "11999887766"
        })
      );
    });

    it("deve validar CPF inválido", async () => {
      // Arrange
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Act - inserir CPF inválido
      await user.type(screen.getByLabelText(/cpf/i), "11111111111");
      await user.tab(); // Sair do campo para trigger validação

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
      });
    });

    it("deve validar email inválido", async () => {
      // Arrange
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Act - inserir email inválido
      await user.type(screen.getByLabelText(/email/i), "email-invalido");
      await user.tab(); // Sair do campo para trigger validação

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it("deve tratar erro de duplicação de CPF", async () => {
      // Arrange
      const user = userEvent.setup();

      // Mock erro de CPF duplicado
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "event-123",
                title: "Evento Teste",
                status: "active",
                registration_open: true
              },
              error: null
            })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockRejectedValue({
              code: "23505", // Código de violação de unique constraint
              message: "duplicate key value violates unique constraint"
            })
          }))
        }))
      });

      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Preencher formulário com CPF que já existe
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/cpf/i), "12345678900");
      await user.type(screen.getByLabelText(/email/i), "joao@test.com");
      await user.type(screen.getByLabelText(/telefone/i), "11999887766");

      const consentCheckbox = screen.getByRole("checkbox", { name: /aceito os termos/i });
      await user.click(consentCheckbox);

      const submitButton = screen.getByRole("button", { name: /confirmar inscrição/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/cpf já cadastrado/i)).toBeInTheDocument();
      });
    });
  });

  describe("Validação de Eventos", () => {
    it("deve bloquear inscrição em evento inativo", async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "event-123",
                title: "Evento Inativo",
                status: "inactive",
                registration_open: false
              },
              error: null
            })
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/inscrições encerradas/i)).toBeInTheDocument();
      });

      // Verificar se formulário está desabilitado
      const submitButton = screen.getByRole("button", { name: /confirmar inscrição/i });
      expect(submitButton).toBeDisabled();
    });

    it("deve bloquear inscrição em evento lotado", async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "event-123",
                title: "Evento Lotado",
                status: "active",
                registration_open: true,
                max_participants: 100,
                current_participants: 100
              },
              error: null
            })
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/evento lotado/i)).toBeInTheDocument();
      });
    });
  });

  describe("Operações de Registração", () => {
    it("deve criar registração após criar paciente", async () => {
      // Arrange
      const user = userEvent.setup();

      let insertCallCount = 0;
      mockSupabase.from.mockImplementation((table) => {
        if (table === "events") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "event-123",
                    title: "Evento Teste",
                    status: "active",
                    registration_open: true
                  },
                  error: null
                })
              }))
            }))
          };
        }

        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockImplementation(() => {
                insertCallCount++;
                if (insertCallCount === 1) {
                  // Primeira chamada - criar paciente
                  return Promise.resolve({
                    data: {
                      id: "patient-123",
                      nome: "João Silva",
                      cpf: "12345678900"
                    },
                    error: null
                  });
                } else {
                  // Segunda chamada - criar registração
                  return Promise.resolve({
                    data: {
                      id: "registration-123",
                      patient_id: "patient-123",
                      event_id: "event-123"
                    },
                    error: null
                  });
                }
              })
            }))
          }))
        };
      });

      // Act
      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Preencher e submeter formulário
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/cpf/i), "12345678900");
      await user.type(screen.getByLabelText(/email/i), "joao@test.com");
      await user.type(screen.getByLabelText(/telefone/i), "11999887766");

      const consentCheckbox = screen.getByRole("checkbox", { name: /aceito os termos/i });
      await user.click(consentCheckbox);

      const submitButton = screen.getByRole("button", { name: /confirmar inscrição/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(insertCallCount).toBe(2); // Paciente + Registração
      });
    });
  });

  describe("Tratamento de Erros de Rede", () => {
    it("deve tratar erro de conexão", async () => {
      // Arrange
      const user = userEvent.setup();

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockRejectedValue(new Error("Network error"))
          }))
        }))
      });

      // Act
      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument();
      });
    });

    it("deve permitir retry após erro", async () => {
      // Arrange
      const user = userEvent.setup();

      let attemptCount = 0;
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockImplementation(() => {
              attemptCount++;
              if (attemptCount === 1) {
                return Promise.reject(new Error("Network error"));
              }
              return Promise.resolve({
                data: {
                  id: "event-123",
                  title: "Evento Teste",
                  status: "active",
                  registration_open: true
                },
                error: null
              });
            })
          }))
        }))
      });

      render(
        <TestWrapper>
          <PatientRegistrationForm />
        </TestWrapper>
      );

      // Aguardar erro aparecer
      await waitFor(() => {
        expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument();
      });

      // Clicar em tentar novamente
      const retryButton = screen.getByRole("button", { name: /tentar novamente/i });
      await user.click(retryButton);

      // Assert - deve carregar com sucesso na segunda tentativa
      await waitFor(() => {
        expect(screen.queryByText(/erro de conexão/i)).not.toBeInTheDocument();
      });
    });
  });
});
