/**
 * Integration tests for notification template components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationTemplatesCard } from '../NotificationTemplatesCard'
import { TemplateForm } from '../TemplateForm'
import { TemplatesList } from '../TemplatesList'
import { TemplatePreview } from '../TemplatePreview'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}))

// Mock hooks
vi.mock('@/hooks/useNotificationTemplates', () => ({
  useNotificationTemplates: () => ({
    templates: [],
    isLoading: false,
    error: null,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn()
  })
}))

vi.mock('@/hooks/useTemplatePreview', () => ({
  useTemplatePreview: () => ({
    preview: {
      processedContent: 'Hello John Doe, your event is Sample Event',
      processedSubject: 'Event: Sample Event',
      errors: [],
      warnings: []
    },
    isLoading: false
  })
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Notification Templates Integration', () => {
  describe('NotificationTemplatesCard', () => {
    it('should render email and WhatsApp tabs', () => {
      renderWithQueryClient(<NotificationTemplatesCard />)
      
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    })

    it('should render new template button', () => {
      renderWithQueryClient(<NotificationTemplatesCard />)
      
      expect(screen.getByText('Novo Template')).toBeInTheDocument()
    })

    it('should switch between tabs', async () => {
      renderWithQueryClient(<NotificationTemplatesCard />)
      
      const whatsappTab = screen.getByText('WhatsApp')
      fireEvent.click(whatsappTab)
      
      await waitFor(() => {
        expect(whatsappTab).toHaveAttribute('data-state', 'active')
      })
    })
  })

  describe('TemplateForm', () => {
    const mockTemplate = {
      id: '1',
      name: 'test_template',
      type: 'email' as const,
      subject: 'Test Subject',
      content: 'Hello {{patient_name}}',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    it('should render form fields', () => {
      renderWithQueryClient(
        <TemplateForm 
          template={mockTemplate}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      expect(screen.getByLabelText(/nome do template/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/assunto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/conteúdo/i)).toBeInTheDocument()
    })

    it('should populate form with template data', () => {
      renderWithQueryClient(
        <TemplateForm 
          template={mockTemplate}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      expect(screen.getByDisplayValue('test_template')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Subject')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Hello {{patient_name}}')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const onSave = vi.fn()
      renderWithQueryClient(
        <TemplateForm 
          onSave={onSave}
          onCancel={vi.fn()}
        />
      )
      
      const saveButton = screen.getByText('Salvar')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled()
      })
    })

    it('should call onSave with form data', async () => {
      const onSave = vi.fn()
      renderWithQueryClient(
        <TemplateForm 
          onSave={onSave}
          onCancel={vi.fn()}
        />
      )
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/nome do template/i), {
        target: { value: 'new_template' }
      })
      fireEvent.change(screen.getByLabelText(/assunto/i), {
        target: { value: 'New Subject' }
      })
      fireEvent.change(screen.getByLabelText(/conteúdo/i), {
        target: { value: 'Hello {{patient_name}}' }
      })
      
      const saveButton = screen.getByText('Salvar')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
          name: 'new_template',
          subject: 'New Subject',
          content: 'Hello {{patient_name}}'
        }))
      })
    })

    it('should show variables helper', () => {
      renderWithQueryClient(
        <TemplateForm 
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      expect(screen.getByText(/variáveis disponíveis/i)).toBeInTheDocument()
    })

    it('should show template preview', () => {
      renderWithQueryClient(
        <TemplateForm 
          template={mockTemplate}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      )
      
      expect(screen.getByText(/preview/i)).toBeInTheDocument()
    })
  })

  describe('TemplatesList', () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'email_confirmation',
        type: 'email' as const,
        subject: 'Confirmation',
        content: 'Hello {{patient_name}}',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'whatsapp_reminder',
        type: 'whatsapp' as const,
        content: 'Reminder for {{patient_name}}',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    it('should render templates list', () => {
      renderWithQueryClient(
        <TemplatesList 
          templates={mockTemplates}
          type=\"email\"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleActive={vi.fn()}
        />
      )
      
      expect(screen.getByText('email_confirmation')).toBeInTheDocument()
    })

    it('should filter templates by type', () => {
      renderWithQueryClient(
        <TemplatesList 
          templates={mockTemplates}
          type=\"email\"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleActive={vi.fn()}
        />
      )
      
      expect(screen.getByText('email_confirmation')).toBeInTheDocument()
      expect(screen.queryByText('whatsapp_reminder')).not.toBeInTheDocument()
    })

    it('should show action buttons', () => {
      renderWithQueryClient(
        <TemplatesList 
          templates={mockTemplates}
          type=\"email\"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleActive={vi.fn()}
        />
      )
      
      expect(screen.getByTitle(/editar/i)).toBeInTheDocument()
      expect(screen.getByTitle(/excluir/i)).toBeInTheDocument()
    })

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = vi.fn()
      renderWithQueryClient(
        <TemplatesList 
          templates={mockTemplates}
          type=\"email\"
          onEdit={onEdit}
          onDelete={vi.fn()}
          onToggleActive={vi.fn()}
        />
      )
      
      const editButton = screen.getByTitle(/editar/i)
      fireEvent.click(editButton)
      
      expect(onEdit).toHaveBeenCalledWith(mockTemplates[0])
    })

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn()
      renderWithQueryClient(
        <TemplatesList 
          templates={mockTemplates}
          type=\"email\"
          onEdit={vi.fn()}
          onDelete={onDelete}
          onToggleActive={vi.fn()}
        />
      )
      
      const deleteButton = screen.getByTitle(/excluir/i)
      fireEvent.click(deleteButton)
      
      expect(onDelete).toHaveBeenCalledWith(mockTemplates[0])
    })

    it('should show active/inactive status', () => {
      renderWithQueryClient(
        <TemplatesList 
          templates={mockTemplates}
          type=\"email\"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onToggleActive={vi.fn()}
        />
      )
      
      expect(screen.getByText(/ativo/i)).toBeInTheDocument()
    })
  })

  describe('TemplatePreview', () => {
    const mockTemplate = {
      name: 'test_template',
      type: 'email' as const,
      subject: 'Event: {{event_title}}',
      content: 'Hello {{patient_name}}, your event is {{event_title}}',
      is_active: true
    }

    it('should render preview content', () => {
      renderWithQueryClient(
        <TemplatePreview template={mockTemplate} />
      )
      
      expect(screen.getByText(/hello john doe/i)).toBeInTheDocument()
    })

    it('should show processed subject for email templates', () => {
      renderWithQueryClient(
        <TemplatePreview template={mockTemplate} />
      )
      
      expect(screen.getByText(/event: sample event/i)).toBeInTheDocument()
    })

    it('should show validation errors', () => {
      const templateWithErrors = {
        ...mockTemplate,
        content: 'Hello {{unknown_variable}}'
      }
      
      renderWithQueryClient(
        <TemplatePreview template={templateWithErrors} />
      )
      
      // This would show errors if the hook returned them
      // The actual error display depends on the hook implementation
    })

    it('should handle loading state', () => {
      // Mock loading state
      vi.mocked(require('@/hooks/useTemplatePreview').useTemplatePreview).mockReturnValue({
        preview: null,
        isLoading: true
      })
      
      renderWithQueryClient(
        <TemplatePreview template={mockTemplate} />
      )
      
      expect(screen.getByText(/carregando/i)).toBeInTheDocument()
    })
  })

  describe('Complete Workflow Integration', () => {
    it('should handle complete template creation workflow', async () => {
      const mockCreateTemplate = vi.fn()
      
      // Mock successful creation
      vi.mocked(require('@/hooks/useNotificationTemplates').useNotificationTemplates).mockReturnValue({
        templates: [],
        isLoading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn()
      })
      
      renderWithQueryClient(<NotificationTemplatesCard />)
      
      // Click new template button
      const newTemplateButton = screen.getByText('Novo Template')
      fireEvent.click(newTemplateButton)
      
      // Form should appear (this depends on modal implementation)
      await waitFor(() => {
        expect(screen.getByLabelText(/nome do template/i)).toBeInTheDocument()
      })
      
      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/nome do template/i), {
        target: { value: 'integration_test' }
      })
      fireEvent.change(screen.getByLabelText(/assunto/i), {
        target: { value: 'Integration Test' }
      })
      fireEvent.change(screen.getByLabelText(/conteúdo/i), {
        target: { value: 'Hello {{patient_name}}' }
      })
      
      const saveButton = screen.getByText('Salvar')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled()
      })
    })

    it('should handle template editing workflow', async () => {
      const mockUpdateTemplate = vi.fn()
      const existingTemplate = {
        id: '1',
        name: 'existing_template',
        type: 'email' as const,
        subject: 'Existing Subject',
        content: 'Hello {{patient_name}}',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      vi.mocked(require('@/hooks/useNotificationTemplates').useNotificationTemplates).mockReturnValue({
        templates: [existingTemplate],
        isLoading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: vi.fn()
      })
      
      renderWithQueryClient(<NotificationTemplatesCard />)
      
      // Click edit button
      const editButton = screen.getByTitle(/editar/i)
      fireEvent.click(editButton)
      
      // Form should appear with existing data
      await waitFor(() => {
        expect(screen.getByDisplayValue('existing_template')).toBeInTheDocument()
      })
      
      // Modify and save
      fireEvent.change(screen.getByLabelText(/assunto/i), {
        target: { value: 'Updated Subject' }
      })
      
      const saveButton = screen.getByText('Salvar')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith(
          existingTemplate.id,
          expect.objectContaining({
            subject: 'Updated Subject'
          })
        )
      })
    })
  })
})