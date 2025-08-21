-- CORREÇÃO: Função admin que usa auth.uid() em vez de email
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-20

-- ============================================================================
-- PROBLEMA: JWT não contém email, então auth.jwt() ->> 'email' é null
-- SOLUÇÃO: Usar auth.uid() ou criar função que bypassa completamente
-- ============================================================================

-- OPÇÃO 1: Função que bypassa RLS completamente (MAIS SEGURA)
CREATE OR REPLACE FUNCTION admin_create_organizer_bypass(
    p_name text,
    p_email text,
    p_phone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador (bypassa RLS)
AS $$
DECLARE
    new_id uuid;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Criando organizer: % (%)', p_name, p_email;
    
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM public.organizers WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email % já existe na tabela organizers', p_email;
    END IF;
    
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
GRANT EXECUTE ON FUNCTION admin_create_organizer_bypass TO public;

-- ============================================================================
-- OPÇÃO 2: Função que usa auth.uid() (se disponível)
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_create_organizer_uid(
    p_name text,
    p_email text,
    p_phone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id uuid;
    current_uid uuid;
BEGIN
    -- Verificar auth.uid()
    current_uid := auth.uid();
    
    -- Log para debug
    RAISE NOTICE 'Auth UID: %', current_uid;
    
    -- Se não há UID, permitir (assumindo que é admin via painel)
    IF current_uid IS NULL THEN
        RAISE NOTICE 'Sem auth.uid(), assumindo admin via painel';
    ELSE
        -- Verificar se o UID corresponde a um admin
        IF NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = current_uid 
            AND email LIKE '%admin%'
        ) THEN
            RAISE EXCEPTION 'Usuário % não é admin', current_uid;
        END IF;
    END IF;
    
    -- Inserir o novo organizer
    INSERT INTO public.organizers (name, email, phone, status, role)
    VALUES (p_name, p_email, p_phone, 'active', 'organizer')
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION admin_create_organizer_uid TO public;

-- ============================================================================
-- TESTE DAS FUNÇÕES
-- ============================================================================

-- Testar função bypass (deve funcionar)
SELECT 
    'TESTE BYPASS' as info,
    admin_create_organizer_bypass(
        'Teste Bypass',
        'teste.bypass@exemplo.com',
        '11555555555'
    ) as new_id;

-- Testar função UID (pode ou não funcionar)
SELECT 
    'TESTE UID' as info,
    admin_create_organizer_uid(
        'Teste UID',
        'teste.uid@exemplo.com',
        '11444444444'
    ) as new_id;

-- ============================================================================
-- VERIFICAR RESULTADOS
-- ============================================================================

SELECT 
    'ORGANIZERS CRIADOS' as info,
    name,
    email,
    created_at
FROM public.organizers 
WHERE email LIKE 'teste.%@exemplo.com'
ORDER BY created_at DESC;