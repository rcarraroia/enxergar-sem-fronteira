import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Loader2, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface SystemSettingsFormProps {
  section: 'general' | 'logos' | 'social' | 'apikeys'
}

export const SystemSettingsForm = ({ section }: SystemSettingsFormProps) => {
  const { getSettingValue, getSettingJSON, updateSetting, isLoading, isUpdating } = useSystemSettings()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    switch (section) {
      case 'general':
        setFormData({
          site_name: getSettingValue('site_name', ''),
          site_description: getSettingValue('site_description', ''),
          contact_email: getSettingValue('contact_email', ''),
          contact_phone: getSettingValue('contact_phone', '')
        })
        break
      case 'logos':
        setFormData({
          logo_url: getSettingValue('logo_url', ''),
          favicon_url: getSettingValue('favicon_url', '')
        })
        break
      case 'social':
        const socialLinks = getSettingJSON('social_media_links', {}) as { facebook?: string; instagram?: string; linkedin?: string }
        setFormData({
          facebook: socialLinks.facebook || '',
          instagram: socialLinks.instagram || '',
          linkedin: socialLinks.linkedin || ''
        })
        break
      case 'apikeys':
        setFormData({
          resend_api_key: getSettingValue('resend_api_key', ''),
          vonage_api_key: getSettingValue('vonage_api_key', ''),
          vonage_api_secret: getSettingValue('vonage_api_secret', '')
        })
        break
    }
  }, [section, getSettingValue, getSettingJSON])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      switch (section) {
        case 'general':
          updateSetting('site_name', formData.site_name)
          updateSetting('site_description', formData.site_description)
          updateSetting('contact_email', formData.contact_email)
          updateSetting('contact_phone', formData.contact_phone)
          break
        case 'logos':
          updateSetting('logo_url', formData.logo_url)
          updateSetting('favicon_url', formData.favicon_url)
          break
        case 'social':
          const socialData = {
            facebook: formData.facebook,
            instagram: formData.instagram,
            linkedin: formData.linkedin
          }
          updateSetting('social_media_links', JSON.stringify(socialData))
          break
        case 'apikeys':
          updateSetting('resend_api_key', formData.resend_api_key)
          updateSetting('vonage_api_key', formData.vonage_api_key)
          updateSetting('vonage_api_secret', formData.vonage_api_secret)
          break
      }

      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="site_name">Nome do Site</Label>
        <Input
          id="site_name"
          value={formData.site_name || ''}
          onChange={(e) => handleInputChange('site_name', e.target.value)}
          placeholder="Enxergar sem Fronteiras"
        />
      </div>

      <div>
        <Label htmlFor="site_description">Descrição do Site</Label>
        <Textarea
          id="site_description"
          value={formData.site_description || ''}
          onChange={(e) => handleInputChange('site_description', e.target.value)}
          placeholder="Promovendo a saúde ocular através de eventos oftalmológicos gratuitos..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="contact_email">Email de Contato</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email || ''}
          onChange={(e) => handleInputChange('contact_email', e.target.value)}
          placeholder="contato@enxergarsemfronteira.com.br"
        />
      </div>

      <div>
        <Label htmlFor="contact_phone">Telefone de Contato</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone || ''}
          onChange={(e) => handleInputChange('contact_phone', e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>
    </div>
  )

  const renderLogosSettings = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="logo_url">URL do Logo</Label>
        <div className="flex gap-2">
          <Input
            id="logo_url"
            value={formData.logo_url || ''}
            onChange={(e) => handleInputChange('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          <Button variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="favicon_url">URL do Favicon</Label>
        <div className="flex gap-2">
          <Input
            id="favicon_url"
            value={formData.favicon_url || ''}
            onChange={(e) => handleInputChange('favicon_url', e.target.value)}
            placeholder="https://example.com/favicon.ico"
          />
          <Button variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderSocialSettings = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="facebook">Facebook</Label>
        <Input
          id="facebook"
          value={formData.facebook || ''}
          onChange={(e) => handleInputChange('facebook', e.target.value)}
          placeholder="https://facebook.com/enxergarsemfronteiras"
        />
      </div>

      <div>
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          value={formData.instagram || ''}
          onChange={(e) => handleInputChange('instagram', e.target.value)}
          placeholder="https://instagram.com/enxergarsemfronteiras"
        />
      </div>

      <div>
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          value={formData.linkedin || ''}
          onChange={(e) => handleInputChange('linkedin', e.target.value)}
          placeholder="https://linkedin.com/company/enxergarsemfronteiras"
        />
      </div>
    </div>
  )

  const renderApiKeysSettings = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="resend_api_key">Resend API Key</Label>
        <Input
          id="resend_api_key"
          type="password"
          value={formData.resend_api_key || ''}
          onChange={(e) => handleInputChange('resend_api_key', e.target.value)}
          placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
      </div>

      <div>
        <Label htmlFor="vonage_api_key">Vonage API Key</Label>
        <Input
          id="vonage_api_key"
          value={formData.vonage_api_key || ''}
          onChange={(e) => handleInputChange('vonage_api_key', e.target.value)}
          placeholder="xxxxxxxx"
        />
      </div>

      <div>
        <Label htmlFor="vonage_api_secret">Vonage API Secret</Label>
        <Input
          id="vonage_api_secret"
          type="password"
          value={formData.vonage_api_secret || ''}
          onChange={(e) => handleInputChange('vonage_api_secret', e.target.value)}
          placeholder="xxxxxxxxxxxxxxxx"
        />
      </div>
    </div>
  )

  const getSectionTitle = () => {
    switch (section) {
      case 'general': return 'Configurações Gerais'
      case 'logos': return 'Logos e Imagens'
      case 'social': return 'Redes Sociais'
      case 'apikeys': return 'Chaves de API'
      default: return 'Configurações'
    }
  }

  const getSectionDescription = () => {
    switch (section) {
      case 'general': return 'Configure as informações básicas do sistema'
      case 'logos': return 'Gerencie os logos e imagens do sistema'
      case 'social': return 'Configure os links das redes sociais'
      case 'apikeys': return 'Configure as chaves de API dos serviços externos'
      default: return 'Configure o sistema'
    }
  }

  const renderSectionContent = () => {
    switch (section) {
      case 'general': return renderGeneralSettings()
      case 'logos': return renderLogosSettings()
      case 'social': return renderSocialSettings()
      case 'apikeys': return renderApiKeysSettings()
      default: return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getSectionTitle()}</CardTitle>
        <CardDescription>{getSectionDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderSectionContent()}

          <Button type="submit" disabled={isSaving || isUpdating}>
            {(isSaving || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {(isSaving || isUpdating) ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
