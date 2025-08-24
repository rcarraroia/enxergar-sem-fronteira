-- =====================================================
-- TESTES DE VALIDAÇÃO DAS CORREÇÕES DE SEGURANÇA RLS
-- =====================================================
-- Versão simplificada para painel do Supabase

-- ============================================================================
-- TESTE 1: VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================================================

SELECT 
    'TESTE 1: Status do RLS' as teste,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'RLS HABILITADO'
        ELSE 'RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs')
ORDER BY tablename;

-- ============================================================================
-- TESTE 2: VERIFICAR FUNÇÃO is_admin_user() EXISTE
-- ============================================================================

SELECT 
    'TESTE 2: Função is_admin_user()' as teste,
    CASE 
        WHEN COUNT(*) > 0 THEN 'FUNÇÃO EXISTE'
        ELSE 'FUNÇÃO NÃO EXISTE'
    END as status
FROM pg_proc 
WHERE proname = 'is_admin_user';

-- ============================================================================
-- TESTE 3: VERIFICAR COLUNA ROLE NA TABELA ORGANIZERS
-- ============================================================================

SELECT 
    'TESTE 3: Coluna role' as teste,
    CASE 
        WHEN COUNT(*) > 0 THEN 'COLUNA ROLE EXISTE'
        ELSE 'COLUNA ROLE NÃO EXISTE'
    END as status
FROM information_schema.columns 
WHERE table_name = 'organizers' 
AND column_name = 'role' 
AND table_schema = 'public';

-- ============================================================================
-- TESTE 4: VERIFICAR POLÍTICAS PERIGOSAS REMOVIDAS
-- ============================================================================

SELECT 
    'TESTE 4: Políticas perigosas' as teste,
    policyname,
    tablename,
    'POLÍTICA PERIGOSA AINDA EXISTE' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND (
    policyname ILIKE '%public%reading%' OR
    policyname ILIKE '%are public%' OR
    qual = 'true'
)
UNION ALL
SELECT 
    'TESTE 4: Políticas perigosas' as teste,
    'NENHUMA' as policyname,
    'TODAS' as tablename,
    'POLÍTICAS PERIGOSAS REMOVIDAS' as status
WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (
        policyname ILIKE '%public%reading%' OR
        policyname ILIKE '%are public%' OR
        qual = 'true'
    )
);

-- ============================================================================
-- TESTE 5: VERIFICAR POLÍTICAS ATUAIS
-- ============================================================================

SELECT 
    'TESTE 5: Políticas atuais' as teste,
    tablename,
    policyname,
    cmd as operacao
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- TESTE 6: VERIFICAR USUÁRIOS ADMIN
-- ============================================================================

SELECT 
    'TESTE 6: Usuários admin' as teste,
    name,
    email,
    role,
    status
FROM public.organizers 
WHERE role = 'admin';

-- ============================================================================
-- TESTE 7: VERIFICAR LOG DA MIGRAÇÃO
-- ============================================================================

SELECT 
    'TESTE 7: Log da migração' as teste,
    key,
    value::jsonb->>'implemented_at' as implementado_em,
    value::jsonb->>'description' as descricao
FROM public.system_settings 
WHERE key = 'critical_rls_security_fixes';