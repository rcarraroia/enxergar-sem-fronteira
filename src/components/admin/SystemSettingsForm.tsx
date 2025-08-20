
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { toast } from 'sonner'

export const SystemSettingsForm = () => {
  const { getSettingValue, getSettingJSON, updateSetting, isUpdating } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: ''
    }
  })

  useEffect(() => {
    const socialLinksData = getSettingJSON('social_links', {
      facebook: '',
      instagram: '',
      linkedin: ''
    })
    
    // Garantir que os valores são strings
    const safeSocialLinks = {
      facebook: typeof socialLinksData.facebook === 'string' ? socialLinksData.facebook : '',
      instagram: typeof socialLinksData.instagram === 'string' ? socialLinksData.instagram : '',
      linkedin: typeof socialLinksData.linkedin === 'string' ? socialLinksData.linkedin : ''
    }

    setFormData({
      projectName: getSettingValue('project_name', 'Enxergar sem Fronteiras'),
      projectDescription: getSettingValue('project_description', 'Cuidados oftalmológicos gratuitos'),
      socialLinks: safeSocialLinks
    })
  }, [getSettingValue, getSettingJSON])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateSetting('project_name', formData.projectName)
      await updateSetting('project_description', formData.projectDescription)
      await updateSetting('social_links', JSON.stringify(formData.socialLinks))
      
      toast.success('Configurações atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast.error('Erro ao salvar configurações')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="projectName">Nome do Projeto</Label>
            <Input
              id="projectName"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              placeholder="Nome do projeto"
            />
          </div>

          <div>
            <Label htmlFor="projectDescription">Descrição do Projeto</Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
              placeholder="Descrição do projeto"
            />
          </div>

          <div className="space-y-4">
            <Label>Redes Sociais</Label>
            
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.socialLinks.facebook}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.socialLinks.instagram}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.socialLinks.linkedin}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                })}
                placeholder="https://linkedin.com/..."
              />
            </div>
          </div>

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
