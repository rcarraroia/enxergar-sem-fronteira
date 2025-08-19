/**
 * Process Reminder Jobs Edge Function
 * Processes pending reminder jobs and sends notifications via email, WhatsApp, and SMS
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessJobsRequest {
  batchSize?: number
  testMode?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Process reminder jobs started')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { batchSize = 50, testMode = false }: ProcessJobsRequest = await req.json()
    
    console.log('📋 Processing jobs with batch size:', batchSize, 'Test mode:', testMode)

    // Get pending reminder jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('reminder_jobs')
      .select(`
        id,
        patient_id,
        event_date_id,
        reminder_type,
        status,
        patient:patients (
          id,
          nome,
          email,
          telefone
        ),
        event_date:event_dates (
          id,
          date,
          start_time,
          end_time,
          event:events (
            id,
            title,
            location,
            address,
            city
          )
        )
      `)
      .eq('status', 'pending')
      .limit(batchSize)

    if (jobsError) {
      throw new Error(`Error fetching reminder jobs: ${jobsError.message}`)
    }

    console.log(`📊 Found ${jobs?.length || 0} pending reminder jobs`)

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending reminder jobs found',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    let processed = 0
    let errors: string[] = []

    // Process each job
    for (const job of jobs) {
      try {
        console.log(`📝 Processing job ${job.id} for patient ${job.patient?.nome}`)

        // Mark job as processing
        await supabase
          .from('reminder_jobs')
          .update({ status: 'processing' })
          .eq('id', job.id)

        // Build template data
        const templateData = {
          patient_name: job.patient?.nome || '',
          patient_email: job.patient?.email || '',
          event_title: job.event_date?.event?.title || '',
          event_date: new Date(job.event_date?.date || '').toLocaleDateString('pt-BR'),
          event_time: `${job.event_date?.start_time?.slice(0, 5)} - ${job.event_date?.end_time?.slice(0, 5)}`,
          event_location: job.event_date?.event?.location || '',
          event_address: job.event_date?.event?.address || '',
          event_city: job.event_date?.event?.city || ''
        }

        console.log('📋 Template data prepared for:', templateData.patient_name)

        let emailSent = false
        let whatsappSent = false
        let smsSent = false

        // Send Email
        if (job.patient?.email) {
          try {
            const { error: emailError } = await supabase.functions.invoke('send-email', {
              body: {
                templateName: `lembrete_email_${job.reminder_type}`,
                templateData,
                recipientEmail: job.patient.email,
                recipientName: job.patient.nome,
                testMode
              }
            })

            if (emailError) {
              console.error(`❌ Email error for ${job.patient.email}:`, emailError)
              errors.push(`Email failed for job ${job.id}: ${emailError.message}`)
            } else {
              console.log(`✅ Email sent to ${job.patient.email}`)
              emailSent = true
            }
          } catch (error) {
            console.error(`❌ Email exception for job ${job.id}:`, error)
            errors.push(`Email exception for job ${job.id}: ${error}`)
          }
        }

        // Send WhatsApp
        if (job.patient?.telefone) {
          try {
            const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
              body: {
                templateName: `lembrete_whatsapp_${job.reminder_type}`,
                templateData,
                recipientPhone: job.patient.telefone,
                recipientName: job.patient.nome,
                testMode
              }
            })

            if (whatsappError) {
              console.error(`❌ WhatsApp error for ${job.patient.telefone}:`, whatsappError)
              errors.push(`WhatsApp failed for job ${job.id}: ${whatsappError.message}`)
            } else {
              console.log(`✅ WhatsApp sent to ${job.patient.telefone}`)
              whatsappSent = true
            }
          } catch (error) {
            console.error(`❌ WhatsApp exception for job ${job.id}:`, error)
            errors.push(`WhatsApp exception for job ${job.id}: ${error}`)
          }
        }

        // Send SMS
        if (job.patient?.telefone) {
          try {
            const { error: smsError } = await supabase.functions.invoke('send-sms', {
              body: {
                templateName: `lembrete_sms_${job.reminder_type}`,
                templateData,
                recipientPhone: job.patient.telefone,
                recipientName: job.patient.nome,
                testMode
              }
            })

            if (smsError) {
              console.error(`❌ SMS error for ${job.patient.telefone}:`, smsError)
              errors.push(`SMS failed for job ${job.id}: ${smsError.message}`)
            } else {
              console.log(`✅ SMS sent to ${job.patient.telefone}`)
              smsSent = true
            }
          } catch (error) {
            console.error(`❌ SMS exception for job ${job.id}:`, error)
            errors.push(`SMS exception for job ${job.id}: ${error}`)
          }
        }

        // Update job status
        const jobStatus = (emailSent || whatsappSent || smsSent) ? 'sent' : 'failed'
        const completedAt = new Date().toISOString()

        await supabase
          .from('reminder_jobs')
          .update({ 
            status: jobStatus,
            completed_at: completedAt,
            email_sent: emailSent,
            whatsapp_sent: whatsappSent,
            sms_sent: smsSent
          })
          .eq('id', job.id)

        console.log(`✅ Job ${job.id} completed with status: ${jobStatus}`)
        processed++

      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error)
        errors.push(`Job ${job.id} failed: ${error}`)

        // Mark job as failed
        await supabase
          .from('reminder_jobs')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : String(error)
          })
          .eq('id', job.id)
      }
    }

    console.log(`✅ Reminder jobs processing completed. Processed: ${processed}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} reminder jobs`,
        processed,
        errors: errors.length > 0 ? errors : undefined,
        testMode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Process reminder jobs error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})