
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Registration {
  id: string
  status: string
  created_at: string
  name: string
  cpf: string
  email: string | null
  phone: string
  city: string
  state: string
  event_date: {
    id: string
    date: string
    start_time: string
    end_time: string
    total_slots: number
    available_slots: number
    event_id: string
    event: {
      id: string
      title: string
      location: string
      address: string
      city: string
    }
  }
}

interface CreateRegistrationData {
  name: string
  cpf: string
  birth_date: string
  gender: string
  phone: string
  email?: string
  address: string
  city: string
  state: string
  zip_code: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_history?: string
  current_medications?: string
  allergies?: string
  has_previous_eye_surgery: boolean
  wears_glasses: boolean
  main_complaint?: string
  event_date_id: string
}

export const useRegistrations = (eventId?: string, eventDateId?: string) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['registrations', eventId, eventDateId],
    queryFn: async () => {
      console.log('🔍 Buscando inscrições...', 
        eventId ? `para evento ${eventId}` : 
        eventDateId ? `para data ${eventDateId}` : 'todas')
      
      let query = supabase
        .from('registrations')
        .select(`
          id,
          status,
          created_at,
          event_date:event_dates (
            id,
            date,
            start_time,
            end_time,
            total_slots,
            available_slots,
            event_id,
            event:events (
              id,
              title,
              location,
              address,
              city
            )
          ),
          patient:patients (
            id,
            nome,
            cpf,
            email,
            telefone,
            data_nascimento,
            diagnostico
          )
        `)
        .order('created_at', { ascending: false })

      if (eventDateId) {
        // Filtrar por event_date_id específico
        query = query.eq('event_date_id', eventDateId)
      } else if (eventId) {
        // Buscar por event_date_id relacionado ao eventId
        const { data: eventDates } = await supabase
          .from('event_dates')
          .select('id')
          .eq('event_id', eventId)
        
        if (eventDates && eventDates.length > 0) {
          const eventDateIds = eventDates.map(ed => ed.id)
          query = query.in('event_date_id', eventDateIds)
        } else {
          // Se não encontrou datas para o evento, retornar array vazio
          console.log('📭 Nenhuma data encontrada para o evento:', eventId)
          return []
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar inscrições:', error)
        throw error
      }

      // Transform the data to match the expected Registration interface
      const transformedData = (data || []).map(reg => ({
        id: reg.id,
        status: reg.status,
        created_at: reg.created_at,
        name: reg.patient?.nome || '',
        cpf: reg.patient?.cpf || '',
        email: reg.patient?.email || null,
        phone: reg.patient?.telefone || '',
        city: '', // This would need to come from patient address if stored
        state: '', // This would need to come from patient address if stored
        event_date: reg.event_date
      }))

      console.log(`✅ Encontradas ${transformedData.length} inscrições`)
      return transformedData as Registration[]
    }
  })

  const createRegistration = useMutation({
    mutationFn: async (registrationData: CreateRegistrationData) => {
      console.log('📝 Criando nova inscrição:', registrationData)
      
      // First, create the patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert([{
          nome: registrationData.name,
          cpf: registrationData.cpf,
          email: registrationData.email || '',
          telefone: registrationData.phone,
          data_nascimento: registrationData.birth_date,
          consentimento_lgpd: true
        }])
        .select()
        .single()

      if (patientError) {
        console.error('❌ Erro ao criar paciente:', patientError)
        throw patientError
      }

      // Then create the registration
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .insert([{
          patient_id: patient.id,
          event_date_id: registrationData.event_date_id,
          status: 'confirmed'
        }])
        .select()
        .single()

      if (registrationError) {
        console.error('❌ Erro ao criar inscrição:', registrationError)
        throw registrationError
      }

      console.log('✅ Inscrição criada com sucesso:', registration)
      return registration
    },
    onSuccess: () => {
      // Invalidate and refetch registrations
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      toast.success('Inscrição realizada com sucesso!')
    },
    onError: (error) => {
      console.error('❌ Erro na mutação de inscrição:', error)
      toast.error('Erro ao realizar inscrição. Tente novamente.')
    }
  })

  return {
    ...query,
    createRegistration
  }
}
