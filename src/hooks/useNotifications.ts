import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface NotificationData {
  to: string
  subject: string
  template: 'registration_confirmation' | 'event_reminder' | 'registration_cancelled'
  data: {
    name: string
    eventTitle: string
    eventDate: string
    eventTime: string
    eventLocation: string
    eventAddress: string
  }
}

export const useNotifications = () => {
  const sendEmail = useMutation({
    mutationFn: async (notificationData: NotificationData) => {
      console.log('📧 Enviando email:', notificationData.subject)
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          templateName: notificationData.template,
          templateData: notificationData.data,
          recipientEmail: notificationData.to,
          recipientName: notificationData.data.name,
          testMode: false
        }
      })

      if (error) {
        console.error('❌ Erro ao enviar email:', error)
        throw error
      }

      console.log('✅ Email enviado com sucesso:', data.messageId)
      return data
    },
    onSuccess: () => {
      toast.success('Email enviado com sucesso!')
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar email:', error)
      toast.error('Erro ao enviar email: ' + error.message)
    }
  })

  const sendRegistrationConfirmation = (
    email: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string,
    eventAddress: string
  ) => {
    return sendEmail.mutate({
      to: email,
      subject: `Confirmação de Inscrição - ${eventTitle}`,
      template: 'registration_confirmation',
      data: {
        name,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        eventAddress
      }
    })
  }

  const sendEventReminder = (
    email: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string,
    eventAddress: string
  ) => {
    return sendEmail.mutate({
      to: email,
      subject: `Lembrete - ${eventTitle} é amanhã!`,
      template: 'event_reminder',
      data: {
        name,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        eventAddress
      }
    })
  }

  const sendCancellationNotification = (
    email: string,
    name: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string,
    eventAddress: string
  ) => {
    return sendEmail.mutate({
      to: email,
      subject: `Cancelamento de Inscrição - ${eventTitle}`,
      template: 'registration_cancelled',
      data: {
        name,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        eventAddress
      }
    })
  }

  return {
    sendEmail,
    sendRegistrationConfirmation,
    sendEventReminder,
    sendCancellationNotification,
    isLoading: sendEmail.isPending
  }
}
