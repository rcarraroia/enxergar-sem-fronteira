
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  eventId: string
  patientId: string
  amount: number
  description: string
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

    const { eventId, patientId, amount, description }: PaymentRequest = await req.json()

    // Buscar dados do evento e organizador
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        organizers:organizer_id (
          name,
          email,
          asaas_api_key
        )
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Evento não encontrado')
    }

    const organizer = event.organizers as any
    if (!organizer?.asaas_api_key) {
      throw new Error('Chave API do Asaas não configurada para este organizador')
    }

    // Buscar dados do paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado')
    }

    // Criar cobrança no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': organizer.asaas_api_key
      },
      body: JSON.stringify({
        customer: patient.cpf.replace(/\D/g, ''), // CPF sem formatação
        billingType: 'PIX',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0], // Hoje
        description: description,
        externalReference: `event_${eventId}_patient_${patientId}`,
        split: [
          {
            walletId: 'WALLET_ENXERGAR_FRONTEIRAS', // Wallet principal
            fixedValue: amount * 0.25 // 25% para Enxergar sem Fronteiras
          },
          {
            walletId: 'WALLET_INSTITUTO_CORACAO', // Wallet Instituto
            fixedValue: amount * 0.25 // 25% para Instituto Coração Valente
          },
          {
            walletId: 'WALLET_PARCEIRO_LOCAL', // Wallet parceiro local
            fixedValue: amount * 0.25 // 25% para parceiro local
          }
          // 25% restante fica com o organizador
        ]
      })
    })

    const asaasData = await asaasResponse.json()

    if (!asaasResponse.ok) {
      throw new Error(`Erro Asaas: ${asaasData.errors?.[0]?.description || 'Erro desconhecido'}`)
    }

    // Salvar transação no banco
    const { error: transactionError } = await supabase
      .from('asaas_transactions')
      .insert({
        event_id: eventId,
        transaction_id: asaasData.id,
        amount: amount,
        payment_status: 'pending',
        split_data: {
          enxergar_fronteiras: amount * 0.25,
          instituto_coracao: amount * 0.25,
          parceiro_local: amount * 0.25,
          organizador: amount * 0.25
        }
      })

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: asaasData.id,
          status: asaasData.status,
          value: asaasData.value,
          pixCode: asaasData.pixCode,
          qrCode: asaasData.qrCode,
          invoiceUrl: asaasData.invoiceUrl
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na criação do pagamento:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
