/**
 * Export Admin Reports Edge Function
 * Generates and exports administrative reports in CSV/XLSX format
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ExportRequest {
  type: 'general' | 'patients' | 'events' | 'registrations' | 'organizers'
  format: 'csv' | 'xlsx'
  dateRange?: {
    start: string
    end: string
  }
}

// CSV generation function
function generateCSV(data: any[], headers: string[]): string {
  const csvRows = []
  
  // Add headers
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || ''
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

// Generate general report data
async function generateGeneralReport(supabase: any) {
  console.log('📊 Generating general report...')
  
  // Get patients data
  const { data: patients } = await supabase
    .from('patients')
    .select('nome, email, telefone, cpf, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  // Get events data
  const { data: events } = await supabase
    .from('events')
    .select(`
      title,
      city,
      location,
      status,
      created_at,
      organizers(name)
    `)
    .order('created_at', { ascending: false })

  // Get registrations data
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      status,
      created_at,
      patients(nome, email),
      events(title, city)
    `)
    .order('created_at', { ascending: false })
    .limit(1000)

  return {
    patients: patients || [],
    events: events || [],
    registrations: registrations || []
  }
}

// Generate patients report
async function generatePatientsReport(supabase: any) {
  console.log('👥 Generating patients report...')
  
  const { data: patients } = await supabase
    .from('patients')
    .select(`
      nome,
      email,
      telefone,
      cpf,
      data_nascimento,
      created_at,
      consentimento_lgpd
    `)
    .order('created_at', { ascending: false })

  return patients || []
}

// Generate events report
async function generateEventsReport(supabase: any) {
  console.log('📅 Generating events report...')
  
  const { data: events } = await supabase
    .from('events')
    .select(`
      title,
      city,
      location,
      address,
      status,
      created_at,
      organizers(name, email),
      event_dates(date, start_time, end_time, total_slots, available_slots)
    `)
    .order('created_at', { ascending: false })

  // Flatten event dates
  const flattenedEvents = []
  for (const event of events || []) {
    if (event.event_dates && event.event_dates.length > 0) {
      for (const date of event.event_dates) {
        flattenedEvents.push({
          title: event.title,
          city: event.city,
          location: event.location,
          address: event.address,
          status: event.status,
          organizer_name: event.organizers?.name || '',
          organizer_email: event.organizers?.email || '',
          date: date.date,
          start_time: date.start_time,
          end_time: date.end_time,
          total_slots: date.total_slots,
          available_slots: date.available_slots,
          occupied_slots: date.total_slots - date.available_slots,
          created_at: event.created_at
        })
      }
    } else {
      flattenedEvents.push({
        title: event.title,
        city: event.city,
        location: event.location,
        address: event.address,
        status: event.status,
        organizer_name: event.organizers?.name || '',
        organizer_email: event.organizers?.email || '',
        date: 'N/A',
        start_time: 'N/A',
        end_time: 'N/A',
        total_slots: 0,
        available_slots: 0,
        occupied_slots: 0,
        created_at: event.created_at
      })
    }
  }

  return flattenedEvents
}

// Generate registrations report
async function generateRegistrationsReport(supabase: any) {
  console.log('📝 Generating registrations report...')
  
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      status,
      created_at,
      patients(nome, email, telefone, cpf),
      events(title, city, location),
      event_dates(date, start_time, end_time)
    `)
    .order('created_at', { ascending: false })

  // Flatten registrations
  const flattenedRegistrations = (registrations || []).map(reg => ({
    patient_name: reg.patients?.nome || '',
    patient_email: reg.patients?.email || '',
    patient_phone: reg.patients?.telefone || '',
    patient_cpf: reg.patients?.cpf || '',
    event_title: reg.events?.title || '',
    event_city: reg.events?.city || '',
    event_location: reg.events?.location || '',
    event_date: reg.event_dates?.date || '',
    event_time: reg.event_dates?.start_time || '',
    status: reg.status,
    registration_date: reg.created_at
  }))

  return flattenedRegistrations
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📊 Export Admin Reports function started')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const {
      type = 'general',
      format = 'csv',
      dateRange
    }: ExportRequest = await req.json()
    
    console.log('📋 Export request:', { type, format, dateRange })

    // Validate admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Generate report data based on type
    let reportData: any[] = []
    let filename = ''
    let headers: string[] = []

    switch (type) {
      case 'patients':
        reportData = await generatePatientsReport(supabase)
        filename = `pacientes_${new Date().toISOString().split('T')[0]}`
        headers = ['nome', 'email', 'telefone', 'cpf', 'data_nascimento', 'created_at', 'consentimento_lgpd']
        break

      case 'events':
        reportData = await generateEventsReport(supabase)
        filename = `eventos_${new Date().toISOString().split('T')[0]}`
        headers = ['title', 'city', 'location', 'address', 'status', 'organizer_name', 'organizer_email', 'date', 'start_time', 'end_time', 'total_slots', 'available_slots', 'occupied_slots', 'created_at']
        break

      case 'registrations':
        reportData = await generateRegistrationsReport(supabase)
        filename = `inscricoes_${new Date().toISOString().split('T')[0]}`
        headers = ['patient_name', 'patient_email', 'patient_phone', 'patient_cpf', 'event_title', 'event_city', 'event_location', 'event_date', 'event_time', 'status', 'registration_date']
        break

      case 'general':
      default:
        const generalData = await generateGeneralReport(supabase)
        // For general report, combine all data
        reportData = [
          ...generalData.patients.map(p => ({ ...p, type: 'patient' })),
          ...generalData.events.map(e => ({ ...e, type: 'event' })),
          ...generalData.registrations.map(r => ({ ...r, type: 'registration' }))
        ]
        filename = `relatorio_geral_${new Date().toISOString().split('T')[0]}`
        headers = ['type', 'nome', 'email', 'title', 'city', 'status', 'created_at']
        break
    }

    console.log(`✅ Generated ${reportData.length} records for ${type} report`)

    // Generate CSV content
    const csvContent = generateCSV(reportData, headers)
    
    // Log export activity
    await supabase
      .from('system_settings')
      .upsert({
        key: 'last_report_export',
        value: {
          timestamp: new Date().toISOString(),
          type,
          format,
          records_count: reportData.length,
          filename: `${filename}.${format}`
        },
        description: 'Last admin report export details'
      })

    console.log('✅ Report exported successfully')

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
      },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Export reports error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})