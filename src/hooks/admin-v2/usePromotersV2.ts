
/**
 * PROMOTERS HOOK V2 - Gestão de promotores (versão simplificada)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface PromoterV2 {
    id: string
    name: string
    email: string
    phone?: string
    status: 'active' | 'inactive' | 'pending'
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
}

export interface PromoterFilters {
    search?: string
    status?: string
}

// Hook para buscar promotores
export const usePromotersV2 = (filters: PromoterFilters = {}) => {
    return useQuery({
        queryKey: ['promoters-v2', filters],
        queryFn: async (): Promise<PromoterV2[]> => {
            try {
                console.log('🔍 [V2] Buscando promotores com filtros:', filters)

                // Buscar diretamente da tabela organizers
                let query = supabase
                    .from('organizers')
                    .select('*')

                // Aplicar filtros
                if (filters.search) {
                    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
                }

                if (filters.status) {
                    query = query.eq('status', filters.status)
                }

                const { data: promoters, error } = await query.order('created_at', { ascending: false })

                if (error) {
                    console.error('❌ [V2] Erro ao buscar promoters:', error)
                    throw error
                }

                // Buscar contagem de eventos para cada promoter
                const promotersWithEventCount = await Promise.all(
                    (promoters || []).map(async (promoter) => {
                        let eventsCount = 0
                        try {
                            const { count } = await supabase
                                .from('events')
                                .select('*', { count: 'exact', head: true })
                                .eq('organizer_id', promoter.id)
                            eventsCount = count || 0
                        } catch (error) {
                            console.warn('⚠️ [V2] Erro ao contar eventos para promoter:', promoter.id)
                        }

                        return {
                            ...promoter,
                            events_count: eventsCount
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
        staleTime: 5000,
        refetchOnWindowFocus: true
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

                return {
                    totalPromoters: totalPromoters || 0,
                    statusCounts,
                    recentPromoters: recentPromoters || 0,
                    topCities: []
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
                const { data: existingPromoter, error: checkError } = await supabase
                    .from('organizers')
                    .select('id, email')
                    .eq('email', data.email)
                    .maybeSingle()

                if (checkError && checkError.code !== 'PGRST116') {
                    console.error('❌ [V2] Erro ao verificar email existente:', checkError)
                    throw checkError
                }

                if (existingPromoter) {
                    throw new Error('Já existe um promoter com este email')
                }

                // Criar promoter diretamente na tabela
                const { data: newPromoter, error: insertError } = await supabase
                    .from('organizers')
                    .insert({
                        name: data.name,
                        email: data.email,
                        phone: data.phone || null,
                        status: 'active'
                    })
                    .select()
                    .single()

                if (insertError) {
                    console.error('❌ [V2] Erro ao criar promoter:', insertError)
                    throw insertError
                }

                console.log('✅ [V2] Promoter criado com sucesso:', newPromoter.id)
                return { promoter: newPromoter, credentials: { email: data.email, password: data.password } }

            } catch (error: any) {
                console.error('❌ [V2] Erro crítico ao criar promoter:', error)
                throw error
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
            queryClient.invalidateQueries({ queryKey: ['promoter-stats-v2'] })
            toast.success(`Promoter criado! Use "Esqueci minha senha" no login com: ${result.credentials.email}`)
        },
        onError: (error: any) => {
            console.error('❌ [V2] Erro na criação:', error)
            if (error.message === 'Já existe um promoter com este email') {
                toast.error('Já existe um promoter com este email')
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

                const updateData: any = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone || null
                }

                if (data.asaas_api_key !== undefined) {
                    updateData.asaas_api_key = data.asaas_api_key || null
                }

                const { error } = await supabase
                    .from('organizers')
                    .update(updateData)
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
                    .update({ status })
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

// Hook para deletar promoter
export const useDeletePromoterV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            try {
                console.log('🗑️ [V2] Deletando promoter:', id)

                const { error } = await supabase
                    .from('organizers')
                    .delete()
                    .eq('id', id)

                if (error) {
                    console.error('❌ [V2] Erro ao deletar promoter:', error)
                    throw error
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
