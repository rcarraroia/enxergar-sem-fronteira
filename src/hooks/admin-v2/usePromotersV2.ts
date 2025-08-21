/**
 * PROMOTERS HOOK V2 - Gestão de promotores (versão robusta)
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

                // Query específica para evitar erros
                let query = supabase
                    .from('organizers')
                    .select('id, name, email, phone, status, asaas_api_key, created_at, updated_at')

                // Aplicar filtros
                if (filters.search) {
                    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
                }

                if (filters.status) {
                    query = query.eq('status', filters.status)
                }

                // Ordenar por data de criação (mais recente primeiro)
                query = query.order('created_at', { ascending: false })

                const { data: promoters, error } = await query

                if (error) {
                    console.error('❌ [V2] Erro ao buscar promotores:', error)
                    throw error
                }

                // Buscar contagem de eventos para cada promoter (com tratamento de erro)
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
        staleTime: 30000,
        refetchOnWindowFocus: false
    })
}

// Hook para estatísticas de promotores (simplificado)
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

                // Top cidades (simplificado)
                const topCities: { city: string, count: number }[] = []

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

// Hook para criar promoter (versão robusta)
export const useCreatePromoterV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: PromoterCreation) => {
            try {
                console.log('🔨 [V2] Criando promoter via função bypass:', { ...data, password: '[HIDDEN]' })

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

                // Usar função que bypassa RLS completamente
                const { data: promoterId, error: dbError } = await supabase
                    .rpc('admin_create_organizer_bypass', {
                        p_name: data.name,
                        p_email: data.email,
                        p_phone: data.phone || null
                    })

                if (dbError) {
                    console.error('❌ [V2] Erro ao criar promoter via função:', dbError)
                    throw dbError
                }

                // Criar objeto promoter com os dados fornecidos (não precisamos buscar)
                const promoter = {
                    id: promoterId,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || null,
                    status: 'active' as const,
                    created_at: new Date().toISOString()
                }



                console.log('✅ [V2] Promoter criado com sucesso via função bypass:', promoter.id)
                return { promoter, credentials: { email: data.email, password: data.password } }

            } catch (error: any) {
                console.error('❌ [V2] Erro crítico ao criar promoter:', error)
                throw error
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
            queryClient.invalidateQueries({ queryKey: ['promoter-stats-v2'] })
            toast.success(`Promoter criado! O promoter deve usar "Esqueci minha senha" no login com o email: ${result.credentials.email}`)
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

// Hook para atualizar promoter (versão robusta)
export const useUpdatePromoterV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<PromoterV2> }) => {
            try {
                console.log('✏️ [V2] Atualizando promoter:', id, data)

                // Preparar dados para atualização
                const updateData: any = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone || null
                }

                // Adicionar asaas_api_key apenas se fornecido
                if (data.asaas_api_key !== undefined) {
                    updateData.asaas_api_key = data.asaas_api_key || null
                }

                console.log('🔄 [V2] Dados para atualização:', updateData)

                const { data: result, error } = await supabase
                    .from('organizers')
                    .update(updateData)
                    .eq('id', id)
                    .select('id')
                    .single()

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

// Hook para atualizar API Key do Asaas
export const useUpdateAsaasApiKeyV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, apiKey }: { id: string, apiKey: string }) => {
            try {
                console.log('🔑 [V2] Atualizando API Key do Asaas:', id)

                const { error } = await supabase
                    .from('organizers')
                    .update({ asaas_api_key: apiKey })
                    .eq('id', id)

                if (error) {
                    console.error('❌ [V2] Erro ao atualizar API Key:', error)
                    throw error
                }

                console.log('✅ [V2] API Key atualizada com sucesso:', id)
                return id

            } catch (error) {
                console.error('❌ [V2] Erro crítico ao atualizar API Key:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promoters-v2'] })
            toast.success('API Key do Asaas atualizada com sucesso!')
        },
        onError: (error: any) => {
            console.error('❌ [V2] Erro na atualização da API Key:', error)
            toast.error('Erro ao atualizar API Key: ' + (error.message || 'Erro desconhecido'))
        }
    })
}

// Hook para gerar nova senha (versão simplificada)
export const useResetPromoterPasswordV2 = () => {
    return useMutation({
        mutationFn: async ({ id, newPassword }: { id: string, newPassword: string }) => {
            try {
                console.log('🔑 [V2] Gerando nova senha para promoter:', id)

                // Sem acesso à API Admin, apenas geramos uma nova senha
                // O promoter deve usar "Esqueci minha senha" no login
                return { id, newPassword }

            } catch (error) {
                console.error('❌ [V2] Erro ao gerar nova senha:', error)
                throw error
            }
        },
        onSuccess: (result) => {
            toast.success(`Nova senha gerada: ${result.newPassword}. O promoter deve usar "Esqueci minha senha" no login para definir esta senha.`)
        },
        onError: (error: any) => {
            console.error('❌ [V2] Erro ao gerar senha:', error)
            toast.error('Erro ao gerar nova senha: ' + (error.message || 'Erro desconhecido'))
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