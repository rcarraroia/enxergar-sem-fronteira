/**
 * Template Form Component
 * Form for creating and editing notification templates
 */

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Save, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  MessageSquare,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { TemplateFormProps, NotificationTemplateInput } from '@/types/notificationTemplates'
import { VariablesHelper } from './VariablesHelper'
import { TemplatePreview } from './TemplatePreview'
import { validateTemplate } from '@/utils/templateProcessor'
import { cn } from '@/lib/utils'

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  type,
  onSave,
  onCancel,
  isLoading = false
}) => {
  // CORREÇÃO: Garantir que todos os hooks sejam chamados no nível superior
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<NotificationTemplateInput>({
    name: template?.name || '',
    type: template?.type || type,
    subject: template?.subject || '',
    content: template?.content || '',
    is_active: template?.is_active ?? true
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showVariables, setShowVariables] = useState(true)

  // Validate form on changes
  useEffect(() => {
    const validationErrors = validateTemplate(formData)
    const errorMap: Record<string, string> = {}
    
    validationErrors.forEach(error => {
      if (error.field) {
        errorMap[error.field] = error.message
      }
    })
    
    setErrors(errorMap)
  }, [formData])

  const handleInputChange = (field: keyof NotificationTemplateInput, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVariableClick = (variable: string) => {
    // CORREÇÃO: Verificação mais robusta para evitar erros de ref
    if (!contentTextareaRef.current) {
      // Fallback: apenas adicionar ao final do conteúdo
      handleInputChange('content', formData.content + variable)
      return
    }
    
    const textarea = contentTextareaRef.current
    try {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end)
      
      handleInputChange('content', newContent)
      
      // Usar requestAnimationFrame para garantir que o DOM foi atualizado
      requestAnimationFrame(() => {
        if (textarea && textarea.focus) {
          textarea.focus()
          if (textarea.setSelectionRange) {
            textarea.setSelectionRange(start + variable.length, start + variable.length)
          }
        }
      })
    } catch (error) {
      console.warn('Erro ao inserir variável:', error)
      // Fallback seguro
      handleInputChange('content', formData.content + variable)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const isFormValid = Object.keys(errors).length === 0 && formData.name && formData.content

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.type === 'email' ? (
                <Mail className="h-5 w-5 text-primary" />
              ) : (
                <MessageSquare className="h-5 w-5 text-primary" />
              )}
              {template ? 'Editar Template' : 'Novo Template'}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="ex: confirmacao_cadastro_email"
                  className={cn(errors.name && "border-red-500")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {formData.type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    ref={subjectInputRef}
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="ex: Confirmação - {{event_title}}"
                    className={cn(errors.subject && "border-red-500")}
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  ref={contentTextareaRef}
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Digite o conteúdo do template..."
                  className={cn("min-h-[200px]", errors.content && "border-red-500")}
                />
                {errors.content && (
                  <p className="text-sm text-red-600">{errors.content}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Template Ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!isFormValid || isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {template ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {showVariables && (
          <VariablesHelper
            type={formData.type}
            onVariableClick={handleVariableClick}
          />
        )}

        {showPreview && (
          <TemplatePreview template={formData} />
        )}
      </div>
    </div>
  )
}