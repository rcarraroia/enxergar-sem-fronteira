
/**
 * CAMPAIGNS HOOK V2 - Gestão de campanhas de doação (versão simplificada)
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

// Hook para buscar campanhas (simulado)
export const useCampaignsV2 = (filters: CampaignFilters = {}) => {
    return useQuery({
        queryKey: ['campaigns-v2', filters],
        queryFn: async (): Promise<CampaignV2[]> => {
            try {
                console.log('🔍 [Campaigns V2] Buscando campanhas com filtros:', filters)
                
                // Por enquanto, retornar array vazio pois as tabelas de campanhas não existem
                console.log('📊 [Campaigns V2] Campanhas simuladas: 0')
                return []

            } catch (error) {
                console.error('❌ [Campaigns V2] Erro crítico ao carregar campanhas:', error)
                throw error
            }
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    })
}

// Hook para estatísticas de campanhas (simulado)
export const useCampaignStatsV2 = () => {
    return useQuery({
        queryKey: ['campaign-stats-v2'],
        queryFn: async () => {
            try {
                console.log('🔍 [Campaigns V2] Buscando estatísticas...')

                return {
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

// Hook para criar campanha (simulado)
export const useCreateCampaignV2 = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CampaignCreation) => {
            try {
                console.log('🔨 [Campaigns V2] Criando campanha:', { ...data, description: '[TRUNCATED]' })
                
                // Simulação - por enquanto só retornar sucesso
                console.log('✅ [Campaigns V2] Campanha simulada criada')
                return 'simulated-id'

            } catch (error: any) {
                console.error('❌ [Campaigns V2] Erro crítico ao criar campanha:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns-v2'] })
            toast.success('Campanha criada com sucesso! (Simulado)')
        },
        onError: (error: any) => {
            console.error('❌ [Campaigns V2] Erro na criação:', error)
            toast.error('Erro ao criar campanha: ' + (error.message || 'Erro desconhecido'))
        }
    })
}
