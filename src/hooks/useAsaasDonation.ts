
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface DonationData {
  eventId: string
  patientId: string
  amount: number
  description: string
}

interface DonationResponse {
  id: string
  status: string
  value: number
  pixCode?: string
  qrCode?: string
  invoiceUrl: string
}

export const useAsaasDonation = () => {
  const [loading, setLoading] = useState(false)

  const createDonation = async (donationData: DonationData): Promise<DonationResponse | null> => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('create-asaas-donation', {
        body: donationData
      })

      if (error) {
        throw error
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar campanha de doação')
      }

      toast.success('Campanha de doação criada com sucesso!')
      return data.donation
      
    } catch (error: any) {
      console.error('Erro ao criar campanha de doação:', error)
      toast.error(`Erro ao criar campanha de doação: ${error.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createDonation,
    loading
  }
}
