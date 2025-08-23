/**
 * useBulkMessaging - Hook para gerenciar envio de mensagens em massa
 *
 * Fornece funcionalidades para enviar mensagens em massa para pacientes
 * baseado em eventos e filtros específicos.
 */

import { supabase } from '@/integrations/supabase/client'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

// ============================================================================
// TYPES
// ============================================================================

export interface BulkMessageOptions {
  eventIds?: string[]
  eventDateIds?: string[]
  messageTypes: ('email' | 'sms' | 'whatsapp')[]
  templateName?: string
  customMessage?: string
  testMode?: boolean
  filters?: {
    patientStatus?: string[]
    registrationStatus?: string[]
    city?: string[]
    dateRange?: {
      start: string
      end: string
    }
  }
}

export interface BulkMessageResult {
  success: boolean
  message: string
  data: {
    totalRecipients: number
    emailsSent: number
    smsSent: number
    whatsappSent: number
    errors: string[]
    recipients: Array<{
      patientId: string
      patientName: string
      email?: string
      phone?: string
      emailSent: boolean
      smsSent: boolean
      whatsappSent: boolean
      errors: string[]
    }>
  }
}

export interface RecipientPreview {
  totalRecipients: number
  recipientsByEvent: Array<{
    eventId: string
    eventTitle: string
    recipientCount: number
  }>
  recipientsByType: {
    email: number
    sms: number
    whatsapp: number
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useBulkMessaging() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<BulkMessageResult | null>(null)

  /**
   * Envia mensagens em massa
   */
  const sendBulkMessages = useCallback(async (
    options: BulkMessageOptions
  ): Promise<BulkMessageResult> => {
    try {
      setLoading(true)
      setLastResult(null)

      // Validações básicas
      if (!options.messageTypes || options.messageTypes.length === 0) {
        throw new Error('Pelo menos um tipo de mensagem deve ser selecionado')
      }

      if (!options.eventIds?.length && !options.eventDateIds?.length) {
        throw new Error('Pelo menos um evento deve ser selecionado')
      }

      if (!options.templateName && !options.customMessage) {
        throw new Error('Template ou mensagem customizada deve ser fornecida')
      }

      console.log('📤 Enviando mensagens em massa:', {
        eventIds: options.eventIds?.length || 0,
        messageTypes: options.messageTypes,
        templateName: options.templateName,
        testMode: options.testMode
      })

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('send-bulk-messages', {
        body: options
      })

      if (error) {
        throw error
      }

      const result = data as BulkMessageResult
      setLastResult(result)

      // Mostrar toast baseado no resultado
      if (result.success) {
        const { emailsSent, smsSent, whatsappSent } = result.data
        const totalSent = emailsSent + smsSent + whatsappSent

        if (options.testMode) {
          toast.success(`Teste concluído! ${totalSent} mensagens seriam enviadas`)
        } else {
          toast.success(`${totalSent} mensagens enviadas com sucesso!`)
        }
      } else {
        toast.error(`Erro no envio: ${result.message}`)
      }

      return result

    } catch (error) {
      console.error('Erro no envio de mensagens em massa:', error)

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro no envio: ${errorMessage}`)

      const errorResult: BulkMessageResult = {
        success: false,
        message: errorMessage,
        data: {
          totalRecipients: 0,
          emailsSent: 0,
          smsSent: 0,
          whatsappSent: 0,
          errors: [errorMessage],
          recipients: []
        }
      }

      setLastResult(errorResult)
      return errorResult

    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtém preview dos destinatários sem enviar mensagens
   */
  const getRecipientsPreview = useCallback(async (
    eventIds: string[],
    filters?: BulkMessageOptions['filters']
  ): Promise<RecipientPreview> => {
    try {
      // Buscar registrações dos eventos selecionados
      let query = supabase
        .from('registrations')
        .select(`
          id,
          patient_id,
          status,
          patient:patients (
            id,
            nome,
            email,
            telefone,
            status
          ),
          event_date:event_dates (
            id,
            event:events (
              id,
              title
            )
          )
        `)

      // Aplicar filtros
      if (filters?.registrationStatus) {
        query = query.in('status', filters.registrationStatus)
      } else {
        query = query.eq('status', 'confirmed')
      }

      // Filtrar por eventos
      if (eventIds.length > 0) {
        query = query.in('event_date.event.id', eventIds)
      }

      const { data: registrations, error } = await query

      if (error) {
        throw error
      }

      // Processar dados para preview
      const uniquePatients = new Map()
      const eventCounts = new Map()

      for (const reg of registrations || []) {
        if (!reg.patient) continue

        // Contar pacientes únicos
        if (!uniquePatients.has(reg.patient.id)) {
          uniquePatients.set(reg.patient.id, reg.patient)
        }

        // Contar por evento
        const eventId = reg.event_date?.event?.id
        const eventTitle = reg.event_date?.event?.title

        if (eventId && eventTitle) {
          if (!eventCounts.has(eventId)) {
            eventCounts.set(eventId, { eventId, eventTitle, count: 0 })
          }
          eventCounts.get(eventId).count++
        }
      }

      // Contar por tipo de contato
      let emailCount = 0
      let smsCount = 0
      let whatsappCount = 0

      for (const patient of uniquePatients.values()) {
        if (patient.email) emailCount++
        if (patient.telefone) {
          smsCount++
          whatsappCount++
        }
      }

      return {
        totalRecipients: uniquePatients.size,
        recipientsByEvent: Array.from(eventCounts.values()).map(item => ({
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          recipientCount: item.count
        })),
        recipientsByType: {
          email: emailCount,
          sms: smsCount,
          whatsapp: whatsappCount
        }
      }

    } catch (error) {
      console.error('Erro ao obter preview de destinatários:', error)
      throw error
    }
  }, [])

  /**
   * Envia mensagem de teste para o próprio usuário
   */
  const sendTestMessage = useCallback(async (
    messageTypes: ('email' | 'sms' | 'whatsapp')[],
    templateName?: string,
    customMessage?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      // Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar dados do organizador
      const { data: organizer, error: orgError } = await supabase
        .from('organizers')
        .select('name, email, phone')
        .eq('id', user.id)
        .single()

      if (orgError || !organizer) {
        throw new Error('Dados do usuário não encontrados')
      }

      // Dados de template de exemplo
      const templateData = {
        patient_name: organizer.name,
        patient_email: organizer.email,
        event_title: 'Evento de Teste',
        event_date: new Date().toLocaleDateString('pt-BR'),
        event_time: '09:00 - 17:00',
        event_location: 'Local de Teste',
        event_address: 'Endereço de Teste',
        event_city: 'Cidade de Teste'
      }

      let success = false

      // Enviar email de teste
      if (messageTypes.includes('email') && organizer.email) {
        try {
          const { error } = await supabase.functions.invoke('send-email', {
            body: {
              templateName,
              templateData,
              recipientEmail: organizer.email,
              recipientName: organizer.name,
              customContent: customMessage,
              testMode: true
            }
          })

          if (!error) {
            success = true
            toast.success('Email de teste enviado!')
          }
        } catch (error) {
          console.error('Erro no email de teste:', error)
        }
      }

      // Enviar SMS de teste
      if (messageTypes.includes('sms') && organizer.phone) {
        try {
          const { error } = await supabase.functions.invoke('send-sms', {
            body: {
              templateName,
              templateData,
              recipientPhone: organizer.phone,
              recipientName: organizer.name,
              customContent: customMessage,
              testMode: true
            }
          })

          if (!error) {
            success = true
            toast.success('SMS de teste enviado!')
          }
        } catch (error) {
          console.error('Erro no SMS de teste:', error)
        }
      }

      // Enviar WhatsApp de teste
      if (messageTypes.includes('whatsapp') && organizer.phone) {
        try {
          const { error } = await supabase.functions.invoke('send-whatsapp', {
            body: {
              templateName,
              templateData,
              recipientPhone: organizer.phone,
              recipientName: organizer.name,
              customContent: customMessage,
              testMode: true
            }
          })

          if (!error) {
            success = true
            toast.success('WhatsApp de teste enviado!')
          }
        } catch (error) {
          console.error('Erro no WhatsApp de teste:', error)
        }
      }

      if (!success) {
        toast.warning('Nenhuma mensagem de teste foi enviada')
      }

      return success

    } catch (error) {
      console.error('Erro no envio de teste:', error)
      toast.error('Erro no envio de teste')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Limpa o último resultado
   */
  const clearLastResult = useCallback(() => {
    setLastResult(null)
  }, [])

  return {
    // Estado
    loading,
    lastResult,

    // Funções
    sendBulkMessages,
    getRecipientsPreview,
    sendTestMessage,
    clearLastResult
  }
}

export default useBulkMessaging
