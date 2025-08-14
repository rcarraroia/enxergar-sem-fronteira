
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const usePatientTokens = () => {
  const [loading, setLoading] = useState(false)

  const generatePatientToken = async (patientId: string, eventDateId: string) => {
    try {
      setLoading(true)

      // Verificar se já existe um token para este paciente e data do evento
      const { data: existingToken } = await supabase
        .from('patient_access_tokens')
        .select('token')
        .eq('patient_id', patientId)
        .eq('event_date_id', eventDateId)
        .single()

      if (existingToken) {
        return existingToken.token
      }

      // Gerar novo token
      const { data, error } = await supabase
        .rpc('generate_access_token')

      if (error) throw error

      const token = data

      // Salvar token no banco
      const { error: insertError } = await supabase
        .from('patient_access_tokens')
        .insert({
          patient_id: patientId,
          token,
          event_date_id: eventDateId
        })

      if (insertError) throw insertError

      return token
    } catch (error) {
      console.error('Erro ao gerar token do paciente:', error)
      toast.error('Erro ao gerar link de acesso')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getPatientByToken = async (token: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('patient_access_tokens')
        .select(`
          *,
          patient:patients(*),
          event_date:event_dates(
            *,
            event:events(*)
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao buscar paciente por token:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    generatePatientToken,
    getPatientByToken
  }
}
