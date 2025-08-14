
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface Organizer {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  invited_by?: string
  invitation_token?: string
  invitation_expires_at?: string
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
          invitation_expires_at
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrganizers(data || [])
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
    updateOrganizerStatus,
    resendInvitation,
    fetchOrganizers
  }
}
