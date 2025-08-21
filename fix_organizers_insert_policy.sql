-- CORREÇÃO: Política RLS para INSERT na tabela organizers
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-20

-- ============================================================================
-- PARTE 1: Verificar políticas existentes
-- ============================================================================

-- Listar políticas atuais da tabela organizers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'organizers'
ORDER BY cmd, policyname;

-- ============================================================================
-- PARTE 2: Remover políticas conflitantes de INSERT
-- ============================================================================

-- Remover todas as políticas de INSERT existentes
DROP POLICY IF EXISTS "Admins can insert organizers" ON public.organizers;
DROP POLICY IF EXISTS "Admin users can insert organizers" ON public.organizers;
DROP POLICY IF EXISTS "Only admins can insert organizers" ON public.organizers;
DROP POLICY IF EXISTS "Sistema pode inserir organizers" ON public.organizers;

-- ============================================================================
-- PARTE 3: Criar política unificada para INSERT
-- ============================================================================

-- Criar política que permite INSERT para admins
CREATE POLICY "Admin can insert organizers" ON public.organizers
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND (
                role = 'admin' 
                OR email LIKE '%@admin.%' 
                OR email = 'rcarraro@admin.enxergar'
            )
            AND status = 'active'
        )
    );

-- ============================================================================
-- PARTE 4: Verificar se a política foi criada
-- ============================================================================

-- Verificar políticas após a criação
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'organizers' AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================================
-- PARTE 5: Teste de inserção (comentado - descomente para testar)
-- ============================================================================

/*
-- TESTE: Inserir um promoter de teste (descomente para testar)
INSERT INTO public.organizers (name, email, phone, status) 
VALUES ('Teste Promoter', 'teste@exemplo.com', '11999999999', 'active');

-- Se der erro, verificar se o usuário atual tem permissão
SELECT 
    auth.jwt() ->> 'email' as current_user_email,
    EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = auth.jwt() ->> 'email' 
        AND (role = 'admin' OR email LIKE '%@admin.%')
        AND status = 'active'
    ) as has_admin_permission;
*/

-- Log da correção
INSERT INTO public.system_settings (key, value, description) VALUES (
    'organizers_insert_policy_fix',
    jsonb_build_object(
        'fixed_at', now(),
        'admin_email', 'rcarraro@admin.enxergar',
        'policy_recreated', true,
        'version', '20250820_insert_fix'
    ),
    'Fixed INSERT policy for organizers table'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- Mensagem final
DO $
BEGIN
    RAISE NOTICE '✅ POLÍTICA DE INSERT CORRIGIDA!';
    RAISE NOTICE '🔐 Admins agora podem criar novos promoters';
    RAISE NOTICE '🧪 Teste a criação de promoter no painel admin-v2';
END $;