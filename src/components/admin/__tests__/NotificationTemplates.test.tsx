
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TemplateForm } from "@/components/admin/TemplateForm";

// Mock do Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockTemplate = {
  id: "1",
  name: "Template Teste",
  description: "Descrição do template",
  type: "email" as const,
  subject: "Assunto do email",
  content: "Conteúdo do template",
  variables: ["patient_name", "event_date"],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
};

describe("TemplateForm", () => {
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnCancel = vi.fn();
  });

  it("renderiza o componente temporário corretamente", () => {
    render(
      <TestWrapper>
        <TemplateForm
          type="email"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByText("Template Form Temporariamente Desabilitado")).toBeInTheDocument();
    expect(screen.getByText("O formulário de templates está temporariamente simplificado para evitar erros de renderização. A versão completa será implementada no Admin V2.")).toBeInTheDocument();
  });

  it("chama onCancel quando botão Voltar é clicado", () => {
    render(
      <TestWrapper>
        <TemplateForm
          type="email"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByText("Voltar");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("renderiza com template existente", () => {
    render(
      <TestWrapper>
        <TemplateForm
          template={mockTemplate}
          type="sms"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByText("Template Form Temporariamente Desabilitado")).toBeInTheDocument();
  });
});
