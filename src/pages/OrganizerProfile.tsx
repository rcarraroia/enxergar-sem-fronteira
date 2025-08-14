import React, { useState, useEffect } from 'react'
import { OrganizerLayout } from '@/components/organizer/OrganizerLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Key,
  Bell,
  Save,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface NotificationPreferences {
  email_reminders: boolean
  sms_reminders: boolean
  registration_notifications: boolean
  event_updates: boolean
}

interface OrganizerProfile {
  id: string
  name: string
  email: string
  phone?: string
  organization?: string
  address?: string
  profile_image_url?: string
  asaas_api_key?: string
  whatsapp_api_key?: string
  notification_preferences: NotificationPreferences
  created_at?: string
  last_login?: string
}

const OrganizerProfile = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAsaasKey, setShowAsaasKey] = useState(false)
  const [showWhatsAppKey, setShowWhatsAppKey] = useState(false)
  const [profile, setProfile] = useState<OrganizerProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    organization: '',
    address: '',
    asaas_api_key: '',
    whatsapp_api_key: '',
    notification_preferences: {
      email_reminders: true,
      sms_reminders: false,
      registration_notifications: true,
      event_updates: true
    } as NotificationPreferences
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      // Safely parse notification_preferences
      const notificationPrefs = (data.notification_preferences as unknown as NotificationPreferences) || {
        email_reminders: true,
        sms_reminders: false,
        registration_notifications: true,
        event_updates: true
      }

      const profileData: OrganizerProfile = {
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        organization: data.organization || '',
        address: data.address || '',
        profile_image_url: data.profile_image_url || '',
        asaas_api_key: data.asaas_api_key || '',
        whatsapp_api_key: data.whatsapp_api_key || '',
        notification_preferences: notificationPrefs,
        created_at: data.created_at,
        last_login: data.last_login
      }

      setProfile(profileData)
      setFormData({
        name: profileData.name,
        phone: profileData.phone || '',
        organization: profileData.organization || '',
        address: profileData.address || '',
        asaas_api_key: profileData.asaas_api_key || '',
        whatsapp_api_key: profileData.whatsapp_api_key || '',
        notification_preferences: profileData.notification_preferences
      })
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('organizers')
        .update({
          name: formData.name,
          phone: formData.phone,
          organization: formData.organization,
          address: formData.address,
          asaas_api_key: formData.asaas_api_key || null,
          whatsapp_api_key: formData.whatsapp_api_key || null,
          notification_preferences: formData.notification_preferences as unknown as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      await fetchProfile()
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="organization">Organização</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  placeholder="Hospital, Clínica, ONG..."
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Endereço completo"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Chaves de API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="asaas_api_key">Chave API Asaas</Label>
                <div className="relative">
                  <Input
                    id="asaas_api_key"
                    type={showAsaasKey ? 'text' : 'password'}
                    value={formData.asaas_api_key}
                    onChange={(e) => handleInputChange('asaas_api_key', e.target.value)}
                    placeholder="$aact_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowAsaasKey(!showAsaasKey)}
                  >
                    {showAsaasKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Para processar pagamentos e doações
                </p>
              </div>

              <div>
                <Label htmlFor="whatsapp_api_key">Chave API WhatsApp</Label>
                <div className="relative">
                  <Input
                    id="whatsapp_api_key"
                    type={showWhatsAppKey ? 'text' : 'password'}
                    value={formData.whatsapp_api_key}
                    onChange={(e) => handleInputChange('whatsapp_api_key', e.target.value)}
                    placeholder="Chave da API do WhatsApp"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowWhatsAppKey(!showWhatsAppKey)}
                  >
                    {showWhatsAppKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Para envio de notificações via WhatsApp
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferências de Notificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_reminders">Lembretes por Email</Label>
                  <p className="text-xs text-gray-500">
                    Receber lembretes sobre eventos por email
                  </p>
                </div>
                <Switch
                  id="email_reminders"
                  checked={formData.notification_preferences.email_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('email_reminders', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms_reminders">Lembretes por SMS</Label>
                  <p className="text-xs text-gray-500">
                    Receber lembretes sobre eventos por SMS
                  </p>
                </div>
                <Switch
                  id="sms_reminders"
                  checked={formData.notification_preferences.sms_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('sms_reminders', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="registration_notifications">Notificações de Inscrição</Label>
                  <p className="text-xs text-gray-500">
                    Ser notificado sobre novas inscrições
                  </p>
                </div>
                <Switch
                  id="registration_notifications"
                  checked={formData.notification_preferences.registration_notifications}
                  onCheckedChange={(checked) => handleNotificationChange('registration_notifications', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="event_updates">Atualizações de Eventos</Label>
                  <p className="text-xs text-gray-500">
                    Receber notificações sobre mudanças nos eventos
                  </p>
                </div>
                <Switch
                  id="event_updates"
                  checked={formData.notification_preferences.event_updates}
                  onCheckedChange={(checked) => handleNotificationChange('event_updates', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status da Conta</Label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ativa
                  </span>
                </div>
              </div>

              {profile?.created_at && (
                <div>
                  <Label>Membro desde</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {profile?.last_login && (
                <div>
                  <Label>Último acesso</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(profile.last_login).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </OrganizerLayout>
  )
}

export default OrganizerProfile
