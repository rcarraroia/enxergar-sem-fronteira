
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface SystemSettings {
  social_links: {
    facebook: string
    instagram: string
    linkedin: string
  }
  logo_header: string
  logo_footer: string
  project_name: string
  project_description: string
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    social_links: { facebook: '', instagram: '', linkedin: '' },
    logo_header: '',
    logo_footer: '',
    project_name: 'Enxergar sem Fronteiras',
    project_description: 'Democratizando o acesso à saúde oftalmológica'
  })
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')

      if (error) throw error

      const settingsObj: any = {}
      data?.forEach(item => {
        settingsObj[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value
      })

      setSettings({
        social_links: settingsObj.social_links || { facebook: '', instagram: '', linkedin: '' },
        logo_header: settingsObj.logo_header || '',
        logo_footer: settingsObj.logo_footer || '',
        project_name: settingsObj.project_name || 'Enxergar sem Fronteiras',
        project_description: settingsObj.project_description || 'Democratizando o acesso à saúde oftalmológica'
      })
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      toast.error('Erro ao carregar configurações do sistema')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key, 
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      await fetchSettings()
      toast.success('Configuração atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error)
      toast.error('Erro ao salvar configuração')
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    updateSetting,
    fetchSettings
  }
}
