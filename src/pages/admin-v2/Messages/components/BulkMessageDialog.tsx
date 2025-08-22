/**
 * DIALOG PARA ENVIO DE MENSAGENS EM MASSA
 */

import { useState, useEffect } from 'react'
import { Send, Mail, Smartphone, MessageSquare, Users, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSendBulkMessage, useMessageTemplates } from '@/hooks/messages/useMessages'
import { useRegistrationsV2 } from '@/hooks/admin-v2/useRegistrationsV2'
import type { MessageChannel, RecipientType } from '@/types/messages'

interface BulkMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface RecipientFilters {
  status?: string[]
  city?: string[]
  hasEmail?: boolean
  hasPhone?: boolean
}

export function BulkMessageDialog({ open, onOpenChange }: BulkMessageDialogProps) {
  const [channel, setChannel] = useState<MessageChannel>('email')
  const [recipientType, setRecipientType] = useState<RecipientType>('patient')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [templateId, setTemplateId] = useState<string>('none')
  const [filters, setFilters] = useState<RecipientFilters>({})
  const [previewRecipients, setPreviewRecipients] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const { mutate: sendBulkMessage, isPending } = useSendBulkMessage()
  const { data: templates = [] } = useMessageTemplates()
  const { data: registrations = [] } = useRegistrationsV2()

  // Filtrar templates por canal
  const channelTemplates = templates.filter(t => t.channel === channel)

  // Filtrar destinatários baseado nos filtros
  useEffect(() => {
    let filtered = registrations

    // Filtrar por tipo de contato disponível
    if (channel === 'email') {
      filtered = filtered.filter(r => r.patient?.email && r.patient.email.trim() !== '')
    } else if (channel === 'sms') {
      filtered = filtered.filter(r => r.patient?.telefone && r.patient.telefone.trim() !== '')
    }

    // Aplicar filtros adicionais
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(r => filters.status!.includes(r.status))
    }

    // Para cidade, vamos usar a localização do evento por enquanto
    if (filters.city && filters.city.length > 0) {
      filtered = filtered.filter(r => r.event?.location && filters.city!.includes(r.event.location))
    }

    setPreviewRecipients(filtered)
  }, [registrations, channel, filters])

  // Obter listas únicas para filtros
  const availableStatuses = [...new Set(registrations.map(r => r.status).filter(Boolean))]
  const availableCities = [...new Set(registrations.map(r => r.event?.location).filter(Boolean))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content || previewRecipients.length === 0) return

    const recipients = previewRecipients.map(r => ({
      contact: channel === 'email' ? r.patient?.email || '' : r.patient?.telefone || '',
      name: r.patient?.nome || '',
      variables: {
        nome: r.patient?.nome || '',
        cidade: r.event?.location || '',
        status: r.status,
        evento: r.event?.title || '',
        data_evento: r.event_date?.date || ''
      }
    }))

    sendBulkMessage({
      channel,
      recipient_type: recipientType,
      recipients,
      subject: channel === 'email' ? subject : undefined,
      content,
      template_id: templateId !== 'none' ? templateId : undefined
    }, {
      onSuccess: () => {
        onOpenChange(false)
        // Reset form
        setSubject('')
        setContent('')
        setTemplateId('none')
        setFilters({})
      }
    })
  }

  const handleTemplateChange = (value: string) => {
    if (value === 'none') {
      setTemplateId('none')
      setContent('')
      setSubject('')
    } else {
      setTemplateId(value)
      const template = templates.find(t => t.id === value)
      if (template) {
        setContent(template.content)
        if (template.subject) {
          setSubject(template.subject)
        }
      }
    }
  }

  const handleStatusFilter = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked 
        ? [...(prev.status || []), status]
        : (prev.status || []).filter(s => s !== status)
    }))
  }

  const handleCityFilter = (city: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      city: checked 
        ? [...(prev.city || []), city]
        : (prev.city || []).filter(c => c !== city)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Envio em Massa
          </DialogTitle>
          <DialogDescription>
            Envie mensagens para múltiplos destinatários de uma vez
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Canal */}
          <div className="space-y-2">
            <Label>Canal de Envio</Label>
            <RadioGroup
              value={channel}
              onValueChange={(value) => setChannel(value as MessageChannel)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="bulk-email" />
                <Label htmlFor="bulk-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="bulk-sms" />
                <Label htmlFor="bulk-sms" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  SMS
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filtros de Destinatários */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros de Destinatários
              </CardTitle>
              <CardDescription>
                Selecione quais pacientes receberão a mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtro por Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status?.includes(status) || false}
                        onCheckedChange={(checked) => handleStatusFilter(status, checked as boolean)}
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtro por Cidade */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Local do Evento</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableCities.slice(0, 10).map(location => (
                    <div key={location} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location}`}
                        checked={filters.city?.includes(location) || false}
                        onCheckedChange={(checked) => handleCityFilter(location, checked as boolean)}
                      />
                      <Label htmlFor={`location-${location}`} className="text-sm">
                        {location}
                      </Label>
                    </div>
                  ))}
                  {availableCities.length > 10 && (
                    <p className="text-xs text-muted-foreground">
                      +{availableCities.length - 10} locais...
                    </p>
                  )}
                </div>
              </div>

              {/* Preview de destinatários */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm">
                    {previewRecipients.length} destinatários selecionados
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Ocultar' : 'Visualizar'} Lista
                  </Button>
                </div>
                
                {showPreview && (
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2">
                    {previewRecipients.slice(0, 20).map((recipient, index) => (
                      <div key={index} className="text-xs py-1 flex justify-between">
                        <span>{recipient.patient?.nome}</span>
                        <span className="text-muted-foreground">
                          {channel === 'email' ? recipient.patient?.email : recipient.patient?.telefone}
                        </span>
                      </div>
                    ))}
                    {previewRecipients.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{previewRecipients.length - 20} destinatários...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Template (opcional) */}
          {channelTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bulk-template">Template (Opcional)</Label>
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum template</SelectItem>
                  {channelTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assunto (apenas para email) */}
          {channel === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="bulk-subject">Assunto</Label>
              <Input
                id="bulk-subject"
                placeholder="Assunto da mensagem"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="bulk-content">Conteúdo da Mensagem</Label>
            <Textarea
              id="bulk-content"
              placeholder="Digite sua mensagem aqui... Use {{nome}}, {{evento}}, {{data_evento}}, {{status}} para personalizar"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {{nome}}, {{evento}}, {{data_evento}}, {{status}}
            </p>
            {channel === 'sms' && (
              <p className="text-xs text-muted-foreground">
                {content.length}/160 caracteres por SMS
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || previewRecipients.length === 0}
            >
              {isPending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {previewRecipients.length} destinatários
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}