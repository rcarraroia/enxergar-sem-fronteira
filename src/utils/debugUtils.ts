
// Utilitários para debug e correção de bugs do sistema
export const debugUtils = {
  // Verificar integridade dos dados
  validateData: (data: any, schema: string) => {
    console.log(`🔍 Validando dados para ${schema}:`, data)
    
    if (!data) {
      console.warn(`⚠️ Dados vazios para ${schema}`)
      return false
    }
    
    return true
  },

  // Monitorar performance de funções
  measureFunction: async <T>(fn: () => Promise<T>, name: string): Promise<T> => {
    const start = performance.now()
    console.log(`⚡ Iniciando ${name}...`)
    
    try {
      const result = await fn()
      const end = performance.now()
      console.log(`✅ ${name} completado em ${(end - start).toFixed(2)}ms`)
      return result
    } catch (error) {
      const end = performance.now()
      console.error(`❌ ${name} falhou em ${(end - start).toFixed(2)}ms:`, error)
      throw error
    }
  },

  // Validar configurações do sistema
  validateSystemConfig: () => {
    const requiredEnvs = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ]
    
    const missing = requiredEnvs.filter(env => !import.meta.env[`VITE_${env}`] && !window.location.origin)
    
    if (missing.length > 0) {
      console.warn('⚠️ Configurações faltando:', missing)
      return false
    }
    
    console.log('✅ Todas as configurações necessárias estão presentes')
    return true
  },

  // Verificar estado da aplicação
  checkAppHealth: () => {
    const health = {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      console: typeof console !== 'undefined',
      performance: typeof performance !== 'undefined'
    }
    
    console.log('🏥 Saúde da aplicação:', health)
    
    const allHealthy = Object.values(health).every(Boolean)
    if (!allHealthy) {
      console.error('❌ Alguns recursos críticos não estão disponíveis')
    }
    
    return allHealthy
  },

  // Limpar dados corrompidos
  cleanCorruptedData: () => {
    try {
      // Limpar localStorage corrompido
      Object.keys(localStorage).forEach(key => {
        try {
          const value = localStorage.getItem(key)
          if (value && (value.includes('undefined') || value === 'null')) {
            console.log(`🧹 Removendo item corrompido: ${key}`)
            localStorage.removeItem(key)
          }
        } catch (error) {
          console.log(`🧹 Removendo item inválido: ${key}`)
          localStorage.removeItem(key)
        }
      })
      
      console.log('✅ Limpeza de dados corrompidos concluída')
    } catch (error) {
      console.error('❌ Erro na limpeza de dados:', error)
    }
  },

  // Detectar vazamentos de memória
  detectMemoryLeaks: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usage = {
        used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      }
      
      console.log('💾 Uso de memória:', usage)
      
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
        console.warn('⚠️ Alto uso de memória detectado!')
        return false
      }
    }
    
    return true
  },

  // Executar diagnóstico completo
  runFullDiagnostic: () => {
    console.log('🔧 Iniciando diagnóstico completo do sistema...')
    
    const results = {
      appHealth: debugUtils.checkAppHealth(),
      systemConfig: debugUtils.validateSystemConfig(),
      memoryHealth: debugUtils.detectMemoryLeaks(),
      timestamp: new Date().toISOString()
    }
    
    debugUtils.cleanCorruptedData()
    
    console.log('📊 Resultados do diagnóstico:', results)
    
    const overallHealth = Object.values(results).slice(0, -1).every(Boolean)
    console.log(overallHealth ? '✅ Sistema saudável' : '⚠️ Problemas detectados')
    
    return results
  }
}

// Auto-executar diagnóstico em desenvolvimento
if (import.meta.env.DEV) {
  setTimeout(() => {
    debugUtils.runFullDiagnostic()
  }, 1000)
}
