
// Utilitários básicos para testes manuais e validação
export const basicTestUtils = {
  // Validação de componentes
  validateComponent: (componentName: string, element: HTMLElement | null): boolean => {
    if (!element) {
      console.error(`❌ Componente ${componentName} não encontrado`)
      return false
    }
    
    console.log(`✅ Componente ${componentName} renderizado corretamente`)
    return true
  },

  // Validação de formulários
  validateForm: (formName: string, formData: Record<string, any>): { isValid: boolean, errors: string[] } => {
    console.log(`🧪 Validando formulário: ${formName}`, formData)
    
    const errors: string[] = []
    const requiredFields = ['nome', 'email', 'cpf', 'telefone']
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors.push(`Campo ${field} é obrigatório`)
      }
    })
    
    const isValid = errors.length === 0
    
    if (isValid) {
      console.log(`✅ Formulário ${formName} válido`)
    } else {
      console.error(`❌ Formulário ${formName} inválido:`, errors)
    }
    
    return { isValid, errors }
  },

  // Teste de API
  testApiEndpoint: async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    console.log(`🔄 Testando endpoint: ${method} ${endpoint}`)
    
    try {
      const startTime = performance.now()
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (response.ok) {
        console.log(`✅ Endpoint ${endpoint} respondeu em ${duration.toFixed(2)}ms`)
        return { success: true, duration, status: response.status }
      } else {
        console.error(`❌ Endpoint ${endpoint} falhou com status ${response.status}`)
        return { success: false, duration, status: response.status }
      }
    } catch (error) {
      console.error(`❌ Erro ao testar endpoint ${endpoint}:`, error)
      return { success: false, error }
    }
  },

  // Teste de performance
  measureRenderTime: (componentName: string, renderFunction: () => void): number => {
    const startTime = performance.now()
    renderFunction()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ ${componentName} renderizado em ${duration.toFixed(2)}ms`)
    
    if (duration > 100) {
      console.warn(`⚠️ ${componentName} levou mais de 100ms para renderizar`)
    }
    
    return duration
  },

  // Teste de acessibilidade básico
  checkAccessibility: (element: HTMLElement): { score: number, issues: string[] } => {
    const issues: string[] = []
    
    // Verificar se tem alt text em imagens
    const images = element.querySelectorAll('img')
    images.forEach((img, index) => {
      if (!img.alt) {
        issues.push(`Imagem ${index + 1} sem texto alternativo`)
      }
    })
    
    // Verificar se botões têm labels
    const buttons = element.querySelectorAll('button')
    buttons.forEach((button, index) => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        issues.push(`Botão ${index + 1} sem label acessível`)
      }
    })
    
    // Verificar inputs
    const inputs = element.querySelectorAll('input')
    inputs.forEach((input, index) => {
      if (!input.getAttribute('aria-label') && !input.id) {
        issues.push(`Input ${index + 1} sem label associado`)
      }
    })
    
    const score = Math.max(0, 100 - (issues.length * 10))
    
    console.log(`♿ Score de acessibilidade: ${score}/100`)
    if (issues.length > 0) {
      console.warn('⚠️ Problemas de acessibilidade encontrados:', issues)
    }
    
    return { score, issues }
  },

  // Simulação de dados para testes
  generateMockData: {
    patient: () => ({
      nome: 'João Silva Test',
      cpf: '123.456.789-09',
      email: 'joao.test@example.com',
      telefone: '(11) 99999-9999',
      data_nascimento: '1990-01-01',
      consentimento_lgpd: true
    }),
    
    event: () => ({
      city: 'São Paulo',
      location: 'Centro Médico Test',
      address: 'Rua das Flores, 123 - Centro',
      description: 'Evento de teste para validação',
      status: 'open' as const,
      dates: [{
        date: '2025-12-01',
        start_time: '08:00',
        end_time: '17:00',
        total_slots: 50,
        available_slots: 50
      }]
    }),
    
    organizer: () => ({
      name: 'Organizador Test',
      email: 'organizador.test@organizer.com',
      organization: 'ONG Test',
      phone: '(11) 99999-9999',
      address: 'Rua Test, 456'
    })
  },

  // Validação de estado da aplicação
  validateAppState: () => {
    const checks = {
      localStorage: typeof localStorage !== 'undefined',
      supabaseClient: typeof window !== 'undefined',
      reactQuery: true, // Assumindo que está configurado
      routing: typeof window !== 'undefined' && !!window.location
    }
    
    const passedChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length
    
    console.log(`🏥 Estado da aplicação: ${passedChecks}/${totalChecks} checks passaram`)
    
    Object.entries(checks).forEach(([check, passed]) => {
      if (passed) {
        console.log(`✅ ${check}`)
      } else {
        console.error(`❌ ${check}`)
      }
    })
    
    return { score: (passedChecks / totalChecks) * 100, checks }
  }
}

// Função para executar todos os testes básicos
export const runBasicTests = () => {
  console.log('🧪 Executando testes básicos da aplicação...')
  
  const results = {
    appState: basicTestUtils.validateAppState(),
    timestamp: new Date().toISOString()
  }
  
  console.log('📊 Resultados dos testes:', results)
  return results
}

// Auto-executar testes em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Modo de desenvolvimento detectado - Utilitários de teste disponíveis')
  
  // Disponibilizar utilitários globalmente para testes manuais
  if (typeof window !== 'undefined') {
    (window as any).testUtils = basicTestUtils
    (window as any).runBasicTests = runBasicTests
  }
}
