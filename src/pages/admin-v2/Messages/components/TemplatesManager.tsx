/**
 * GERENCIADOR DE TEMPLATES
 */

import { useState } from 'react'
import { Plus, Edit, Trash2, Mail, Smartphone, MessageSquare, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMessageTemplates, useCreateTemplate, useDeleteTemplate } from '@/hooks/messages/useMessages'
import { TemplateProcessor } from '@/services/messages/TemplateProcessor'
import type { MessageChannel, CreateTemplateData } from '@/types/messages'

export function TemplatesManager() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  const { data: templates = [], isLoading } = useMessageTemplates()
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate()
  const { mutate: deleteTemplate } = useDeleteTemplate()

  const templateProcessor = new TemplateProcessor()

  const getChannelIcon = (channel: MessageChannel) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <Smartphone className="h-4 w-4 text-green-500" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const handlePreview = (template: any) => {
    setSelectedTemplate(template)
    setPreviewDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-muted-foreground">
            Gerencie templates de mensagens reutilizáveis
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Lista de templates */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(template.channel)}
                    <Badge variant="outline" className="text-xs">
                      {template.channel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {template.subject && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">ASSUNTO</p>
                      <p className="text-sm truncate">{template.subject}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">CONTEÚDO</p>
                    <p className="text-sm line-clamp-3">{template.content}</p>
                  </div>
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">VARIÁVEIS</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable: string) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhum template criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie templates reutilizáveis para agilizar o envio de mensagens
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de criação */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={createTemplate}
        isLoading={isCreating}
      />

      {/* Dialog de preview */}
      <PreviewTemplateDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        template={selectedTemplate}
        templateProcessor={templateProcessor}
      />
    </div>
  )
}

function CreateTemplateDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTemplateData) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    description: '',
    channel: 'email',
    subject: '',
    content: '',
    variables: []
  })

  const templateProcessor = new TemplateProcessor()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Extrair variáveis do conteúdo
    const variables = templateProcessor.extractVariables(formData.content)
    if (formData.subject) {
      variables.push(...templateProcessor.extractVariables(formData.subject))
    }

    onSubmit({
      ...formData,
      variables: [...new Set(variables)] // Remove duplicatas
    })

    // Reset form
    setFormData({
      name: '',
      description: '',
      channel: 'email',
      subject: '',
      content: '',
      variables: []
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Template</DialogTitle>
          <DialogDescription>
            Crie um template reutilizável para suas mensagens
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                placeholder="Ex: Boas-vindas Paciente"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select 
                value={formData.channel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value as MessageChannel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              placeholder="Descreva quando usar este template"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {formData.channel === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Ex: Bem-vindo(a) ao Enxergar Sem Fronteiras, [nome]!"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="Digite o conteúdo do template. Use [variavel] para inserir variáveis dinâmicas."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use [nome], [email], [data_consulta] etc. para inserir variáveis dinâmicas
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PreviewTemplateDialog({ 
  open, 
  onOpenChange, 
  template, 
  templateProcessor 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: any
  templateProcessor: TemplateProcessor
}) {
  if (!template) return null

  const preview = templateProcessor.generatePreview(template.content)
  const subjectPreview = template.subject ? templateProcessor.generatePreview(template.subject) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>
            Visualização do template com dados de exemplo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {subjectPreview && (
            <div>
              <Label className="text-sm font-medium">Assunto</Label>
              <div className="p-3 bg-muted rounded border">
                {subjectPreview}
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Conteúdo</Label>
            <div className="p-4 bg-muted rounded border whitespace-pre-wrap">
              {preview}
            </div>
          </div>

          {template.variables.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Variáveis Disponíveis</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {template.variables.map((variable: string) => (
                  <Badge key={variable} variant="outline">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}