-- ABORDAGEM SEGURA: Inserir promoter diretamente sem alterar políticas RLS
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-20
-- SEGURANÇA: NÃO altera políticas existentes, apenas insere dados

-- ============================================================================
-- OPÇÃO 1: Inserir promoter diretamente (BYPASS RLS temporário)
-- ============================================================================

-- Desabilitar RLS temporariamente APENAS para esta operação
SET row_security = off;

-- Inserir o promoter de teste
INSERT INTO public.organizers (name, email, phone, status, role) 
VALUES ('Teste Promoter Admin', 'teste.admin@exemplo.com', '11999999999', 'active', 'organizer');

-- Reabilitar RLS
SET row_security = on;

-- ============================================================================
-- OPÇÃO 2: Usar função administrativa (MAIS SEGURA)
-- ============================================================================

-- Criar função que bypassa RLS para admins
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
    
    IF NOT EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = current_user_email 
        AND role = 'admin' 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é admin';
    END IF;
    
    -- Inserir o novo organizer (bypassa RLS por ser SECURITY DEFINER)
    INSERT INTO public.organizers (name, email, phone, status, role)
    VALUES (p_name, p_email, p_phone, 'active', 'organizer')
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION admin_create_organizer TO public;

-- ============================================================================
-- TESTE DA FUNÇÃO (descomente para testar)
-- ============================================================================

/*
-- Testar a função
SELECT admin_create_organizer(
    'Promoter Teste Função',
    'teste.funcao@exemplo.com',
    '11888888888'
);
*/

-- ============================================================================
-- VERIFICAÇÃO: Não altera políticas existentes
-- ============================================================================

SELECT 
    'POLÍTICAS MANTIDAS' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'organizers' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Log da solução segura
INSERT INTO public.system_settings (key, value, description) VALUES (
    'safe_admin_organizer_creation',
    jsonb_build_object(
        'created_at', now(),
        'method', 'admin_create_organizer function',
        'security', 'DEFINER function bypasses RLS safely',
        'policies_unchanged', true,
        'version', '20250820_safe_solution'
    ),
    'Safe admin organizer creation without changing RLS policies'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();