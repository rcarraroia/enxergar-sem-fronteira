/**
 * MÓDULO DE MENSAGENS - TIPOS TYPESCRIPT
 */

export type MessageChannel = "email" | "sms" | "whatsapp"
export type RecipientType = "patient" | "promoter" | "donor" | "admin"
export type MessageStatus = "pending" | "sent" | "delivered" | "failed" | "read"
export type EventType = "sent" | "delivered" | "failed" | "webhook_received" | "retry"

// Template de mensagem
export interface MessageTemplate {
  id: string
  name: string
  description?: string
  channel: MessageChannel
  subject?: string // Para emails
  content: string
  variables: string[] // Array de variáveis disponíveis como ['nome', 'data_consulta']
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

// Regra de automação
export interface AutomationRule {
  id: string
  name: string
  description?: string
  trigger_event: string // ex: 'on_registration_success'
  conditions: Record<string, any> // Condições para ativar
  template_id: string
  delay_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  template?: MessageTemplate
}

// Mensagem
export interface Message {
  id: string
  channel: MessageChannel
  recipient_type: RecipientType
  recipient_id?: string
  recipient_contact: string
  subject?: string
  content: string
  template_id?: string
  automation_rule_id?: string
  
  // Status
  status: MessageStatus
  scheduled_for?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  
  // Controle de erro
  provider_response?: Record<string, any>
  error_message?: string
  retry_count: number
  max_retries: number
  
  // Contexto
  context: Record<string, any>
  variables: Record<string, any>
  
  created_at: string
  updated_at: string
  
  // Relacionamentos
  template?: MessageTemplate
  automation_rule?: AutomationRule
  logs?: MessageLog[]
}

// Log de mensagem
export interface MessageLog {
  id: string
  message_id: string
  event_type: EventType
  event_data: Record<string, any>
  provider?: string
  webhook_data?: Record<string, any>
  created_at: string
}

// Dados para criação de template
export interface CreateTemplateData {
  name: string
  description?: string
  channel: MessageChannel
  subject?: string
  content: string
  variables?: string[]
}

// Dados para criação de regra de automação
export interface CreateAutomationRuleData {
  name: string
  description?: string
  trigger_event: string
  conditions?: Record<string, any>
  template_id: string
  delay_minutes?: number
}

// Dados para envio de mensagem
export interface SendMessageData {
  channel: MessageChannel
  recipient_type: RecipientType
  recipient_id?: string
  recipient_contact: string
  subject?: string
  content?: string
  template_id?: string
  variables?: Record<string, any>
  context?: Record<string, any>
  scheduled_for?: string
}

// Dados para envio em massa
export interface BulkSendData {
  channel: MessageChannel
  recipient_type: RecipientType
  recipients: {
    contact: string
    name?: string
    variables?: Record<string, any>
  }[]
  subject?: string
  content: string
  template_id?: string
  scheduled_for?: string
  context?: Record<string, any>
}

// Filtros para busca de mensagens
export interface MessageFilters {
  channel?: MessageChannel
  status?: MessageStatus
  recipient_type?: RecipientType
  date_from?: string
  date_to?: string
  template_id?: string
  search?: string
}

// Estatísticas de mensagens
export interface MessageStats {
  total_sent: number
  total_delivered: number
  total_failed: number
  total_pending: number
  delivery_rate: number
  failure_rate: number
  by_channel: Record<MessageChannel, {
    sent: number
    delivered: number
    failed: number
    pending: number
  }>
  by_recipient_type: Record<RecipientType, {
    sent: number
    delivered: number
    failed: number
    pending: number
  }>
}

// Eventos de trigger disponíveis
export const TRIGGER_EVENTS = {
  // Pacientes
  ON_REGISTRATION_SUCCESS: "on_registration_success",
  ON_APPOINTMENT_CREATED: "on_appointment_created",
  ON_APPOINTMENT_24H_BEFORE: "on_appointment_24h_before",
  ON_APPOINTMENT_CANCELLED: "on_appointment_cancelled",
  
  // Doadores
  ON_DONATION_RECEIVED: "on_donation_received",
  ON_DONATION_FAILED: "on_donation_failed",
  
  // Campanhas
  ON_CAMPAIGN_COMPLETION: "on_campaign_completion",
  ON_CAMPAIGN_MILESTONE: "on_campaign_milestone",
  
  // Promotores
  ON_PROMOTER_REGISTERED: "on_promoter_registered",
  ON_EVENT_COMPLETED: "on_event_completed"
} as const;

export type TriggerEvent = typeof TRIGGER_EVENTS[keyof typeof TRIGGER_EVENTS]

// Variáveis padrão disponíveis por contexto
export const DEFAULT_VARIABLES = {
  patient: ["nome", "email", "telefone", "data_consulta", "local_consulta"],
  promoter: ["nome", "email", "evento", "data_evento", "local_evento"],
  donor: ["nome", "email", "valor_doacao", "campanha", "data_doacao"],
  admin: ["nome", "email"]
} as const;