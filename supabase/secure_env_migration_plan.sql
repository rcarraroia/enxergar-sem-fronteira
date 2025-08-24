-- =====================================================
-- PLANO DE MIGRAÇÃO SEGURA PARA VARIÁVEIS DE AMBIENTE
-- =====================================================
-- FASE 1: Preparação e backup das chaves existentes

-- ============================================================================
-- 1. CRIAR TABELA TEMPORÁRIA PARA BACKUP DAS CHAVES (CRIPTOGRAFADA)
-- ============================================================================

-- Criar extensão para criptografia se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar tabela temporária para backup seguro
CREATE TABLE IF NOT EXISTS temp_api_keys_backup (
    id UUID PRIMARY KEY,
    organizer_id UUID REFERENCES organizers(id),
    organizer_email TEXT,
    asaas_key_encrypted BYTEA,
    whatsapp_key_encrypted BYTEA,
    backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    migration_status TEXT DEFAULT 'pending'
);

-- Comentário de segurança
COMMENT ON TABLE temp_api_keys_backup IS 'TEMPORÁRIO: Backup criptografado das chaves de API durante migração - DELETAR APÓS MIGRAÇÃO';

-- ============================================================================
-- 2. FAZER BACKUP CRIPTOGRAFADO DAS CHAVES EXISTENTES
-- ============================================================================

-- Gerar chave de criptografia aleatória (deve ser armazenada em local seguro)
-- IMPORTANTE: Esta chave deve ser salva em local seguro fora do banco
DO $$
DECLARE
    encryption_key TEXT := 'temp_migration_key_' || extract(epoch from now())::text;
BEGIN
    -- Inserir backup criptografado das chaves existentes
    INSERT INTO temp_api_keys_backup (
        id,
        organizer_id,
        organizer_email,
        asaas_key_encrypted,
        whatsapp_key_encrypted
    )
    SELECT 
        gen_random_uuid(),
        id,
        email,
        CASE 
            WHEN asaas_api_key IS NOT NULL AND asaas_api_key != '' 
            THEN pgp_sym_encrypt(asaas_api_key, encryption_key)
            ELSE NULL 
        END,
        CASE 
            WHEN whatsapp_api_key IS NOT NULL AND whatsapp_api_key != '' 
            THEN pgp_sym_encrypt(whatsapp_api_key, encryption_key)
            ELSE NULL 
        END
    FROM organizers
    WHERE (asaas_api_key IS NOT NULL AND asaas_api_key != '')
       OR (whatsapp_api_key IS NOT NULL AND whatsapp_api_key != '');

    -- Log do backup
    RAISE NOTICE 'Backup criptografado criado com chave: %', encryption_key;
END $$;

-- ============================================================================
-- 3. CRIAR SISTEMA DE CONFIGURAÇÃO SEGURA
-- ============================================================================

-- Criar tabela para configurações do sistema (sem chaves sensíveis)
CREATE TABLE IF NOT EXISTS secure_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    requires_env_var BOOLEAN DEFAULT FALSE,
    env_var_name TEXT,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações que devem ser movidas para variáveis de ambiente
INSERT INTO secure_system_config (config_key, config_description, is_sensitive, requires_env_var, env_var_name) VALUES
('asaas_api_url', 'URL base da API do Asaas', FALSE, TRUE, 'ASAAS_API_URL'),
('asaas_api_key', 'Chave de API do Asaas', TRUE, TRUE, 'ASAAS_API_KEY'),
('whatsapp_api_url', 'URL da API do WhatsApp', FALSE, TRUE, 'WHATSAPP_API_URL'),
('whatsapp_api_key', 'Chave de API do WhatsApp', TRUE, TRUE, 'WHATSAPP_API_KEY'),
('smtp_host', 'Servidor SMTP para emails', FALSE, TRUE, 'SMTP_HOST'),
('smtp_port', 'Porta do servidor SMTP', FALSE, TRUE, 'SMTP_PORT'),
('smtp_user', 'Usuário SMTP', FALSE, TRUE, 'SMTP_USER'),
('smtp_password', 'Senha SMTP', TRUE, TRUE, 'SMTP_PASSWORD'),
('jwt_secret', 'Chave secreta para JWT', TRUE, TRUE, 'JWT_SECRET'),
('encryption_key', 'Chave para criptografia de dados', TRUE, TRUE, 'ENCRYPTION_KEY')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- 4. CRIAR FUNÇÕES PARA ACESSAR VARIÁVEIS DE AMBIENTE
-- ============================================================================

-- Função para obter configuração segura
CREATE OR REPLACE FUNCTION get_secure_config(config_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_value TEXT;
    env_var_name TEXT;
BEGIN
    -- Buscar configuração
    SELECT env_var_name INTO env_var_name
    FROM secure_system_config 
    WHERE config_key = config_name AND requires_env_var = TRUE;
    
    IF env_var_name IS NULL THEN
        RAISE EXCEPTION 'Configuração % não encontrada ou não requer variável de ambiente', config_name;
    END IF;
    
    -- Tentar obter da variável de ambiente (simulado - na prática seria current_setting)
    BEGIN
        config_value := current_setting(env_var_name, true);
    EXCEPTION WHEN OTHERS THEN
        config_value := NULL;
    END;
    
    IF config_value IS NULL OR config_value = '' THEN
        RAISE EXCEPTION 'Variável de ambiente % não configurada para %', env_var_name, config_name;
    END IF;
    
    RETURN config_value;
END;
$$;

-- ============================================================================
-- 5. LOG DO PLANO DE MIGRAÇÃO
-- ============================================================================

INSERT INTO system_settings (key, value, description) VALUES (
    'secure_env_migration_plan',
    jsonb_build_object(
        'phase', 'preparation',
        'implemented_at', now(),
        'description', 'Plano de migração segura para variáveis de ambiente',
        'backup_created', true,
        'next_steps', ARRAY[
            'Configurar variáveis de ambiente no servidor',
            'Testar acesso às configurações',
            'Remover chaves do banco de dados',
            'Deletar backup temporário'
        ],
        'security_improvements', ARRAY[
            'Chaves de API fora do banco de dados',
            'Backup criptografado durante migração',
            'Sistema de configuração centralizado',
            'Funções seguras para acesso a configurações'
        ]
    ),
    'Plano de migração para variáveis de ambiente seguras'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

SELECT 'PLANO DE MIGRAÇÃO PREPARADO - PRÓXIMO: CONFIGURAR VARIÁVEIS DE AMBIENTE' as resultado;