/**
 * =====================================================
 * API DE PACIENTES COM TRATAMENTO DE ERROS
 * =====================================================
 * Exemplo de integração com Supabase e sistema de erros
 */

import { supabase } from "@/lib/supabase";
import type { Patient } from "@/lib/validation/schemas";
import type {
  Result
} from "@/lib/errors";
import { 
  AppDatabaseError,
  AppValidationError,
  convertSupabaseError,
  withSupabaseErrorHandling
} from "@/lib/errors";

// ============================================================================
// OPERAÇÕES CRUD DE PACIENTES
// ============================================================================

export async function createPatient(patientData: Omit<Patient, "id" | "created_at" | "updated_at">): Promise<Result<Patient>> {
  return withSupabaseErrorHandling(async () => {
    // Validação adicional antes de enviar
    if (!patientData.nome?.trim()) {
      throw new AppValidationError({
        message: "Nome é obrigatório",
        field: "nome",
        userMessage: "Por favor, informe o nome do paciente."
      });
    }

    if (!patientData.email?.trim()) {
      throw new AppValidationError({
        message: "Email é obrigatório",
        field: "email",
        userMessage: "Por favor, informe o email do paciente."
      });
    }

    // Verificar se email já existe
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("email", patientData.email)
      .single();

    if (existingPatient) {
      throw new AppDatabaseError({
        message: "Email já cadastrado",
        table: "patients",
        operation: "insert",
        context: { 
          field: "email", 
          value: patientData.email,
          constraint: "unique_email"
        }
      });
    }

    // Criar paciente
    const { data, error } = await supabase
      .from("patients")
      .insert([{
        ...patientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw convertSupabaseError(error);
    }

    return { data, error: null };
  });
}

export async function updatePatient(id: string, patientData: Partial<Patient>): Promise<Result<Patient>> {
  return withSupabaseErrorHandling(async () => {
    // Verificar se paciente existe
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingPatient) {
      throw AppDatabaseError.notFound("patients", id);
    }

    // Se está atualizando email, verificar duplicação
    if (patientData.email) {
      const { data: emailExists } = await supabase
        .from("patients")
        .select("id")
        .eq("email", patientData.email)
        .neq("id", id)
        .single();

      if (emailExists) {
        throw new AppDatabaseError({
          message: "Email já está em uso por outro paciente",
          table: "patients",
          operation: "update",
          context: { 
            field: "email", 
            value: patientData.email,
            constraint: "unique_email"
          }
        });
      }
    }

    // Atualizar paciente
    const { data, error } = await supabase
      .from("patients")
      .update({
        ...patientData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw convertSupabaseError(error);
    }

    return { data, error: null };
  });
}

export async function getPatient(id: string): Promise<Result<Patient>> {
  return withSupabaseErrorHandling(async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") { // No rows returned
        throw AppDatabaseError.notFound("patients", id);
      }
      throw convertSupabaseError(error);
    }

    return { data, error: null };
  });
}

export async function listPatients(filters?: {
  search?: string
  limit?: number
  offset?: number
}): Promise<Result<Patient[]>> {
  return withSupabaseErrorHandling(async () => {
    let query = supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw convertSupabaseError(error);
    }

    return { data: data || [], error: null };
  });
}

export async function deletePatient(id: string): Promise<Result<void>> {
  return withSupabaseErrorHandling(async () => {
    // Verificar se paciente existe
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingPatient) {
      throw AppDatabaseError.notFound("patients", id);
    }

    // Verificar se paciente tem registros relacionados
    const { data: registrations } = await supabase
      .from("registrations")
      .select("id")
      .eq("patient_id", id)
      .limit(1);

    if (registrations && registrations.length > 0) {
      throw new AppDatabaseError({
        message: "Não é possível excluir paciente com registros de eventos",
        table: "patients",
        operation: "delete",
        context: {
          constraint: "has_registrations",
          patientId: id
        }
      });
    }

    // Deletar paciente
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) {
      throw convertSupabaseError(error);
    }

    return { data: undefined, error: null };
  });
}

// ============================================================================
// OPERAÇÕES ESPECÍFICAS
// ============================================================================

export async function searchPatientsByEmail(email: string): Promise<Result<Patient[]>> {
  return withSupabaseErrorHandling(async () => {
    if (!email?.trim()) {
      throw new AppValidationError({
        message: "Email é obrigatório para busca",
        field: "email",
        userMessage: "Por favor, informe um email para buscar."
      });
    }

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .ilike("email", `%${email}%`)
      .order("nome");

    if (error) {
      throw convertSupabaseError(error);
    }

    return { data: data || [], error: null };
  });
}

export async function getPatientStats(): Promise<Result<{
  total: number
  thisMonth: number
  lastMonth: number
}>> {
  return withSupabaseErrorHandling(async () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total de pacientes
    const { count: total, error: totalError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      throw convertSupabaseError(totalError);
    }

    // Pacientes deste mês
    const { count: thisMonth, error: thisMonthError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart.toISOString());

    if (thisMonthError) {
      throw convertSupabaseError(thisMonthError);
    }

    // Pacientes do mês passado
    const { count: lastMonth, error: lastMonthError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    if (lastMonthError) {
      throw convertSupabaseError(lastMonthError);
    }

    return {
      data: {
        total: total || 0,
        thisMonth: thisMonth || 0,
        lastMonth: lastMonth || 0
      },
      error: null
    };
  });
}