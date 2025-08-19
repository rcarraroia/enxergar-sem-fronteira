/**
 * Available variables for notification templates
 */

import { TemplateVariable } from '@/types/notificationTemplates'

// Email-specific variables (includes all variables)
export const EMAIL_VARIABLES: TemplateVariable[] = [
  // Patient variables
  {
    key: '{{patient_name}}',
    description: 'Nome completo do paciente',
    example: 'Maria Silva Santos',
    required: false,
    type: 'patient'
  },
  {
    key: '{{patient_email}}',
    description: 'Email do paciente',
    example: 'maria.silva@email.com',
    required: false,
    type: 'patient'
  },
  
  // Event variables
  {
    key: '{{event_title}}',
    description: 'Título do evento',
    example: 'Atendimento Oftalmológico Gratuito',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_date}}',
    description: 'Data do evento (formato brasileiro)',
    example: '22/08/2025',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_time}}',
    description: 'Horário do evento',
    example: '08:00 - 18:00',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_location}}',
    description: 'Nome do local do evento',
    example: 'Paróquia São José',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_address}}',
    description: 'Endereço completo do evento',
    example: 'Rua das Flores, 123 - Centro, Timóteo - MG',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_city}}',
    description: 'Cidade do evento',
    example: 'Timóteo',
    required: false,
    type: 'event'
  },
  
  // System variables
  {
    key: '{{confirmation_link}}',
    description: 'Link para confirmação de presença',
    example: 'https://enxergar.com.br/confirm/abc123',
    required: false,
    type: 'system'
  },
  {
    key: '{{unsubscribe_link}}',
    description: 'Link para descadastro de notificações',
    example: 'https://enxergar.com.br/unsubscribe/abc123',
    required: false,
    type: 'system'
  }
]

// SMS-specific variables (optimized for short messages)
export const SMS_VARIABLES: TemplateVariable[] = [
  // Patient variables
  {
    key: '{{patient_name}}',
    description: 'Nome completo do paciente',
    example: 'Maria Silva Santos',
    required: false,
    type: 'patient'
  },
  
  // Event variables
  {
    key: '{{event_title}}',
    description: 'Título do evento',
    example: 'Atendimento Oftalmológico Gratuito',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_date}}',
    description: 'Data do evento (formato brasileiro)',
    example: '22/08/2025',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_time}}',
    description: 'Horário do evento',
    example: '08:00 - 18:00',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_location}}',
    description: 'Nome do local do evento',
    example: 'Paróquia São José',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_address}}',
    description: 'Endereço completo do evento',
    example: 'Rua das Flores, 123 - Centro, Timóteo - MG',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_city}}',
    description: 'Cidade do evento',
    example: 'Timóteo',
    required: false,
    type: 'event'
  }
]

// WhatsApp-specific variables (excludes email-specific ones)
export const WHATSAPP_VARIABLES: TemplateVariable[] = [
  // Patient variables
  {
    key: '{{patient_name}}',
    description: 'Nome completo do paciente',
    example: 'Maria Silva Santos',
    required: false,
    type: 'patient'
  },
  
  // Event variables
  {
    key: '{{event_title}}',
    description: 'Título do evento',
    example: 'Atendimento Oftalmológico Gratuito',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_date}}',
    description: 'Data do evento (formato brasileiro)',
    example: '22/08/2025',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_time}}',
    description: 'Horário do evento',
    example: '08:00 - 18:00',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_location}}',
    description: 'Nome do local do evento',
    example: 'Paróquia São José',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_address}}',
    description: 'Endereço completo do evento',
    example: 'Rua das Flores, 123 - Centro, Timóteo - MG',
    required: true,
    type: 'event'
  },
  {
    key: '{{event_city}}',
    description: 'Cidade do evento',
    example: 'Timóteo',
    required: false,
    type: 'event'
  }
]

// All variables combined (for validation purposes)
export const ALL_VARIABLES: TemplateVariable[] = EMAIL_VARIABLES

// Variables grouped by category
export const VARIABLES_BY_CATEGORY = {
  patient: EMAIL_VARIABLES.filter(v => v.type === 'patient'),
  event: EMAIL_VARIABLES.filter(v => v.type === 'event'),
  system: EMAIL_VARIABLES.filter(v => v.type === 'system')
}

// Required variables for each template type
export const REQUIRED_VARIABLES = {
  email: EMAIL_VARIABLES.filter(v => v.required),
  whatsapp: WHATSAPP_VARIABLES.filter(v => v.required),
  sms: SMS_VARIABLES.filter(v => v.required)
}

// Variable validation map (for quick lookup)
export const VARIABLE_VALIDATION_MAP = EMAIL_VARIABLES.reduce((acc, variable) => {
  const key = variable.key.replace(/[{}]/g, '') // Remove braces for lookup
  acc[key] = variable
  return acc
}, {} as Record<string, TemplateVariable>)

// Helper functions for variable management
export const getVariablesForType = (type: 'email' | 'whatsapp' | 'sms'): TemplateVariable[] => {
  switch (type) {
    case 'email': return EMAIL_VARIABLES
    case 'whatsapp': return WHATSAPP_VARIABLES
    case 'sms': return SMS_VARIABLES
    default: return EMAIL_VARIABLES
  }
}

export const getRequiredVariablesForType = (type: 'email' | 'whatsapp' | 'sms'): TemplateVariable[] => {
  return REQUIRED_VARIABLES[type as keyof typeof REQUIRED_VARIABLES] || []
}

export const isValidVariable = (variableName: string): boolean => {
  return Object.prototype.hasOwnProperty.call(VARIABLE_VALIDATION_MAP, variableName)
}

export const getVariableInfo = (variableName: string): TemplateVariable | undefined => {
  return VARIABLE_VALIDATION_MAP[variableName]
}

// Template suggestions based on type
export const TEMPLATE_SUGGESTIONS = {
  email: {
    confirmation: [
      '{{patient_name}}',
      '{{event_title}}',
      '{{event_date}}',
      '{{event_time}}',
      '{{event_location}}',
      '{{event_address}}',
      '{{confirmation_link}}'
    ],
    reminder: [
      '{{patient_name}}',
      '{{event_title}}',
      '{{event_date}}',
      '{{event_time}}',
      '{{event_location}}',
      '{{event_address}}'
    ]
  },
  whatsapp: {
    confirmation: [
      '{{patient_name}}',
      '{{event_title}}',
      '{{event_date}}',
      '{{event_time}}',
      '{{event_location}}',
      '{{event_address}}'
    ],
    reminder: [
      '{{patient_name}}',
      '{{event_date}}',
      '{{event_time}}',
      '{{event_location}}'
    ]
  },
  sms: {
    confirmation: [
      '{{patient_name}}',
      '{{event_title}}',
      '{{event_date}}',
      '{{event_time}}',
      '{{event_location}}'
    ],
    reminder: [
      '{{patient_name}}',
      '{{event_date}}',
      '{{event_time}}',
      '{{event_location}}'
    ]
  }
}

// Variable formatting helpers
export const formatVariableForDisplay = (variable: TemplateVariable): string => {
  return `${variable.key} - ${variable.description}`
}

export const formatVariableExample = (variable: TemplateVariable): string => {
  return `${variable.key} → ${variable.example}`
}

// Variable categories for UI organization
export const VARIABLE_CATEGORIES = [
  {
    id: 'patient',
    name: 'Dados do Paciente',
    description: 'Informações pessoais do paciente',
    icon: '👤'
  },
  {
    id: 'event',
    name: 'Dados do Evento',
    description: 'Informações sobre o atendimento',
    icon: '📅'
  },
  {
    id: 'system',
    name: 'Sistema',
    description: 'Links e informações do sistema',
    icon: '🔗'
  }
] as const