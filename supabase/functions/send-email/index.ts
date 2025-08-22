import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface EmailRequest {
  to: string
  subject: string
  content: string
  from?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, content, from }: EmailRequest = await req.json()

    // Validar dados obrigatórios
    if (!to || !subject || !content) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: to, subject, content' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obter chaves de API das variáveis de ambiente (Supabase Secrets)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // Usar email padrão do Resend se não tiver domínio verificado
    const fromEmail = from || Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

    if (!resendApiKey) {
      console.error('RESEND_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração de email não encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Formatar conteúdo HTML
    const htmlContent = formatEmailContent(content)

    // Enviar email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: htmlContent,
        text: content
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Erro da API Resend:', errorData)
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar email', details: errorData }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({
        id: result.id,
        status: 'sent',
        provider: 'resend',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function send-email:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function formatEmailContent(content: string): string {
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