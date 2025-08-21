/**
 * PROCESSADOR DE TEMPLATES
 * Responsável por processar variáveis nos templates de mensagens
 */

export class TemplateProcessor {
  /**
   * Processa um template substituindo variáveis
   * Suporta sintaxe: [variavel] ou {{variavel}}
   */
  process(template: string, variables: Record<string, any>): string {
    let processed = template

    // Processar variáveis com sintaxe [variavel]
    processed = processed.replace(/\[([^\]]+)\]/g, (match, variableName) => {
      const value = this.getNestedValue(variables, variableName.trim())
      return value !== undefined ? String(value) : match
    })

    // Processar variáveis com sintaxe {{variavel}}
    processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const value = this.getNestedValue(variables, variableName.trim())
      return value !== undefined ? String(value) : match
    })

    return processed
  }

  /**
   * Extrai variáveis de um template
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>()

    // Extrair variáveis com sintaxe [variavel]
    const bracketMatches = template.match(/\[([^\]]+)\]/g)
    if (bracketMatches) {
      bracketMatches.forEach(match => {
        const variableName = match.slice(1, -1).trim()
        variables.add(variableName)
      })
    }

    // Extrair variáveis com sintaxe {{variavel}}
    const braceMatches = template.match(/\{\{([^}]+)\}\}/g)
    if (braceMatches) {
      braceMatches.forEach(match => {
        const variableName = match.slice(2, -2).trim()
        variables.add(variableName)
      })
    }

    return Array.from(variables)
  }

  /**
   * Valida se todas as variáveis necessárias estão presentes
   */
  validateVariables(template: string, variables: Record<string, any>): {
    isValid: boolean
    missingVariables: string[]
  } {
    const requiredVariables = this.extractVariables(template)
    const missingVariables: string[] = []

    requiredVariables.forEach(variableName => {
      const value = this.getNestedValue(variables, variableName)
      if (value === undefined || value === null || value === '') {
        missingVariables.push(variableName)
      }
    })

    return {
      isValid: missingVariables.length === 0,
      missingVariables
    }
  }

  /**
   * Gera preview de um template com variáveis de exemplo
   */
  generatePreview(template: string, sampleVariables?: Record<string, any>): string {
    const defaultSamples: Record<string, any> = {
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      telefone: '(11) 99999-9999',
      data_consulta: '15/03/2024',
      horario_consulta: '14:30',
      local_consulta: 'Clínica Central',
      endereco_consulta: 'Rua das Flores, 123',
      medico: 'Dr. Maria Santos',
      evento: 'Consulta Oftalmológica',
      data_evento: '15/03/2024',
      local_evento: 'Centro Médico',
      valor_doacao: 'R$ 100,00',
      campanha: 'Enxergar Sem Fronteiras',
      data_doacao: '10/03/2024'
    }

    const variables = { ...defaultSamples, ...sampleVariables }
    return this.process(template, variables)
  }

  /**
   * Formata valores baseado no tipo
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    // Formatação de data
    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR')
    }

    // Formatação de números como moeda
    if (typeof value === 'number' && value > 0) {
      // Se parece ser um valor monetário (maior que 1)
      if (value >= 1) {
        return value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        })
      }
    }

    // Formatação de telefone
    if (typeof value === 'string' && /^\d{10,11}$/.test(value)) {
      if (value.length === 11) {
        return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (value.length === 10) {
        return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
    }

    return String(value)
  }

  /**
   * Obtém valor aninhado de um objeto usando notação de ponto
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }
}

// Templates de exemplo para diferentes contextos
export const SAMPLE_TEMPLATES = {
  email: {
    welcome_patient: {
      subject: 'Bem-vindo(a) ao Enxergar Sem Fronteiras, [nome]!',
      content: `
Olá [nome],

Seja bem-vindo(a) ao programa Enxergar Sem Fronteiras!

Seu cadastro foi realizado com sucesso. Em breve você receberá informações sobre consultas disponíveis em sua região.

Dados do seu cadastro:
- Nome: [nome]
- Email: [email]
- Telefone: [telefone]

Se você tiver alguma dúvida, entre em contato conosco.

Atenciosamente,
Equipe Enxergar Sem Fronteiras
      `.trim()
    },
    
    appointment_confirmation: {
      subject: 'Consulta agendada - [data_consulta] às [horario_consulta]',
      content: `
Olá [nome],

Sua consulta foi agendada com sucesso!

Detalhes da consulta:
- Data: [data_consulta]
- Horário: [horario_consulta]
- Local: [local_consulta]
- Endereço: [endereco_consulta]
- Médico: [medico]

Por favor, chegue com 15 minutos de antecedência e traga um documento com foto.

Atenciosamente,
Equipe Enxergar Sem Fronteiras
      `.trim()
    }
  },
  
  sms: {
    appointment_reminder: {
      content: 'Lembrete: Sua consulta é amanhã ([data_consulta]) às [horario_consulta] em [local_consulta]. Chegue 15min antes. Enxergar Sem Fronteiras'
    },
    
    appointment_confirmation: {
      content: 'Consulta agendada para [data_consulta] às [horario_consulta] em [local_consulta]. Chegue 15min antes. Enxergar Sem Fronteiras'
    }
  }
}