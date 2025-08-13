
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar eventos que acontecem em 48 horas
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    console.log('🔍 Buscando eventos para:', tomorrowDate)

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        start_time,
        end_time,
        location,
        address,
        registrations (
          id,
          patient:patients (
            nome,
            email
          )
        )
      `)
      .eq('date', tomorrowDate)
      .eq('status', 'open')

    if (eventsError) {
      throw new Error(`Erro ao buscar eventos: ${eventsError.message}`)
    }

    console.log(`📅 Encontrados ${events?.length || 0} eventos para enviar lembretes`)

    let totalReminders = 0

    for (const event of events || []) {
      const registrations = event.registrations || []
      
      for (const registration of registrations) {
        if (registration.patient) {
          try {
            // Enviar lembrete por email
            const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
              body: {
                to: registration.patient.email,
                subject: `Lembrete - ${event.title} é amanhã!`,
                template: 'event_reminder',
                data: {
                  name: registration.patient.nome,
                  eventTitle: event.title,
                  eventDate: new Date(event.date).toLocaleDateString('pt-BR'),
                  eventTime: `${event.start_time} - ${event.end_time}`,
                  eventLocation: event.location,
                  eventAddress: event.address
                }
              }
            })

            if (emailError) {
              console.error(`❌ Erro ao enviar lembrete para ${registration.patient.email}:`, emailError)
            } else {
              console.log(`✅ Lembrete enviado para ${registration.patient.email}`)
              totalReminders++
            }
          } catch (error) {
            console.error(`❌ Erro ao processar lembrete para ${registration.patient.email}:`, error)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${totalReminders} lembretes enviados com sucesso`,
        eventsProcessed: events?.length || 0,
        remindersCount: totalReminders
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar lembretes:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
