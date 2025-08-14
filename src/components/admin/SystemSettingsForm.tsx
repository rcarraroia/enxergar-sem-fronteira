import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, Image, Share2, Save } from 'lucide-react'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { ImageUpload } from './ImageUpload'

interface SystemSettingsFormProps {
  section: 'general' | 'logos' | 'social'
}

export const SystemSettingsForm = ({ section }: SystemSettingsFormProps) => {
  const { settings, loading, updateSetting } = useSystemSettings()
  const [formData, setFormData] = useState(settings)

  React.useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleSave = async () => {
    try {
      switch (section) {
        case 'general':
          await updateSetting('project_name', formData.project_name)
          await updateSetting('project_description', formData.project_description)
          break
        case 'logos':
          await updateSetting('logo_header', formData.logo_header)
          await updateSetting('logo_footer', formData.logo_footer)
          break
        case 'social':
          await updateSetting('social_links', formData.social_links)
          break
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (section === 'general') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>
            Configure as informações básicas do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="project_name">Nome do Projeto</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="Nome do projeto"
            />
          </div>

          <div>
            <Label htmlFor="project_description">Descrição do Projeto</Label>
            <Input
              id="project_description"
              value={formData.project_description}
              onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              placeholder="Descrição do projeto"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações Gerais
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (section === 'logos') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Configuração de Logos
          </CardTitle>
          <CardDescription>
            Configure as logos que aparecerão no cabeçalho e rodapé do site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            label="Logo do Cabeçalho (Colorida)"
            value={formData.logo_header}
            onChange={(url) => setFormData({ ...formData, logo_header: url })}
            placeholder="URL da logo colorida (recomendado: 200x50px)"
            description="Tamanho recomendado: 200x50px para melhor qualidade no cabeçalho"
            previewBg="bg-white"
          />

          <Separator />

          <ImageUpload
            label="Logo do Rodapé (Branca)"
            value={formData.logo_footer}
            onChange={(url) => setFormData({ ...formData, logo_footer: url })}
            placeholder="URL da logo branca (recomendado: 150x40px)"
            description="Tamanho recomendado: 150x40px para melhor qualidade no rodapé"
            previewBg="bg-slate-800"
          />

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações de Logo
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Redes Sociais
        </CardTitle>
        <CardDescription>
          Configure os links das redes sociais que aparecerão no rodapé
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            value={formData.social_links.facebook}
            onChange={(e) => setFormData({ 
              ...formData, 
              social_links: { ...formData.social_links, facebook: e.target.value }
            })}
            placeholder="https://facebook.com/sua-pagina"
          />
        </div>

        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={formData.social_links.instagram}
            onChange={(e) => setFormData({ 
              ...formData, 
              social_links: { ...formData.social_links, instagram: e.target.value }
            })}
            placeholder="https://instagram.com/seu-perfil"
          />
        </div>

        <div>
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.social_links.linkedin}
            onChange={(e) => setFormData({ 
              ...formData, 
              social_links: { ...formData.social_links, linkedin: e.target.value }
            })}
            placeholder="https://linkedin.com/company/sua-empresa"
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salvar Links das Redes Sociais
        </Button>
      </CardContent>
    </Card>
  )
}
