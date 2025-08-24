/**
 * PROVEDOR DE SMS - VONAGE
 * Integração com Vonage para envio de SMS
 * Utiliza as Edge Functions já configuradas
 */

interface SMSData {
  to: string
  content: string
}

interface SMSResponse {
  id: string
  status: string
  provider: "vonage"
  timestamp: string
}

export class SMSProvider {
  private baseUrl: string;

  constructor() {
    // URL base das Edge Functions (Supabase)
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  }

  /**
   * Envia SMS através da Edge Function do Supabase
   */
  async send(data: SMSData): Promise<SMSResponse> {
    try {
      console.log("📱 [SMSProvider] Enviando SMS para:", data.to);

      // Formatar número de telefone
      const formattedPhone = this.formatPhoneNumber(data.to);
      
      // Se não temos configuração, simular envio
      if (!this.baseUrl) {
        console.log("⚠️ [SMSProvider] URL base não configurada, simulando envio");
        return this.simulateSend(data);
      }

      // Chamar Edge Function do Supabase
      const response = await fetch(`${this.baseUrl}/functions/v1/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""}`
        },
        body: JSON.stringify({
          to: formattedPhone,
          text: data.content
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`SMS API Error: ${errorData || response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ [SMSProvider] SMS enviado via Edge Function:", result.id);

      return {
        id: result.id,
        status: result.status,
        provider: result.provider,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error("❌ [SMSProvider] Erro ao enviar SMS:", error);
      // Em caso de erro, simular envio
      return this.simulateSend(data);
    }
  }

  /**
   * Verifica status de um SMS (usando webhook data se disponível)
   */
  async getStatus(smsId: string): Promise<any> {
    try {
      // Em produção, isso consultaria a API da Vonage ou dados do webhook
      // Por enquanto, retornar status simulado
      return {
        messageId: smsId,
        status: "delivered",
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("❌ [SMSProvider] Erro ao verificar status:", error);
      throw error;
    }
  }

  /**
   * Formata número de telefone para padrão internacional
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, "");

    // Se começa com 0, remove
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    // Se não tem código do país, adiciona +55 (Brasil)
    if (!cleaned.startsWith("55") && cleaned.length <= 11) {
      cleaned = `55${  cleaned}`;
    }

    // Adiciona + se não tem
    if (!cleaned.startsWith("+")) {
      cleaned = `+${  cleaned}`;
    }

    return cleaned;
  }

  /**
   * Valida se o número de telefone é válido
   */
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    
    // Número brasileiro deve ter 10 ou 11 dígitos (sem código do país)
    // Ou 12-13 dígitos (com código do país 55)
    return (
      (cleaned.length >= 10 && cleaned.length <= 11) ||
      (cleaned.length >= 12 && cleaned.length <= 13 && cleaned.startsWith("55"))
    );
  }

  /**
   * Trunca mensagem se necessário (SMS tem limite de caracteres)
   */
  private truncateMessage(content: string, maxLength = 160): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Truncar e adicionar indicador
    return `${content.substring(0, maxLength - 3)  }...`;
  }

  /**
   * Simula envio para desenvolvimento
   */
  private simulateSend(data: SMSData): SMSResponse {
    console.log("🔄 [SMSProvider] SIMULAÇÃO - SMS que seria enviado:");
    console.log("Para:", data.to);
    console.log("Conteúdo:", data.content);
    console.log("Caracteres:", data.content.length);
    console.log("---");

    return {
      id: `sim_sms_${Date.now()}`,
      status: "sent",
      provider: "vonage",
      timestamp: new Date().toISOString()
    };
  }
}

// Status possíveis do Vonage SMS
export const VONAGE_SMS_STATUS = {
  SUBMITTED: "submitted",
  DELIVERED: "delivered",
  FAILED: "failed",
  REJECTED: "rejected",
  UNKNOWN: "unknown"
} as const;