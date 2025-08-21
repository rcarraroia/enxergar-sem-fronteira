-- DIAGNÓSTICO: Políticas RLS da tabela organizers
-- Execute este script no Supabase SQL Editor para diagnosticar o problema
-- Data: 2025-08-20

-- ============================================================================
-- PARTE 1: Verificar usuário atual e JWT
-- ============================================================================

SELECT 
    'USUÁRIO ATUAL' as info,
    auth.uid() as user_id,
    auth.jwt() ->> 'email' as current_email,
    auth.jwt() ->> 'role' as jwt_role;

-- ============================================================================
-- PARTE 2: Verificar se o admin existe na tabela organizers
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
WHERE email = 'rcarraro@admin.enxergar'
   OR email LIKE '%@admin.%';

-- ============================================================================
-- PARTE 3: Testar a condição da política manualmente
-- ============================================================================

SELECT 
    'TESTE DA POLÍTICA' as info,
    auth.jwt() ->> 'email' as current_user,
    EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = auth.jwt() ->> 'email' 
        AND (
            role = 'admin' 
            OR email LIKE '%@admin.%' 
            OR email = 'rcarraro@admin.enxergar'
        )
        AND status = 'active'
    ) as policy_should_allow;

-- ============================================================================
-- PARTE 4: Listar todas as políticas da tabela organizers
-- ============================================================================

SELECT 
    'POLÍTICAS ATUAIS' as info,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'organizers'
ORDER BY cmd, policyname;

-- ============================================================================
-- PARTE 5: Verificar se RLS está habilitado
-- ============================================================================

SELECT 
    'RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'organizers';

-- ============================================================================
-- PARTE 6: Verificar colunas da tabela organizers
-- ============================================================================

SELECT 
    'COLUNAS DA TABELA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'organizers'
ORDER BY ordinal_position;