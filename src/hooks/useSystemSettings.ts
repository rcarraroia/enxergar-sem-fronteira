
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  created_at: string
  updated_at: string
}

interface SettingUpdate {
  key: string
  value: string
  description?: string
}

export const useSystemSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async (): Promise<SystemSetting[]> => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");

      if (error) {
        console.error("Erro ao buscar configurações:", error);
        throw error;
      }

      return data || [];
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (setting: SettingUpdate) => {
      const { data, error } = await supabase
        .from("system_settings")
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description || null
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar configuração:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar configuração:", error);
      toast.error(`Erro ao atualizar configuração: ${  error.message}`);
    }
  });

  const getSettingValue = (key: string, defaultValue = ""): string => {
    const setting = settings?.find(s => s.key === key);
    if (!setting) {return defaultValue;}
    
    // Verificar se é um valor JSON válido
    try {
      const parsed = JSON.parse(setting.value);
      return typeof parsed === "string" ? parsed : setting.value;
    } catch {
      return setting.value;
    }
  };

  const getSettingJSON = (key: string, defaultValue: Record<string, unknown> = {}): Record<string, unknown> => {
    const setting = settings?.find(s => s.key === key);
    if (!setting) {return defaultValue;}
    
    try {
      return JSON.parse(setting.value);
    } catch {
      return defaultValue;
    }
  };

  const updateSetting = (key: string, value: string, description?: string) => {
    updateSettingMutation.mutate({ key, value, description });
  };

  return {
    settings,
    isLoading,
    error,
    getSettingValue,
    getSettingJSON,
    updateSetting,
    isUpdating: updateSettingMutation.isPending
  };
};
