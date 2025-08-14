
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DonationRequest {
  campaign_id: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  amount: number
  donation_type: 'one_time' | 'subscription'
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

    const { campaign_id, donor_name, donor_email, donor_phone, amount, donation_type }: DonationRequest = await req.json()

    console.log('Processando doação:', { campaign_id, donor_name, donor_email, amount, donation_type })

    // Buscar dados da campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        events:event_id (
          title,
          city,
          location
        ),
        organizers:created_by (
          name,
          email,
          asaas_api_key
        )
      `)
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new Error('Campanha não encontrada')
    }

    console.log('Campanha encontrada:', campaign.title)

    const organizer = campaign.organizers as any
    if (!organizer?.asaas_api_key) {
      throw new Error('Chave API do Asaas não configurada para este organizador')
    }

    // Buscar configurações das 3 API Keys fixas
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['asaas_ong_coracao_valente', 'asaas_projeto_visao_itinerante', 'asaas_renum_tecnologia'])

    if (settingsError) {
      console.log('Erro ao buscar configurações das API Keys:', settingsError)
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

    // Preparar dados da cobrança
    const paymentData = {
      customer: donor_email.replace(/[^a-zA-Z0-9@.-]/g, ''), // Sanitizar email
      billingType: 'PIX',
      value: amount,
      dueDate: new Date().toISOString().split('T')[0], // Hoje
      description: `Doação para: ${campaign.title}`,
      externalReference: `donation_${campaign_id}_${Date.now()}`,
    }

    // Adicionar split se há configurações
    const splits = []
    if (apiKeys.ong_coracao_valente) {
      splits.push({
        walletId: apiKeys.ong_coracao_valente,
        fixedValue: amount * 0.25
      })
    }
    if (apiKeys.projeto_visao_itinerante) {
      splits.push({
        walletId: apiKeys.projeto_visao_itinerante,
        fixedValue: amount * 0.25
      })
    }
    if (apiKeys.renum_tecnologia) {
      splits.push({
        walletId: apiKeys.renum_tecnologia,
        fixedValue: amount * 0.25
      })
    }

    if (splits.length > 0) {
      (paymentData as any).split = splits
    }

    // Para assinaturas, criar cobrança recorrente
    if (donation_type === 'subscription') {
      (paymentData as any).cycle = 'MONTHLY'
      (paymentData as any).nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    console.log('Criando cobrança no Asaas:', paymentData)

    // Criar cobrança no Asaas
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': organizer.asaas_api_key
      },
      body: JSON.stringify(paymentData)
    })

    const asaasData = await asaasResponse.json()

    if (!asaasResponse.ok) {
      console.error('Erro Asaas:', asaasData)
      throw new Error(`Erro Asaas: ${asaasData.errors?.[0]?.description || 'Erro desconhecido'}`)
    }

    console.log('Cobrança criada no Asaas:', asaasData.id)

    // Salvar doação no banco
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        campaign_id,
        donor_name,
        donor_email,
        donor_phone,
        amount,
        donation_type,
        payment_id: asaasData.id,
        payment_status: 'pending',
        asaas_subscription_id: donation_type === 'subscription' ? asaasData.id : null,
        split_data: {
          ong_coracao_valente: amount * 0.25,
          projeto_visao_itinerante: amount * 0.25,
          renum_tecnologia: amount * 0.25,
          organizador: amount * 0.25
        }
      })
      .select()
      .single()

    if (donationError) {
      console.error('Erro ao salvar doação:', donationError)
    }

    // Para assinaturas, também salvar na tabela de assinaturas
    if (donation_type === 'subscription' && donation) {
      const { error: subscriptionError } = await supabase
        .from('donation_subscriptions')
        .insert({
          donation_id: donation.id,
          campaign_id,
          subscriber_email: donor_email,
          amount,
          status: 'active',
          asaas_subscription_id: asaasData.id,
          next_charge_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total_charges: 0
        })

      if (subscriptionError) {
        console.error('Erro ao salvar assinatura:', subscriptionError)
      }
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
          invoiceUrl: asaasData.invoiceUrl,
          bankSlipUrl: asaasData.bankSlipUrl
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro na criação da doação:', error)
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
