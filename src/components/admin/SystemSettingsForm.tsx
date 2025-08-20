
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { Settings, Save, Loader2 } from 'lucide-react'

export const SystemSettingsForm = () => {
  const { settings, isLoading, updateSetting, isUpdating, getSettingValue, getSettingJSON } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    // Organização
    organization_name: '',
    organization_description: '',
    organization_phone: '',
    organization_email: '',
    organization_address: '',
    
    // Redes Sociais
    social_media_links: {
      facebook: '',
      instagram: '',
      linkedin: ''
    },
    
    // Email
    email_sender_name: '',
    email_sender_email: '',
    email_reply_to: '',
    
    // Notificações
    sms_enabled: 'true',
    email_enabled: 'true',
    whatsapp_enabled: 'false',
    
    // Sistema
    max_registrations_per_event: '100',
    registration_deadline_hours: '24',
    reminder_hours_before: '24'
  })

  useEffect(() => {
    if (settings && settings.length > 0) {
      const socialLinks = getSettingJSON('social_media_links', { facebook: '', instagram: '', linkedin: '' }) as { facebook: string; instagram: string; linkedin: string }
      
      setFormData({
        organization_name: getSettingValue('organization_name', ''),
        organization_description: getSettingValue('organization_description', ''),
        organization_phone: getSettingValue('organization_phone', ''),
        organization_email: getSettingValue('organization_email', ''),
        organization_address: getSettingValue('organization_address', ''),
        social_media_links: {
          facebook: socialLinks.facebook || '',
          instagram: socialLinks.instagram || '',
          linkedin: socialLinks.linkedin || ''
        },
        email_sender_name: getSettingValue('email_sender_name', ''),
        email_sender_email: getSettingValue('email_sender_email', ''),
        email_reply_to: getSettingValue('email_reply_to', ''),
        sms_enabled: getSettingValue('sms_enabled', 'true'),
        email_enabled: getSettingValue('email_enabled', 'true'),
        whatsapp_enabled: getSettingValue('whatsapp_enabled', 'false'),
        max_registrations_per_event: getSettingValue('max_registrations_per_event', '100'),
        registration_deadline_hours: getSettingValue('registration_deadline_hours', '24'),
        reminder_hours_before: getSettingValue('reminder_hours_before', '24')
      })
    }
  }, [settings, getSettingValue, getSettingJSON])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Atualizar configurações individualmente
    const updates = [
      { key: 'organization_name', value: formData.organization_name },
      { key: 'organization_description', value: formData.organization_description },
      { key: 'organization_phone', value: formData.organization_phone },
      { key: 'organization_email', value: formData.organization_email },
      { key: 'organization_address', value: formData.organization_address },
      { key: 'social_media_links', value: JSON.stringify(formData.social_media_links) },
      { key: 'email_sender_name', value: formData.email_sender_name },
      { key: 'email_sender_email', value: formData.email_sender_email },
      { key: 'email_reply_to', value: formData.email_reply_to },
      { key: 'sms_enabled', value: formData.sms_enabled },
      { key: 'email_enabled', value: formData.email_enabled },
      { key: 'whatsapp_enabled', value: formData.whatsapp_enabled },
      { key: 'max_registrations_per_event', value: formData.max_registrations_per_event },
      { key: 'registration_deadline_hours', value: formData.registration_deadline_hours },
      { key: 'reminder_hours_before', value: formData.reminder_hours_before }
    ]

    for (const update of updates) {
      updateSetting(update.key, update.value)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton variant="card" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Sistema
        </CardTitle>
        <CardDescription>
          Configure as informações gerais da organização e parâmetros do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Organização */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações da Organização</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization_name">Nome da Organização</Label>
                <Input
                  id="organization_name"
                  value={formData.organization_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="organization_email">Email da Organização</Label>
                <Input
                  id="organization_email"
                  type="email"
                  value={formData.organization_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization_email: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="organization_description">Descrição</Label>
              <Textarea
                id="organization_description"
                value={formData.organization_description}
                onChange={(e) => setFormData(prev => ({ ...prev, organization_description: e.target.value }))}
                disabled={isUpdating}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization_phone">Telefone</Label>
                <Input
                  id="organization_phone"
                  value={formData.organization_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization_phone: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="organization_address">Endereço</Label>
                <Input
                  id="organization_address"
                  value={formData.organization_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization_address: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Redes Sociais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={formData.social_media_links.facebook}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    social_media_links: { ...prev.social_media_links, facebook: e.target.value }
                  }))}
                  placeholder="https://facebook.com/..."
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.social_media_links.instagram}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    social_media_links: { ...prev.social_media_links, instagram: e.target.value }
                  }))}
                  placeholder="https://instagram.com/..."
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={formData.social_media_links.linkedin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    social_media_links: { ...prev.social_media_links, linkedin: e.target.value }
                  }))}
                  placeholder="https://linkedin.com/..."
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Email */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações de Email</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email_sender_name">Nome do Remetente</Label>
                <Input
                  id="email_sender_name"
                  value={formData.email_sender_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_sender_name: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="email_sender_email">Email do Remetente</Label>
                <Input
                  id="email_sender_email"
                  type="email"
                  value={formData.email_sender_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_sender_email: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email_reply_to">Email de Resposta</Label>
              <Input
                id="email_reply_to"
                type="email"
                value={formData.email_reply_to}
                onChange={(e) => setFormData(prev => ({ ...prev, email_reply_to: e.target.value }))}
                disabled={isUpdating}
              />
            </div>
          </div>

          <Separator />

          {/* Configurações do Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_registrations_per_event">Máximo de Inscrições por Evento</Label>
                <Input
                  id="max_registrations_per_event"
                  type="number"
                  value={formData.max_registrations_per_event}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_registrations_per_event: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="registration_deadline_hours">Prazo para Inscrição (horas)</Label>
                <Input
                  id="registration_deadline_hours"
                  type="number"
                  value={formData.registration_deadline_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline_hours: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="reminder_hours_before">Lembrete (horas antes)</Label>
                <Input
                  id="reminder_hours_before"
                  type="number"
                  value={formData.reminder_hours_before}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_hours_before: e.target.value }))}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
