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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mail,
  MessageSquare,
  Loader2
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
}) => {
  // CORREÇÃO TEMPORÁRIA: Componente simplificado para evitar React Error #310
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle>Template Form Temporariamente Desabilitado</CardTitle>
            <CardDescription>
              Componente simplificado para resolver problemas de renderização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                O formulário de templates está temporariamente simplificado para evitar erros de renderização.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Voltar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // CÓDIGO ORIGINAL COMENTADO PARA DEBUGGING
  /*
  // CORREÇÃO: Hooks no topo para evitar violação das regras de hooks
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  */
}
}