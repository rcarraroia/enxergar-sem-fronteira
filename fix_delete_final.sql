-- CORREÇÃO FINAL: Dropar e recriar a função corretamente
-- Execute este script no Supabase SQL Editor

-- ============================================================================
-- DROPAR A FUNÇÃO ATUAL (que está com bug)
-- ============================================================================

DROP FUNCTION IF EXISTS admin_delete_organizer(uuid);

-- ============================================================================
-- RECRIAR A FUNÇÃO CORRIGIDA
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_delete_organizer(
    p_organizer_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Bypassa RLS
AS $$
DECLARE
    events_count integer;
    organizer_name text;
    delete_count integer;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Tentando deletar organizer: %', p_organizer_id;
    
    -- Verificar se o organizer existe e pegar o nome
    SELECT name INTO organizer_name
    FROM public.organizers 
    WHERE id = p_organizer_id;
    
    IF organizer_name IS NULL THEN
        RAISE EXCEPTION 'Organizer com ID % não encontrado', p_organizer_id;
    END IF;
    
    RAISE NOTICE 'Organizer encontrado: %', organizer_name;
    
    -- Verificar se tem eventos associados
    SELECT COUNT(*) INTO events_count
    FROM public.events 
    WHERE organizer_id = p_organizer_id;
    
    RAISE NOTICE 'Eventos encontrados: %', events_count;
    
    IF events_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir o promoter "%" pois ele possui % evento(s) associado(s)', 
                        organizer_name, events_count;
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Deletando organizer: %', organizer_name;
    
    -- Deletar o organizer (bypassa RLS por ser SECURITY DEFINER)
    DELETE FROM public.organizers 
    WHERE id = p_organizer_id;
    
    -- CORREÇÃO: Usar GET DIAGNOSTICS em vez de NOT FOUND
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    
    RAISE NOTICE 'Linhas deletadas: %', delete_count;
    
    IF delete_count = 0 THEN
        RAISE EXCEPTION 'Falha ao deletar organizer % - nenhuma linha afetada', p_organizer_id;
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Organizer % deletado com sucesso', organizer_name;
    
    RETURN true;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION admin_delete_organizer TO public;

-- ============================================================================
-- TESTE IMEDIATO DA FUNÇÃO CORRIGIDA
-- ============================================================================

-- Testar com o Teste UID
SELECT 
    'TESTE FUNÇÃO CORRIGIDA' as info,
    admin_delete_organizer('eefaf213-9773-4863-9e3d-8797172473f4') as result;

-- Verificar se foi realmente deletado
SELECT 
    'VERIFICAÇÃO PÓS-DELETE' as info,
    COUNT(*) as total_promoters
FROM get_all_promoters();

-- Listar promoters restantes
SELECT 
    'PROMOTERS RESTANTES' as info,
    name,
    email
FROM get_all_promoters()
WHERE email LIKE 'teste.%@exemplo.com'
ORDER BY created_at DESC;