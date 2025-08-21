-- INVESTIGAÇÃO: Por que a função não encontra o promoter?
-- Execute este script para descobrir

-- ============================================================================
-- TESTE 1: Verificar se o ID realmente existe (fora da função)
-- ============================================================================

SELECT 
    'TESTE DIRETO NA TABELA' as info,
    id,
    name,
    email
FROM public.organizers 
WHERE id = 'eefaf213-9773-4863-9e3d-8797172473f4';

-- ============================================================================
-- TESTE 2: Verificar via função get_all_promoters
-- ============================================================================

SELECT 
    'TESTE VIA FUNÇÃO' as info,
    id,
    name,
    email
FROM get_all_promoters()
WHERE id = 'eefaf213-9773-4863-9e3d-8797172473f4';

-- ============================================================================
-- TESTE 3: Buscar por nome para confirmar ID
-- ============================================================================

SELECT 
    'BUSCA POR NOME' as info,
    id,
    name,
    email
FROM public.organizers 
WHERE name = 'Teste UID';

-- ============================================================================
-- TESTE 4: Listar todos os IDs que começam com 'eef'
-- ============================================================================

SELECT 
    'IDs SIMILARES' as info,
    id,
    name,
    email
FROM public.organizers 
WHERE id::text LIKE 'eef%';

-- ============================================================================
-- TESTE 5: Criar função de teste sem RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION test_find_organizer(p_id uuid)
RETURNS TABLE(found boolean, name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (o.id IS NOT NULL) as found,
        o.name,
        o.email
    FROM public.organizers o
    WHERE o.id = p_id;
    
    -- Se não encontrou nada, retornar linha com false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::text, NULL::text;
    END IF;
END;
$$;

-- Testar a função
SELECT 
    'TESTE FUNÇÃO BUSCA' as info,
    found,
    name,
    email
FROM test_find_organizer('eefaf213-9773-4863-9e3d-8797172473f4');