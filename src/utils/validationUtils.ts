import { z } from 'zod'

// Função para validar CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(cleanCPF[9]) !== digit1) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  
  return parseInt(cleanCPF[10]) === digit2
}

// Schemas de validação mais robustos
export const patientValidationSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .max(14, 'CPF inválido')
    .refine((cpf) => validateCPF(cpf), 'CPF inválido'),
    
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
    
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone muito longo')
    .regex(/^[\d\s\-()]+$/, 'Formato de telefone inválido'),
    
  data_nascimento: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 120
    }, 'Data de nascimento inválida'),
    
  consentimento_lgpd: z.boolean()
    .refine((val) => val === true, 'Consentimento LGPD é obrigatório')
})

export const eventValidationSchema = z.object({
  city: z.string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade muito longa'),
    
  location: z.string()
    .min(2, 'Local deve ter pelo menos 2 caracteres')
    .max(200, 'Local muito longo'),
    
  address: z.string()
    .min(10, 'Endereço deve ter pelo menos 10 caracteres')
    .max(300, 'Endereço muito longo'),
    
  description: z.string()
    .max(1000, 'Descrição muito longa')
    .optional(),
    
  status: z.enum(['open', 'closed', 'full']),
  
  dates: z.array(z.object({
    date: z.string()
      .refine((date) => {
        const eventDate = new Date(date)
        const today = new Date()
        return eventDate >= today
      }, 'Data deve ser futura'),
      
    start_time: z.string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      
    end_time: z.string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
      
    total_slots: z.number()
      .min(1, 'Deve ter pelo menos 1 vaga')
      .max(1000, 'Máximo 1000 vagas'),
      
    available_slots: z.number()
      .min(0, 'Vagas disponíveis não pode ser negativo')
  }))
  .min(1, 'Evento deve ter pelo menos uma data')
  .refine((dates) => {
    return dates.every(date => 
      date.end_time > date.start_time
    )
  }, 'Hora de fim deve ser posterior ao início')
})

export const organizerValidationSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
    
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo'),
    
  organization: z.string()
    .min(2, 'Organização deve ter pelo menos 2 caracteres')
    .max(200, 'Nome da organização muito longo')
    .optional(),
    
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone muito longo')
    .regex(/^[\d\s\-()]+$/, 'Formato de telefone inválido')
    .optional(),
    
  address: z.string()
    .min(10, 'Endereço deve ter pelo menos 10 caracteres')
    .max(300, 'Endereço muito longo')
    .optional()
})

// Função de validação genérica
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean
  data?: T
  errors?: string[]
} => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      }
    }
    return {
      success: false,
      errors: ['Erro de validação desconhecido']
    }
  }
}

// Formatadores melhorados
export const formatters = {
  cpf: (value: string): string => {
    if (!value) return ''
    const cleanValue = value.replace(/\D/g, '')
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  },
  
  phone: (value: string): string => {
    if (!value) return ''
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length === 11) {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  },
  
  currency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
}

// Validações em tempo real
export const realTimeValidators = {
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  cpf: (cpf: string) => {
    return validateCPF(cpf)
  },
  
  phone: (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 11
  }
}
