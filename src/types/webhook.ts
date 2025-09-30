/**
 * TIPOS PARA O SISTEMA DE WEBHOOKS N8N
 */

export interface WebhookPayload {
  registration_id: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface WebhookResponse {
  success: boolean;
  status?: number;
  message?: string;
  data?: unknown;
}

export interface WebhookConfig {
  url: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelamber;
}

export interface RegistrationDetails {
  id: string;
  patient_name: string;
  phone: string;
  date: string;
  start_time: string;
  event_name: string;
  event_location: string;
  event_city: string;
}

export interface WebhookNotification {
  id: string;
  registration_id: string;
  notification_type: 'confirmation' | 'delivery' | 'donation' | 'event_reminder';
  sent_at: string;
  status: 'sent' | 'failed' | 'pending' | 'scheduled';
  message_content?: string;
  phone_number?: string;
  created_at: string;
}

export interface ScheduledWebhook {
  id: string;
  registration_id: string;
  webhook_type: 'donation' | 'event_reminder';
  scheduled_for: string;
  executed_at?: string;
  status: 'scheduled' | 'executed' | 'failed' | 'cancelled';
  created_at: string;
}

export interface WebhookTestResult {
  [webhookName: string]: WebhookResponse;
}
