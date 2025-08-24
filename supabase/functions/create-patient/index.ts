/**
 * =====================================================
 * EDGE FUNCTION: CRIAR PACIENTE COM VALIDAÇÃO RIGOROSA
 * =====================================================
 * Exemplo de Edge Function usando middleware de validação
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.22.4'
import { withValidation } from '../../../src/lib/validation/middleware.ts'

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

// Schema para criação de paciente (versão simplificada para Edge Function)
const CreatePatientSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .transform((name) => name.trim().replace(/\s+/g, ' ')),
  
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email muito curto')
    .max(254, 'Email muito longo')
    .toLowerCase(),
  
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone muito longo')
    .regex(/^(?:\+55\s?)?(?:\(\d{2}\)\s?|\d{2}\s?)(?:9\s?)?\d{4}[-\s]?\d{4}$/, 'Formato de telefone inválido'),
  
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido')
    .optional()
    .transform((cpf) => {
      if (!cpf) return undefined
      // Validação completa do CPF seria feita aqui
      return cpf.replace(/[^\d]/g, '')
    }),
  
  data_nascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      return !isNaN(birthDate.getTime()) && 
             birthDate <= today && 
             age >= 0 && age <= 120
    }, 'Data de nascimento inválida'),
  
  diagnostico: z.string()
    .max(500, 'Diagnóstico muito longo')
    .optional(),
  
  endereco: z.string()
    .max(200, 'Endereço muito longo')
    .optional(),
  
  cidade: z.string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(50, 'Cidade muito longa')
    .optional(),
  
  estado: z.string()
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .regex(/^[A-Z]{2}$/, 'Estado deve ser uma UF válida')
    .optional(),
  
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
    .optional()
    .transform((cep) => {
      if (!cep) return undefined
      return cep.replace(/[^\d]/g, '')
    })
})

// Schema para headers de autenticação
const AuthHeadersSchema = z.object({
  authorization: z.string()
    .regex(/^Bearer .+/, 'Token de autorização inválido')
})

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se email já existe no banco
 */
async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('email', email)
    .single()

  return !error && !!data
}

/**
 * Verifica se CPF já existe no banco (se fornecido)
 */
async function checkCPFExists(cpf: string): Promise<boolean> {
  if (!cpf) return false
  
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('cpf', cpf)
    .single()

  return !error && !!data
}

/**
 * Cria paciente no banco de dados
 */
async function createPatient(patientData: z.infer<typeof CreatePatientSchema>) {
  const { data, error } = await supabase
    .from('patients')
    .insert([{
      ...patientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar paciente:', error)
    throw new Error('Falha ao criar paciente no banco de dados')
  }

  return data
}

/**
 * Registra log de auditoria
 */
async function logAuditEvent(action: string, details: any, userId?: string) {
  try {
    await supabase
      .from('audit_logs')
      .insert([{
        action,
        table_name: 'patients',
        details: JSON.stringify(details),
        user_id: userId,
        created_at: new Date().toISOString()
      }])
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error)
    // Não falhar a operação principal por causa do log
  }
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

const handler = withValidation(
  {
    body: CreatePatientSchema,
    headers: AuthHeadersSchema
  },
  async ({ body, headers }) => {
    try {
      // Extrair token de autenticação
      const token = headers!.authorization.substring(7) // Remove 'Bearer '
      
      // Verificar autenticação com Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Token de autenticação inválido'
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Validações de negócio
      const patientData = body!

      // Verificar se email já existe
      const emailExists = await checkEmailExists(patientData.email)
      if (emailExists) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            message: 'Email já cadastrado no sistema',
            field: 'email'
          }),
          { 
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Verificar se CPF já existe (se fornecido)
      if (patientData.cpf) {
        const cpfExists = await checkCPFExists(patientData.cpf)
        if (cpfExists) {
          return new Response(
            JSON.stringify({
              error: 'Validation failed',
              message: 'CPF já cadastrado no sistema',
              field: 'cpf'
            }),
            { 
              status: 409,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      }

      // Criar paciente
      const newPatient = await createPatient(patientData)

      // Registrar log de auditoria
      await logAuditEvent('CREATE_PATIENT', {
        patient_id: newPatient.id,
        patient_email: newPatient.email,
        created_by: user.id
      }, user.id)

      // Resposta de sucesso
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Paciente criado com sucesso',
          data: {
            id: newPatient.id,
            nome: newPatient.nome,
            email: newPatient.email,
            created_at: newPatient.created_at
          }
        }),
        { 
          status: 201,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )

    } catch (error) {
      console.error('Erro interno na criação de paciente:', error)

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: 'Erro interno do servidor'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
)

// ============================================================================
// CONFIGURAÇÃO DO SERVIDOR
// ============================================================================

serve(async (req) => {
  // Tratar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        message: 'Apenas POST é permitido'
      }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return await handler(req)
})

/* 
EXEMPLO DE USO:

POST /functions/v1/create-patient
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "nome": "João Silva Santos",
  "email": "joao.silva@email.com",
  "telefone": "(11) 99999-9999",
  "cpf": "123.456.789-00",
  "data_nascimento": "1990-05-15",
  "diagnostico": "Miopia",
  "endereco": "Rua das Flores, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567"
}

RESPOSTA DE SUCESSO:
{
  "success": true,
  "message": "Paciente criado com sucesso",
  "data": {
    "id": "uuid-do-paciente",
    "nome": "João Silva Santos",
    "email": "joao.silva@email.com",
    "created_at": "2025-08-23T15:30:00Z"
  }
}

RESPOSTA DE ERRO DE VALIDAÇÃO:
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email inválido",
      "code": "invalid_string",
      "source": "body"
    }
  ]
}
*/