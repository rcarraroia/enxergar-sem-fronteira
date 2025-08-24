import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Hook para verificação segura de privilégios administrativos
 * Usa a função is_admin_user() do banco de dados para máxima segurança
 */
export function useAdminCheck() {
  const { user, userRole } = useAuth();
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) {
        setIsAdminVerified(false);
        setIsLoading(false);
        return;
      }

      try {
        // Usar a função segura do banco de dados
        const { data, error } = await supabase.rpc("is_admin_user");

        if (error) {
          console.error("Erro ao verificar status de admin:", error);
          setIsAdminVerified(false);
        } else {
          setIsAdminVerified(data === true);
          console.log("🔐 Verificação de admin via RPC:", data === true ? "ADMIN" : "NÃO ADMIN");
        }
      } catch (error) {
        console.error("Erro crítico na verificação de admin:", error);
        setIsAdminVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminStatus();
  }, [user, userRole]);

  return {
    isAdminVerified,
    isLoading,
    // Verificação dupla: tanto o role local quanto a verificação do banco
    isAdmin: userRole === "admin" && isAdminVerified
  };
}