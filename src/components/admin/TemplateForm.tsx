
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { NotificationTemplate } from '@/types/notificationTemplates'

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['whatsapp', 'email', 'sms']),
  subject: z.string().optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório')
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateFormProps {
  template?: NotificationTemplate
  onSuccess: () => void
  onCancel: () => void
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || '',
      type: template?.type || 'whatsapp',
      subject: template?.subject || '',
      content: template?.content || ''
    }
  })

  const templateType = watch('type')

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true)
    
    try {
      const templateData = {
        name: data.name,
        type: data.type,
        subject: data.subject || null,
        content: data.content,
        is_active: true
      }

      if (template) {
        const { error } = await supabase
          .from('notification_templates')
          .update(templateData)
          .eq('id', template.id)

        if (error) throw error
        toast.success('Template atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('notification_templates')
          .insert(templateData)

        if (error) throw error
        toast.success('Template criado com sucesso!')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Erro ao salvar template:', error)
      toast.error('Erro ao salvar template: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {template ? 'Editar Template' : 'Novo Template'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Template</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Lembrete de Consulta"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
            )}
          </div>

          {templateType === 'email' && (
            <div>
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                {...register('subject')}
                placeholder="Assunto do email"
              />
              {errors.subject && (
                <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Digite o conteúdo da mensagem..."
              rows={6}
            />
            {errors.content && (
              <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Salvando...' : template ? 'Atualizar' : 'Criar Template'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default TemplateForm
