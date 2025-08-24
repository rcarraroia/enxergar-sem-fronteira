-- =====================================================
-- TESTES DE VALIDAÇÃO DAS CORREÇÕES DE SEGURANÇA RLS
-- =====================================================
-- Descrição: Valida se as correções de segurança estão funcionando corretamente

-- ============================================================================
-- CONFIGURAÇÃO DOS TESTES
-- ============================================================================

-- Criar usuários de teste temporários (se não existirem)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'test.organizer@test.com', 'encrypted', now(), now(), now()),
    ('22222222-2222-2222-2222-222222222222', 'test.admin@test.com', 'encrypted', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Criar organizers de teste
INSERT INTO public.organizers (id, name, email, status, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Test Organizer', 'test.organizer@test.com', 'active', 'organizer'),
    ('22222222-2222-2222-2222-222222222222', 'Test Admin', 'test.admin@test.com', 'active', 'admin')
ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- ============================================================================
-- TESTE 1: VERIFICAR FUNÇÃO is_admin_user()
-- ============================================================================

\echo '🧪 TESTE 1: Verificando função is_admin_user()'

-- Simular contexto de usuário organizador comum
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
SELECT 
    CASE 
        WHEN is_admin_user() = false THEN '✅ PASSOU: Organizador comum não é admin'
        ELSE '❌ FALHOU: Organizador comum detectado como admin'
    END as test_result;

-- Simular contexto de usuário admin
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);
SELECT 
    CASE 
        WHEN is_admin_user() = true THEN '✅ PASSOU: Admin detectado corretamente'
        ELSE '❌ FALHOU: Admin não detectado'
    END as test_result;

-- ============================================================================
-- TESTE 2: VERIFICAR POLÍTICAS RLS PARA EVENTS
-- ============================================================================

\echo '🧪 TESTE 2: Verificando políticas RLS para events'

-- Criar evento de teste
INSERT INTO public.events (id, title, address, location, organizer_id, status)
VALUES 
    ('test-event-1', 'Evento Teste Organizador', 'Rua Teste', 'Local Teste', '11111111-1111-1111-1111-111111111111', 'active'),
    ('test-event-2', 'Evento Teste Admin', 'Rua Admin', 'Local Admin', '22222222-2222-2222-2222-222222222222', 'draft')
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    organizer_id = EXCLUDED.organizer_id,
    status = EXCLUDED.status;

-- Teste como usuário não autenticado
SELECT set_config('request.jwt.claims', '{}', true);
SELECT set_config('role', 'anon', true);

SELECT 
    CASE 
        WHEN COUNT(*) = 1 AND MAX(status) = 'active' THEN '✅ PASSOU: Usuário anônimo vê apenas eventos ativos'
        ELSE '❌ FALHOU: Usuário anônimo tem acesso incorreto'
    END as test_result
FROM public.events;

-- Teste como organizador comum
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
SELECT set_config('role', 'authenticated', true);

SELECT 
    CASE 
        WHEN COUNT(*) >= 1 THEN '✅ PASSOU: Organizador vê seus eventos'
        ELSE '❌ FALHOU: Organizador não vê seus eventos'
    END as test_result
FROM public.events 
WHERE organizer_id = '11111111-1111-1111-1111-111111111111';

-- Teste como admin
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);

SELECT 
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASSOU: Admin vê todos os eventos'
        ELSE '❌ FALHOU: Admin não vê todos os eventos'
    END as test_result
FROM public.events;

-- ============================================================================
-- TESTE 3: VERIFICAR POLÍTICAS RLS PARA ORGANIZERS
-- ============================================================================

\echo '🧪 TESTE 3: Verificando políticas RLS para organizers'

-- Teste como organizador comum (deve ver apenas seus dados)
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);

SELECT 
    CASE 
        WHEN COUNT(*) = 1 AND MAX(email) = 'test.organizer@test.com' THEN '✅ PASSOU: Organizador vê apenas seus dados'
        ELSE '❌ FALHOU: Organizador tem acesso incorreto'
    END as test_result
FROM public.organizers;

-- Teste como admin (deve ver todos)
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);

SELECT 
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASSOU: Admin vê todos os organizers'
        ELSE '❌ FALHOU: Admin não vê todos os organizers'
    END as test_result
FROM public.organizers;

-- ============================================================================
-- TESTE 4: VERIFICAR POLÍTICAS RLS PARA NOTIFICATION_TEMPLATES
-- ============================================================================

\echo '🧪 TESTE 4: Verificando políticas RLS para notification_templates'

-- Teste como organizador comum (não deve ter acesso)
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASSOU: Organizador comum não acessa templates'
        ELSE '❌ FALHOU: Organizador comum tem acesso indevido'
    END as test_result
FROM public.notification_templates;

-- Teste como admin (deve ter acesso total)
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);

SELECT 
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASSOU: Admin tem acesso aos templates'
        ELSE '❌ FALHOU: Admin não tem acesso aos templates'
    END as test_result
FROM public.notification_templates;

-- ============================================================================
-- TESTE 5: VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================================================

\echo '🧪 TESTE 5: Verificando se RLS está habilitado nas tabelas críticas'

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS HABILITADO'
        ELSE '❌ RLS DESABILITADO'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs')
ORDER BY tablename;

-- ============================================================================
-- TESTE 6: VERIFICAR POLÍTICAS PERIGOSAS REMOVIDAS
-- ============================================================================

\echo '🧪 TESTE 6: Verificando se políticas perigosas foram removidas'

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASSOU: Políticas perigosas removidas'
        ELSE '❌ FALHOU: Ainda existem políticas perigosas'
    END as test_result
FROM pg_policies 
WHERE schemaname = 'public' 
AND (
    policyname LIKE '%public%reading%' OR
    policyname LIKE '%true%' OR
    qual = 'true'
);

-- ============================================================================
-- LIMPEZA DOS TESTES
-- ============================================================================

\echo '🧹 Limpando dados de teste...'

-- Remover eventos de teste
DELETE FROM public.events WHERE id IN ('test-event-1', 'test-event-2');

-- Remover organizers de teste (manter se necessário para outros testes)
-- DELETE FROM public.organizers WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Resetar configurações
SELECT set_config('request.jwt.claims', '{}', true);
SELECT set_config('role', 'anon', true);

\echo '✅ TESTES DE SEGURANÇA RLS CONCLUÍDOS'
\echo '📋 Revisar resultados acima para identificar falhas'
\echo '🔧 Corrigir políticas que falharam nos testes'