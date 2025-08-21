-- CORREÇÃO: Função para deletar promoter que bypassa RLS
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-21

-- ============================================================================
-- PROBLEMA: DELETE também está sendo bloqueado pelo RLS
-- SOLUÇÃO: Criar função que bypassa RLS para deletar promoters
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
    
    -- Verificar se tem eventos associados
    SELECT COUNT(*) INTO events_count
    FROM public.events 
    WHERE organizer_id = p_organizer_id;
    
    IF events_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir o promoter "%" pois ele possui % evento(s) associado(s)', 
                        organizer_name, events_count;
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Deletando organizer: % (%)', organizer_name, p_organizer_id;
    
    -- Deletar o organizer (bypassa RLS por ser SECURITY DEFINER)
    DELETE FROM public.organizers 
    WHERE id = p_organizer_id;
    
    -- Verificar se foi deletado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Falha ao deletar organizer %', p_organizer_id;
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Organizer % deletado com sucesso', organizer_name;
    
    RETURN true;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION admin_delete_organizer TO public;

-- ============================================================================
-- TESTE DA FUNÇÃO (comentado - descomente para testar)
-- ============================================================================

/*
-- TESTE: Deletar um dos promoters de teste
SELECT admin_delete_organizer(
    (SELECT id FROM organizers WHERE email = 'teste.bypass@exemplo.com' LIMIT 1)
);
*/

-- ============================================================================
-- VERIFICAÇÃO: Listar promoters após criação da função
-- ============================================================================

SELECT 
    'PROMOTERS DISPONÍVEIS PARA TESTE' as info,
    id,
    name,
    email,
    (SELECT COUNT(*) FROM events WHERE organizer_id = organizers.id) as events_count
FROM organizers 
WHERE email LIKE 'teste.%@exemplo.com'
ORDER BY created_at DESC;