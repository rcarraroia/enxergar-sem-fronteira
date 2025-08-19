
/**
 * Vonage Inbound Webhook - Recebe mensagens dos pacientes
 * Este webhook é chamado quando uma mensagem é enviada para o número da Vonage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface VonageInboundMessage {
  message_uuid: string
  to: string
  from: string
  text: string
  timestamp: string
  message_type: string
  channel?: string
  keyword?: string
}

// Função para verificar assinatura do webhook Vonage
function verifyVonageSignature(
  body: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): boolean {
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
    
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => 
      crypto.subtle.sign('HMAC', key, messageData)
    ).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      return hashHex === signature.replace('sha256=', '')
    }).catch(() => false)
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
    console.log('📨 Vonage Inbound Webhook chamado')
    
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
    const inboundData: VonageInboundMessage = JSON.parse(body)
    
    console.log('📨 Mensagem recebida:', {
      from: inboundData.from,
      to: inboundData.to,
      text: inboundData.text?.substring(0, 100) + '...',
      messageUuid: inboundData.message_uuid
    })

    // Salvar mensagem recebida no banco de dados
    const { error: insertError } = await supabase
      .from('inbound_messages')
      .insert({
        message_uuid: inboundData.message_uuid,
        from_number: inboundData.from,
        to_number: inboundData.to,
        message_text: inboundData.text,
        message_type: inboundData.message_type || 'text',
        channel: inboundData.channel || 'sms',
        received_at: new Date(inboundData.timestamp || new Date().toISOString()),
        processed: false
      })

    if (insertError) {
      console.error('❌ Erro ao salvar mensagem:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Mensagem salva com sucesso')

    // Resposta de sucesso para a Vonage
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Inbound message received and processed' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro no webhook inbound:', error)
    
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
