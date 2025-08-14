import { faker } from '@faker-js/faker'

interface AppState {
  isOnline: boolean
  version: string
  environment: 'development' | 'production' | 'test'
}

interface MockData {
  users: {
    id: string
    name: string
    email: string
  }[]
  products: {
    id: string
    name: string
    price: number
  }[]
}

const mockDataGenerator = {
  generateUsers: (count: number): MockData['users'] => {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
    }))
  },
  generateProducts: (count: number): MockData['products'] => {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
    }))
  },
}

const basicTestUtils = {
  validateAppState: (): AppState => {
    return {
      isOnline: navigator.onLine,
      version: '1.0.0',
      environment: process.env.NODE_ENV as AppState['environment'],
    }
  },
  validateComponent: (componentName: string, element: HTMLElement): boolean => {
    if (!element) {
      console.error(`Component ${componentName} not found`)
      return false
    }
    return true
  },
  validateForm: (formName: string, formData: Record<string, string>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    let isValid = true
    
    if (!formData) {
      errors.push('Form data is empty')
      isValid = false
    } else {
      for (const key in formData) {
        if (formData[key] === '') {
          errors.push(`Field ${key} is required`)
          isValid = false
        }
      }
    }
    
    return { isValid, errors }
  },
  generateMockData: mockDataGenerator,
}

// Função para executar todos os testes básicos - CORRIGIDA
export const runBasicTests = () => {
  console.log('🧪 Executando testes básicos da aplicação...')
  
  // Validar estado da aplicação
  const appState = basicTestUtils.validateAppState()
  console.log('📊 Estado da aplicação:', appState)
  
  // Validar elementos principais
  const header = document.querySelector('header')
  if (header) {
    const headerValid = basicTestUtils.validateComponent('Header', header as HTMLElement)
    console.log('🏠 Header válido:', headerValid)
  }
  
  // Validar formulários se existirem
  const forms = document.querySelectorAll('form')
  forms.forEach((form, index) => {
    const formData = {}
    const inputs = form.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      const element = input as HTMLInputElement
      if (element.name) {
        formData[element.name] = element.value
      }
    })
    
    const validation = basicTestUtils.validateForm(`Form-${index}`, formData)
    console.log(`📝 Formulário ${index} válido:`, validation.isValid)
    if (!validation.isValid) {
      console.log('❌ Erros:', validation.errors)
    }
  })
  
  console.log('✅ Testes básicos concluídos!')
}
