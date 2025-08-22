/**
 * HOOKS PARA MÓDULO DE MENSAGENS
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { 
  Message, 
  MessageTemplate, 
  AutomationRule, 
  MessageFilters,
  CreateTemplateData,
  CreateAutomationRuleData,
  SendMessageData,
  BulkSendData,
  MessageStats
} from '@/types/messages'
import { messageService } from '@/services/messages/MessageService'

// Tipos temporários para contornar problema de tipos não atualizados
type SupabaseClient = typeof supabase

// =====================================================
// HOOKS PARA MENSAGENS
// =====================================================

export const useMessages = (filters: MessageFilters = {}) => {
  return useQuery({
    queryKey: ['messages', filters],
    queryFn: async (): Promise<Message[]> => {
      try {
        console.log('🔍 [useMessages] Buscando mensagens com filtros:', filters)

        // Por enquanto, retornar array vazio até as tabelas serem criadas
        console.log('⚠️ [useMessages] Tabela messages não existe ainda, retornando dados vazios')
        return []

      } catch (error) {
        console.error('❌ [useMessages] Erro crítico:', error)
        throw error
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  })
}

export const useMessage = (messageId: string) => {
  return useQuery({
    queryKey: ['message', messageId],
    queryFn: async (): Promise<Message | null> => {
      if (!messageId) return null

      const { data, error } = await (supabase as any)
        .from('messages')
        .select(`
          *,
          template:message_templates(*),
          automation_rule:automation_rules(*),
          logs:message_logs(*)
        `)
        .eq('id', messageId)
        .single()

      if (error) {
        console.error('❌ [useMessage] Erro ao buscar mensagem:', error)
        throw error
      }

      return data as Message
    },
    enabled: !!messageId
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      return await messageService.sendMessage(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['message-stats'] })
      toast.success('Mensagem enviada com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [useSendMessage] Erro:', error)
      toast.error('Erro ao enviar mensagem: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

export const useSendBulkMessages = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkSendData) => {
      return await messageService.sendBulkMessages(data)
    },
    onSuccess: (messageIds) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['message-stats'] })
      toast.success(`${messageIds.length} mensagens enviadas com sucesso!`)
    },
    onError: (error: any) => {
      console.error('❌ [useSendBulkMessages] Erro:', error)
      toast.error('Erro no envio em massa: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

// =====================================================
// HOOKS PARA TEMPLATES
// =====================================================

export const useMessageTemplates = () => {
  return useQuery({
    queryKey: ['message-templates'],
    queryFn: async (): Promise<MessageTemplate[]> => {
      const { data, error } = await (supabase as any)
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ [useMessageTemplates] Erro:', error)
        throw error
      }

      return (data || []) as MessageTemplate[]
    }
  })
}

export const useMessageTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['message-template', templateId],
    queryFn: async (): Promise<MessageTemplate | null> => {
      if (!templateId) return null

      const { data, error } = await (supabase as any)
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) {
        console.error('❌ [useMessageTemplate] Erro:', error)
        throw error
      }

      return data as MessageTemplate
    },
    enabled: !!templateId
  })
}

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const { data: template, error } = await (supabase as any)
        .from('message_templates')
        .insert({
          name: data.name,
          description: data.description,
          channel: data.channel,
          subject: data.subject,
          content: data.content,
          variables: data.variables || [],
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error
      return template as MessageTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.success('Template criado com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [useCreateTemplate] Erro:', error)
      toast.error('Erro ao criar template: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<CreateTemplateData> }) => {
      const { data: template, error } = await (supabase as any)
        .from('message_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return template as MessageTemplate
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      queryClient.invalidateQueries({ queryKey: ['message-template', variables.id] })
      toast.success('Template atualizado com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [useUpdateTemplate] Erro:', error)
      toast.error('Erro ao atualizar template: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await (supabase as any)
        .from('message_templates')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.success('Template removido com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [useDeleteTemplate] Erro:', error)
      toast.error('Erro ao remover template: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

// =====================================================
// HOOKS PARA AUTOMAÇÃO
// =====================================================

export const useAutomationRules = () => {
  return useQuery({
    queryKey: ['automation-rules'],
    queryFn: async (): Promise<AutomationRule[]> => {
      const { data, error } = await (supabase as any)
        .from('automation_rules')
        .select(`
          *,
          template:message_templates(name, channel)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ [useAutomationRules] Erro:', error)
        throw error
      }

      return (data || []) as AutomationRule[]
    }
  })
}

export const useCreateAutomationRule = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAutomationRuleData) => {
      const { data: rule, error } = await (supabase as any)
        .from('automation_rules')
        .insert({
          name: data.name,
          description: data.description,
          trigger_event: data.trigger_event,
          conditions: data.conditions || {},
          template_id: data.template_id,
          delay_minutes: data.delay_minutes || 0,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error
      return rule as AutomationRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] })
      toast.success('Regra de automação criada com sucesso!')
    },
    onError: (error: any) => {
      console.error('❌ [useCreateAutomationRule] Erro:', error)
      toast.error('Erro ao criar regra: ' + (error.message || 'Erro desconhecido'))
    }
  })
}

// =====================================================
// HOOKS PARA ESTATÍSTICAS
// =====================================================

export const useMessageStats = (dateRange?: { from: string, to: string }) => {
  return useQuery({
    queryKey: ['message-stats', dateRange],
    queryFn: async (): Promise<MessageStats> => {
      try {
        const { data, error } = await (supabase as any)
          .from('messages')
          .select('channel, status, recipient_type')

        if (error) throw error

        // Calcular estatísticas
        const stats: MessageStats = {
          total_sent: 0,
          total_delivered: 0,
          total_failed: 0,
          total_pending: 0,
          delivery_rate: 0,
          failure_rate: 0,
          by_channel: {
            email: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            sms: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            whatsapp: { sent: 0, delivered: 0, failed: 0, pending: 0 }
          },
          by_recipient_type: {
            patient: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            promoter: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            donor: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            admin: { sent: 0, delivered: 0, failed: 0, pending: 0 }
          }
        }

        // Processar dados (dados mockados por enquanto)
        console.log('📊 [useMessageStats] Retornando estatísticas mockadas até tabelas estarem funcionais')
        
        return stats

      } catch (error) {
        console.error('❌ [useMessageStats] Erro:', error)
        // Retornar stats vazias em caso de erro
        return {
          total_sent: 0,
          total_delivered: 0,
          total_failed: 0,
          total_pending: 0,
          delivery_rate: 0,
          failure_rate: 0,
          by_channel: {
            email: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            sms: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            whatsapp: { sent: 0, delivered: 0, failed: 0, pending: 0 }
          },
          by_recipient_type: {
            patient: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            promoter: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            donor: { sent: 0, delivered: 0, failed: 0, pending: 0 },
            admin: { sent: 0, delivered: 0, failed: 0, pending: 0 }
          }
        }
      }
    },
    staleTime: 60000 // 1 minuto
  })
}