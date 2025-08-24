/**
 * Trigger Reminders Edge Function
 * Initiates the reminder sending process using notification templates
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TriggerRemindersRequest {
  type: 'reminder' | 'confirmation'
  timestamp: string
  eventId?: string
  reminderType?: '24h' | '48h'
}

interface ReminderJob {
  id: string
  patient_id: string
  event_date_id: string
  reminder_type: string
  scheduled_for: string
  status: 'pending' | 'sent' | 'failed'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify admin access
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Check if user has admin role using secure role-based system
    const { data: organizerData, error: roleError } = await supabase
      .from('organizers')
      .select('role, status')
      .eq('id', user.id)
      .eq('status', 'active')
      .single()

    if (roleError || !organizerData || organizerData.role !== 'admin') {
      throw new Error('Insufficient permissions - admin access required')
    }

    console.log('🔐 Admin user authenticated via role system:', user.email, 'Role:', organizerData.role)

    // Parse request body
    const body: TriggerRemindersRequest = await req.json()
    console.log('📋 Trigger reminders request:', body)

    // Validate request
    if (!body.type || !body.timestamp) {
      throw new Error('Missing required fields: type and timestamp')
    }

    let jobsCreated = 0
    const errors: string[] = []

    if (body.type === 'reminder') {
      // Find upcoming events that need reminders
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0]

      console.log('📅 Looking for events on:', tomorrowStr, 'and', dayAfterTomorrowStr)

      // Get event dates for tomorrow (24h reminders) and day after tomorrow (48h reminders)
      const { data: eventDates, error: eventDatesError } = await supabase
        .from('event_dates')
        .select(`
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
        `)
        .in('date', [tomorrowStr, dayAfterTomorrowStr])

      if (eventDatesError) {
        throw new Error(`Error fetching event dates: ${eventDatesError.message}`)
      }

      console.log(`📊 Found ${eventDates?.length || 0} upcoming event dates`)

      if (eventDates && eventDates.length > 0) {
        for (const eventDate of eventDates) {
          try {
            // Determine reminder type based on date
            const reminderType = eventDate.date === tomorrowStr ? '24h' : '48h'

            // Get registrations for this event date
            const { data: registrations, error: regError } = await supabase
              .from('registrations')
              .select(`
                id,
                patient_id,
                status,
                patient:patients (
                  id,
                  nome,
                  email,
                  telefone
                )
              `)
              .eq('event_date_id', eventDate.id)
              .eq('status', 'confirmed')

            if (regError) {
              errors.push(`Error fetching registrations for event ${eventDate.id}: ${regError.message}`)
              continue
            }

            console.log(`📝 Found ${registrations?.length || 0} confirmed registrations for event date ${eventDate.id}`)

            if (registrations && registrations.length > 0) {
              // Create reminder jobs for each registration
              for (const registration of registrations) {
                try {
                  // Check if reminder already sent
                  const { data: existingJob } = await supabase
                    .from('reminder_jobs')
                    .select('id')
                    .eq('patient_id', registration.patient_id)
                    .eq('event_date_id', eventDate.id)
                    .eq('reminder_type', reminderType)
                    .single()

                  if (existingJob) {
                    console.log(`⏭️ Reminder already exists for patient ${registration.patient_id}`)
                    continue
                  }

                  // Create reminder job
                  const { error: jobError } = await supabase
                    .from('reminder_jobs')
                    .insert({
                      patient_id: registration.patient_id,
                      event_date_id: eventDate.id,
                      reminder_type: reminderType,
                      scheduled_for: new Date().toISOString(),
                      status: 'pending'
                    })

                  if (jobError) {
                    errors.push(`Error creating reminder job: ${jobError.message}`)
                  } else {
                    jobsCreated++
                  }

                } catch (jobError) {
                  errors.push(`Error processing registration ${registration.id}: ${jobError}`)
                }
              }
            }

          } catch (eventError) {
            errors.push(`Error processing event date ${eventDate.id}: ${eventError}`)
          }
        }
      }
    }

    // Return results
    const response = {
      success: true,
      message: `Reminder process initiated successfully`,
      data: {
        jobsCreated,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: body.timestamp,
        type: body.type
      }
    }

    console.log('✅ Trigger reminders completed:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ Trigger reminders error:', error)

    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
