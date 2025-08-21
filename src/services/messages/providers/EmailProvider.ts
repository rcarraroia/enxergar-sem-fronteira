/**
 * PROVEDOR DE EMAIL - RESEND
 * Integração com Resend para envio de emails
 */

interface EmailData {
  to: string
  subject: string
  content: string
  from?: string
}

interface EmailResponse {
  id: string
  status: string
  provider: 'resend'
  timestamp: string
}

export class EmailProvider {
  private baseUrl: string

  constructor() {
    // URL base das Edge Functions (Supabase)
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL || ''
  }

  /**
   * Envia email através da Edge Function do Supabase
   */
  async send(data: EmailData): Promise<EmailResponse> {
    try {
      console.log('📧 [EmailProvider] Enviando email para:', data.to)

      // Se não temos URL base, simular envio em desenvolvimento
      if (!this.baseUrl) {
        console.log('⚠️ [EmailProvider] URL base não configurada, simulando envio')
        return this.simulateSend(data)
      }

      // Chamar Edge Function do Supabase
      const response = await fetch(`${this.baseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`
        },
        body: JSON.stringify({
          to: data.to,
          subject: data.subject,
          content: data.content,
          from: data.from
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Email API Error: ${errorData || response.statusText}`)
      }

      const result = await response.json()

      console.log('✅ [EmailProvider] Email enviado:', result.id)

      return {
        id: result.id,
        status: result.status,
        provider: result.provider,
        timestamp: result.timestamp
      }

    } catch (error) {
      console.error('❌ [EmailProvider] Erro ao enviar email:', error)
      throw error
    }
  }

  /**
   * Verifica status de um email
   */
  async getStatus(emailId: string): Promise<any> {
    try {
      if (!this.baseUrl) {
        return { status: 'delivered' } // Simular em desenvolvimento
      }

      // Por enquanto, retornar status simulado
      // Em produção, isso poderia consultar webhooks ou logs do Supabase
      return {
        messageId: emailId,
        status: 'delivered',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ [EmailProvider] Erro ao verificar status:', error)
      throw error
    }
  }



  /**
   * Simula envio para desenvolvimento
   */
  private simulateSend(data: EmailData): EmailResponse {
    console.log('🔄 [EmailProvider] SIMULAÇÃO - Email que seria enviado:')
    console.log('Para:', data.to)
    console.log('Assunto:', data.subject)
    console.log('Conteúdo:', data.content)
    console.log('---')

    return {
      id: `sim_${Date.now()}`,
      status: 'sent',
      provider: 'resend',
      timestamp: new Date().toISOString()
    }
  }
}

// Configurações de webhook para Resend (para implementação futura)
export const RESEND_WEBHOOK_EVENTS = {
  DELIVERED: 'email.delivered',
  BOUNCED: 'email.bounced',
  COMPLAINED: 'email.complained',
  CLICKED: 'email.clicked',
  OPENED: 'email.opened'
} as const