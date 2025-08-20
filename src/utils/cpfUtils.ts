
// Utilitários específicos para CPF
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '')
}

export const formatCPF = (cpf: string): string => {
  const cleanValue = cleanCPF(cpf)
  
  if (cleanValue.length <= 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  return cleanValue.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Adicionar a função cpfMask que estava sendo usada
export const cpfMask = (value: string): string => {
  if (!value) return ''
  const cleanValue = cleanCPF(value)
  
  if (cleanValue.length <= 3) {
    return cleanValue
  } else if (cleanValue.length <= 6) {
    return cleanValue.replace(/(\d{3})(\d{1,3})/, '$1.$2')
  } else if (cleanValue.length <= 9) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
  } else {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
  }
}

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // Verificar se tem 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verificar se não são todos iguais (ex: 11111111111)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validar primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(cleanCPF[9]) !== digit1) return false
  
  // Validar segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  
  return parseInt(cleanCPF[10]) === digit2
}
