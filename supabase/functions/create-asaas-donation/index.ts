
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DonationRequest {
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

    const { eventId, patientId, amount, description }: DonationRequest = await req.json()

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

    // Buscar configurações das 3 API Keys fixas
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['asaas_ong_coracao_valente', 'asaas_projeto_visao_itinerante', 'asaas_renum_tecnologia'])

    if (settingsError) {
      throw new Error('Erro ao buscar configurações das API Keys')
    }

    const apiKeys = {
      ong_coracao_valente: '',
      projeto_visao_itinerante: '',
      renum_tecnologia: ''
    }

    settings?.forEach(setting => {
      switch (setting.key) {
        case 'asaas_ong_coracao_valente':
          apiKeys.ong_coracao_valente = setting.value
          break
        case 'asaas_projeto_visao_itinerante':
          apiKeys.projeto_visao_itinerante = setting.value
          break
        case 'asaas_renum_tecnologia':
          apiKeys.renum_tecnologia = setting.value
          break
      }
    })

    // Buscar dados do paciente se fornecido
    let customer = 'CUSTOMER_DEFAULT'
    if (patientId) {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (!patientError && patient) {
        customer = patient.cpf.replace(/\D/g, '') // CPF sem formatação
      }
    }

    // Criar campanha de doação no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': organizer.asaas_api_key
      },
      body: JSON.stringify({
        customer: customer,
        billingType: 'PIX',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0], // Hoje
        description: description,
        externalReference: `donation_${eventId}_${Date.now()}`,
        split: [
          // 25% para ONG Coração Valente
          apiKeys.ong_coracao_valente && {
            walletId: apiKeys.ong_coracao_valente,
            fixedValue: amount * 0.25
          },
          // 25% para Projeto Visão Itinerante
          apiKeys.projeto_visao_itinerante && {
            walletId: apiKeys.projeto_visao_itinerante,
            fixedValue: amount * 0.25
          },
          // 25% para Renum Tecnologia
          apiKeys.renum_tecnologia && {
            walletId: apiKeys.renum_tecnologia,
            fixedValue: amount * 0.25
          }
          // 25% restante fica com o organizador automaticamente
        ].filter(Boolean)
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
          ong_coracao_valente: amount * 0.25,
          projeto_visao_itinerante: amount * 0.25,
          renum_tecnologia: amount * 0.25,
          organizador: amount * 0.25
        }
      })

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        donation: {
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
    console.error('Erro na criação da campanha de doação:', error)
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
