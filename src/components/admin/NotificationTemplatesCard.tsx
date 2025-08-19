/**
 * Notification Templates Card Component
 * Main dashboard card for managing email and WhatsApp templates
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Plus, 
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react'
import { NotificationTemplatesCardProps, NotificationTemplate } from '@/types/notificationTemplates'
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates'
import { TemplatesList } from './TemplatesList'
import { TemplateForm } from './TemplateForm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ModalMode = 'create' | 'edit' | null
type TemplateType = 'email' | 'whatsapp' | 'sms'

export const NotificationTemplatesCard: React.FC<NotificationTemplatesCardProps> = ({
  className
}) => {
  const [activeTab, setActiveTab] = useState<TemplateType>('email')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)

  const { 
    templates, 
    loading, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    duplicateTemplate, 
    toggleTemplate 
  } = useNotificationTemplates()

  // Filter templates by type
  const emailTemplates = templates.filter(t => t.type === 'email')
  const whatsappTemplates = templates.filter(t => t.type === 'whatsapp')
  const smsTemplates = templates.filter(t => t.type === 'sms')
  const activeTemplates = templates.filter(t => t.is_active)

  // Get templates for current tab
  const currentTemplates = activeTab === 'email' ? emailTemplates : whatsappTemplates

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setModalMode('create')
  }

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setModalMode('edit')
  }

  const handleDuplicateTemplate = async (template: NotificationTemplate) => {
    try {
      const duplicated = await duplicateTemplate(template.id)
      toast.success(`Template duplicado como "${duplicated.name}"`)
      
      // Switch to the duplicated template's tab if different
      if (duplicated.type !== activeTab) {
        setActiveTab(duplicated.type)
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
    }
  }

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    try {
      await deleteTemplate(template.id)
      toast.success(`Template "${template.name}" excluído`)
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleToggleTemplate = async (template: NotificationTemplate) => {
    try {
      await toggleTemplate(template.id)
      const status = template.is_active ? 'desativado' : 'ativado'
      toast.success(`Template "${template.name}" ${status}`)
    } catch (error) {
      console.error('Error toggling template:', error)
    }
  }

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (modalMode === 'create') {
        await createTemplate(templateData)
        toast.success('Template criado com sucesso!')
      } else if (modalMode === 'edit' && selectedTemplate) {
        await updateTemplate(selectedTemplate.id, templateData)
        toast.success('Template atualizado com sucesso!')
      }
      
      setModalMode(null)
      setSelectedTemplate(null)
      
      // Switch to the template's tab if different
      if (templateData.type !== activeTab) {
        setActiveTab(templateData.type)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleCloseModal = () => {
    setModalMode(null)
    setSelectedTemplate(null)
  }

  return (
    <>
      <Card className={cn('hover:shadow-lg transition-all duration-200', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Gerenciar Notificações
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg font-bold">
                {templates.length}
              </Badge>
              <Button
                size="sm"
                onClick={handleCreateTemplate}
                className="h-7 px-3"
              >
                <Plus className="h-3 w-3 mr-1" />
                Novo
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-xs">
            Templates para email e WhatsApp com variáveis dinâmicas
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-primary">{activeTemplates.length}</div>
              <div className="text-xs text-muted-foreground">Ativos</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{emailTemplates.length}</div>
              <div className="text-xs text-muted-foreground">Email</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{whatsappTemplates.length}</div>
              <div className="text-xs text-muted-foreground">WhatsApp</div>
            </div>
          </div>

          {/* Templates Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateType)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
                <Badge variant="secondary" className="ml-1 text-xs">
                  {emailTemplates.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
                <Badge variant="secondary" className="ml-1 text-xs">
                  {whatsappTemplates.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS
                <Badge variant="secondary" className="ml-1 text-xs">
                  {smsTemplates.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-0">
              <div className="space-y-3">
                {emailTemplates.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg">
                    <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhum template de email criado
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateTemplate}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {emailTemplates.slice(0, 3).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">
                              {template.name}
                            </div>
                            <Badge 
                              variant={template.is_active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {template.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {template.subject || 'Sem assunto'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                          className="h-7 px-2"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {emailTemplates.length > 3 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* TODO: Open full templates page */}}
                          className="text-xs"
                        >
                          Ver todos os {emailTemplates.length} templates
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="mt-0">
              <div className="space-y-3">
                {whatsappTemplates.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhum template de WhatsApp criado
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateTemplate}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {whatsappTemplates.slice(0, 3).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">
                              {template.name}
                            </div>
                            <Badge 
                              variant={template.is_active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {template.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {template.content.substring(0, 50)}...
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                          className="h-7 px-2"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {whatsappTemplates.length > 3 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* TODO: Open full templates page */}}
                          className="text-xs"
                        >
                          Ver todos os {whatsappTemplates.length} templates
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sms" className="mt-0">
              <div className="space-y-3">
                {smsTemplates.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhum template de SMS criado
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateTemplate}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Template
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {smsTemplates.slice(0, 3).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm truncate">
                              {template.name}
                            </div>
                            <Badge 
                              variant={template.is_active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {template.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {template.content.substring(0, 50)}...
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                          className="h-7 px-2"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {smsTemplates.length > 3 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* TODO: Open full templates page */}}
                          className="text-xs"
                        >
                          Ver todos os {smsTemplates.length} templates
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateTemplate}
              className="flex-1 h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Novo Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {/* TODO: Open templates management page */}}
              className="flex-1 h-8"
            >
              <Activity className="h-3 w-3 mr-1" />
              Gerenciar Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Form Modal */}
      <Dialog open={modalMode !== null} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Criar Novo Template' : 'Editar Template'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' 
                ? `Criar um novo template de ${activeTab === 'email' ? 'email' : 'WhatsApp'}`
                : `Editando template "${selectedTemplate?.name}"`
              }
            </DialogDescription>
          </DialogHeader>
          
          {modalMode && (
            <TemplateForm
              template={selectedTemplate}
              type={activeTab}
              onSave={handleSaveTemplate}
              onCancel={handleCloseModal}
              isLoading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}