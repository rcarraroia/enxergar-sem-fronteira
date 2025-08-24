/**
 * Types and interfaces for the Notification Templates system
 */

// Base notification template interface
export interface NotificationTemplate {
  id: string
  name: string
  type: "email" | "whatsapp" | "sms"
  subject?: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Input interface for creating/updating templates
export interface NotificationTemplateInput {
  name: string
  type: "email" | "whatsapp" | "sms"
  subject?: string
  content: string
  is_active: boolean
}

// Template variable definition
export interface TemplateVariable {
  key: string
  description: string
  example: string
  required: boolean
  type: "patient" | "event" | "system"
}

// Template validation rules
export interface TemplateValidationRules {
  name: {
    required: boolean
    minLength: number
    maxLength: number
    pattern: RegExp
    message: string
  }
  subject: {
    required: (type: string) => boolean
    maxLength: number
    message: string
  }
  content: {
    required: boolean
    minLength: number
    maxLength: number
    message: string
  }
}

// Error types for template operations
export enum TemplateErrorType {
  VALIDATION_ERROR = "validation_error",
  DUPLICATE_NAME = "duplicate_name",
  TEMPLATE_NOT_FOUND = "template_not_found",
  PERMISSION_DENIED = "permission_denied",
  PROCESSING_ERROR = "processing_error",
  VARIABLE_ERROR = "variable_error"
}

// Template error interface
export interface TemplateError {
  type: TemplateErrorType
  message: string
  field?: string
  details?: string
}

// Sample data for template preview
export interface TemplateSampleData {
  patient_name: string
  patient_email: string
  event_title: string
  event_date: string
  event_time: string
  event_location: string
  event_address: string
  event_city: string
  confirmation_link?: string
  unsubscribe_link?: string
}

// Template processing result
export interface TemplateProcessingResult {
  success: boolean
  processedContent: string
  processedSubject?: string
  errors: TemplateError[]
  warnings: string[]
}

// Template statistics
export interface TemplateStats {
  total: number
  active: number
  inactive: number
  email: number
  whatsapp: number
  sms: number
  lastUpdated?: string
}

// Form state for template editing
export interface TemplateFormState {
  template: NotificationTemplateInput
  isValid: boolean
  errors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
}

// Template list filters
export interface TemplateFilters {
  type?: "email" | "whatsapp" | "sms" | "all"
  status?: "active" | "inactive" | "all"
  search?: string
}

// Template operation types
export type TemplateOperation = "create" | "edit" | "duplicate" | "delete" | "toggle"

// Hook return types
export interface UseNotificationTemplatesReturn {
  templates: NotificationTemplate[]
  loading: boolean
  error: TemplateError | null
  createTemplate: (template: NotificationTemplateInput) => Promise<NotificationTemplate>
  updateTemplate: (id: string, template: Partial<NotificationTemplateInput>) => Promise<NotificationTemplate>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<NotificationTemplate>
  toggleTemplate: (id: string) => Promise<NotificationTemplate>
  refetch: () => Promise<void>
}

export interface UseTemplatePreviewReturn {
  preview: TemplateProcessingResult | null
  loading: boolean
  error: TemplateError | null
  generatePreview: (template: NotificationTemplateInput, sampleData?: TemplateSampleData) => Promise<void>
  clearPreview: () => void
}

// Component prop types
export interface NotificationTemplatesCardProps {
  className?: string
}

export interface TemplateFormProps {
  template?: NotificationTemplate
  type: "email" | "whatsapp" | "sms"
  onSave: (template: NotificationTemplateInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface TemplatePreviewProps {
  template: NotificationTemplateInput
  sampleData?: TemplateSampleData
  className?: string
}

export interface VariablesHelperProps {
  type: "email" | "whatsapp" | "sms"
  onVariableClick: (variable: string) => void
  className?: string
}

export interface TemplatesListProps {
  type: "email" | "whatsapp" | "sms"
  templates: NotificationTemplate[]
  onEdit: (template: NotificationTemplate) => void
  onDuplicate: (template: NotificationTemplate) => void
  onDelete: (template: NotificationTemplate) => void
  onToggle: (template: NotificationTemplate) => void
  loading?: boolean
}

// Constants
export const TEMPLATE_TYPES = ["email", "whatsapp", "sms"] as const;
export const TEMPLATE_STATUSES = ["active", "inactive"] as const;
export const VARIABLE_TYPES = ["patient", "event", "system"] as const;

// Default sample data for previews
export const DEFAULT_SAMPLE_DATA: TemplateSampleData = {
  patient_name: "Maria Silva Santos",
  patient_email: "maria.silva@email.com",
  event_title: "Atendimento Oftalmológico Gratuito",
  event_date: "22/08/2025",
  event_time: "08:00 - 18:00",
  event_location: "Paróquia São José",
  event_address: "Rua das Flores, 123 - Centro, Timóteo - MG",
  event_city: "Timóteo",
  confirmation_link: "https://enxergar.com.br/confirm/abc123",
  unsubscribe_link: "https://enxergar.com.br/unsubscribe/abc123"
};