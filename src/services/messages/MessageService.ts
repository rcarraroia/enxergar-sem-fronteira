/**
 * SERVIÇO PRINCIPAL DO MÓDULO DE MENSAGENS
 * Responsável por orquestrar o envio de mensagens multi-canal
 */

import { supabase } from '@/integrations/supabase/client'
import type { 
  Message, 
  SendMessageData, 
  BulkSendData, 
  MessageTemplate,
  AutomationRule,
  TriggerEvent 
} from '@/types/messages'
import { EmailProvider } from './providers/EmailProvider'
import { SMSProvider } from './providers/SMSProvider'
import { TemplateProcessor } from './TemplateProcessor'

export class MessageService {
  private emailProvider: EmailProvider
  private smsProvider: SMSProvider
  private templateProcessor: TemplateProcessor

  constructor() {
    this.emailProvider = new EmailProvider()
    this.smsProvider = new SMSProvider()
    this.templateProcessor = new TemplateProcessor()
  }

  /**
   * Envia uma mensagem individual
   */
  async sendMessage(data: SendMessageData): Promise<string> {
    try {
      console.log('📤 [MessageService] Enviando mensagem:', data.channel, data.recipient_contact)

      // Processar template se fornecido
      let processedContent = data.content || ''
      let processedSubject = data.subject

      if (data.template_id) {
        const template = await this.getTemplate(data.template_id)
        if (template) {
          processedContent = this.templateProcessor.process(template.content, data.variables || {})
          if (template.subject) {
            processedSubject = this.templateProcessor.process(template.subject, data.variables || {})
          }
        }
      }

      // Por enquanto, simular criação até tabela messages ser criada
      console.log('⚠️ [MessageService] Simulando criação de mensagem (tabela não existe)')
      const message = {
        id: `msg_${Date.now()}`,
        channel: data.channel,
        recipient_type: data.recipient_type,
        recipient_id: data.recipient_id,
        recipient_contact: data.recipient_contact,
        subject: processedSubject,
        content: processedContent,
        template_id: data.template_id,
        variables: data.variables || {},
        context: data.context || {},
        scheduled_for: data.scheduled_for,
        status: data.scheduled_for ? 'pending' : 'pending',
        created_at: new Date().toISOString()
      }

      // Se não é agendada, enviar imediatamente
      if (!data.scheduled_for) {
        await this.processMessage(message.id)
      }

      console.log('✅ [MessageService] Mensagem criada:', message.id)
      return message.id

    } catch (error) {
      console.error('❌ [MessageService] Erro crítico ao enviar mensagem:', error)
      throw error
    }
  }

  /**
   * Envia mensagens em massa
   */
  async sendBulkMessages(data: BulkSendData): Promise<string[]> {
    try {
      console.log('📤 [MessageService] Enviando mensagens em massa:', data.recipients.length)

      const template = await this.getTemplate(data.template_id)
      if (!template) {
        throw new Error('Template não encontrado')
      }

      const messageIds: string[] = []

      // Processar cada destinatário
      for (const recipient of data.recipients) {
        const processedContent = this.templateProcessor.process(
          template.content, 
          recipient.variables || {}
        )
        
        let processedSubject: string | undefined
        if (template.subject) {
          processedSubject = this.templateProcessor.process(
            template.subject, 
            recipient.variables || {}
          )
        }

        // Criar mensagem
        const { data: message, error } = await supabase
          .from('messages')
          .insert({
            channel: template.channel,
            recipient_type: recipient.type,
            recipient_id: recipient.id,
            recipient_contact: recipient.contact,
            subject: processedSubject,
            content: processedContent,
            template_id: data.template_id,
            variables: recipient.variables || {},
            context: data.context || {},
            scheduled_for: data.scheduled_for,
            status: 'pending'
          })
          .select()
          .single()

        if (error) {
          console.error('❌ [MessageService] Erro ao criar mensagem em massa:', error)
          continue // Continua com as outras mensagens
        }

        messageIds.push(message.id)

        // Se não é agendada, enviar imediatamente
        if (!data.scheduled_for) {
          await this.processMessage(message.id)
        }
      }

      console.log('✅ [MessageService] Mensagens em massa criadas:', messageIds.length)
      return messageIds

    } catch (error) {
      console.error('❌ [MessageService] Erro crítico no envio em massa:', error)
      throw error
    }
  }

  /**
   * Processa uma mensagem específica (envia efetivamente)
   */
  async processMessage(messageId: string): Promise<void> {
    try {
      console.log('🔄 [MessageService] Processando mensagem:', messageId)

      // Buscar mensagem
      const { data: message, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single()

      if (error || !message) {
        throw new Error('Mensagem não encontrada')
      }

      if (message.status !== 'pending') {
        console.log('⚠️ [MessageService] Mensagem já processada:', messageId)
        return
      }

      // Enviar através do provedor apropriado
      let result: any
      
      switch (message.channel) {
        case 'email':
          result = await this.emailProvider.send({
            to: message.recipient_contact,
            subject: message.subject || 'Mensagem',
            content: message.content
          })
          break
          
        case 'sms':
          result = await this.smsProvider.send({
            to: message.recipient_contact,
            content: message.content
          })
          break
          
        default:
          throw new Error(`Canal não suportado: ${message.channel}`)
      }

      // Atualizar status da mensagem
      await supabase
        .from('messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_response: result
        })
        .eq('id', messageId)

      // Criar log
      await this.createLog(messageId, 'sent', { provider_response: result })

      console.log('✅ [MessageService] Mensagem enviada:', messageId)

    } catch (error) {
      console.error('❌ [MessageService] Erro ao processar mensagem:', messageId, error)
      
      // Atualizar status de erro
      await supabase
        .from('messages')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          retry_count: supabase.raw('retry_count + 1')
        })
        .eq('id', messageId)

      // Criar log de erro
      await this.createLog(messageId, 'failed', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      })

      throw error
    }
  }

  /**
   * Processa mensagens agendadas
   */
  async processScheduledMessages(): Promise<void> {
    try {
      console.log('⏰ [MessageService] Processando mensagens agendadas')

      const { data: messages, error } = await supabase
        .from('messages')
        .select('id')
        .eq('status', 'pending')
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', new Date().toISOString())
        .limit(50) // Processar em lotes

      if (error) {
        console.error('❌ [MessageService] Erro ao buscar mensagens agendadas:', error)
        return
      }

      if (!messages || messages.length === 0) {
        console.log('📭 [MessageService] Nenhuma mensagem agendada para processar')
        return
      }

      console.log(`📤 [MessageService] Processando ${messages.length} mensagens agendadas`)

      // Processar cada mensagem
      for (const message of messages) {
        try {
          await this.processMessage(message.id)
        } catch (error) {
          console.error('❌ [MessageService] Erro ao processar mensagem agendada:', message.id, error)
          // Continua com as outras mensagens
        }
      }

    } catch (error) {
      console.error('❌ [MessageService] Erro crítico ao processar mensagens agendadas:', error)
    }
  }

  /**
   * Dispara automação baseada em evento
   */
  async triggerAutomation(event: TriggerEvent, context: Record<string, any>): Promise<void> {
    try {
      console.log('🤖 [MessageService] Disparando automação:', event, context)

      // Buscar regras ativas para o evento
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select(`
          *,
          template:message_templates(*)
        `)
        .eq('trigger_event', event)
        .eq('is_active', true)

      if (error) {
        console.error('❌ [MessageService] Erro ao buscar regras de automação:', error)
        return
      }

      if (!rules || rules.length === 0) {
        console.log('📭 [MessageService] Nenhuma regra de automação encontrada para:', event)
        return
      }

      console.log(`🤖 [MessageService] Encontradas ${rules.length} regras para o evento:`, event)

      // Processar cada regra
      for (const rule of rules) {
        try {
          // Verificar condições (se houver)
          if (rule.conditions && Object.keys(rule.conditions).length > 0) {
            const conditionsMet = this.checkConditions(rule.conditions, context)
            if (!conditionsMet) {
              console.log('⚠️ [MessageService] Condições não atendidas para regra:', rule.name)
              continue
            }
          }

          // Calcular quando enviar (delay)
          let scheduledFor: string | undefined
          if (rule.delay_minutes > 0) {
            const sendTime = new Date()
            sendTime.setMinutes(sendTime.getMinutes() + rule.delay_minutes)
            scheduledFor = sendTime.toISOString()
          }

          // Determinar destinatário baseado no contexto
          const recipientData = this.extractRecipientFromContext(context)
          if (!recipientData) {
            console.error('❌ [MessageService] Não foi possível extrair destinatário do contexto')
            continue
          }

          // Enviar mensagem
          await this.sendMessage({
            channel: rule.template.channel,
            recipient_type: recipientData.type,
            recipient_id: recipientData.id,
            recipient_contact: recipientData.contact,
            template_id: rule.template_id,
            variables: context,
            context: { ...context, automation_rule_id: rule.id },
            scheduled_for: scheduledFor
          })

          console.log('✅ [MessageService] Automação disparada:', rule.name)

        } catch (error) {
          console.error('❌ [MessageService] Erro ao processar regra de automação:', rule.name, error)
          // Continua com as outras regras
        }
      }

    } catch (error) {
      console.error('❌ [MessageService] Erro crítico na automação:', error)
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private async getTemplate(templateId: string): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('❌ [MessageService] Erro ao buscar template:', error)
      return null
    }

    return data
  }

  private async createLog(messageId: string, eventType: string, eventData: any): Promise<void> {
    await supabase
      .from('message_logs')
      .insert({
        message_id: messageId,
        event_type: eventType,
        event_data: eventData
      })
  }

  private checkConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    // Implementação simples de verificação de condições
    // Pode ser expandida conforme necessário
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (context[key] !== expectedValue) {
        return false
      }
    }
    return true
  }

  private extractRecipientFromContext(context: Record<string, any>): {
    type: any
    id?: string
    contact: string
  } | null {
    // Extrair dados do destinatário baseado no contexto
    if (context.patient_email) {
      return {
        type: 'patient',
        id: context.patient_id,
        contact: context.patient_email
      }
    }
    
    if (context.promoter_email) {
      return {
        type: 'promoter',
        id: context.promoter_id,
        contact: context.promoter_email
      }
    }
    
    if (context.donor_email) {
      return {
        type: 'donor',
        id: context.donor_id,
        contact: context.donor_email
      }
    }

    return null
  }
}

// Instância singleton
export const messageService = new MessageService()