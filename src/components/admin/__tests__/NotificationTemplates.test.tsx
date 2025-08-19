
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TemplatesList } from '../TemplatesList'
import { TemplateForm } from '../TemplateForm'
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates'

// Mock the hook
vi.mock('@/hooks/useNotificationTemplates')

const mockUseNotificationTemplates = vi.mocked(useNotificationTemplates)

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('NotificationTemplates', () => {
  const mockTemplates = [
    {
      id: '1',
      name: 'Test Template',
      subject: 'Test Subject',
      content: 'Test Content',
      type: 'email',
      category: 'registration',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  ]

  beforeEach(() => {
    mockUseNotificationTemplates.mockReturnValue({
      templates: mockTemplates,
      loading: false,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
      duplicateTemplate: vi.fn(),
    })
  })

  describe('TemplatesList', () => {
    it('renders templates list correctly', () => {
      renderWithQueryClient(<TemplatesList />)
      
      expect(screen.getByText('Test Template')).toBeInTheDocument()
      expect(screen.getByText('Test Subject')).toBeInTheDocument()
    })

    it('shows empty state when no templates', () => {
      mockUseNotificationTemplates.mockReturnValue({
        templates: [],
        loading: false,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        duplicateTemplate: vi.fn(),
      })

      renderWithQueryClient(<TemplatesList />)
      
      expect(screen.getByText(/nenhum template/i)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      mockUseNotificationTemplates.mockReturnValue({
        templates: [],
        loading: true,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
        duplicateTemplate: vi.fn(),
      })

      renderWithQueryClient(<TemplatesList />)
      
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })
  })

  describe('TemplateForm', () => {
    const mockOnSave = vi.fn()
    const mockOnCancel = vi.fn()

    const defaultProps = {
      onSave: mockOnSave,
      onCancel: mockOnCancel,
    }

    beforeEach(() => {
      mockOnSave.mockClear()
      mockOnCancel.mockClear()
    })

    it('renders form fields correctly', () => {
      renderWithQueryClient(<TemplateForm {...defaultProps} />)
      
      expect(screen.getByLabelText(/nome do template/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/assunto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/conteúdo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      renderWithQueryClient(<TemplateForm {...defaultProps} />)
      
      const saveButton = screen.getByRole('button', { name: /criar template/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    it('calls onSave with form data when valid', async () => {
      renderWithQueryClient(<TemplateForm {...defaultProps} />)
      
      fireEvent.change(screen.getByLabelText(/nome do template/i), {
        target: { value: 'New Template' }
      })
      fireEvent.change(screen.getByLabelText(/assunto/i), {
        target: { value: 'New Subject' }
      })
      fireEvent.change(screen.getByLabelText(/conteúdo/i), {
        target: { value: 'New Content' }
      })

      const saveButton = screen.getByRole('button', { name: /criar template/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'New Template',
          subject: 'New Subject', 
          content: 'New Content',
          type: 'email',
          category: 'registration',
          is_active: true
        })
      })
    })

    it('populates form when editing existing template', () => {
      const editTemplate = mockTemplates[0]
      
      renderWithQueryClient(
        <TemplateForm {...defaultProps} initialData={editTemplate} />
      )

      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Subject')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument()
    })

    it('calls onCancel when cancel button clicked', () => {
      renderWithQueryClient(<TemplateForm {...defaultProps} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })
})
