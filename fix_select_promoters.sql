-- CORREÇÃO: Função para buscar promoters que bypassa RLS
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-21

-- ============================================================================
-- PROBLEMA: SELECT também está sendo bloqueado pelo RLS
-- SOLUÇÃO: Criar função que bypassa RLS para buscar promoters
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_promoters()
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    phone character varying,
    status text,
    asaas_api_key text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER -- Bypassa RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.email,
        o.phone,
        o.status,
        o.asaas_api_key,
        o.created_at,
        o.updated_at
    FROM public.organizers o
    ORDER BY o.created_at DESC;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION get_all_promoters TO public;

-- ============================================================================
-- TESTE DA FUNÇÃO
-- ============================================================================

SELECT 
    'TESTE BUSCA PROMOTERS' as info,
    COUNT(*) as total_promoters
FROM get_all_promoters();

-- Mostrar alguns promoters
SELECT 
    'PROMOTERS ENCONTRADOS' as info,
    name,
    email,
    status,
    created_at
FROM get_all_promoters()
LIMIT 5;