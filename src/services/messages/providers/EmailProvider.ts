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
  private apiKey: string
  private fromEmail: string

  constructor() {
    // Configurações do Resend (serão movidas para variáveis de ambiente)
    this.apiKey = process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@enxergarsemfronteiras.com'
  }

  /**
   * Envia email através do Resend
   */
  async send(data: EmailData): Promise<EmailResponse> {
    try {
      console.log('📧 [EmailProvider] Enviando email para:', data.to)

      // Se não temos API key, simular envio em desenvolvimento
      if (!this.apiKey) {
        console.log('⚠️ [EmailProvider] API Key não configurada, simulando envio')
        return this.simulateSend(data)
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: data.from || this.fromEmail,
          to: [data.to],
          subject: data.subject,
          html: this.formatContent(data.content),
          text: data.content
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Resend API Error: ${errorData.message || response.statusText}`)
      }

      const result = await response.json()

      console.log('✅ [EmailProvider] Email enviado:', result.id)

      return {
        id: result.id,
        status: 'sent',
        provider: 'resend',
        timestamp: new Date().toISOString()
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
      if (!this.apiKey) {
        return { status: 'delivered' } // Simular em desenvolvimento
      }

      const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Resend API Error: ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ [EmailProvider] Erro ao verificar status:', error)
      throw error
    }
  }

  /**
   * Formata conteúdo para HTML
   */
  private formatContent(content: string): string {
    // Converter quebras de linha para HTML
    const htmlContent = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enxergar Sem Fronteiras</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    p {
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Enxergar Sem Fronteiras</div>
  </div>
  
  <div class="content">
    <p>${htmlContent}</p>
  </div>
  
  <div class="footer">
    <p>Esta é uma mensagem automática do sistema Enxergar Sem Fronteiras.</p>
    <p>Se você não solicitou esta mensagem, pode ignorá-la com segurança.</p>
  </div>
</body>
</html>
    `.trim()
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