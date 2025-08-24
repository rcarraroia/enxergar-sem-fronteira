-- =====================================================
-- SETUP SEGURO DE LOGS DE AUDITORIA
-- =====================================================
-- Verifica estado atual antes de fazer mudanças

-- ============================================================================
-- 1. VERIFICAR SE TABELA JÁ EXISTE
-- ============================================================================

DO $$
BEGIN
    -- Verificar se tabela audit_logs já existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE 'Tabela audit_logs já existe - pulando criação';
    ELSE
        -- Criar tabela apenas se não existir
        CREATE TABLE public.audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            action TEXT NOT NULL,
            table_name TEXT NOT NULL,
            record_id UUID,
            details JSONB,
            old_values JSONB,
            new_values JSONB,
            user_id UUID REFERENCES auth.users(id),
            user_email TEXT,
            user_role TEXT,
            ip_address INET,
            user_agent TEXT,
            request_id TEXT,
            validation_errors JSONB,
            validation_passed BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT audit_logs_action_check CHECK (action ~ '^[A-Z_]+$'),
            CONSTRAINT audit_logs_table_name_check CHECK (table_name ~ '^[a-z_]+$')
        );
        
        RAISE NOTICE 'Tabela audit_logs criada com sucesso';
    END IF;
END $$;

-- ============================================================================
-- 2. CRIAR ÍNDICES APENAS SE NÃO EXISTIREM
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- ============================================================================
-- 3. HABILITAR RLS APENAS SE NÃO ESTIVER HABILITADO
-- ============================================================================

DO $$
BEGIN
    -- Verificar se RLS já está habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'audit_logs' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para audit_logs';
    ELSE
        RAISE NOTICE 'RLS já estava habilitado para audit_logs';
    END IF;
END $$;

-- ============================================================================
-- 4. CRIAR POLÍTICAS APENAS SE NÃO EXISTIREM
-- ============================================================================

DO $$
BEGIN
    -- Política para admins
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' 
        AND policyname = 'Admins can view all audit logs'
    ) THEN
        CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
            FOR SELECT USING (is_admin_user());
        RAISE NOTICE 'Política admin criada para audit_logs';
    ELSE
        RAISE NOTICE 'Política admin já existe para audit_logs';
    END IF;

    -- Política para organizadores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' 
        AND policyname = 'Organizers can view own audit logs'
    ) THEN
        CREATE POLICY "Organizers can view own audit logs" ON public.audit_logs
            FOR SELECT USING (user_id = auth.uid() OR is_admin_user());
        RAISE NOTICE 'Política organizador criada para audit_logs';
    ELSE
        RAISE NOTICE 'Política organizador já existe para audit_logs';
    END IF;

    -- Política para inserção
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' 
        AND policyname = 'System can insert audit logs'
    ) THEN
        CREATE POLICY "System can insert audit logs" ON public.audit_logs
            FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política inserção criada para audit_logs';
    ELSE
        RAISE NOTICE 'Política inserção já existe para audit_logs';
    END IF;
END $$;

-- ============================================================================
-- 5. CRIAR FUNÇÃO APENAS SE NÃO EXISTIR
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_user_email TEXT DEFAULT NULL,
    p_user_role TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL,
    p_validation_errors JSONB DEFAULT NULL,
    p_validation_passed BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        action, table_name, record_id, details, old_values, new_values,
        user_id, user_email, user_role, ip_address, user_agent, request_id,
        validation_errors, validation_passed
    ) VALUES (
        p_action, p_table_name, p_record_id, p_details, p_old_values, p_new_values,
        COALESCE(p_user_id, auth.uid()), p_user_email, p_user_role, 
        p_ip_address, p_user_agent, p_request_id, p_validation_errors, p_validation_passed
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- ============================================================================
-- 6. LOG DE SUCESSO
-- ============================================================================

SELECT log_audit_event(
    p_action := 'SETUP_AUDIT_SYSTEM',
    p_table_name := 'audit_logs',
    p_details := jsonb_build_object(
        'setup_completed', true,
        'timestamp', NOW(),
        'safe_mode', true
    )
);

SELECT 'SETUP DE AUDITORIA CONCLUÍDO COM SEGURANÇA!' as resultado;