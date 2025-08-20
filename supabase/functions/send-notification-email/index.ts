
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailData {
  to: string
  subject: string
  template: 'registration_confirmation' | 'event_reminder' | 'registration_cancelled'
  data: {
    name: string
    eventTitle: string
    eventDate: string
    eventTime: string
    eventLocation: string
    eventAddress: string
  }
}

const templates = {
  registration_confirmation: (data: EmailData['data']) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Inscrição</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Enxergar sem Fronteiras</h1>
        <p style="margin: 10px 0 0 0;">Confirmação de Inscrição</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea;">Olá, ${data.name}!</h2>
        
        <p>Sua inscrição foi confirmada com sucesso para o evento:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${data.eventTitle}</h3>
          <p><strong>📅 Data:</strong> ${data.eventDate}</p>
          <p><strong>🕐 Horário:</strong> ${data.eventTime}</p>
          <p><strong>📍 Local:</strong> ${data.eventLocation}</p>
          <p><strong>📌 Endereço:</strong> ${data.eventAddress}</p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">Informações Importantes:</h4>
          <ul>
            <li>Chegue com 30 minutos de antecedência</li>
            <li>Traga um documento de identidade</li>
            <li>Use roupas confortáveis</li>
            <li>Em caso de dúvidas, entre em contato conosco</li>
          </ul>
        </div>
        
        <p>Agradecemos sua participação e esperamos vê-lo(a) em breve!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Enxergar sem Fronteiras<br>
            Levando cuidado oftalmológico onde mais se precisa
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  event_reminder: (data: EmailData['data']) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lembrete do Evento</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff9a56 0%, #ffad56 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Enxergar sem Fronteiras</h1>
        <p style="margin: 10px 0 0 0;">Lembrete do Evento</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <h2 style="color: #ff9a56;">Olá, ${data.name}!</h2>
        
        <p>Este é um lembrete de que você tem um evento confirmado:</p>
        
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9a56;">
          <h3 style="margin-top: 0; color: #333;">${data.eventTitle}</h3>
          <p><strong>📅 Data:</strong> ${data.eventDate}</p>
          <p><strong>🕐 Horário:</strong> ${data.eventTime}</p>
          <p><strong>📍 Local:</strong> ${data.eventLocation}</p>
          <p><strong>📌 Endereço:</strong> ${data.eventAddress}</p>
        </div>
        
        <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #7b1fa2;">Não se esqueça:</h4>
          <ul>
            <li>Chegue com 30 minutos de antecedência</li>
            <li>Traga um documento de identidade</li>
            <li>Use roupas confortáveis</li>
          </ul>
        </div>
        
        <p>Estamos ansiosos para vê-lo(a)!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Enxergar sem Fronteiras<br>
            Levando cuidado oftalmológico onde mais se precisa
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  registration_cancelled: (data: EmailData['data']) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cancelamento de Inscrição</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef5350 0%, #e53935 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Enxergar sem Fronteiras</h1>
        <p style="margin: 10px 0 0 0;">Cancelamento de Inscrição</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <h2 style="color: #ef5350;">Olá, ${data.name}!</h2>
        
        <p>Sua inscrição para o evento abaixo foi cancelada:</p>
        
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef5350;">
          <h3 style="margin-top: 0; color: #333;">${data.eventTitle}</h3>
          <p><strong>📅 Data:</strong> ${data.eventDate}</p>
          <p><strong>🕐 Horário:</strong> ${data.eventTime}</p>
          <p><strong>📍 Local:</strong> ${data.eventLocation}</p>
        </div>
        
        <p>Se você cancelou por engano ou gostaria de se inscrever novamente, entre em contato conosco.</p>
        
        <p>Esperamos vê-lo(a) em futuros eventos!</p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Enxergar sem Fronteiras<br>
            Levando cuidado oftalmológico onde mais se precisa
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, data }: EmailData = await req.json()

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const htmlContent = templates[template](data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Enxergar sem Fronteiras <noreply@enxergarsemfronteira.com.br>',
        to: [to],
        subject,
        html: htmlContent,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await res.json()
    
    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
