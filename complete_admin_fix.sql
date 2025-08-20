-- SCRIPT COMPLETO: Correção do Painel Administrativo
-- Execute este script único no Supabase SQL Editor
-- Data: 2025-08-20

-- ============================================================================
-- PARTE 1: Adicionar campo 'role' na tabela organizers
-- ============================================================================

-- Verificar se o campo já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizers' AND column_name = 'role') THEN
        
        -- Adicionar campo role
        ALTER TABLE public.organizers 
        ADD COLUMN role text DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer'));
        
        -- Comentário para documentação
        COMMENT ON COLUMN public.organizers.role IS 'User role: admin or organizer. Replaces email-based role determination for security.';
        
        -- Criar índices
        CREATE INDEX idx_organizers_role ON public.organizers(role);
        CREATE INDEX idx_organizers_email_status ON public.organizers(email, status);
        
        RAISE NOTICE 'Campo role adicionado com sucesso!';
    ELSE
        RAISE NOTICE 'Campo role já existe, pulando...';
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: Garantir acesso admin para rcarraro@admin.enxergar
-- ============================================================================

-- Inserir ou atualizar usuário admin
INSERT INTO public.organizers (name, email, status, role) 
VALUES ('Admin Sistema', 'rcarraro@admin.enxergar', 'active', 'admin')
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  status = 'active',
  updated_at = now();

-- Atualizar outros admins existentes baseado no email
UPDATE public.organizers 
SET role = 'admin' 
WHERE email LIKE '%@admin.%' AND role != 'admin';

-- ============================================================================
-- PARTE 3: Limpar políticas RLS conflitantes (apenas as críticas)
-- ============================================================================

-- Patients - Remover políticas conflitantes
DROP POLICY IF EXISTS "Apenas sistema pode inserir patients" ON public.patients;
DROP POLICY IF EXISTS "Sistema e admins podem ver patients" ON public.patients;

-- Recriar política unificada para patients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Admins can manage patients') THEN
        CREATE POLICY "Admins can manage patients" ON public.patients
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.organizers 
                    WHERE email = auth.jwt() ->> 'email' 
                    AND role = 'admin' 
                    AND status = 'active'
                )
            );
        RAISE NOTICE 'Política para patients criada!';
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: Atualizar políticas de notification_templates e reminder_jobs
-- ============================================================================

-- Notification templates
DROP POLICY IF EXISTS "Admin users can manage notification templates" ON notification_templates;
CREATE POLICY "Admin users can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- Reminder jobs (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminder_jobs') THEN
        DROP POLICY IF EXISTS "Admin users can manage reminder jobs" ON reminder_jobs;
        CREATE POLICY "Admin users can manage reminder jobs" ON reminder_jobs
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.organizers 
                    WHERE email = auth.jwt() ->> 'email' 
                    AND role = 'admin' 
                    AND status = 'active'
                )
            );
        RAISE NOTICE 'Política para reminder_jobs atualizada!';
    END IF;
END $$;

-- ============================================================================
-- PARTE 5: Verificação final
-- ============================================================================

-- Mostrar resultado final
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    email,
    role,
    status as user_status,
    created_at
FROM public.organizers 
WHERE email = 'rcarraro@admin.enxergar';

-- Log da correção
INSERT INTO public.system_settings (key, value, description) VALUES (
    'admin_access_fix_complete',
    jsonb_build_object(
        'fixed_at', now(),
        'admin_email', 'rcarraro@admin.enxergar',
        'role_field_added', true,
        'policies_updated', true,
        'version', '20250820_complete_fix'
    ),
    'Complete admin access fix applied'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ CORREÇÃO COMPLETA APLICADA!';
    RAISE NOTICE '🔐 Usuário rcarraro@admin.enxergar agora tem acesso admin';
    RAISE NOTICE '🛡️ Políticas RLS atualizadas para usar campo role';
    RAISE NOTICE '🎯 Faça logout e login novamente no painel';
END $$;