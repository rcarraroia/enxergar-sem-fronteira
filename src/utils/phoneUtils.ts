/**
 * Utilitários para formatação e validação de números de telefone
 * Garante formato internacional brasileiro (+55) para WhatsApp
 */

/**
 * Formata telefone para formato internacional brasileiro
 * @param phone - Número de telefone em qualquer formato
 * @returns Telefone no formato 55DDDNNNNNNNNN
 */
export function formatPhoneToInternational(phone: string): string {
  if (!phone) return '';

  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Se já começa com 55, retorna como está
  if (cleaned.startsWith('55')) {
    return cleaned;
  }

  // Se começa com 0, remove o 0 inicial (DDD com zero)
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;

  // Adiciona código do país
  return `55${withoutLeadingZero}`;
}

/**
 * Valida se o telefone está no formato brasileiro correto
 * @param phone - Número de telefone
 * @returns true se válido
 */
export function validateBrazilianPhone(phone: string): boolean {
  if (!phone) return false;

  const cleaned = phone.replace(/\D/g, '');

  // Formato: 55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
  // DDD válido: 11-99 (não pode começar com 0)
  // Número: pode ter 8 dígitos (fixo) ou 9 dígitos (celular com 9 na frente)
  const brazilianPhoneRegex = /^55[1-9]{2}9?[0-9]{8}$/;

  return brazilianPhoneRegex.test(cleaned);
}

/**
 * Aplica máscara visual para telefone brasileiro
 * @param phone - Número de telefone
 * @returns Telefone formatado para exibição: +55 (DD) 9NNNN-NNNN
 */
export function phoneMask(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  // Se tem 55 no início, formatar como internacional
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const ddd = cleaned.substring(2, 4);
    const number = cleaned.substring(4);

    if (number.length === 9) {
      // Celular: +55 (DD) 9NNNN-NNNN
      return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (number.length === 8) {
      // Fixo: +55 (DD) NNNN-NNNN
      return `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    }
  }

  // Formato local sem 55
  if (cleaned.length >= 10) {
    const ddd = cleaned.substring(0, 2);
    const number = cleaned.substring(2);

    if (number.length === 9) {
      // Celular: (DD) 9NNNN-NNNN
      return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (number.length === 8) {
      // Fixo: (DD) NNNN-NNNN
      return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    }
  }

  return phone;
}

/**
 * Remove formatação do telefone, mantendo apenas números
 * @param phone - Telefone formatado
 * @returns Apenas números
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
