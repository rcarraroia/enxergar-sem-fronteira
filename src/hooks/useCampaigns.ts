
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Campaign {
  id: string
  title: string
  description: string | null
  event_id: string | null
  goal_amount: number | null
  current_amount: number
  suggested_amounts: number[]
  allow_custom_amount: boolean
  allow_subscriptions: boolean
  status: string
  image_url: string | null
  slug: string
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  events?: {
    title: string
    city: string
    location: string
  }
}

export interface CreateCampaignData {
  title: string
  description?: string
  event_id?: string
  goal_amount?: number
  suggested_amounts?: number[]
  allow_custom_amount?: boolean
  allow_subscriptions?: boolean
  status?: string
  image_url?: string
  start_date?: string
  end_date?: string
}

export const useCampaigns = () => {
  const queryClient = useQueryClient()

  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          events:event_id (
            title,
            city,
            location
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Campaign[]
    }
  })

  const createCampaign = useMutation({
    mutationFn: async (campaignData: CreateCampaignData) => {
      // Gerar slug único baseado no título
      const slug = campaignData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now()

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ ...campaignData, slug }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha criada com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao criar campanha:', error)
      toast.error('Erro ao criar campanha')
    }
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateCampaignData>) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha atualizada com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao atualizar campanha:', error)
      toast.error('Erro ao atualizar campanha')
    }
  })

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha excluída com sucesso!')
    },
    onError: (error) => {
      console.error('Erro ao excluir campanha:', error)
      toast.error('Erro ao excluir campanha')
    }
  })

  return {
    campaigns,
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign
  }
}

export const useCampaignBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['campaign', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          events:event_id (
            title,
            city,
            location
          )
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single()
      
      if (error) throw error
      return data as Campaign
    },
    enabled: !!slug
  })
}

export const useCampaignStats = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      const { data: donations, error } = await supabase
        .from('donations')
        .select('amount, payment_status, donation_type')
        .eq('campaign_id', campaignId)
        .eq('payment_status', 'paid')

      if (error) throw error

      const totalAmount = donations?.reduce((sum, donation) => sum + Number(donation.amount), 0) ?? 0
      const totalDonors = donations?.length ?? 0
      const subscriptions = donations?.filter(d => d.donation_type === 'subscription').length ?? 0
      const oneTimeDonations = donations?.filter(d => d.donation_type === 'one_time').length ?? 0

      return {
        totalAmount,
        totalDonors,
        subscriptions,
        oneTimeDonations,
        averageAmount: totalDonors > 0 ? totalAmount / totalDonors : 0
      }
    },
    enabled: !!campaignId
  })
}
