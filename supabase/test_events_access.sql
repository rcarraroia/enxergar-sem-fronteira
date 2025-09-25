-- ============================================================================
-- TESTE: Verificar acesso público aos eventos
-- ============================================================================

-- 1. Verificar políticas atuais da tabela events
SELECT
    'POLÍTICAS ATUAIS' as teste,
    policyname,
    cmd as operacao,
    qual as condicao
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'events'
ORDER BY policyname;

-- 2. Verificar status dos eventos existentes
SELECT
    'STATUS DOS EVENTOS' as teste,
    city,
    status,
    created_at::date as data_criacao
FROM public.events
ORDER BY created_at DESC
LIMIT 10;

-- 3. Simular acesso anônimo (sem autenticação)
SET LOCAL role = 'anon';

-- 4. Tentar acessar eventos como usuário anônimo
SELECT
    'ACESSO ANÔNIMO' as teste,
    COUNT(*) as eventos_visiveis,
    STRING_AGG(city, ', ') as cidades
FROM public.events
WHERE status = 'open';

-- 5. Reset role
RESET role;
