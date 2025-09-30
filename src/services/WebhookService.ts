/**
 * SERVIÇO DE WEBHOOKS N8N
 * Responsável por disparar webhooks para automação N8N
 * Implementa tratamento não-bloqueante e logging para auditoria
 */

import { supabase } from "@/integrations/supabase/client";

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
  retryDelay?: number;
}

export class WebhookService {
  private readonly defaultTimeout = 5000; // 5 segundos
  private readonly defaultRetryAttempts = 3;
  private readonly defaultRetryDelay = 1000; // 1 segundo

  constructor() {
    console.log("🔗 [WebhookService] Serviço inicializado");
  }

  /**
   * Envia webhook de confirmação de inscrição
   */
  async sendConfirmationWebhook(registrationId: string): Promise<WebhookResponse> {
    const webhookUrl = import.meta.env.VITE_WEBHOOK_CONFIRMATION_URL;

    if (!webhookUrl) {
      console.log("⚠️ [WebhookService] VITE_WEBHOOK_CONFIRMATION_URL não configurada - webhook desabilitado");
      return { success: true, message: "Webhook desabilitado" };
    }

    try {
      console.log("📤 [WebhookService] Enviando webhook de confirmação:", registrationId);

      // Buscar dados da inscrição usando a função existente
      const registrationData = await this.getRegistrationDetails(registrationId);

      if (!registrationData) {
        throw new Error("Dados da inscrição não encontrados");
      }

      const payload: WebhookPayload = {
        registration_id: registrationId,
        timestamp: new Date().toISOString(),
        ...registrationData
      };

      const response = await this.sendWebhook({
        url: webhookUrl,
        timeout: this.defaultTimeout,
        retryAttempts: this.defaultRetryAttempts,
        retryDelay: this.defaultRetryDelay
      }, payload);

      // Registrar na tabela de notificações
      await this.logNotification(registrationId, 'confirmation', response.success ? 'sent' : 'failed', payload, response.message);

      console.log("✅ [WebhookService] Webhook de confirmação enviado:", registrationId);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("❌ [WebhookService] Erro no webhook de confirmação:", registrationId, errorMessage);

      // Registrar erro na tabela de notificações
      await this.logNotification(registrationId, 'confirmation', 'failed', { registration_id: registrationId }, errorMessage);

      // Retornar sucesso para não bloquear o fluxo principal
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Envia webhook de notificação de entrega
   */
  async sendDeliveryWebhook(registrationId: string, deliveryDate: Date): Promise<WebhookResponse> {
    const webhookUrl = import.meta.env.VITE_WEBHOOK_DELIVERY_URL;

    if (!webhookUrl) {
      console.log("⚠️ [WebhookService] VITE_WEBHOOK_DELIVERY_URL não configurada - webhook desabilitado");
      return { success: true, message: "Webhook desabilitado" };
    }

    try {
      console.log("📤 [WebhookService] Enviando webhook de entrega:", registrationId);

      const payload: WebhookPayload = {
        registration_id: registrationId,
        delivery_date: deliveryDate.toISOString(),
        timestamp: new Date().toISOString()
      };

      const response = await this.sendWebhook({
        url: webhookUrl,
        timeout: this.defaultTimeout,
        retryAttempts: this.defaultRetryAttempts,
        retryDelay: this.defaultRetryDelay
      }, payload);

      // Registrar na tabela de notificações
      await this.logNotification(registrationId, 'delivery', response.success ? 'sent' : 'failed', payload, response.message);

      console.log("✅ [WebhookService] Webhook de entrega enviado:", registrationId);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("❌ [WebhookService] Erro no webhook de entrega:", registrationId, errorMessage);

      // Registrar erro na tabela de notificações
      await this.logNotification(registrationId, 'delivery', 'failed', { registration_id: registrationId }, errorMessage);

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Agenda webhook de doação para ser enviado após 48h
   */
  async scheduleDonationWebhook(registrationId: string, baseDate: Date): Promise<WebhookResponse> {
    try {
      console.log("⏰ [WebhookService] Agendando webhook de doação:", registrationId);

      const delayHours = parseInt(import.meta.env.WEBHOOK_DONATION_DELAY_HOURS || '48');
      const scheduledDate = new Date(baseDate);
      scheduledDate.setHours(scheduledDate.getHours() + delayHours);

      // Por enquanto, registrar como agendado na tabela de notificações
      await this.logNotification(registrationId, 'donation', 'scheduled', {
        registration_id: registrationId,
        scheduled_for: scheduledDate.toISOString()
      });

      console.log(`✅ [WebhookService] Webhook de doação agendado para ${scheduledDate.toISOString()}`);

      // TODO: Implementar sistema de agendamento real na Fase 2
      console.log("⚠️ [WebhookService] Sistema de agendamento será implementado na Fase 2");

      return { success: true, message: `Agendado para ${scheduledDate.toISOString()}` };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("❌ [WebhookService] Erro ao agendar webhook de doação:", registrationId, errorMessage);

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Método genérico para enviar webhook com retry
   */
  private async sendWebhook(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookResponse> {
    const { url, timeout = this.defaultTimeout, retryAttempts = this.defaultRetryAttempts, retryDelay = this.defaultRetryDelay } = config;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`🔄 [WebhookService] Tentativa ${attempt}/${retryAttempts} para ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'EnxergarSemFronteira-Webhook/1.0'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const responseData = await response.text();
          console.log(`✅ [WebhookService] Webhook enviado com sucesso (${response.status})`);

          return {
            success: true,
            status: response.status,
            message: 'Webhook enviado com sucesso',
            data: responseData
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido');
        console.warn(`⚠️ [WebhookService] Tentativa ${attempt} falhou:`, lastError.message);

        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < retryAttempts) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Backoff exponencial
          console.log(`⏳ [WebhookService] Aguardando ${delay}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const errorMessage = lastError?.message || 'Todas as tentativas falharam';
    console.error(`❌ [WebhookService] Webhook falhou após ${retryAttempts} tentativas:`, errorMessage);

    return {
      success: false,
      message: errorMessage
    };
  }

  /**
   * Busca detalhes da inscrição usando a função existente do banco
   */
  private async getRegistrationDetails(registrationId: string): Promise<unknown> {
    try {
      const { data, error } = await supabase.rpc('get_registration_details', {
        reg_id: registrationId
      });

      if (error) {
        console.error("❌ [WebhookService] Erro ao buscar detalhes da inscrição:", error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ [WebhookService] Nenhum dado encontrado para a inscrição:", registrationId);
        return null;
      }

      return data[0]; // A função retorna um array, pegar o primeiro item

    } catch (error) {
      console.error("❌ [WebhookService] Erro crítico ao buscar detalhes da inscrição:", error);
      return null;
    }
  }

  /**
   * Registra notificação na tabela registration_notifications
   */
  private async logNotification(
    registrationId: string,
    notificationType: 'confirmation' | 'delivery' | 'donation',
    status: 'sent' | 'failed' | 'scheduled',
    payload: unknown,
    _errorMessage?: string
  ): Promise<void> {
    try {
      const notificationData = {
        registration_id: registrationId,
        notification_type: notificationType,
        sent_at: new Date().toISOString(),
        status: status,
        message_content: JSON.stringify(payload),
        phone_number: payload.phone || null
      };

      const { error } = await supabase
        .from('registration_notifications')
        .insert(notificationData);

      if (error) {
        console.error("❌ [WebhookService] Erro ao registrar notificação:", error);
      } else {
        console.log("📝 [WebhookService] Notificação registrada:", notificationType, status);
      }

    } catch (error) {
      console.error("❌ [WebhookService] Erro crítico ao registrar notificação:", error);
      // Não propagar o erro para não afetar o fluxo principal
    }
  }

  /**
   * Método para testar conectividade com N8N
   */
  async testWebhookConnectivity(): Promise<{ [key: string]: WebhookResponse }> {
    const results: { [key: string]: WebhookResponse } = {};

    const webhooks = {
      confirmation: import.meta.env.VITE_WEBHOOK_CONFIRMATION_URL,
      delivery: import.meta.env.VITE_WEBHOOK_DELIVERY_URL,
      donation: import.meta.env.VITE_WEBHOOK_DONATION_URL
    };

    for (const [name, url] of Object.entries(webhooks)) {
      if (!url) {
        results[name] = { success: false, message: "URL não configurada" };
        continue;
      }

      try {
        const testPayload: WebhookPayload = {
          registration_id: "test-" + Date.now(),
          timestamp: new Date().toISOString(),
          test: true
        };

        results[name] = await this.sendWebhook({
          url,
          timeout: 3000, // Timeout menor para teste
          retryAttempts: 1 // Apenas uma tentativa para teste
        }, testPayload);

      } catch (error) {
        results[name] = {
          success: false,
          message: error instanceof Error ? error.message : 'Erro no teste'
        };
      }
    }

    return results;
  }
}

// Instância singleton
export const webhookService = new WebhookService();
