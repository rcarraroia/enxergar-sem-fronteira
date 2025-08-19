
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Campaign {
  id: string
  slug: string
  title: string
  description?: string
  event_id?: string
  goal_amount: number
  current_amount: number
  suggested_amounts: number[]
  allow_custom_amount: boolean
  allow_subscriptions: boolean
  status: string
  image_url?: string
  start_date?: string
  end_date?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Join with events table
  events?: {
    id: string
    title: string
    city: string
    location: string
  }
}

export interface CampaignFormData {
  slug: string
  title: string
  description?: string
  event_id?: string
  goal_amount: number
  suggested_amounts?: number[]
  allow_custom_amount?: boolean
  allow_subscriptions?: boolean
  status?: string
  image_url?: string
  start_date?: string
  end_date?: string
}

export interface CreateCampaignData {
  title: string
  description?: string
  event_id?: string
  goal_amount?: number
  suggested_amounts?: number[]
  allow_custom_amount: boolean
  allow_subscriptions: boolean
  status: string
  start_date?: string
  end_date?: string
}

export const useCampaigns = () => {
  const queryClient = useQueryClient()

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          events (
            id,
            title,
            city,
            location
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar campanhas:', error)
        throw error
      }

      return data?.map(campaign => ({
        ...campaign,
        suggested_amounts: Array.isArray(campaign.suggested_amounts) 
          ? campaign.suggested_amounts as number[]
          : [25, 50, 100, 200]
      })) || []
    }
  })

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: CreateCampaignData) => {
      const slug = campaignData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          slug,
          title: campaignData.title,
          description: campaignData.description,
          event_id: campaignData.event_id,
          goal_amount: campaignData.goal_amount || 0,
          current_amount: 0,
          suggested_amounts: campaignData.suggested_amounts || [25, 50, 100, 200],
          allow_custom_amount: campaignData.allow_custom_amount ?? true,
          allow_subscriptions: campaignData.allow_subscriptions ?? true,
          status: campaignData.status || 'active',
          start_date: campaignData.start_date,
          end_date: campaignData.end_date
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar campanha:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha criada com sucesso!')
    },
    onError: (error: Error) => {
      console.error('Erro ao criar campanha:', error)
      toast.error('Erro ao criar campanha: ' + error.message)
    }
  })

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, ...campaignData }: Partial<CampaignFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar campanha:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha atualizada com sucesso!')
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar campanha:', error)
      toast.error('Erro ao atualizar campanha: ' + error.message)
    }
  })

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) {
        console.error('Erro ao excluir campanha:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha excluída com sucesso!')
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir campanha:', error)
      toast.error('Erro ao excluir campanha: ' + error.message)
    }
  })

  return {
    campaigns,
    isLoading,
    error,
    createCampaign: createCampaignMutation,
    updateCampaign: updateCampaignMutation,
    deleteCampaign: deleteCampaignMutation,
    isCreating: createCampaignMutation.isPending,
    isUpdating: updateCampaignMutation.isPending,
    isDeleting: deleteCampaignMutation.isPending
  }
}
