
/**
 * Template Form Component
 * Form for creating and editing notification templates
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X, Send } from 'lucide-react'
import { TemplateFormProps } from '@/types/notificationTemplates'
import { validateTemplate } from '@/utils/templateProcessor'
import { toast } from 'sonner'

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  type,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    type: template?.type || type,
    is_active: template?.is_active ?? true
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testContact, setTestContact] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject || '',
        content: template.content,
        type: template.type,
        is_active: template.is_active
      })
    }
  }, [template])

  const validateForm = () => {
    const validationErrors = validateTemplate(formData)
    const errorMap: Record<string, string> = {}
    
    validationErrors.forEach(error => {
      if (error.field) {
        errorMap[error.field] = error.message
      }
    })
    
    setErrors(errorMap)
    return validationErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSendTest = async () => {
    if (!testContact) {
      toast.error('Por favor, insira um contato para teste')
      return
    }

    if (!formData.content) {
      toast.error('Por favor, adicione conteúdo ao template antes de testar')
      return
    }

    setIsSendingTest(true)

    try {
      // Validate contact based on template type
      if (formData.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(testContact)) {
          toast.error('Por favor, insira um email válido')
          return
        }
      } else if (formData.type === 'sms' || formData.type === 'whatsapp') {
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/
        if (!phoneRegex.test(testContact)) {
          toast.error('Por favor, insira um número de telefone válido')
          return
        }
      }

      // Prepare test data
      const testData = {
        template: formData,
        contact: testContact,
        sampleData: {
          patient_name: 'Paciente Teste',
          patient_email: 'teste@email.com',
          event_title: 'Atendimento Oftalmológico Gratuito - TESTE',
          event_date: new Date().toLocaleDateString('pt-BR'),
          event_time: '08:00 - 18:00',
          event_location: 'Local de Teste',
          event_address: 'Endereço de Teste, 123 - Centro',
          event_city: 'Cidade Teste',
          confirmation_link: 'https://enxergarsemfronteira.com.br/confirm/test123',
          unsubscribe_link: 'https://enxergarsemfronteira.com.br/unsubscribe/test123'
        }
      }

      console.log('🧪 Enviando teste:', testData)

      // Call appropriate Edge Function for testing
      let functionName = ''
      if (formData.type === 'email') {
        functionName = 'send-notification-email'
      } else if (formData.type === 'sms') {
        functionName = 'send-sms'
      } else if (formData.type === 'whatsapp') {
        functionName = 'send-whatsapp'
      }

      const response = await fetch(`/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: testContact,
          template_name: `test_${formData.name}`,
          template_data: testData.sampleData,
          custom_template: {
            subject: formData.subject,
            content: formData.content
          },
          test_mode: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar teste')
      }

      const result = await response.json()
      console.log('✅ Teste enviado:', result)
      
      toast.success(`Teste enviado com sucesso para ${testContact}!`)
      
    } catch (error) {
      console.error('❌ Erro ao enviar teste:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar teste')
    } finally {
      setIsSendingTest(false)
    }
  }

  const getTestContactPlaceholder = () => {
    switch (formData.type) {
      case 'email':
        return 'Ex: teste@email.com'
      case 'sms':
      case 'whatsapp':
        return 'Ex: +5511999999999 ou 11999999999'
      default:
        return 'Contato para teste'
    }
  }

  const getTestContactLabel = () => {
    switch (formData.type) {
      case 'email':
        return 'Email para Teste'
      case 'sms':
        return 'Número para Teste (SMS)'
      case 'whatsapp':
        return 'Número para Teste (WhatsApp)'
      default:
        return 'Contato para Teste'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {template ? 'Editar Template' : 'Criar Novo Template'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Confirmação de Consulta"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Template Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Subject (only for email templates) */}
          {formData.type === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Ex: Confirmação da sua consulta"
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject}</p>
              )}
            </div>
          )}

          {/* Template Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Digite o conteúdo do template..."
              rows={8}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content}</p>
            )}
            <p className="text-sm text-gray-500">
              Você pode usar variáveis como {"{{"} patient_name {"}"}, {"{{"} event_date {"}"}, etc.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Template ativo</Label>
          </div>

          {/* Test Section */}
          <div className="border-t pt-6 space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Testar Template</h4>
            
            <div className="space-y-2">
              <Label htmlFor="test_contact">{getTestContactLabel()}</Label>
              <div className="flex gap-2">
                <Input
                  id="test_contact"
                  value={testContact}
                  onChange={(e) => setTestContact(e.target.value)}
                  placeholder={getTestContactPlaceholder()}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testContact || !formData.content}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Teste
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Envie uma mensagem de teste para verificar como o template será processado
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {template ? 'Atualizar Template' : 'Criar Template'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
