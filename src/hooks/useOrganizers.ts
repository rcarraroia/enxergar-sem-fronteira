
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Organizer {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  invited_by?: string | null
  invitation_token?: string | null
  invitation_expires_at?: string | null
  asaas_api_key?: string | null
}

export const useOrganizers = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrganizers = async () => {
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select(`
          id,
          name,
          email,
          status,
          created_at,
          invited_by,
          invitation_token,
          invitation_expires_at,
          asaas_api_key
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Garantir que o status está correto
      const organizersWithValidStatus = data?.map(org => ({
        ...org,
        status: ['active', 'inactive', 'pending'].includes(org.status) 
          ? org.status as 'active' | 'inactive' | 'pending'
          : 'active' as const
      })) || []

      setOrganizers(organizersWithValidStatus)
    } catch (error) {
      console.error('Erro ao buscar organizadores:', error)
      toast.error('Erro ao carregar organizadores')
    } finally {
      setLoading(false)
    }
  }

  const createOrganizer = async (organizerData: { name: string; email: string }) => {
    try {
      // Gerar token de convite
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias para aceitar convite

      const { data, error } = await supabase
        .from('organizers')
        .insert({
          name: organizerData.name,
          email: organizerData.email,
          status: 'pending',
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // TODO: Enviar email de convite
      console.log('Convite gerado para:', organizerData.email, 'Token:', invitationToken)

      await fetchOrganizers()
      toast.success('Organizador criado e convite enviado!')
      return data
    } catch (error) {
      console.error('Erro ao criar organizador:', error)
      toast.error('Erro ao criar organizador')
      throw error
    }
  }

  const editOrganizer = async (id: string, data: { name: string; email: string }) => {
    try {
      const { error } = await supabase
        .from('organizers')
        .update(data)
        .eq('id', id)

      if (error) throw error

      await fetchOrganizers()
      toast.success('Organizador atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar organizador:', error)
      toast.error('Erro ao atualizar organizador')
      throw error
    }
  }

  const deleteOrganizer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizers')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchOrganizers()
      toast.success('Organizador excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir organizador:', error)
      toast.error('Erro ao excluir organizador')
      throw error
    }
  }

  const updateOrganizerStatus = async (id: string, status: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('organizers')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      await fetchOrganizers()
      toast.success('Status do organizador atualizado!')
    } catch (error) {
      console.error('Erro ao atualizar organizador:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const updateOrganizerApiKey = async (id: string, asaas_api_key: string) => {
    try {
      const { error } = await supabase
        .from('organizers')
        .update({ asaas_api_key })
        .eq('id', id)

      if (error) throw error

      await fetchOrganizers()
      toast.success('API Key do organizador atualizada!')
    } catch (error) {
      console.error('Erro ao atualizar API Key:', error)
      toast.error('Erro ao atualizar API Key')
    }
  }

  const resendInvitation = async (id: string) => {
    try {
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase
        .from('organizers')
        .update({
          invitation_token: newToken,
          invitation_expires_at: expiresAt.toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // TODO: Enviar email de convite
      console.log('Novo convite gerado, Token:', newToken)

      await fetchOrganizers()
      toast.success('Convite reenviado!')
    } catch (error) {
      console.error('Erro ao reenviar convite:', error)
      toast.error('Erro ao reenviar convite')
    }
  }

  useEffect(() => {
    fetchOrganizers()
  }, [])

  return {
    organizers,
    loading,
    createOrganizer,
    editOrganizer,
    deleteOrganizer,
    updateOrganizerStatus,
    updateOrganizerApiKey,
    resendInvitation,
    fetchOrganizers
  }
}
