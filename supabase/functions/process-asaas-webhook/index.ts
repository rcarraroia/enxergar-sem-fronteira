
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const webhookData = await req.json()
    
    console.log('Webhook Asaas recebido:', webhookData)

    const { event, payment } = webhookData

    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      // Atualizar status da transação
      const { error: updateError } = await supabase
        .from('asaas_transactions')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', payment.id)

      if (updateError) {
        console.error('Erro ao atualizar transação:', updateError)
        throw updateError
      }

      console.log(`Pagamento ${payment.id} confirmado com sucesso`)
    }

    if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
      // Atualizar status para falhou
      const { error: updateError } = await supabase
        .from('asaas_transactions')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', payment.id)

      if (updateError) {
        console.error('Erro ao atualizar transação:', updateError)
        throw updateError
      }

      console.log(`Pagamento ${payment.id} marcado como falhou`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro no webhook Asaas:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
