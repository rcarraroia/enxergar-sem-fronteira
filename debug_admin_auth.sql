-- DIAGNÓSTICO: Por que a função não reconhece o admin?
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-20

-- ============================================================================
-- PARTE 1: Verificar JWT atual
-- ============================================================================

SELECT 
    'JWT ATUAL' as info,
    auth.uid() as user_id,
    auth.jwt() ->> 'email' as jwt_email,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() as full_jwt;

-- ============================================================================
-- PARTE 2: Verificar admin na tabela
-- ============================================================================

SELECT 
    'ADMIN NA TABELA' as info,
    id,
    name,
    email,
    status,
    role,
    created_at
FROM public.organizers 
WHERE email LIKE '%rcarraro%' OR email LIKE '%admin%';

-- ============================================================================
-- PARTE 3: Testar a condição da função manualmente
-- ============================================================================

SELECT 
    'TESTE CONDIÇÃO' as info,
    auth.jwt() ->> 'email' as current_email,
    EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'admin' 
        AND status = 'active'
    ) as should_allow,
    (
        SELECT COUNT(*) FROM public.organizers 
        WHERE email = auth.jwt() ->> 'email'
    ) as email_matches,
    (
        SELECT COUNT(*) FROM public.organizers 
        WHERE email = auth.jwt() ->> 'email' 
        AND role = 'admin'
    ) as admin_matches,
    (
        SELECT COUNT(*) FROM public.organizers 
        WHERE email = auth.jwt() ->> 'email' 
        AND status = 'active'
    ) as active_matches;

-- ============================================================================
-- PARTE 4: Verificar se há problema com NULL
-- ============================================================================

SELECT 
    'VERIFICAÇÃO NULL' as info,
    CASE 
        WHEN auth.jwt() ->> 'email' IS NULL THEN 'JWT EMAIL É NULL!'
        WHEN auth.jwt() ->> 'email' = '' THEN 'JWT EMAIL É VAZIO!'
        ELSE 'JWT EMAIL OK: ' || (auth.jwt() ->> 'email')
    END as jwt_status;

-- ============================================================================
-- PARTE 5: Comparação direta de strings
-- ============================================================================

SELECT 
    'COMPARAÇÃO STRINGS' as info,
    auth.jwt() ->> 'email' as jwt_email,
    (
        SELECT email FROM public.organizers 
        WHERE role = 'admin' 
        LIMIT 1
    ) as admin_email_in_table,
    (auth.jwt() ->> 'email') = (
        SELECT email FROM public.organizers 
        WHERE role = 'admin' 
        LIMIT 1
    ) as emails_match;