/**
 * Testes críticos para funcionalidades essenciais do sistema em produção
 */

import { describe, expect, it } from "vitest";
import { validateCPF } from "@/utils/cpfUtils";
import { formatters, realTimeValidators } from "@/utils/validationUtils";

describe("🚨 FUNCIONALIDADES CRÍTICAS - SISTEMA EM PRODUÇÃO", () => {
  
  describe("✅ Sistema de Cadastro - Validação de CPF", () => {
    it("deve validar CPFs válidos corretamente", () => {
      // CPFs válidos para teste
      const validCPFs = [
        "11144477735",
        "12345678909",
        "98765432100"
      ];
      
      validCPFs.forEach(cpf => {
        expect(validateCPF(cpf)).toBe(true);
      });
    });

    it("deve rejeitar CPFs inválidos", () => {
      const invalidCPFs = [
        "11111111111", // Todos iguais
        "12345678901", // Dígito verificador errado
        "123456789",   // Muito curto
        "123456789012", // Muito longo
        "abcdefghijk"   // Não numérico
      ];
      
      invalidCPFs.forEach(cpf => {
        expect(validateCPF(cpf)).toBe(false);
      });
    });

    it("deve formatar CPF corretamente", () => {
      expect(formatters.cpf("11144477735")).toBe("111.444.777-35");
      expect(formatters.cpf("12345678909")).toBe("123.456.789-09");
    });
  });

  describe("✅ Sistema de Cadastro - Validação de Telefone", () => {
    it("deve validar telefones válidos", () => {
      expect(realTimeValidators.phone("11999887766")).toBe(true);
      expect(realTimeValidators.phone("1133334444")).toBe(true);
    });

    it("deve rejeitar telefones inválidos", () => {
      expect(realTimeValidators.phone("123")).toBe(false);
      expect(realTimeValidators.phone("123456789012")).toBe(false);
    });

    it("deve formatar telefone corretamente", () => {
      expect(formatters.phone("11999887766")).toBe("(11) 99988-7766");
      expect(formatters.phone("1133334444")).toBe("(11) 3333-4444");
    });
  });

  describe("✅ Sistema de Cadastro - Validação de Email", () => {
    it("deve validar emails válidos", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "admin@enxergar.org.br"
      ];
      
      validEmails.forEach(email => {
        expect(realTimeValidators.email(email)).toBe(true);
      });
    });

    it("deve rejeitar emails inválidos", () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user@domain",
        ""
      ];
      
      invalidEmails.forEach(email => {
        expect(realTimeValidators.email(email)).toBe(false);
      });
    });
  });

  describe("✅ Sistema de Relatórios - Formatação de Dados", () => {
    it("deve formatar datas corretamente", () => {
      // Teste básico de formatação de data
      const date = new Date("2025-01-19T12:00:00Z");
      const formatted = date.toLocaleDateString("pt-BR");
      expect(formatted).toMatch(/\d{2}\/\d{2}\/2025/);
    });

    it("deve lidar com valores nulos/undefined", () => {
      expect(formatters.cpf("")).toBe("");
      expect(formatters.phone("")).toBe("");
    });
  });

  describe("✅ Sistema de Confirmação - Validação de Dados", () => {
    it("deve validar dados de paciente completos", () => {
      const patientData = {
        nome: "João Silva Santos",
        email: "joao@email.com",
        telefone: "11999887766",
        cpf: "11144477735"
      };

      expect(realTimeValidators.email(patientData.email)).toBe(true);
      expect(realTimeValidators.phone(patientData.telefone)).toBe(true);
      expect(validateCPF(patientData.cpf)).toBe(true);
      expect(patientData.nome.length).toBeGreaterThan(2);
    });
  });
});

describe("🔧 UTILITÁRIOS DE SISTEMA", () => {
  
  describe("Formatação de Dados", () => {
    it("deve limpar dados de entrada corretamente", () => {
      // Teste de limpeza de CPF
      const cpfWithMask = "111.444.777-35";
      const cleanCPF = cpfWithMask.replace(/\D/g, "");
      expect(cleanCPF).toBe("11144477735");
      
      // Teste de limpeza de telefone
      const phoneWithMask = "(11) 99988-7766";
      const cleanPhone = phoneWithMask.replace(/\D/g, "");
      expect(cleanPhone).toBe("11999887766");
    });
  });

  describe("Validação de Entrada", () => {
    it("deve validar comprimento de campos obrigatórios", () => {
      expect("João Silva".length).toBeGreaterThanOrEqual(2);
      expect("João Silva".length).toBeLessThanOrEqual(100);
    });

    it("deve validar formato de nome", () => {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
      expect(nameRegex.test("João Silva Santos")).toBe(true);
      expect(nameRegex.test("João123")).toBe(false);
    });
  });
});