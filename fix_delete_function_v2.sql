-- CORREÇÃO V2: Função de delete mais robusta
-- Execute este script no Supabase SQL Editor

-- ============================================================================
-- RECRIAR A FUNÇÃO COM MAIS DEBUG E TRATAMENTO DE ERRO
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_delete_organizer(
    p_organizer_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Bypassa RLS
AS $$
DECLARE
    events_count integer;
    organizer_name text;
    organizer_email text;
    delete_result integer;
BEGIN
    -- Log inicial
    RAISE NOTICE 'INÍCIO: Tentando deletar organizer: %', p_organizer_id;
    
    -- Verificar se o organizer existe e pegar dados
    SELECT name, email INTO organizer_name, organizer_email
    FROM public.organizers 
    WHERE id = p_organizer_id;
    
    IF organizer_name IS NULL THEN
        RAISE NOTICE 'ERRO: Organizer com ID % não encontrado', p_organizer_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Organizer não encontrado',
            'organizer_id', p_organizer_id
        );
    END IF;
    
    RAISE NOTICE 'ENCONTRADO: % (%)', organizer_name, organizer_email;
    
    -- Verificar se tem eventos associados
    SELECT COUNT(*) INTO events_count
    FROM public.events 
    WHERE organizer_id = p_organizer_id;
    
    RAISE NOTICE 'EVENTOS: % eventos encontrados', events_count;
    
    IF events_count > 0 THEN
        RAISE NOTICE 'BLOQUEADO: Organizer tem eventos associados';
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Não é possível excluir o promoter "%s" pois ele possui %s evento(s) associado(s)', organizer_name, events_count),
            'organizer_id', p_organizer_id,
            'events_count', events_count
        );
    END IF;
    
    -- Tentar deletar
    RAISE NOTICE 'DELETANDO: Iniciando exclusão de %', organizer_name;
    
    DELETE FROM public.organizers 
    WHERE id = p_organizer_id;
    
    -- Verificar quantas linhas foram afetadas
    GET DIAGNOSTICS delete_result = ROW_COUNT;
    
    RAISE NOTICE 'RESULTADO: % linhas deletadas', delete_result;
    
    IF delete_result = 0 THEN
        RAISE NOTICE 'FALHA: Nenhuma linha foi deletada';
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Falha ao deletar - nenhuma linha afetada',
            'organizer_id', p_organizer_id
        );
    END IF;
    
    RAISE NOTICE 'SUCESSO: Organizer % deletado com sucesso', organizer_name;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Organizer "%s" deletado com sucesso', organizer_name),
        'organizer_id', p_organizer_id,
        'deleted_rows', delete_result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'EXCEÇÃO: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'organizer_id', p_organizer_id
        );
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION admin_delete_organizer TO public;

-- ============================================================================
-- TESTE IMEDIATO DA NOVA FUNÇÃO
-- ============================================================================

-- Testar com o Teste UID que deveria ter sido deletado
SELECT 
    'TESTE NOVA FUNÇÃO' as info,
    admin_delete_organizer('eefaf213-9773-4863-9e3d-8797172473f4') as result;