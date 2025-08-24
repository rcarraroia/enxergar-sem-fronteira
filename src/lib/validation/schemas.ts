/**
 * =====================================================
 * SCHEMAS DE VALIDAÇÃO RIGOROSA
 * =====================================================
 * Schemas Zod para validação de entrada em todas as APIs críticas
 */

import { z } from "zod";

// ============================================================================
// SCHEMAS BASE E UTILITÁRIOS
// ============================================================================

/**
 * Schema de validação para CPF brasileiro
 * 
 * Valida tanto CPFs formatados (000.000.000-00) quanto não formatados (00000000000).
 * Inclui validação dos dígitos verificadores conforme algoritmo oficial.
 * 
 * @example
 * ```typescript
 * const result = CPFSchema.safeParse('123.456.789-09')
 * if (result.success) {
 *   console.log('CPF válido:', result.data)
 * }
 * ```
 */
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
export const CPFSchema = z.string()
  .refine((cpf) => {
    // Remove formatação
    const cleanCPF = cpf.replace(/[^\d]/g, "");
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {return false;}
    
    // Verifica se não são todos iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {return false;}
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) {digit1 = 0;}
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) {digit2 = 0;}
    
    return digit1 === parseInt(cleanCPF.charAt(9)) && digit2 === parseInt(cleanCPF.charAt(10));
  }, "CPF inválido");

/**
 * Schema de validação para telefones brasileiros
 * 
 * Aceita diversos formatos:
 * - (11) 99999-9999
 * - 11 999999999
 * - +55 11 99999-9999
 * - 1199999999
 * 
 * @example
 * ```typescript
 * const result = PhoneSchema.safeParse('(11) 99999-9999')
 * if (result.success) {
 *   console.log('Telefone válido:', result.data)
 * }
 * ```
 */
const phoneRegex = /^(?:\+55\s?)?(?:\(\d{2}\)\s?|\d{2}\s?)(?:9\s?)?\d{4}[-\s]?\d{4}$/;
export const PhoneSchema = z.string()
  .min(10, "Telefone deve ter pelo menos 10 dígitos")
  .max(20, "Telefone muito longo")
  .regex(phoneRegex, "Formato de telefone inválido");

/**
 * Schema de validação para emails com verificações rigorosas de segurança
 * 
 * Além da validação padrão de email, inclui verificações adicionais:
 * - Local part não pode começar/terminar com ponto
 * - Não permite pontos consecutivos
 * - Domain deve conter pelo menos um ponto
 * - Limites de tamanho conforme RFC 5321
 * 
 * @example
 * ```typescript
 * const result = EmailSchema.safeParse('usuario@exemplo.com')
 * if (result.success) {
 *   console.log('Email válido:', result.data)
 * }
 * ```
 */
export const EmailSchema = z.string()
  .email("Email inválido")
  .min(5, "Email muito curto")
  .max(254, "Email muito longo")
  .refine((email) => {
    // Verificações adicionais de segurança
    const parts = email.split("@");
    if (parts.length !== 2) {return false;}
    
    const [local, domain] = parts;
    
    // Local part não pode começar ou terminar com ponto
    if (local.startsWith(".") || local.endsWith(".")) {return false;}
    
    // Não pode ter pontos consecutivos
    if (local.includes("..")) {return false;}
    
    // Domain deve ter pelo menos um ponto
    if (!domain.includes(".")) {return false;}
    
    return true;
  }, "Formato de email inválido");

/**
 * Schema de validação para data de nascimento
 * 
 * Valida que a data:
 * - É uma data válida no formato ISO (YYYY-MM-DD)
 * - Não está no futuro
 * - Representa uma idade entre 0 e 120 anos
 * 
 * @example
 * ```typescript
 * const result = BirthDateSchema.safeParse('1990-05-15')
 * if (result.success) {
 *   console.log('Data válida:', result.data)
 * }
 * ```
 */
export const BirthDateSchema = z.string()
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    // Deve ser uma data válida
    if (isNaN(birthDate.getTime())) {return false;}
    
    // Não pode ser no futuro
    if (birthDate > today) {return false;}
    
    // Idade razoável (0 a 120 anos)
    return age >= 0 && age <= 120;
  }, "Data de nascimento inválida");

// ============================================================================
// SCHEMAS DE ENTIDADES
// ============================================================================

/**
 * Schema de validação para dados de paciente
 * 
 * Define a estrutura e validações para o cadastro de pacientes no sistema.
 * Inclui validações rigorosas para todos os campos obrigatórios e opcionais.
 * 
 * @interface Patient
 * @property {string} nome - Nome completo do paciente (2-100 caracteres, apenas letras)
 * @property {string} email - Email válido do paciente
 * @property {string} telefone - Telefone brasileiro válido
 * @property {string} [cpf] - CPF brasileiro válido (opcional)
 * @property {string} data_nascimento - Data de nascimento no formato ISO
 * @property {string} [diagnostico] - Diagnóstico médico (opcional, 3-500 caracteres)
 * @property {string} [endereco] - Endereço completo (opcional, máx 200 caracteres)
 * @property {string} [cidade] - Cidade (opcional, máx 100 caracteres)
 * @property {string} [estado] - Estado brasileiro (opcional, código de 2 letras)
 * @property {string} [cep] - CEP brasileiro (opcional)
 * 
 * @example
 * ```typescript
 * const patientData = {
 *   nome: 'João Silva',
 *   email: 'joao@email.com',
 *   telefone: '(11) 99999-9999',
 *   data_nascimento: '1990-05-15'
 * }
 * 
 * const result = PatientSchema.safeParse(patientData)
 * if (result.success) {
 *   console.log('Paciente válido:', result.data)
 * }
 * ```
 */
export const PatientSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços")
    .transform((name) => name.trim().replace(/\s+/g, " ")), // Normalizar espaços
  
  email: EmailSchema,
  
  telefone: PhoneSchema,
  
  cpf: CPFSchema.optional(),
  
  data_nascimento: BirthDateSchema,
  
  diagnostico: z.string()
    .min(3, "Diagnóstico deve ter pelo menos 3 caracteres")
    .max(500, "Diagnóstico muito longo")
    .optional(),
  
  endereco: z.string()
    .max(200, "Endereço muito longo")
    .optional(),
  
  cidade: z.string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(50, "Cidade muito longa")
    .optional(),
  
  estado: z.string()
    .length(2, "Estado deve ter 2 caracteres (UF)")
    .regex(/^[A-Z]{2}$/, "Estado deve ser uma UF válida")
    .optional(),
  
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
    .optional()
});

// Schema para evento
export const EventSchema = z.object({
  title: z.string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título muito longo")
    .transform((title) => title.trim()),
  
  description: z.string()
    .max(1000, "Descrição muito longa")
    .optional(),
  
  location: z.string()
    .min(3, "Local deve ter pelo menos 3 caracteres")
    .max(200, "Local muito longo"),
  
  address: z.string()
    .min(10, "Endereço deve ter pelo menos 10 caracteres")
    .max(300, "Endereço muito longo"),
  
  city: z.string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(50, "Cidade muito longa"),
  
  state: z.string()
    .length(2, "Estado deve ter 2 caracteres (UF)")
    .regex(/^[A-Z]{2}$/, "Estado deve ser uma UF válida"),
  
  organizer_id: z.string()
    .uuid("ID do organizador inválido"),
  
  max_participants: z.number()
    .int("Número de participantes deve ser inteiro")
    .min(1, "Deve permitir pelo menos 1 participante")
    .max(1000, "Máximo de 1000 participantes"),
  
  status: z.enum(["draft", "active", "completed", "cancelled"], {
    errorMap: () => ({ message: "Status inválido" })
  })
});

// Schema para data de evento
export const EventDateSchema = z.object({
  event_id: z.string()
    .uuid("ID do evento inválido"),
  
  date: z.string()
    .refine((date) => {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Deve ser uma data válida
      if (isNaN(eventDate.getTime())) {return false;}
      
      // Não pode ser no passado (exceto hoje)
      return eventDate >= today;
    }, "Data do evento deve ser hoje ou no futuro"),
  
  start_time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de início inválido (HH:MM)"),
  
  end_time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário de fim inválido (HH:MM)"),
  
  total_slots: z.number()
    .int("Número de vagas deve ser inteiro")
    .min(1, "Deve ter pelo menos 1 vaga")
    .max(500, "Máximo de 500 vagas por data"),
  
  available_slots: z.number()
    .int("Vagas disponíveis deve ser inteiro")
    .min(0, "Vagas disponíveis não pode ser negativo")
}).refine((data) => {
  // Validar que horário de fim é após horário de início
  const [startHour, startMin] = data.start_time.split(":").map(Number);
  const [endHour, endMin] = data.end_time.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes > startMinutes;
}, {
  message: "Horário de fim deve ser após horário de início",
  path: ["end_time"]
}).refine((data) => {
  // Validar que vagas disponíveis não excedem total
  return data.available_slots <= data.total_slots;
}, {
  message: "Vagas disponíveis não podem exceder total de vagas",
  path: ["available_slots"]
});

// Schema para inscrição
export const RegistrationSchema = z.object({
  patient_id: z.string()
    .uuid("ID do paciente inválido"),
  
  event_date_id: z.string()
    .uuid("ID da data do evento inválido"),
  
  status: z.enum(["pending", "confirmed", "cancelled", "attended"], {
    errorMap: () => ({ message: "Status de inscrição inválido" })
  }).default("pending"),
  
  notes: z.string()
    .max(500, "Observações muito longas")
    .optional()
});

// Schema para organizador
export const OrganizerSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  
  email: EmailSchema,
  
  phone: PhoneSchema.optional(),
  
  role: z.enum(["admin", "organizer", "viewer"], {
    errorMap: () => ({ message: "Role inválido" })
  }).default("organizer"),
  
  status: z.enum(["active", "inactive", "suspended"], {
    errorMap: () => ({ message: "Status inválido" })
  }).default("active")
});

// ============================================================================
// SCHEMAS DE API E FORMULÁRIOS
// ============================================================================

// Schema para login
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(128, "Senha muito longa")
});

// Schema para registro de usuário
export const RegisterSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo"),
  email: EmailSchema,
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128, "Senha muito longa")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter pelo menos: 1 minúscula, 1 maiúscula e 1 número"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

// Schema para filtros de busca
export const SearchFiltersSchema = z.object({
  searchTerm: z.string()
    .max(100, "Termo de busca muito longo")
    .optional(),
  
  city: z.string()
    .max(50, "Cidade muito longa")
    .optional(),
  
  status: z.enum(["all", "active", "completed", "cancelled"])
    .default("all"),
  
  dateFrom: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .optional(),
  
  dateTo: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .optional(),
  
  page: z.number()
    .int("Página deve ser um número inteiro")
    .min(1, "Página deve ser pelo menos 1")
    .default(1),
  
  limit: z.number()
    .int("Limite deve ser um número inteiro")
    .min(1, "Limite deve ser pelo menos 1")
    .max(100, "Limite máximo de 100 itens")
    .default(20)
}).refine((data) => {
  // Validar que dateFrom é antes de dateTo
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  }
  return true;
}, {
  message: "Data inicial deve ser anterior à data final",
  path: ["dateTo"]
});

// ============================================================================
// TIPOS TYPESCRIPT DERIVADOS DOS SCHEMAS
// ============================================================================

export type Patient = z.infer<typeof PatientSchema>
export type Event = z.infer<typeof EventSchema>
export type EventDate = z.infer<typeof EventDateSchema>
export type Registration = z.infer<typeof RegistrationSchema>
export type Organizer = z.infer<typeof OrganizerSchema>
export type LoginData = z.infer<typeof LoginSchema>
export type RegisterData = z.infer<typeof RegisterSchema>
export type SearchFilters = z.infer<typeof SearchFiltersSchema>