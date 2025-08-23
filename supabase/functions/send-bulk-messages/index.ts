/**
 * Send Bulk Messages Edge Function
 * Sends mass messages (email, SMS, WhatsApp) to patients based on events
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkMessageRequest {
  eventIds?: string[]           // IDs dos eventos (opcional - se não fornecido, envia para todos)
  eventDateIds?: string[]       // IDs específicos de datas de eventos
  messageTypes: ('email' | 'sms' | 'whatsapp')[]  // Tipos de mensagem a enviar
  templateName: string          // Nome do template a usar
  customMessage?: string        // Mensagem customizada (opcional)
  testMode?: boolean           // Modo de teste
  filters?: {
    patientStatus?: string[]   // Status dos pacientes
    registrationStatus?: string[] // Status das inscrições
    city?: string[]           // Filtrar por cidade
    dateRange?: {             // Filtrar por período
      start: string
      end: string
    }
  }
}

interface BulkMessageResponse {
  success: boolean
  message: string
  data: {
    totalRecipients: number
    emailsSent: number
    smsSent: number
    whatsappSent: number
    errors: string[]
    recipients: Array<{
      patientId: string
      patientName: string
      email?: string
      phone?: string
      emailSent: boolean
      smsSent: boolean
      whatsappSent: boolean
      errors: string[]
    }>
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Bulk message sending started')

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

    // Check if user has admin role
    const { data: organizerData, error: roleError } = await supabase
      .from('organizers')
      .select('role, status')
      .eq('id', user.id)
      .eq('status', 'active')
      .single()

    if (roleError || !organizerData || organizerData.role !== 'admin') {
      throw new Error('Insufficient permissions - admin access required')
    }

    console.log('🔐 Admin user authenticated:', user.email)

    // Parse request body
    const body: BulkMessageRequest = await req.json()
    console.log('📋 Bulk message request:', {
      eventIds: body.eventIds?.length || 'all',
      messageTypes: body.messageTypes,
      templateName: body.templateName,
      testMode: body.testMode
    })

    // Validate request
    if (!body.messageTypes || body.messageTypes.length === 0) {
      throw new Error('At least one message type must be specified')
    }

    if (!body.templateName && !body.customMessage) {
      throw new Error('Either templateName or customMessage must be provided')
    }

    // Build query for recipients
    let query = supabase
      .from('registrations')
      .select(`
        id,
        patient_id,
        status as registration_status,
        event_date_id,
        patient:patients (
          id,
          nome,
          email,
          telefone,
          status
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
            city,
            status
          )
        )
      `)

    // Apply filters
    if (body.filters?.registrationStatus) {
      query = query.in('status', body.filters.registrationStatus)
    } else {
      query = query.eq('status', 'confirmed') // Default to confirmed registrations
    }

    // Filter by event IDs if provided
    if (body.eventIds && body.eventIds.length > 0) {
      query = query.in('event_date.event.id', body.eventIds)
    }

    // Filter by event date IDs if provided
    if (body.eventDateIds && body.eventDateIds.length > 0) {
      query = query.in('event_date_id', body.eventDateIds)
    }

    // Execute query
    const { data: registrations, error: queryError } = await query

    if (queryError) {
      throw new Error(`Error fetching registrations: ${queryError.message}`)
    }

    console.log(`📊 Found ${registrations?.length || 0} registrations`)

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recipients found matching the criteria',
          data: {
            totalRecipients: 0,
            emailsSent: 0,
            smsSent: 0,
            whatsappSent: 0,
            errors: [],
            recipients: []
          }
        } as BulkMessageResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Apply additional filters
    let filteredRegistrations = registrations

    // Filter by patient status
    if (body.filters?.patientStatus) {
      filteredRegistrations = filteredRegistrations.filter(reg =>
        body.filters!.patientStatus!.includes(reg.patient?.status || '')
      )
    }

    // Filter by city
    if (body.filters?.city) {
      filteredRegistrations = filteredRegistrations.filter(reg =>
        body.filters!.city!.includes(reg.event_date?.event?.city || '')
      )
    }

    // Filter by date range
    if (body.filters?.dateRange) {
      const startDate = new Date(body.filters.dateRange.start)
      const endDate = new Date(body.filters.dateRange.end)

      filteredRegistrations = filteredRegistrations.filter(reg => {
        const eventDate = new Date(reg.event_date?.date || '')
        return eventDate >= startDate && eventDate <= endDate
      })
    }

    console.log(`📊 After filtering: ${filteredRegistrations.length} recipients`)

    // Get template if specified
    let template = null
    if (body.templateName) {
      const { data: templateData, error: templateError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('name', body.templateName)
        .eq('is_active', true)
        .single()

      if (templateError) {
        console.warn(`⚠️ Template '${body.templateName}' not found, using custom message`)
      } else {
        template = templateData
        console.log(`📋 Using template: ${template.name}`)
      }
    }

    // Process recipients
    const results = {
      totalRecipients: filteredRegistrations.length,
      emailsSent: 0,
      smsSent: 0,
      whatsappSent: 0,
      errors: [] as string[],
      recipients: [] as any[]
    }

    // Group recipients by patient to avoid duplicates
    const uniquePatients = new Map()
    for (const reg of filteredRegistrations) {
      if (reg.patient && !uniquePatients.has(reg.patient.id)) {
        uniquePatients.set(reg.patient.id, {
          registration: reg,
          events: [reg.event_date?.event]
        })
      } else if (reg.patient) {
        uniquePatients.get(reg.patient.id).events.push(reg.event_date?.event)
      }
    }

    console.log(`📊 Unique patients: ${uniquePatients.size}`)

    // Send messages to each unique patient
    for (const [patientId, patientData] of uniquePatients) {
      const { registration, events } = patientData
      const patient = registration.patient

      if (!patient) continue

      console.log(`📝 Processing patient: ${patient.nome}`)

      const recipientResult = {
        patientId: patient.id,
        patientName: patient.nome,
        email: patient.email,
        phone: patient.telefone,
        emailSent: false,
        smsSent: false,
        whatsappSent: false,
        errors: [] as string[]
      }

      // Build template data
      const templateData = {
        patient_name: patient.nome || '',
        patient_email: patient.email || '',
        event_title: events[0]?.title || '',
        event_date: new Date(registration.event_date?.date || '').toLocaleDateString('pt-BR'),
        event_time: `${registration.event_date?.start_time?.slice(0, 5)} - ${registration.event_date?.end_time?.slice(0, 5)}`,
        event_location: events[0]?.location || '',
        event_address: events[0]?.address || '',
        event_city: events[0]?.city || '',
        events_count: events.length,
        events_list: events.map(e => e?.title).filter(Boolean).join(', ')
      }

      // Send Email
      if (body.messageTypes.includes('email') && patient.email) {
        try {
          const emailBody = body.customMessage || template?.content || ''
          const emailSubject = template?.subject || 'Mensagem importante'

          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              templateName: body.templateName,
              templateData,
              recipientEmail: patient.email,
              recipientName: patient.nome,
              customSubject: template ? undefined : emailSubject,
              customContent: body.customMessage,
              testMode: body.testMode
            }
          })

          if (emailError) {
            console.error(`❌ Email error for ${patient.email}:`, emailError)
            recipientResult.errors.push(`Email failed: ${emailError.message}`)
            results.errors.push(`Email failed for ${patient.nome}: ${emailError.message}`)
          } else {
            console.log(`✅ Email sent to ${patient.email}`)
            recipientResult.emailSent = true
            results.emailsSent++
          }
        } catch (error) {
          console.error(`❌ Email exception for ${patient.nome}:`, error)
          recipientResult.errors.push(`Email exception: ${error}`)
          results.errors.push(`Email exception for ${patient.nome}: ${error}`)
        }
      }

      // Send SMS
      if (body.messageTypes.includes('sms') && patient.telefone) {
        try {
          const { error: smsError } = await supabase.functions.invoke('send-sms', {
            body: {
              templateName: body.templateName,
              templateData,
              recipientPhone: patient.telefone,
              recipientName: patient.nome,
              customContent: body.customMessage,
              testMode: body.testMode
            }
          })

          if (smsError) {
            console.error(`❌ SMS error for ${patient.telefone}:`, smsError)
            recipientResult.errors.push(`SMS failed: ${smsError.message}`)
            results.errors.push(`SMS failed for ${patient.nome}: ${smsError.message}`)
          } else {
            console.log(`✅ SMS sent to ${patient.telefone}`)
            recipientResult.smsSent = true
            results.smsSent++
          }
        } catch (error) {
          console.error(`❌ SMS exception for ${patient.nome}:`, error)
          recipientResult.errors.push(`SMS exception: ${error}`)
          results.errors.push(`SMS exception for ${patient.nome}: ${error}`)
        }
      }

      // Send WhatsApp
      if (body.messageTypes.includes('whatsapp') && patient.telefone) {
        try {
          const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              templateName: body.templateName,
              templateData,
              recipientPhone: patient.telefone,
              recipientName: patient.nome,
              customContent: body.customMessage,
              testMode: body.testMode
            }
          })

          if (whatsappError) {
            console.error(`❌ WhatsApp error for ${patient.telefone}:`, whatsappError)
            recipientResult.errors.push(`WhatsApp failed: ${whatsappError.message}`)
            results.errors.push(`WhatsApp failed for ${patient.nome}: ${whatsappError.message}`)
          } else {
            console.log(`✅ WhatsApp sent to ${patient.telefone}`)
            recipientResult.whatsappSent = true
            results.whatsappSent++
          }
        } catch (error) {
          console.error(`❌ WhatsApp exception for ${patient.nome}:`, error)
          recipientResult.errors.push(`WhatsApp exception: ${error}`)
          results.errors.push(`WhatsApp exception for ${patient.nome}: ${error}`)
        }
      }

      results.recipients.push(recipientResult)

      // Add small delay to avoid rate limiting
      if (!body.testMode) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Bulk message sending completed`)
    console.log(`📊 Results: ${results.emailsSent} emails, ${results.smsSent} SMS, ${results.whatsappSent} WhatsApp`)

    const response: BulkMessageResponse = {
      success: true,
      message: `Bulk messages sent successfully. Emails: ${results.emailsSent}, SMS: ${results.smsSent}, WhatsApp: ${results.whatsappSent}`,
      data: results
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Bulk message sending error:', error)

    const errorResponse: BulkMessageResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        totalRecipients: 0,
        emailsSent: 0,
        smsSent: 0,
        whatsappSent: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        recipients: []
      }
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
</content>
</invoke>
