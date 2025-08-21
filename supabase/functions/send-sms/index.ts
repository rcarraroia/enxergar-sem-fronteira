import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface SMSRequest {
  to: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, text }: SMSRequest = await req.json()

    // Validar dados obrigatórios
    if (!to || !text) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: to, text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obter chaves de API das variáveis de ambiente (Supabase Secrets)
    const vonageApiKey = Deno.env.get('VONAGE_API_KEY')
    const vonageApiSecret = Deno.env.get('VONAGE_API_SECRET')

    if (!vonageApiKey || !vonageApiSecret) {
      console.error('Credenciais Vonage não configuradas')
      return new Response(
        JSON.stringify({ error: 'Configuração de SMS não encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Formatar número de telefone
    const formattedPhone = formatPhoneNumber(to)

    // Validar número de telefone
    if (!validatePhoneNumber(formattedPhone)) {
      return new Response(
        JSON.stringify({ error: 'Número de telefone inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Truncar mensagem se necessário (SMS tem limite de 160 caracteres)
    const truncatedText = text.length > 160 ? text.substring(0, 157) + '...' : text

    // Enviar SMS via Vonage
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        api_key: vonageApiKey,
        api_secret: vonageApiSecret,
        to: formattedPhone,
        from: 'EnxergarSF',
        text: truncatedText
      })
    })

    if (!response.ok) {
      console.error('Erro da API Vonage:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar SMS' }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await response.json()

    // Verificar se o SMS foi enviado com sucesso
    if (result.messages && result.messages[0] && result.messages[0].status === '0') {
      return new Response(
        JSON.stringify({
          id: result.messages[0]['message-id'],
          status: 'sent',
          provider: 'vonage',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      const errorText = result.messages?.[0]?.['error-text'] || 'Erro desconhecido'
      console.error('Erro no envio SMS:', errorText)
      return new Response(
        JSON.stringify({ error: `Falha ao enviar SMS: ${errorText}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Erro na Edge Function send-sms:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function formatPhoneNumber(phone: string): string {
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '')

  // Se começa com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }

  // Se não tem código do país, adiciona +55 (Brasil)
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned
  }

  // Adiciona + se não tem
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}

function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  
  // Número brasileiro deve ter 10 ou 11 dígitos (sem código do país)
  // Ou 12-13 dígitos (com código do país 55)
  return (
    (cleaned.length >= 10 && cleaned.length <= 11) ||
    (cleaned.length >= 12 && cleaned.length <= 13 && cleaned.startsWith('55'))
  )
}