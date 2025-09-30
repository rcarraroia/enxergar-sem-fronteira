/**
 * Testes unitários para utilitários de telefone
 */

import {
    cleanPhone,
    formatPhoneToInternational,
    phoneMask,
    validateBrazilianPhone
} from '../phoneUtils';

describe('phoneUtils', () => {
  describe('formatPhoneToInternational', () => {
    it('deve adicionar código 55 para números sem código', () => {
      expect(formatPhoneToInternational('33998384177')).toBe('5533998384177');
      expect(formatPhoneToInternational('1133334444')).toBe('551133334444');
    });

    it('deve remover zero inicial do DDD', () => {
      expect(formatPhoneToInternational('033998384177')).toBe('5533998384177');
      expect(formatPhoneToInternational('011933334444')).toBe('55119933334444');
    });

    it('deve manter números que já têm código 55', () => {
      expect(formatPhoneToInternational('5533998384177')).toBe('5533998384177');
      expect(formatPhoneToInternational('551133334444')).toBe('551133334444');
    });

    it('deve remover formatação e processar', () => {
      expect(formatPhoneToInternational('(33) 99838-4177')).toBe('5533998384177');
      expect(formatPhoneToInternational('+55 (33) 9 9838-4177')).toBe('5533998384177');
      expect(formatPhoneToInternational('33 9.9838.4177')).toBe('5533998384177');
    });

    it('deve lidar com strings vazias', () => {
      expect(formatPhoneToInternational('')).toBe('');
      expect(formatPhoneToInternational('   ')).toBe('55');
    });

    it('deve processar números de diferentes tamanhos', () => {
      // Celular com 9 dígitos
      expect(formatPhoneToInternational('33999887766')).toBe('5533999887766');
      // Fixo com 8 dígitos
      expect(formatPhoneToInternational('3333334444')).toBe('553333334444');
    });
  });

  describe('validateBrazilianPhone', () => {
    it('deve validar números brasileiros corretos', () => {
      // Celulares
      expect(validateBrazilianPhone('5533998384177')).toBe(true);
      expect(validateBrazilianPhone('5511999887766')).toBe(true);

      // Fixos
      expect(validateBrazilianPhone('551133334444')).toBe(true);
      expect(validateBrazilianPhone('553333334444')).toBe(true);
    });

    it('deve rejeitar números inválidos', () => {
      // Sem código do país
      expect(validateBrazilianPhone('33998384177')).toBe(false);

      // DDD inválido (começando com 0)
      expect(validateBrazilianPhone('5503998384177')).toBe(false);

      // Muito curto
      expect(validateBrazilianPhone('55339983841')).toBe(false);

      // Muito longo
      expect(validateBrazilianPhone('553399838417799')).toBe(false);

      // String vazia
      expect(validateBrazilianPhone('')).toBe(false);
    });

    it('deve validar números com formatação', () => {
      expect(validateBrazilianPhone('+55 (33) 99838-4177')).toBe(true);
      expect(validateBrazilianPhone('55 33 9.9838.4177')).toBe(true);
    });
  });

  describe('phoneMask', () => {
    it('deve formatar números internacionais corretamente', () => {
      // Celular internacional
      expect(phoneMask('5533998384177')).toBe('+55 (33) 99838-4177');

      // Fixo internacional
      expect(phoneMask('551133334444')).toBe('+55 (11) 3333-4444');
    });

    it('deve formatar números locais', () => {
      // Celular local
      expect(phoneMask('33998384177')).toBe('(33) 99838-4177');

      // Fixo local
      expect(phoneMask('1133334444')).toBe('(11) 3333-4444');
    });

    it('deve retornar string original se não conseguir formatar', () => {
      expect(phoneMask('123')).toBe('123');
      expect(phoneMask('')).toBe('');
    });

    it('deve lidar com números já formatados', () => {
      expect(phoneMask('+55 (33) 99838-4177')).toBe('+55 (33) 99838-4177');
    });
  });

  describe('cleanPhone', () => {
    it('deve remover toda formatação', () => {
      expect(cleanPhone('+55 (33) 99838-4177')).toBe('5533998384177');
      expect(cleanPhone('(33) 9.9838.4177')).toBe('33998384177');
      expect(cleanPhone('33 99838-4177')).toBe('33998384177');
    });

    it('deve manter apenas números', () => {
      expect(cleanPhone('abc123def456')).toBe('123456');
      expect(cleanPhone('!@#$%^&*()')).toBe('');
    });
  });

  describe('Casos de uso reais', () => {
    const testCases = [
      {
        input: '(33) 99838-4177',
        expected: '5533998384177',
        description: 'Celular com formatação local'
      },
      {
        input: '+55 (33) 9 9838-4177',
        expected: '5533998384177',
        description: 'Celular com formatação internacional completa'
      },
      {
        input: '033 99838-4177',
        expected: '5533998384177',
        description: 'Celular com zero no DDD'
      },
      {
        input: '11 3333-4444',
        expected: '551133334444',
        description: 'Fixo de São Paulo'
      },
      {
        input: '5533998384177',
        expected: '5533998384177',
        description: 'Já no formato correto'
      }
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`deve processar: ${description}`, () => {
        const result = formatPhoneToInternational(input);
        expect(result).toBe(expected);
        expect(validateBrazilianPhone(result)).toBe(true);
      });
    });
  });
});
