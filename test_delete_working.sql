-- TESTE: Confirmar que a exclusão está funcionando
-- Execute para testar com outro promoter

-- ============================================================================
-- VERIFICAR PROMOTERS DISPONÍVEIS PARA TESTE
-- ============================================================================

SELECT 
    'PROMOTERS DE TESTE DISPONÍVEIS' as info,
    id,
    name,
    email
FROM public.organizers 
WHERE email LIKE 'teste.%@exemplo.com'
ORDER BY created_at DESC;

-- ============================================================================
-- TESTAR EXCLUSÃO COM O "Teste Bypass"
-- ============================================================================

SELECT 
    'TESTE DELETE TESTE BYPASS' as info,
    admin_delete_organizer(
        (SELECT id FROM public.organizers WHERE name = 'Teste Bypass' LIMIT 1)
    ) as result;

-- ============================================================================
-- VERIFICAR SE FOI DELETADO
-- ============================================================================

SELECT 
    'VERIFICAÇÃO PÓS-DELETE' as info,
    COUNT(*) as total_promoters_teste
FROM public.organizers 
WHERE email LIKE 'teste.%@exemplo.com';

-- Listar os que restaram
SELECT 
    'PROMOTERS TESTE RESTANTES' as info,
    name,
    email
FROM public.organizers 
WHERE email LIKE 'teste.%@exemplo.com'
ORDER BY created_at DESC;