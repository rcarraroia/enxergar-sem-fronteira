
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Patient {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string | null
  diagnostico: string | null
  consentimento_lgpd: boolean
  created_at: string
  updated_at: string
  tags: Record<string, unknown> | null
}

export const usePatients = () => {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      console.log("🔍 Buscando todos os pacientes...");
      
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar pacientes:", error);
        throw error;
      }

      console.log(`✅ Encontrados ${data?.length || 0} pacientes`);
      return data as Patient[];
    }
  });
};
