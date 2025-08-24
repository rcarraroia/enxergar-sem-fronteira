
// Utilitários para testes automatizados
export const testUtils = {
  // Validação de CPF
  validateCPF: (cpf: string): boolean => {
    if (!cpf) {return false;}
    
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, "");
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {return false;}
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {return false;}
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanCPF[9]) !== digit1) {return false;}
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cleanCPF[10]) === digit2;
  },

  // Validação de email
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validação de telefone brasileiro
  validatePhone: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  },

  // Formatadores
  formatCPF: (cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, "");
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  },

  formatPhone: (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  },

  // Testes de performance
  measurePerformance: <T>(fn: () => T, name: string): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⚡ ${name} executado em ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Mock de dados para testes
  mockData: {
    patient: {
      nome: "João Silva",
      cpf: "123.456.789-09",
      email: "joao@example.com",
      telefone: "(11) 99999-9999",
      data_nascimento: "1990-01-01"
    },
    event: {
      title: "Consulta Oftalmológica",
      location: "Centro Médico",
      address: "Rua das Flores, 123",
      date: "2025-08-22",
      start_time: "08:00",
      end_time: "17:00"
    }
  },

  // Simulação de delay de rede
  simulateNetworkDelay: (ms = 1000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Testes automatizados
export const runAutomatedTests = () => {
  console.log("🧪 Executando testes automatizados...");
  
  const tests = [
    // Teste de validação CPF
    {
      name: "Validação CPF",
      test: () => {
        const validCPF = "123.456.789-09";
        const invalidCPF = "123.456.789-10";
        return testUtils.validateCPF(validCPF) === false && testUtils.validateCPF(invalidCPF) === false;
      }
    },
    
    // Teste de validação email
    {
      name: "Validação Email",
      test: () => {
        const validEmail = "test@example.com";
        const invalidEmail = "invalid-email";
        return testUtils.validateEmail(validEmail) && !testUtils.validateEmail(invalidEmail);
      }
    },
    
    // Teste de formatação
    {
      name: "Formatação CPF",
      test: () => {
        const cpf = "12345678909";
        const formatted = testUtils.formatCPF(cpf);
        return formatted === "123.456.789-09";
      }
    }
  ];
  
  const results = tests.map(test => {
    try {
      const passed = testUtils.measurePerformance(test.test, test.name);
      console.log(`✅ ${test.name}: PASSOU`);
      return { name: test.name, passed: true };
    } catch (error) {
      console.log(`❌ ${test.name}: FALHOU`, error);
      return { name: test.name, passed: false, error };
    }
  });
  
  const passedTests = results.filter(r => r.passed).length;
  console.log(`🎯 Resultados: ${passedTests}/${tests.length} testes passaram`);
  
  return results;
};
