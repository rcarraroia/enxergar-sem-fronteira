
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Iniciando processamento da fila de sincronização valente-conecta-app')

    // Buscar registros pendentes na fila
    const { data: queueItems, error: queueError } = await supabase
      .rpc('process_integration_queue')

    if (queueError) {
      console.error('❌ Erro ao buscar fila:', queueError)
      throw queueError
    }

    console.log(`📋 Encontrados ${queueItems?.length || 0} registros na fila`)

    const results = []

    for (const item of queueItems || []) {
      console.log(`🚀 Processando paciente ${item.payload.nome} (${item.queue_id})`)

      try {
        // Atualizar status para processing
        await supabase.rpc('update_queue_status', {
          queue_id: item.queue_id,
          new_status: 'processing'
        })

        // Enviar para valente-conecta-app
        const valenteResponse = await fetch('https://valente-conecta-app.com/api/v1/webhooks/enxergar-sem-fronteira', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('VALENTE_API_KEY') || 'demo-key'}`
          },
          body: JSON.stringify(item.payload)
        })

        if (valenteResponse.ok) {
          console.log(`✅ Paciente ${item.payload.nome} sincronizado com sucesso`)
          
          // Marcar como concluído
          await supabase.rpc('update_queue_status', {
            queue_id: item.queue_id,
            new_status: 'completed'
          })

          results.push({
            patient_id: item.patient_id,
            status: 'success',
            message: 'Sincronizado com sucesso'
          })
        } else {
          const errorText = await valenteResponse.text()
          console.error(`❌ Erro no valente-conecta-app para ${item.payload.nome}:`, errorText)

          // Marcar como falha
          await supabase.rpc('update_queue_status', {
            queue_id: item.queue_id,
            new_status: 'failed',
            error_msg: `HTTP ${valenteResponse.status}: ${errorText}`
          })

          results.push({
            patient_id: item.patient_id,
            status: 'error',
            message: errorText,
            retries: item.retries + 1
          })
        }

      } catch (error) {
        console.error(`❌ Erro ao processar paciente ${item.payload.nome}:`, error)

        // Marcar como falha
        await supabase.rpc('update_queue_status', {
          queue_id: item.queue_id,
          new_status: 'failed',
          error_msg: error.message
        })

        results.push({
          patient_id: item.patient_id,
          status: 'error',
          message: error.message,
          retries: item.retries + 1
        })
      }
    }

    console.log('🏁 Processamento da fila concluído')

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
