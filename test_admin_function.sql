-- TESTE: Verificar se a função admin_create_organizer existe e funciona
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-20

-- ============================================================================
-- PARTE 1: Verificar se a função existe
-- ============================================================================

SELECT 
    'FUNÇÃO EXISTE?' as info,
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'admin_create_organizer';

-- ============================================================================
-- PARTE 2: Verificar permissões da função
-- ============================================================================

SELECT 
    'PERMISSÕES DA FUNÇÃO' as info,
    proname,
    proacl as permissions
FROM pg_proc 
WHERE proname = 'admin_create_organizer';

-- ============================================================================
-- PARTE 3: Testar a função diretamente
-- ============================================================================

-- Verificar usuário atual
SELECT 
    'USUÁRIO ATUAL' as info,
    auth.uid() as user_id,
    auth.jwt() ->> 'email' as current_email;

-- Testar a função (vai dar erro se não funcionar)
SELECT 
    'TESTE DA FUNÇÃO' as info,
    admin_create_organizer(
        'Teste Direto SQL',
        'teste.direto@exemplo.com',
        '11777777777'
    ) as new_organizer_id;

-- ============================================================================
-- PARTE 4: Se a função não existir, recriar
-- ============================================================================

-- Recriar a função (caso tenha dado problema)
CREATE OR REPLACE FUNCTION admin_create_organizer(
    p_name text,
    p_email text,
    p_phone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função
AS $$
DECLARE
    new_id uuid;
    current_user_email text;
BEGIN
    -- Verificar se o usuário atual é admin
    current_user_email := auth.jwt() ->> 'email';
    
    -- Log para debug
    RAISE NOTICE 'Usuário atual: %', current_user_email;
    
    IF NOT EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = current_user_email 
        AND role = 'admin' 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário % não é admin ativo', current_user_email;
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Admin verificado, criando organizer: %', p_email;
    
    -- Inserir o novo organizer (bypassa RLS por ser SECURITY DEFINER)
    INSERT INTO public.organizers (name, email, phone, status, role)
    VALUES (p_name, p_email, p_phone, 'active', 'organizer')
    RETURNING id INTO new_id;
    
    -- Log para debug
    RAISE NOTICE 'Organizer criado com ID: %', new_id;
    
    RETURN new_id;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION admin_create_organizer TO public;

-- ============================================================================
-- PARTE 5: Testar novamente após recriar
-- ============================================================================

SELECT 
    'TESTE APÓS RECRIAR' as info,
    admin_create_organizer(
        'Teste Após Recriar',
        'teste.apos.recriar@exemplo.com',
        '11666666666'
    ) as new_organizer_id;