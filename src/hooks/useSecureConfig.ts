import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook para acessar configurações seguras do sistema
 * Substitui o acesso direto às chaves de API no banco de dados
 */

interface SecureConfig {
  asaasApiUrl: string
  whatsappApiUrl: string
  smtpHost: string
  smtpPort: string
  appUrl: string
}

interface ConfigError {
  message: string
  code: string
}

interface ConfigStatus {
  secure_configs: number
  warning_configs: number
  critical_configs: number
  supabase: {
    status: "secure" | "warning" | "critical"
    url_status: "secure" | "warning" | "critical"
    anon_key_status: "secure" | "warning" | "critical"
    service_key_status: "secure" | "warning" | "critical"
  }
  asaas: {
    status: "secure" | "warning" | "critical"
    api_key_status: "secure" | "warning" | "critical"
    webhook_status: "secure" | "warning" | "critical"
    keys_in_database: boolean
  }
  whatsapp: {
    status: "secure" | "warning" | "critical"
    token_status: "secure" | "warning" | "critical"
    webhook_status: "secure" | "warning" | "critical"
    keys_in_database: boolean
  }
  email: {
    status: "secure" | "warning" | "critical"
    smtp_status: "secure" | "warning" | "critical"
    auth_status: "secure" | "warning" | "critical"
  }
}

export function useSecureConfig() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ConfigError | null>(null);

  useEffect(() => {
    loadConfigStatus();
  }, []);

  const loadConfigStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar status das configurações
      const status = await checkConfigurationStatus();
      setConfigStatus(status);
    } catch (err) {
      console.error("Erro ao carregar status das configurações:", err);
      setError({
        message: err instanceof Error ? err.message : "Erro desconhecido",
        code: "CONFIG_STATUS_ERROR"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkConfigurationStatus = async (): Promise<ConfigStatus> => {
    // Verificar variáveis de ambiente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    // Verificar chaves no banco de dados
    const { data: organizersWithKeys } = await supabase
      .from("organizers")
      .select("asaas_api_key, whatsapp_api_key")
      .not("asaas_api_key", "is", null)
      .not("whatsapp_api_key", "is", null);

    const hasAsaasKeysInDB = organizersWithKeys?.some(org => org.asaas_api_key) || false;
    const hasWhatsAppKeysInDB = organizersWithKeys?.some(org => org.whatsapp_api_key) || false;

    // Avaliar status de cada serviço
    const supabaseStatus = {
      url_status: supabaseUrl ? "secure" as const : "critical" as const,
      anon_key_status: supabaseAnonKey ? "secure" as const : "critical" as const,
      service_key_status: supabaseServiceKey ? "secure" as const : "warning" as const,
      status: (supabaseUrl && supabaseAnonKey) ? "secure" as const : "critical" as const
    };

    const asaasStatus = {
      api_key_status: import.meta.env.VITE_ASAAS_API_KEY ? "secure" as const : "critical" as const,
      webhook_status: import.meta.env.VITE_ASAAS_WEBHOOK_URL ? "secure" as const : "warning" as const,
      keys_in_database: hasAsaasKeysInDB,
      status: hasAsaasKeysInDB ? "critical" as const : 
              import.meta.env.VITE_ASAAS_API_KEY ? "secure" as const : "critical" as const
    };

    const whatsappStatus = {
      token_status: import.meta.env.VITE_WHATSAPP_TOKEN ? "secure" as const : "critical" as const,
      webhook_status: import.meta.env.VITE_WHATSAPP_WEBHOOK_URL ? "secure" as const : "warning" as const,
      keys_in_database: hasWhatsAppKeysInDB,
      status: hasWhatsAppKeysInDB ? "critical" as const :
              import.meta.env.VITE_WHATSAPP_TOKEN ? "secure" as const : "critical" as const
    };

    const emailStatus = {
      smtp_status: import.meta.env.VITE_SMTP_HOST ? "secure" as const : "warning" as const,
      auth_status: (import.meta.env.VITE_SMTP_USER && import.meta.env.VITE_SMTP_PASS) ? "secure" as const : "warning" as const,
      status: import.meta.env.VITE_SMTP_HOST ? "secure" as const : "warning" as const
    };

    // Contar configurações por status
    const allStatuses = [
      supabaseStatus.status,
      asaasStatus.status,
      whatsappStatus.status,
      emailStatus.status
    ];

    const secure_configs = allStatuses.filter(s => s === "secure").length;
    const warning_configs = allStatuses.filter(s => s === "warning").length;
    const critical_configs = allStatuses.filter(s => s === "critical").length;

    return {
      secure_configs,
      warning_configs,
      critical_configs,
      supabase: supabaseStatus,
      asaas: asaasStatus,
      whatsapp: whatsappStatus,
      email: emailStatus
    };
  };

  const migrateApiKeys = async () => {
    try {
      toast.info("Iniciando migração das chaves de API...");
      
      // Buscar chaves do banco
      const { data: organizers, error } = await supabase
        .from("organizers")
        .select("id, email, asaas_api_key, whatsapp_api_key")
        .or("asaas_api_key.not.is.null,whatsapp_api_key.not.is.null");

      if (error) {throw error;}

      if (!organizers || organizers.length === 0) {
        toast.success("Nenhuma chave encontrada no banco de dados");
        return;
      }

      // Criar log das chaves encontradas (sem expor os valores)
      const keysFound = organizers.map(org => ({
        email: org.email,
        hasAsaasKey: !!org.asaas_api_key,
        hasWhatsAppKey: !!org.whatsapp_api_key
      }));

      console.log("Chaves encontradas para migração:", keysFound);

      // Criar arquivo de instruções para migração manual
      const migrationInstructions = `
# MIGRAÇÃO DE CHAVES DE API - INSTRUÇÕES

## Chaves encontradas no banco de dados:
${keysFound.map(k => `
- Email: ${k.email}
  - ASAAS API Key: ${k.hasAsaasKey ? "SIM" : "NÃO"}
  - WhatsApp API Key: ${k.hasWhatsAppKey ? "SIM" : "NÃO"}
`).join("")}

## Próximos passos:

1. Configure as variáveis de ambiente no seu provedor de hospedagem:
   ${keysFound.some(k => k.hasAsaasKey) ? "- VITE_ASAAS_API_KEY=<sua_chave_asaas>" : ""}
   ${keysFound.some(k => k.hasWhatsAppKey) ? "- VITE_WHATSAPP_TOKEN=<seu_token_whatsapp>" : ""}

2. Após configurar as variáveis, execute a limpeza do banco:
   UPDATE organizers SET asaas_api_key = NULL, whatsapp_api_key = NULL;

3. Reinicie a aplicação para carregar as novas variáveis.

## IMPORTANTE:
- Mantenha as chaves originais em local seguro até confirmar que tudo funciona
- Teste todas as funcionalidades após a migração
- As chaves serão removidas do banco apenas após confirmação manual
`;

      // Salvar instruções no sistema
      await supabase.from("system_settings").upsert({
        key: "api_keys_migration_instructions",
        value: migrationInstructions,
        description: "Instruções para migração manual das chaves de API"
      });

      toast.success("Instruções de migração geradas. Verifique os logs do sistema.");
      
      // Recarregar status
      await loadConfigStatus();

    } catch (err) {
      console.error("Erro na migração:", err);
      toast.error("Erro ao processar migração das chaves");
    }
  };

  const refetch = () => {
    loadConfigStatus();
  };

  return {
    configStatus,
    isLoading,
    error,
    refetch,
    migrateApiKeys
  };
}

/**
 * Hook para verificar se as configurações críticas estão disponíveis
 */
export function useConfigValidation() {
  const [isValid, setIsValid] = useState(false);
  const [missingConfigs, setMissingConfigs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateConfigurations();
  }, []);

  const validateConfigurations = async () => {
    try {
      setLoading(true);
      const missing: string[] = [];

      // Verificar variáveis de ambiente críticas
      const criticalEnvVars = [
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY"
      ];

      criticalEnvVars.forEach(varName => {
        const value = import.meta.env[varName];
        if (!value || value === "") {
          missing.push(varName);
        }
      });

      // Verificar se Supabase está acessível
      try {
        const { error } = await supabase.from("system_settings").select("key").limit(1);
        if (error) {
          missing.push("SUPABASE_CONNECTION");
        }
      } catch {
        missing.push("SUPABASE_CONNECTION");
      }

      setMissingConfigs(missing);
      setIsValid(missing.length === 0);
    } catch (err) {
      console.error("Erro na validação de configurações:", err);
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isValid,
    missingConfigs,
    loading,
    revalidate: validateConfigurations
  };
}

/**
 * Utilitário para obter configurações específicas de forma segura
 */
export const ConfigUtils = {
  /**
   * Obtém URL da API Asaas (sem expor a chave)
   */
  getAsaasApiUrl: (): string => {
    return import.meta.env.VITE_ASAAS_API_URL || "https://www.asaas.com/api/v3";
  },

  /**
   * Verifica se está em modo de desenvolvimento
   */
  isDevelopment: (): boolean => {
    return import.meta.env.DEV || import.meta.env.NODE_ENV === "development";
  },

  /**
   * Verifica se está em modo de produção
   */
  isProduction: (): boolean => {
    return import.meta.env.PROD || import.meta.env.NODE_ENV === "production";
  },

  /**
   * Obtém URL base da aplicação
   */
  getAppUrl: (): string => {
    return import.meta.env.VITE_APP_URL || "https://www.enxergarsemfronteira.com.br";
  },

  /**
   * Obtém configuração do Supabase
   */
  getSupabaseConfig: () => {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    };
  },

  /**
   * Valida se uma configuração está presente
   */
  hasConfig: (configName: string): boolean => {
    const value = import.meta.env[configName];
    return value !== undefined && value !== null && value !== "";
  }
};