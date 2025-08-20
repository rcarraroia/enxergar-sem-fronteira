/**
 * PROMOTERS HOOK V2 - Gestão de promotores com cadastro direto
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface PromoterV2 {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  state?: string
  status: 'active' | 'inactive' | 'pending'
  role: 'admin' | 'organizer'
  asaas_api_key?: string
  events_count?: number
  created_at: string
  updated_at?: string
}

export interface PromoterCreation {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
  state?: string
}

export interface PromoterFilters {
  search?: string
  status?: string
  city?: string
}

// Hook para buscar promotores
export const usePromotersV2 = (filters: PromoterFilters = {}) => {
  return useQuery({
    queryKey: ['promoters-v2', filters],
    queryFn: async (): Promise<PromoterV2[]> => {
      try {
        console.log('🔍 [V2] Buscando promotores com filtros:', filters)

        let query = supabase
          .from('organizers')
          .select('*')

        // Aplicar filtros
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
        }

        if (filters.status) {
          query = query.eq('status', filters.status)
        }

        if (filters.city) {
          query = query.eq('city', filters.city)
        }

        // Ordenar por data de criação (mais recente primeiro)
        query = query.order('created_at', { ascending: false })

        const { data: promoters, error } = await query

        if (error) {
          console.error('❌ [V2] Erro ao buscar promotores:', error)
          throw error
        }

        // Buscar contagem de eventos para cada promoter
        const promotersWithEventCount = await Promise.all(
          (promoters || []).map(async (promoter) => {
            const { count } = await supabase
              .from('events')
              .select('*', { count: 'exact', head: true })
              .eq('organizer_id', promoter.id)

            return {
              ...promoter,
              events_count: count || 0
            }
          })
        )

        console.log('📊 [V2] Promotores carregados:', promotersWithEventCount.length)
        return promotersWithEventCount

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao carregar promotores:', error)
        throw error
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  })
}

// Hook para estatísticas de promotores
export const usePromoterStatsV2 = () => {
  return useQuery({
    queryKey: ['promoter-stats-v2'],
    queryFn: async () => {
      try {
        console.log('🔍 [V2] Buscando estatísticas de promotores...')

        // Total de promotores
        const { count: totalPromoters } = await supabase
          .from('organizers')
          .select('*', { count: 'exact', head: true })

        // Promotores por status
        const { data: statusData } = await supabase
          .from('organizers')
          .select('status')

        const statusCounts = statusData?.reduce((acc, promoter) => {
          const status = promoter.status || 'active'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // Promotores recentes (últimos 30 dias)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: recentPromoters } = await supabase
          .from('organizers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString())

        // Top cidades
        const { data: cityData } = await supabase
          .from('organizers')
          .select('city')
          .not('city', 'is', null)

        const cityCounts = cityData?.reduce((acc, promoter) => {
          const city = promoter.city
          if (city) {
            acc[city] = (acc[city] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>) || {}

        const topCities = Object.entries(cityCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([city, count]) => ({ city, count }))

        return {
          totalPromoters: totalPromoters || 0,
          statusCounts,
          recentPromoters: recentPromoters || 0,
          topCities
        }

      } catch (error) {
        console.error('❌ [V2] Erro ao carregar estatísticas:', error)
        return {
          totalPromoters: 0,
          statusCounts: {},
          recentPromoters: 0,
          topCities: []
        }
      }
    },
    staleTime: 60000
  })
}

// Função para gerar senha segura
export const generateSecurePassword = (): string => {
  const length = 12
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  
  // Garantir pelo menos um de cada tipo
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
  password += "0123456789"[Math.floor(Math.random() * 10)]
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]
  
  // Completar o resto
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Embaralhar
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Hook para criar promoter
export const useCreatePromoterV2 = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PromoterCreation) => {
      try {
        console.log('🔨 [V2] Criando promoter:', { ...data, password: '[HIDDEN]' })

        // Verificar se já existe um promoter com este email
        const { data: existingPromoter } = await supabase
          .from('organizers')
          .select('id, email')
          .eq('email', data.email)
          .single()

        if (existingPromoter) {
          throw new Error('Já existe um promoter com este email')
        }

        // 1. Criar usuário no Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            name: data.name,
            role: 'organizer'
          }
        })

        if (authError) {
          console.error('❌ [V2] Erro ao criar usuário no Auth:', authError)
          throw authError
        }

        // 2. Criar registro na tabela organizers
        const { data: promoter, error: dbError } = await supabase
          .from('organizers')
          .insert({
            id: authUser.user.id, // Usar mesmo ID do Auth
            name: data.name,
            email: data.email,
            phone: data.phone,
            city: data.city,
            state: data.state,
            status: 'active',
            role: 'organizer'
          })
          .select()
          .single()

        if (dbError) {
          console.error('❌ [V2] Erro ao criar promoter no banco:', dbError)
          // Se falhou no banco, tentar limpar o usuário do Auth
          try {
            await supabase.auth.admin.deleteUser(authUser.user.id)
          } catch (cleanupError) {
            console.error('❌ [V2] Erro ao limpar usuário do Auth:', cleanupError)
          }
          throw dbError
        }

        console.log('✅ [V2] Promoter criado com sucesso:', promoter.id)
        return { promoter, credentials: { email: data.email, password: data.password } }

      } catch (error: any) {
        console.error('❌ [V2] Erro crítico ao criar promoter:', error)
        throw error
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
      queryClient.invalidateQueries({ queryKey: ['promoter-stats-v2'] })
      toast.success(`Promoter criado com sucesso! Credenciais: ${result.credentials.email}`)
    },
    onError: (error: any) => {
      console.error('❌ [V2] Erro na criação:', error)
      if (error.message === 'Já existe um promoter com este email') {
        toast.error('Já existe um promoter com este email')
      } else if (error.message?.includes('User already registered')) {
        toast.error('Este email já está registrado no sistema')
      } else {
        toast.error('Erro ao criar promoter: ' + (error.message || 'Erro desconhecido'))
      }
    }
  })
}

// Hook para atualizar promoter
export const useUpdatePromoterV2 = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<PromoterV2> }) => {
      try {
        console.log('✏️ [V2] Atualizando promoter:', id, data)

        const { error } = await supabase
          .from('organizers')
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            city: data.city,
            state: data.state,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          console.error('❌ [V2] Erro ao atualizar promoter:', error)
          throw error
        }

        console.log('✅ [V2] Promoter atualizado com sucesso:', id)
        return id

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao atualizar promoter:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
      toast.success('Promoter atualizado com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [V2] Erro na atualização:', error)
      toast.error('Erro ao atualizar promoter: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

// Hook para atualizar status do promoter
export const useUpdatePromoterStatusV2 = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'inactive' }) => {
      try {
        console.log('🔄 [V2] Atualizando status do promoter:', id, status)

        const { error } = await supabase
          .from('organizers')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          console.error('❌ [V2] Erro ao atualizar status:', error)
          throw error
        }

        console.log('✅ [V2] Status atualizado com sucesso:', id)
        return id

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao atualizar status:', error)
        throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
      queryClient.invalidateQueries({ queryKey: ['promoter-stats-v2'] })
      const statusText = variables.status === 'active' ? 'ativado' : 'desativado'
      toast.success(`Promoter ${statusText} com sucesso!`)
    },
    onError: (error: any) => {
      console.error('❌ [V2] Erro na atualização de status:', error)
      toast.error('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

// Hook para resetar senha do promoter
export const useResetPromoterPasswordV2 = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string, newPassword: string }) => {
      try {
        console.log('🔑 [V2] Resetando senha do promoter:', id)

        // Atualizar senha no Supabase Auth
        const { error } = await supabase.auth.admin.updateUserById(id, {
          password: newPassword
        })

        if (error) {
          console.error('❌ [V2] Erro ao resetar senha:', error)
          throw error
        }

        console.log('✅ [V2] Senha resetada com sucesso:', id)
        return { id, newPassword }

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao resetar senha:', error)
        throw error
      }
    },
    onSuccess: (result) => {
      toast.success(`Senha resetada com sucesso! Nova senha: ${result.newPassword}`)
    },
    onError: (error: any) => {
      console.error('❌ [V2] Erro no reset de senha:', error)
      toast.error('Erro ao resetar senha: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

// Hook para deletar promoter
export const useDeletePromoterV2 = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        console.log('🗑️ [V2] Deletando promoter:', id)

        // Verificar se tem eventos associados
        const { count: eventsCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organizer_id', id)

        if (eventsCount && eventsCount > 0) {
          throw new Error(`Não é possível excluir este promoter pois ele possui ${eventsCount} evento(s) associado(s)`)
        }

        // Deletar do banco
        const { error: dbError } = await supabase
          .from('organizers')
          .delete()
          .eq('id', id)

        if (dbError) {
          console.error('❌ [V2] Erro ao deletar do banco:', dbError)
          throw dbError
        }

        // Deletar do Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(id)
        if (authError) {
          console.warn('⚠️ [V2] Erro ao deletar do Auth (pode não existir):', authError)
        }

        console.log('✅ [V2] Promoter deletado com sucesso:', id)
        return id

      } catch (error) {
        console.error('❌ [V2] Erro crítico ao deletar promoter:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
      queryClient.invalidateQueries({ queryKey: ['promoter-stats-v2'] })
      toast.success('Promoter excluído com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [V2] Erro na exclusão:', error)
      toast.error('Erro ao excluir promoter: ' + (error.message || 'Erro desconhecido'))
    }
  })
}