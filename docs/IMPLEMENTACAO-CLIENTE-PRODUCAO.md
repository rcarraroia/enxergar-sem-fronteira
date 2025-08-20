# 📧 IMPLEMENTAÇÃO CLIENTE - SISTEMA DE NOTIFICAÇÕES

**Data**: 19 de Agosto de 2025  
**Status**: ✅ **PRONTO PARA IMPLEMENTAÇÃO**

---

## 🎯 **VISÃO GERAL**

Com o domínio `enxergarsemfronteira.com.br` verificado e as Edge Functions corrigidas, o sistema está pronto para uso em produção. Este guia mostra como implementar no frontend.

---

## 📧 **ENVIO DE EMAIL**

### **Implementação Recomendada:**

```typescript
// hooks/useEmailSender.ts
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface EmailData {
  to: string
  subject: string
  message?: string
  templateName?: string
  templateData?: Record<string, string>
  testMode?: boolean
}

export const useEmailSender = () => {
  const sendEmail = async (emailData: EmailData) => {
    try {
      console.log('📧 Enviando email...', {
        to: emailData.to.substring(0, 5) + '***',
        subject: emailData.subject,
        hasTemplate: !!emailData.templateName
      })

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          recipientEmail: emailData.to,
          recipientName: emailData.to.split('@')[0],
          subject: emailData.subject,
          message: emailData.message,
          templateName: emailData.templateName,
          templateData: emailData.templateData || {},
          testMode: emailData.testMode || false
        }
      })

      if (error) {
        console.error('❌ Erro no envio de email:', error)
        
        // Tratamento específico de erros
        if (error.message?.includes('domain is not verified')) {
          toast.error('Erro de configuração: Domínio não verificado')
          throw new Error('DOMAIN_NOT_VERIFIED')
        }
        
        if (error.message?.includes('RESEND_API_KEY')) {
          toast.error('Erro de configuração: API Key não configurada')
          throw new Error('API_KEY_MISSING')
        }
        
        toast.error('Erro ao enviar email: ' + error.message)
        throw error
      }

      if (data?.success) {
        console.log('✅ Email enviado com sucesso:', {
          messageId: data.messageId,
          recipient: emailData.to.substring(0, 5) + '***'
        })
        
        if (!emailData.testMode) {
          toast.success('Email enviado com sucesso!')
        }
        
        return {
          success: true,
          messageId: data.messageId,
          recipient: emailData.to
        }
      } else {
        throw new Error(data?.error || 'Falha no envio do email')
      }

    } catch (catchError) {
      console.error('❌ Erro inesperado no envio de email:', catchError)
      
      if (!emailData.testMode) {
        toast.error('Erro inesperado ao enviar email')
      }
      
      throw catchError
    }
  }

  return { sendEmail }
}
```

### **Uso no Componente:**

```typescript
// components/EmailSender.tsx
import React, { useState } from 'react'
import { useEmailSender } from '@/hooks/useEmailSender'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export const EmailSender = () => {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { sendEmail } = useEmailSender()

  const handleSendEmail = async () => {
    if (!email || !subject || !message) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    
    try {
      await sendEmail({
        to: email,
        subject: subject,
        message: message,
        testMode: false
      })
      
      // Limpar formulário após sucesso
      setEmail('')
      setSubject('')
      setMessage('')
      
    } catch (error) {
      console.error('Erro ao enviar email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Email do destinatário"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      
      <Input
        placeholder="Assunto"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      
      <Textarea
        placeholder="Mensagem"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
      />
      
      <Button 
        onClick={handleSendEmail}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Enviando...' : 'Enviar Email'}
      </Button>
    </div>
  )
}
```

---

## 📱 **ENVIO DE SMS**

### **Implementação Recomendada:**

```typescript
// hooks/useSmsSender.ts
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface SmsData {
  phone: string
  message?: string
  templateName?: string
  templateData?: Record<string, string>
  testMode?: boolean
}

export const useSmsSender = () => {
  const sendSms = async (smsData: SmsData) => {
    try {
      console.log('📱 Enviando SMS...', {
        phone: smsData.phone.substring(0, 6) + '****',
        hasTemplate: !!smsData.templateName,
        testMode: smsData.testMode
      })

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          recipientPhone: smsData.phone,
          recipientName: 'Usuario',
          templateName: smsData.templateName || 'teste_manual',
          templateData: {
            custom_message: smsData.message,
            ...smsData.templateData
          },
          testMode: smsData.testMode || false
        }
      })

      if (error) {
        console.error('❌ Erro no envio de SMS:', error)
        
        // Tratamento específico de erros
        if (error.message?.includes('credentials not configured')) {
          toast.error('Erro de configuração: Credenciais Vonage não configuradas')
          throw new Error('VONAGE_CREDENTIALS_MISSING')
        }
        
        if (error.message?.includes('Invalid phone number')) {
          toast.error('Número de telefone inválido')
          throw new Error('INVALID_PHONE_NUMBER')
        }
        
        toast.error('Erro ao enviar SMS: ' + error.message)
        throw error
      }

      if (data?.success) {
        console.log('✅ SMS enviado com sucesso:', {
          messageId: data.messageId,
          recipient: smsData.phone.substring(0, 6) + '****'
        })
        
        if (!smsData.testMode) {
          toast.success('SMS enviado com sucesso!')
        }
        
        return {
          success: true,
          messageId: data.messageId,
          recipient: smsData.phone
        }
      } else {
        throw new Error(data?.error || 'Falha no envio do SMS')
      }

    } catch (catchError) {
      console.error('❌ Erro inesperado no envio de SMS:', catchError)
      
      if (!smsData.testMode) {
        toast.error('Erro inesperado ao enviar SMS')
      }
      
      throw catchError
    }
  }

  return { sendSms }
}
```

### **Uso no Componente:**

```typescript
// components/SmsSender.tsx
import React, { useState } from 'react'
import { useSmsSender } from '@/hooks/useSmsSender'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export const SmsSender = () => {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { sendSms } = useSmsSender()

  const handleSendSms = async () => {
    if (!phone || !message) {
      toast.error('Preencha todos os campos')
      return
    }

    setIsLoading(true)
    
    try {
      await sendSms({
        phone: phone,
        message: message,
        testMode: false
      })
      
      // Limpar formulário após sucesso
      setPhone('')
      setMessage('')
      
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Telefone (ex: 5511999999999)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        type="tel"
      />
      
      <Textarea
        placeholder="Mensagem SMS"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={160}
      />
      
      <div className="text-sm text-gray-500">
        {message.length}/160 caracteres
      </div>
      
      <Button 
        onClick={handleSendSms}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Enviando...' : 'Enviar SMS'}
      </Button>
    </div>
  )
}
```

---

## 🔄 **ENVIO DE CONFIRMAÇÃO DE CADASTRO**

### **Implementação para Confirmação Automática:**

```typescript
// utils/sendConfirmationEmail.ts
import { supabase } from '@/integrations/supabase/client'

interface PatientData {
  nome: string
  email: string
  telefone: string
  eventTitle?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventAddress?: string
}

export const sendConfirmationEmail = async (patientData: PatientData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        recipientEmail: patientData.email,
        recipientName: patientData.nome,
        templateName: 'confirmacao_cadastro_email',
        templateData: {
          patient_name: patientData.nome,
          event_title: patientData.eventTitle || 'Consulta Oftalmológica',
          event_date: patientData.eventDate || 'A definir',
          event_time: patientData.eventTime || 'A definir',
          event_location: patientData.eventLocation || 'A definir',
          event_address: patientData.eventAddress || 'A definir'
        },
        testMode: false
      }
    })

    if (error) {
      console.error('❌ Erro ao enviar email de confirmação:', error)
      throw error
    }

    console.log('✅ Email de confirmação enviado:', data)
    return data
    
  } catch (error) {
    console.error('❌ Falha no envio de confirmação:', error)
    throw error
  }
}

export const sendConfirmationSms = async (patientData: PatientData) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        recipientPhone: patientData.telefone,
        recipientName: patientData.nome,
        templateName: 'confirmacao_cadastro_sms',
        templateData: {
          patient_name: patientData.nome,
          event_title: patientData.eventTitle || 'Consulta Oftalmológica',
          event_date: patientData.eventDate || 'A definir',
          event_location: patientData.eventLocation || 'A definir'
        },
        testMode: false
      }
    })

    if (error) {
      console.error('❌ Erro ao enviar SMS de confirmação:', error)
      throw error
    }

    console.log('✅ SMS de confirmação enviado:', data)
    return data
    
  } catch (error) {
    console.error('❌ Falha no envio de SMS:', error)
    throw error
  }
}
```

### **Uso no Formulário de Cadastro:**

```typescript
// components/PatientRegistrationForm.tsx (adicionar ao onSubmit existente)
import { sendConfirmationEmail, sendConfirmationSms } from '@/utils/sendConfirmationEmail'

const onSubmit = async (data: PatientFormData) => {
  try {
    setIsSubmitting(true)
    
    // ... código existente de cadastro do paciente ...
    
    // Após cadastro bem-sucedido, enviar confirmações
    if (patient && eventInfo) {
      try {
        // Enviar email de confirmação
        await sendConfirmationEmail({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          eventTitle: eventInfo.title,
          eventDate: formatDate(eventInfo.date),
          eventTime: formatTime(eventInfo.start_time),
          eventLocation: eventInfo.location,
          eventAddress: eventInfo.address
        })
        
        // Enviar SMS de confirmação (opcional)
        try {
          await sendConfirmationSms({
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            eventTitle: eventInfo.title,
            eventDate: formatDate(eventInfo.date),
            eventLocation: eventInfo.location
          })
        } catch (smsError) {
          console.warn('⚠️ SMS não enviado, mas email foi enviado:', smsError)
          // Não falhar o cadastro se SMS falhar
        }
        
        toast.success('Cadastro realizado! Verifique seu email e SMS.')
        
      } catch (notificationError) {
        console.error('⚠️ Erro ao enviar notificações:', notificationError)
        toast.success('Cadastro realizado! (Notificações podem ter falhado)')
      }
    }
    
    // ... resto do código existente ...
    
  } catch (error) {
    console.error('💥 Erro no cadastro:', error)
    toast.error('Erro ao processar cadastro')
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## 🔍 **MONITORAMENTO E LOGS**

### **Hook para Monitoramento:**

```typescript
// hooks/useNotificationMonitor.ts
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const useNotificationMonitor = () => {
  const [stats, setStats] = useState({
    emailsSent: 0,
    smsSent: 0,
    emailErrors: 0,
    smsErrors: 0
  })

  const getNotificationStats = async () => {
    try {
      // Buscar estatísticas dos últimos envios
      const { data: emailStats } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'last_email_sent')
        .single()

      const { data: smsStats } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'last_sms_sent')
        .single()

      // Atualizar estatísticas
      setStats({
        emailsSent: emailStats?.value?.success ? 1 : 0,
        smsSent: smsStats?.value?.success ? 1 : 0,
        emailErrors: emailStats?.value?.success ? 0 : 1,
        smsErrors: smsStats?.value?.success ? 0 : 1
      })

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  useEffect(() => {
    getNotificationStats()
  }, [])

  return { stats, refreshStats: getNotificationStats }
}
```

---

## ⚠️ **TRATAMENTO DE ERROS**

### **Códigos de Erro Comuns:**

```typescript
// utils/errorHandler.ts
export const handleNotificationError = (error: any) => {
  const errorMessage = error.message || error.toString()

  // Erros de Email
  if (errorMessage.includes('domain is not verified')) {
    return {
      type: 'EMAIL_DOMAIN_ERROR',
      message: 'Domínio não verificado no Resend',
      action: 'Verificar configuração do domínio'
    }
  }

  if (errorMessage.includes('RESEND_API_KEY')) {
    return {
      type: 'EMAIL_CONFIG_ERROR',
      message: 'API Key do Resend não configurada',
      action: 'Configurar variável de ambiente'
    }
  }

  // Erros de SMS
  if (errorMessage.includes('Vonage API credentials')) {
    return {
      type: 'SMS_CONFIG_ERROR',
      message: 'Credenciais Vonage não configuradas',
      action: 'Configurar API Key e Secret da Vonage'
    }
  }

  if (errorMessage.includes('SMS failed (status 29)')) {
    return {
      type: 'SMS_TRIAL_ERROR',
      message: 'Conta Vonage em modo trial',
      action: 'Ativar conta de produção ou usar número verificado'
    }
  }

  if (errorMessage.includes('Invalid phone number')) {
    return {
      type: 'SMS_PHONE_ERROR',
      message: 'Número de telefone inválido',
      action: 'Verificar formato do número'
    }
  }

  // Erro genérico
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    action: 'Verificar logs para mais detalhes'
  }
}
```

---

## 🚀 **DEPLOY E PRODUÇÃO**

### **Checklist Final:**

```typescript
// utils/productionCheck.ts
export const checkProductionReadiness = async () => {
  const checks = {
    emailDomain: false,
    resendApiKey: false,
    vonageCredentials: false,
    templatesExist: false
  }

  try {
    // Testar email
    const emailTest = await supabase.functions.invoke('send-email', {
      body: {
        recipientEmail: 'test@example.com',
        recipientName: 'Test',
        subject: 'Production Check',
        message: 'Test message',
        testMode: true
      }
    })
    checks.emailDomain = !emailTest.error

    // Testar SMS
    const smsTest = await supabase.functions.invoke('send-sms', {
      body: {
        recipientPhone: '5511999999999',
        recipientName: 'Test',
        templateName: 'teste_manual',
        templateData: { custom_message: 'Test' },
        testMode: true
      }
    })
    checks.vonageCredentials = !smsTest.error

    console.log('🔍 Production readiness check:', checks)
    return checks

  } catch (error) {
    console.error('❌ Production check failed:', error)
    return checks
  }
}
```

---

## 📊 **RESUMO DE IMPLEMENTAÇÃO**

### **✅ Pronto para Usar:**
- ✅ Email com domínio verificado
- ✅ SMS com logs detalhados
- ✅ Tratamento de erros robusto
- ✅ Monitoramento implementado

### **🔧 Configurações Necessárias:**
- ✅ Domínio verificado no Resend
- ⚠️ Verificar conta Vonage (produção vs trial)
- ⚠️ Configurar templates no banco de dados

### **🧪 Testes Recomendados:**
1. Teste de email em modo test
2. Teste de email em modo produção
3. Teste de SMS em modo test
4. Teste de SMS em modo produção
5. Teste de confirmação de cadastro completo

---

**Status**: 🚀 **SISTEMA PRONTO PARA PRODUÇÃO**