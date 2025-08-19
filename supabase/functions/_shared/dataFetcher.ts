/**
 * Data Fetcher for Template Variables
 * Fetches patient and event data for variable substitution
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface PatientData {
  id: string
  nome: string
  email: string
  telefone: string
  cpf: string
  data_nascimento?: string
  diagnostico?: string
}

export interface EventData {
  id: string
  title: string
  location: string
  address: string
  city: string
}

export interface EventDateData {
  id: string
  date: string
  start_time: string
  end_time: string
  event: EventData
}

export interface TemplateVariableData {
  patient_name: string
  patient_email: string
  patient_phone?: string
  event_title: string
  event_date: string
  event_time: string
  event_location: string
  event_address: string
  event_city: string
  confirmation_link?: string
  unsubscribe_link?: string
}

/**
 * Fetches patient data by ID
 */
export async function fetchPatientData(
  supabase: SupabaseClient,
  patientId: string
): Promise<PatientData | null> {
  try {
    console.log('👤 Fetching patient data:', patientId)
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error) {
      console.error('❌ Error fetching patient:', error)
      return null
    }

    console.log('✅ Patient data fetched:', data.nome)
    return data as PatientData
  } catch (error) {
    console.error('❌ Exception fetching patient:', error)
    return null
  }
}

/**
 * Fetches event date data with event details
 */
export async function fetchEventDateData(
  supabase: SupabaseClient,
  eventDateId: string
): Promise<EventDateData | null> {
  try {
    console.log('📅 Fetching event date data:', eventDateId)
    
    const { data, error } = await supabase
      .from('event_dates')
      .select(`
        id,
        date,
        start_time,
        end_time,
        events (
          id,
          title,
          location,
          address,
          city
        )
      `)
      .eq('id', eventDateId)
      .single()

    if (error) {
      console.error('❌ Error fetching event date:', error)
      return null
    }

    console.log('✅ Event date data fetched:', data.events?.title)
    return data as EventDateData
  } catch (error) {
    console.error('❌ Exception fetching event date:', error)
    return null
  }
}

/**
 * Fetches registration data with patient and event details
 */
export async function fetchRegistrationData(
  supabase: SupabaseClient,
  registrationId: string
): Promise<{ patient: PatientData; eventDate: EventDateData } | null> {
  try {
    console.log('📝 Fetching registration data:', registrationId)
    
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        patients (
          id,
          nome,
          email,
          telefone,
          cpf,
          data_nascimento,
          diagnostico
        ),
        event_dates (
          id,
          date,
          start_time,
          end_time,
          events (
            id,
            title,
            location,
            address,
            city
          )
        )
      `)
      .eq('id', registrationId)
      .single()

    if (error) {
      console.error('❌ Error fetching registration:', error)
      return null
    }

    if (!data.patients || !data.event_dates) {
      console.error('❌ Missing patient or event data in registration')
      return null
    }

    console.log('✅ Registration data fetched:', data.patients.nome, '-', data.event_dates.events?.title)
    
    return {
      patient: data.patients as PatientData,
      eventDate: data.event_dates as EventDateData
    }
  } catch (error) {
    console.error('❌ Exception fetching registration:', error)
    return null
  }
}

/**
 * Formats date to Brazilian format (DD/MM/YYYY)
 */
function formatDate(dateString: string): string {
  if (!dateString) return ''
  
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Formats time to HH:MM format
 */
function formatTime(timeString: string): string {
  if (!timeString) return ''
  
  return timeString.slice(0, 5)
}

/**
 * Generates confirmation link for a registration
 */
function generateConfirmationLink(registrationId: string, baseUrl?: string): string {
  const domain = baseUrl || 'https://enxergarsemfronteira.com.br'
  return `${domain}/confirm/${registrationId}`
}

/**
 * Generates unsubscribe link for a patient
 */
function generateUnsubscribeLink(patientId: string, baseUrl?: string): string {
  const domain = baseUrl || 'https://enxergarsemfronteira.com.br'
  return `${domain}/unsubscribe/${patientId}`
}

/**
 * Converts patient and event data to template variables
 */
export function buildTemplateVariables(
  patient: PatientData,
  eventDate: EventDateData,
  options: {
    registrationId?: string
    baseUrl?: string
    includeLinks?: boolean
  } = {}
): TemplateVariableData {
  const variables: TemplateVariableData = {
    patient_name: patient.nome,
    patient_email: patient.email,
    patient_phone: patient.telefone,
    event_title: eventDate.event.title,
    event_date: formatDate(eventDate.date),
    event_time: `${formatTime(eventDate.start_time)} - ${formatTime(eventDate.end_time)}`,
    event_location: eventDate.event.location,
    event_address: eventDate.event.address,
    event_city: eventDate.event.city
  }

  // Add optional links
  if (options.includeLinks) {
    if (options.registrationId) {
      variables.confirmation_link = generateConfirmationLink(options.registrationId, options.baseUrl)
    }
    variables.unsubscribe_link = generateUnsubscribeLink(patient.id, options.baseUrl)
  }

  return variables
}

/**
 * Fetches and builds template variables from registration ID
 */
export async function fetchTemplateVariables(
  supabase: SupabaseClient,
  registrationId: string,
  options: {
    baseUrl?: string
    includeLinks?: boolean
  } = {}
): Promise<TemplateVariableData | null> {
  try {
    console.log('🔍 Fetching template variables for registration:', registrationId)
    
    const registrationData = await fetchRegistrationData(supabase, registrationId)
    
    if (!registrationData) {
      console.error('❌ Could not fetch registration data')
      return null
    }

    const variables = buildTemplateVariables(
      registrationData.patient,
      registrationData.eventDate,
      {
        ...options,
        registrationId
      }
    )

    console.log('✅ Template variables built:', Object.keys(variables))
    return variables
  } catch (error) {
    console.error('❌ Error fetching template variables:', error)
    return null
  }
}

/**
 * Fetches template variables from separate patient and event date IDs
 */
export async function fetchTemplateVariablesSeparate(
  supabase: SupabaseClient,
  patientId: string,
  eventDateId: string,
  options: {
    baseUrl?: string
    includeLinks?: boolean
  } = {}
): Promise<TemplateVariableData | null> {
  try {
    console.log('🔍 Fetching template variables separately:', { patientId, eventDateId })
    
    const [patient, eventDate] = await Promise.all([
      fetchPatientData(supabase, patientId),
      fetchEventDateData(supabase, eventDateId)
    ])

    if (!patient || !eventDate) {
      console.error('❌ Could not fetch patient or event data')
      return null
    }

    const variables = buildTemplateVariables(patient, eventDate, options)

    console.log('✅ Template variables built separately:', Object.keys(variables))
    return variables
  } catch (error) {
    console.error('❌ Error fetching template variables separately:', error)
    return null
  }
}

/**
 * Validates that all required variables are present
 */
export function validateTemplateVariables(
  variables: TemplateVariableData,
  requiredVariables: string[] = ['patient_name', 'event_title', 'event_date']
): { isValid: boolean; missingVariables: string[] } {
  const missingVariables: string[] = []
  
  for (const required of requiredVariables) {
    const value = variables[required as keyof TemplateVariableData]
    if (!value || value.trim() === '') {
      missingVariables.push(required)
    }
  }

  return {
    isValid: missingVariables.length === 0,
    missingVariables
  }
}

/**
 * Creates sample template variables for testing
 */
export function createSampleTemplateVariables(): TemplateVariableData {
  return {
    patient_name: 'Maria Silva Santos',
    patient_email: 'maria.silva@email.com',
    patient_phone: '31999887766',
    event_title: 'Atendimento Oftalmológico Gratuito',
    event_date: '22/08/2025',
    event_time: '08:00 - 18:00',
    event_location: 'Paróquia São José',
    event_address: 'Rua das Flores, 123 - Centro, Timóteo - MG',
    event_city: 'Timóteo',
    confirmation_link: 'https://enxergarsemfronteira.com.br/confirm/sample123',
    unsubscribe_link: 'https://enxergarsemfronteira.com.br/unsubscribe/sample123'
  }
}