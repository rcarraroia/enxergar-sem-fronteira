
/**
 * Vonage Status Webhook - Recebe atualizações de status das mensagens enviadas
 * Este webhook é chamado quando o status de uma mensagem enviada muda
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface VonageStatusUpdate {
  message_uuid: string
  to: string
  from: string
  timestamp: string
  status: 'delivered' | 'failed' | 'rejected' | 'unknown' | 'buffered' | 'accepted' | 'submitted'
  error_code?: string
  error_text?: string
  client_ref?: string
  price?: string
  currency?: string
  network_code?: string
}

// Função para verificar assinatura do webhook Vonage
async function verifyVonageSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !timestamp) {
    return false
  }

  try {
    // Criar o payload para verificação
    const payload = `${timestamp}.${body}`
    
    // Criar hash HMAC SHA-256
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(payload)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const hashBuffer = await crypto.subtle.sign('HMAC', key, messageData)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex === signature.replace('sha256=', '')
  } catch (error) {
    console.error('❌ Erro na verificação da assinatura:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📊 Vonage Status Webhook chamado')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vonageSigningSecret = Deno.env.get('VONAGE_SIGNING_SECRET')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obter dados da requisição
    const body = await req.text()
    const signature = req.headers.get('x-vonage-signature')
    const timestamp = req.headers.get('x-vonage-timestamp')
    
    console.log('📋 Headers recebidos:', {
      signature: signature ? 'presente' : 'ausente',
      timestamp: timestamp ? 'presente' : 'ausente'
    })

    // Verificar assinatura se secret estiver configurado
    if (vonageSigningSecret) {
      const isValidSignature = await verifyVonageSignature(
        body, 
        signature, 
        timestamp, 
        vonageSigningSecret
      )
      
      if (!isValidSignature) {
        console.error('❌ Assinatura inválida do webhook')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      console.log('✅ Assinatura verificada com sucesso')
    } else {
      console.warn('⚠️ VONAGE_SIGNING_SECRET não configurado - pulando verificação de assinatura')
    }

    // Parse do payload
    const statusData: VonageStatusUpdate = JSON.parse(body)
    
    console.log('📊 Status update recebido:', {
      messageUuid: statusData.message_uuid,
      to: statusData.to,
      status: statusData.status,
      errorCode: statusData.error_code,
      timestamp: statusData.timestamp
    })

    // Buscar mensagem existente para atualizar
    const { data: existingMessage, error: findError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', `message_${statusData.message_uuid}`)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Erro ao buscar mensagem:', findError)
    }

    // Salvar/atualizar status da mensagem
    const statusRecord = {
      message_uuid: statusData.message_uuid,
      to_number: statusData.to,
      from_number: statusData.from,
      status: statusData.status,
      timestamp: new Date(statusData.timestamp),
      error_code: statusData.error_code,
      error_text: statusData.error_text,
      price: statusData.price,
      currency: statusData.currency,
      network_code: statusData.network_code,
      updated_at: new Date().toISOString()
    }

    // Salvar o status na tabela system_settings para tracking
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({
        key: `message_status_${statusData.message_uuid}`,
        value: statusRecord,
        description: `Status da mensagem ${statusData.message_uuid}: ${statusData.status}`
      })

    if (upsertError) {
      console.error('❌ Erro ao salvar status:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Status salvo com sucesso')

    // Log específico para falhas de entrega
    if (statusData.status === 'failed' || statusData.status === 'rejected') {
      console.error('❌ Falha na entrega da mensagem:', {
        messageUuid: statusData.message_uuid,
        to: statusData.to,
        errorCode: statusData.error_code,
        errorText: statusData.error_text
      })
    }

    // Resposta de sucesso para a Vonage
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Status update received and processed',
        messageUuid: statusData.message_uuid,
        status: statusData.status
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro no webhook status:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
