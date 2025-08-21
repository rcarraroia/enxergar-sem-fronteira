/**
 * CAMPAIGNS HOOK V2 - Gestão de campanhas de doação
 * Implementa regras de split automático e lógica de negócio
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface CampaignV2 {
    id: string
    title: string
    description: string
    goal_amount: number
    raised_amount: number
    start_date: string
    end_date: string
    status: 'active' | 'inactive' | 'completed' | 'draft'
    donation_type: 'one_time' | 'recurring' | 'both'
    suggested_amounts: number[]
    allow_custom_amount: boolean
    created_by: string
    created_at: string
    updated_at: string
    // Campos calculados
    progress_percentage?: number
    days_remaining?: number
    total_donors?: number
}

export interface CampaignCreation {
    title: string
    description: string
    goal_amount: number
    start_date: string
    end_date: string
    donation_type: 'one_time' | 'recurring' | 'both'
    suggested_amounts: number[]
    allow_custom_amount: boolean
}

export interface CampaignFilters {
    search?: string
    status?: string
    donation_type?: string
}

export interface DonationSplit {
    donation_id: string
    total_amount: number
    ong_amount: number          // ONG Coração Valente
    project_amount: number      // Projeto Visão Itinerante
    renum_amount: number        // Renum (Sistema)
    promoter_amount: number     // Promoter Local
    promoter_id?: string
    split_type: 'first_donation' | 'recurring_subsequent' | 'promoter_fallback'
    created_at: string
}

export interface CampaignStats {
    total_campaigns: number
    active_campaigns: number
    total_raised: number
    total_donors: number
    avg_donation: number
    completion_rate: number
}

// Hook para buscar campanhas
export const useCampaignsV2 = (filters: CampaignFilters = {}) => {
    return useQuery({
        queryKey: ['campaigns-v2', filters],
        queryFn: async (): Promise<CampaignV2[]> => {
            try {
                console.log('🔍 [Campaigns V2] Buscando campanhas com filtros:', filters)

                // Usar função que bypassa RLS (será criada)
                const { data: campaigns, error } = await supabase
                    .rpc('get_all_campaigns')

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao buscar campanhas:', error)
                    throw error
                }

                // Aplicar filtros no lado cliente
                let filteredCampaigns = campaigns || []

                if (filters.search) {
                    const searchLower = filters.search.toLowerCase()
                    filteredCampaigns = filteredCampaigns.filter(campaign => 
                        campaign.title?.toLowerCase().includes(searchLower) ||
                        campaign.description?.toLowerCase().includes(searchLower)
                    )
                }

                if (filters.status) {
                    filteredCampaigns = filteredCampaigns.filter(campaign => 
                        campaign.status === filters.status
                    )
                }

                if (filters.donation_type) {
                    filteredCampaigns = filteredCampaigns.filter(campaign => 
                        campaign.donation_type === filters.donation_type
                    )
                }

                // Calcular campos adicionais
                const campaignsWithCalculations = filteredCampaigns.map(campaign => ({
                    ...campaign,
                    progress_percentage: Math.min((campaign.raised_amount / campaign.goal_amount) * 100, 100),
                    days_remaining: Math.max(0, Math.ceil(
                        (new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    ))
                }))

                console.log('📊 [Campaigns V2] Campanhas carregadas:', campaignsWithCalculations.length)
                return campaignsWithCalculations

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao carregar campanhas:', error)
                throw error
            }
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    })
}

// Hook para estatísticas de campanhas
export const useCampaignStatsV2 = () => {
    return useQuery({
        queryKey: ['campaign-stats-v2'],
        queryFn: async (): Promise<CampaignStats> => {
            try {
                console.log('🔍 [Campaigns V2] Buscando estatísticas...')

                // Buscar estatísticas via função SQL
                const { data: stats, error } = await supabase
                    .rpc('get_campaign_stats')

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao buscar estatísticas:', error)
                    throw error
                }

                return stats || {
                    total_campaigns: 0,
                    active_campaigns: 0,
                    total_raised: 0,
                    total_donors: 0,
                    avg_donation: 0,
                    completion_rate: 0
                }

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro ao carregar estatísticas:', error)
                return {
                    total_campaigns: 0,
                    active_campaigns: 0,
                    total_raised: 0,
                    total_donors: 0,
                    avg_donation: 0,
                    completion_rate: 0
                }
            }
        },
        staleTime: 60000
    })
}

// Hook para criar campanha
export const useCreateCampaignV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CampaignCreation) => {
            try {
                console.log('🔨 [Campaigns V2] Criando campanha:', { ...data, description: '[TRUNCATED]' })

                // Validações de negócio
                if (new Date(data.start_date) >= new Date(data.end_date)) {
                    throw new Error('Data de início deve ser anterior à data de fim')
                }

                if (data.goal_amount <= 0) {
                    throw new Error('Meta de arrecadação deve ser maior que zero')
                }

                // Usar função que bypassa RLS
                const { data: campaignId, error } = await supabase
                    .rpc('admin_create_campaign', {
                        p_title: data.title,
                        p_description: data.description,
                        p_goal_amount: data.goal_amount,
                        p_start_date: data.start_date,
                        p_end_date: data.end_date,
                        p_donation_type: data.donation_type,
                        p_suggested_amounts: data.suggested_amounts,
                        p_allow_custom_amount: data.allow_custom_amount
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao criar campanha:', error)
                    throw error
                }

                console.log('✅ [Campaigns V2] Campanha criada com sucesso:', campaignId)
                return campaignId

            } catch (error: any) {
                console.error('❌ [Campaigns V2] Erro crítico ao criar campanha:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns-v2'] })
            queryClient.invalidateQueries({ queryKey: ['campaign-stats-v2'] })
            toast.success('Campanha criada com sucesso!')
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro na criação:', error)
            toast.error('Erro ao criar campanha: ' + (error.message || 'Erro desconhecido'))
        }
    })
}

// Hook para atualizar campanha
export const useUpdateCampaignV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<CampaignV2> }) => {
            try {
                console.log('✏️ [Campaigns V2] Atualizando campanha:', id)

                // Usar função que bypassa RLS
                const { error } = await supabase
                    .rpc('admin_update_campaign', {
                        p_campaign_id: id,
                        p_title: data.title,
                        p_description: data.description,
                        p_goal_amount: data.goal_amount,
                        p_start_date: data.start_date,
                        p_end_date: data.end_date,
                        p_donation_type: data.donation_type,
                        p_suggested_amounts: data.suggested_amounts,
                        p_allow_custom_amount: data.allow_custom_amount,
                        p_status: data.status
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao atualizar campanha:', error)
                    throw error
                }

                console.log('✅ [Campaigns V2] Campanha atualizada com sucesso:', id)
                return id

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao atualizar campanha:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns-v2'] })
            queryClient.invalidateQueries({ queryKey: ['campaign-stats-v2'] })
            toast.success('Campanha atualizada com sucesso!')
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro na atualização:', error)
            toast.error('Erro ao atualizar campanha: ' + (error.message || 'Erro desconhecido'))
        }
    })
}

// Hook para deletar campanha
export const useDeleteCampaignV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            try {
                console.log('🗑️ [Campaigns V2] Deletando campanha:', id)

                // Usar função que bypassa RLS e verifica doações
                const { data: result, error } = await supabase
                    .rpc('admin_delete_campaign', {
                        p_campaign_id: id
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao deletar campanha:', error)
                    throw error
                }

                console.log('✅ [Campaigns V2] Campanha deletada com sucesso:', id)
                return id

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao deletar campanha:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns-v2'] })
            queryClient.invalidateQueries({ queryKey: ['campaign-stats-v2'] })
            toast.success('Campanha excluída com sucesso!')
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro na exclusão:', error)
            toast.error('Erro ao excluir campanha: ' + (error.message || 'Erro desconhecido'))
        }
    })
}

// Hook para processar doação com split automático
export const useProcessDonationV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (donationData: {
            campaign_id: string
            amount: number
            donor_email: string
            donor_name: string
            donation_type: 'one_time' | 'recurring'
            promoter_id?: string
            is_recurring_subsequent?: boolean
        }) => {
            try {
                console.log('💰 [Campaigns V2] Processando doação com split:', donationData)

                // Processar doação com regras de split automático
                const { data: result, error } = await supabase
                    .rpc('process_donation_with_split', {
                        p_campaign_id: donationData.campaign_id,
                        p_amount: donationData.amount,
                        p_donor_email: donationData.donor_email,
                        p_donor_name: donationData.donor_name,
                        p_donation_type: donationData.donation_type,
                        p_promoter_id: donationData.promoter_id,
                        p_is_recurring_subsequent: donationData.is_recurring_subsequent || false
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao processar doação:', error)
                    throw error
                }

                console.log('✅ [Campaigns V2] Doação processada com split:', result)
                return result

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao processar doação:', error)
                throw error
            }
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns-v2'] })
            queryClient.invalidateQueries({ queryKey: ['campaign-stats-v2'] })
            toast.success(`Doação de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.amount)} processada com sucesso!`)
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro no processamento:', error)
            toast.error('Erro ao processar doação: ' + (error.message || 'Erro desconhecido'))
        }
    })
}

// Hook para buscar relatório de split de uma campanha
export const useCampaignSplitReportV2 = (campaignId: string) => {
    return useQuery({
        queryKey: ['campaign-split-report-v2', campaignId],
        queryFn: async (): Promise<DonationSplit[]> => {
            try {
                console.log('📊 [Campaigns V2] Buscando relatório de split:', campaignId)

                const { data: splits, error } = await supabase
                    .rpc('get_campaign_split_report', {
                        p_campaign_id: campaignId
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao buscar relatório:', error)
                    throw error
                }

                return splits || []

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao buscar relatório:', error)
                throw error
            }
        },
        enabled: !!campaignId,
        staleTime: 60000
    })
}

// Hook para enviar comunicação da campanha
export const useSendCampaignCommunicationV2 = () => {
    return useMutation({
        mutationFn: async (communicationData: {
            campaign_id: string
            message_type: 'email' | 'sms' | 'whatsapp'
            subject?: string
            message: string
            recipient_list: 'all_patients' | 'campaign_donors' | 'custom'
            custom_recipients?: string[]
        }) => {
            try {
                console.log('📧 [Campaigns V2] Enviando comunicação:', communicationData)

                // Enviar comunicação via módulo de mensagens
                const { data: result, error } = await supabase
                    .rpc('send_campaign_communication', {
                        p_campaign_id: communicationData.campaign_id,
                        p_message_type: communicationData.message_type,
                        p_subject: communicationData.subject,
                        p_message: communicationData.message,
                        p_recipient_list: communicationData.recipient_list,
                        p_custom_recipients: communicationData.custom_recipients
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao enviar comunicação:', error)
                    throw error
                }

                console.log('✅ [Campaigns V2] Comunicação enviada:', result)
                return result

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao enviar comunicação:', error)
                throw error
            }
        },
        onSuccess: (result) => {
            toast.success(`Comunicação enviada para ${result.sent_count} destinatários!`)
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro no envio:', error)
            toast.error('Erro ao enviar comunicação: ' + (error.message || 'Erro desconhecido'))
        }
    })
}

// Hook para atualizar status da campanha
export const useUpdateCampaignStatusV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, status }: { id: string, status: CampaignV2['status'] }) => {
            try {
                console.log('🔄 [Campaigns V2] Atualizando status da campanha:', id, status)

                const { error } = await supabase
                    .rpc('admin_update_campaign_status', {
                        p_campaign_id: id,
                        p_status: status
                    })

                if (error) {
                    console.error('❌ [Campaigns V2] Erro ao atualizar status:', error)
                    throw error
                }

                console.log('✅ [Campaigns V2] Status atualizado com sucesso:', id)
                return id

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao atualizar status:', error)
                throw error
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['campaigns-v2'] })
            queryClient.invalidateQueries({ queryKey: ['campaign-stats-v2'] })
            const statusText = {
                active: 'ativada',
                inactive: 'desativada',
                completed: 'concluída',
                draft: 'marcada como rascunho'
            }[variables.status]
            toast.success(`Campanha ${statusText} com sucesso!`)
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro na atualização de status:', error)
            toast.error('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'))
        }
    })
}