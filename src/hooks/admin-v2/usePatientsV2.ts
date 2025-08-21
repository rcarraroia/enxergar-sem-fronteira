
/**
 * PATIENTS HOOK V2 - Gestão de pacientes
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface PatientV2 {
  id: string
  name: string
  email: string
  phone: string
  birth_date: string
  city: string
  state: string
  created_at: string
  _count?: {
    registrations: number
  }
}

export interface PatientFilters {
  search?: string
  city?: string
  state?: string
}

export const usePatientsV2 = (filters: PatientFilters = {}) => {
  return useQuery({
    queryKey: ['patients-v2', filters],
    queryFn: async (): Promise<PatientV2[]> => {
      try {
        console.log('🔍 [V2] Buscando pacientes com filtros:', filters)

        let query = supabase
          .from('patients')
          .select('*')

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }

        if (filters.city) {
          query = query.eq('cidade', filters.city)
        }

        if (filters.state) {
          query = query.eq('estado', filters.state)
        }

        // Ordenar por data de criação (mais recente primeiro)
        query = query.order('created_at', { ascending: false })

        const { data: patients, error } = await query

        if (error) {
          console.error('❌ [V2] Erro ao buscar pacientes:', error)
          throw error
        }

        // Mapear dados do banco para interface V2
        const processedPatients: PatientV2[] = (patients || []).map(patient => ({
          id: patient.id,
          name: patient.nome || '',
          email: patient.email || '',
          phone: patient.telefone || '',
          birth_date: patient.data_nascimento || '',
          city: patient.cidade || '',
          state: patient.estado || '',
          created_at: patient.created_at,
          _count: {
            registrations: 0 // TODO: Contar inscrições
          }
        }))

        console.log('📊 [V2] Pacientes carregados:', processedPatients.length)
        return processedPatients

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao carregar pacientes:', error)
        throw error
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  })
}
