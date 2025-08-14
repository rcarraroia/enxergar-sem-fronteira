
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

const DEFAULT_SETTINGS: SystemSettings = {
  social_links: { facebook: '', instagram: '', linkedin: '' },
  logo_header: '',
  logo_footer: '',
  project_name: 'Enxergar sem Fronteiras',
  project_description: 'Democratizando o acesso à saúde oftalmológica'
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const safeJsonParse = (value: any, fallback: any = null) => {
    if (!value) return fallback
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
      try {
        // Check if it's already a valid JSON string
        if (value.trim() === '') return fallback
        return JSON.parse(value)
      } catch (error) {
        console.warn('🔧 Failed to parse JSON value:', value, 'Using fallback:', fallback)
        return fallback
      }
    }
    return fallback
  }

  const fetchSettings = async () => {
    try {
      console.log('🔧 Buscando configurações do sistema...')
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')

      if (error) {
        console.error('❌ Erro ao buscar configurações:', error)
        throw error
      }

      console.log('📊 Dados recebidos:', data)

      if (!data || data.length === 0) {
        console.log('📝 Nenhuma configuração encontrada, usando padrões')
        setSettings(DEFAULT_SETTINGS)
        setLoading(false)
        return
      }

      const settingsObj: any = { ...DEFAULT_SETTINGS }
      
      data.forEach(item => {
        if (!item.key || item.value === undefined || item.value === null) {
          console.warn('⚠️ Item inválido ignorado:', item)
          return
        }

        const parsedValue = safeJsonParse(item.value, null)
        
        if (parsedValue !== null) {
          settingsObj[item.key] = parsedValue
          console.log(`✅ Configuração carregada: ${item.key}`)
        } else {
          console.warn(`⚠️ Valor inválido para ${item.key}, usando padrão`)
        }
      })

      // Ensure social_links has the correct structure
      if (!settingsObj.social_links || typeof settingsObj.social_links !== 'object') {
        settingsObj.social_links = DEFAULT_SETTINGS.social_links
      } else {
        settingsObj.social_links = {
          ...DEFAULT_SETTINGS.social_links,
          ...settingsObj.social_links
        }
      }

      setSettings(settingsObj)
      console.log('✅ Configurações carregadas com sucesso:', settingsObj)
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error)
      toast.error('Erro ao carregar configurações do sistema')
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    try {
      console.log(`📝 Atualizando configuração: ${key}`)
      
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key, 
          value: jsonValue,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Erro ao atualizar configuração:', error)
        throw error
      }

      await fetchSettings()
      toast.success('Configuração atualizada com sucesso!')
      console.log(`✅ Configuração ${key} atualizada`)
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração:', error)
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
