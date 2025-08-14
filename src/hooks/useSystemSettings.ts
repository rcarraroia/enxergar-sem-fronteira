
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { debugUtils } from '@/utils/debugUtils'

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
  asaas_ong_coracao_valente: string
  asaas_projeto_visao_itinerante: string
  asaas_renum_tecnologia: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  social_links: { facebook: '', instagram: '', linkedin: '' },
  logo_header: '',
  logo_footer: '',
  project_name: 'Enxergar sem Fronteiras',
  project_description: 'Democratizando o acesso à saúde oftalmológica',
  asaas_ong_coracao_valente: '',
  asaas_projeto_visao_itinerante: '',
  asaas_renum_tecnologia: ''
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const safeJsonParse = (value: string, fallback: any = null) => {
    if (!value || value.trim() === '') return fallback
    
    try {
      // Se o valor já começa e termina com aspas, é uma string JSON
      if (value.startsWith('"') && value.endsWith('"')) {
        return JSON.parse(value)
      }
      
      // Se parece ser um objeto JSON
      if (value.startsWith('{') && value.endsWith('}')) {
        return JSON.parse(value)
      }
      
      // Caso contrário, retornar como string
      return value
    } catch (error) {
      console.warn('🔧 Failed to parse JSON value:', value, 'Using fallback:', fallback)
      return fallback
    }
  }

  const fetchSettings = async () => {
    try {
      console.log('🔧 Buscando configurações do sistema...')
      
      const result = await debugUtils.measureFunction(async () => {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')

        if (error) {
          console.error('❌ Erro ao buscar configurações:', error)
          throw error
        }

        return data
      }, 'fetchSystemSettings')

      console.log('📊 Dados recebidos:', result)

      if (!result || result.length === 0) {
        console.log('📝 Nenhuma configuração encontrada, usando padrões')
        setSettings(DEFAULT_SETTINGS)
        setLoading(false)
        return
      }

      const settingsObj: any = { ...DEFAULT_SETTINGS }
      
      result.forEach(item => {
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

      // Garantir estrutura correta do social_links
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
      
      // Validações específicas
      if ((key === 'logo_header' || key === 'logo_footer') && typeof value === 'string' && value.trim()) {
        try {
          new URL(value)
        } catch {
          toast.error('URL da logo inválida')
          return
        }
      }

      await debugUtils.measureFunction(async () => {
        // Preparar valor para salvamento
        const jsonValue = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value)
        
        // Primeiro, verificar se o registro existe
        const { data: existing } = await supabase
          .from('system_settings')
          .select('id')
          .eq('key', key)
          .single()

        if (existing) {
          // Atualizar registro existente
          const { error } = await supabase
            .from('system_settings')
            .update({ 
              value: jsonValue,
              updated_at: new Date().toISOString()
            })
            .eq('key', key)

          if (error) {
            console.error('❌ Erro ao atualizar configuração:', error)
            throw error
          }
        } else {
          // Inserir novo registro
          const { error } = await supabase
            .from('system_settings')
            .insert({ 
              key, 
              value: jsonValue
            })

          if (error) {
            console.error('❌ Erro ao inserir configuração:', error)
            throw error
          }
        }
      }, `updateSetting-${key}`)

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
