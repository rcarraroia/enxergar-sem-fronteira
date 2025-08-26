-- ============================================================================
-- SCRIPT: Criar Usuário Admin com Autenticação
-- Descrição: Cria usuário tanto no Auth quanto na tabela organizers
-- Email: rcarrarocoach@gmail.com
-- Senha: M&151173c@
-- Nome: Rcarraro
-- ============================================================================

-- PASSO 1: Criar usuário na tabela organizers primeiro
INSERT INTO public.organizers (
    id,
    name,
    email,
    role,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Rcarraro',
    'rcarrarocoach@gmail.com',
    'admin',
    'active',
    now(),
    now()
)
ON CONFLICT (email)
DO UPDATE SET
    name = EXCLUDED.name,
    role = 'admin',
    status = 'active',
    updated_at = now();

-- PASSO 2: Obter o ID do usuário criado
DO $$
DECLARE
    user_id uuid;
    auth_user_exists boolean := false;
BEGIN
    -- Obter o ID do usuário
    SELECT id INTO user_id
    FROM public.organizers
    WHERE email = 'rcarrarocoach@gmail.com';

    -- Verificar se já existe no auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users
        WHERE email = 'rcarrarocoach@gmail.com'
    ) INTO auth_user_exists;

    IF NOT auth_user_exists THEN
        -- Criar usuário no auth.users
        -- IMPORTANTE: Isso precisa ser feito via API do Supabase, não diretamente no SQL
        RAISE NOTICE '⚠️  ATENÇÃO: Usuário criado na tabela organizers com ID: %', user_id;
        RAISE NOTICE '📧 Para ativar a autenticação, o usuário deve fazer SIGNUP na aplicação com:';
        RAISE NOTICE '   Email: rcarrarocoach@gmail.com';
        RAISE NOTICE '   Senha: M&151173c@';
        RAISE NOTICE '';
        RAISE NOTICE '🔗 Alternativamente, use o Supabase Dashboard:';
        RAISE NOTICE '   1. Vá em Authentication > Users';
        RAISE NOTICE '   2. Clique em "Add user"';
        RAISE NOTICE '   3. Use o email: rcarrarocoach@gmail.com';
        RAISE NOTICE '   4. Use a senha: M&151173c@';
        RAISE NOTICE '   5. Marque "Auto Confirm User"';
    ELSE
        RAISE NOTICE '✅ Usuário já existe no auth.users';
    END IF;

    -- Exibir informações do usuário
    RAISE NOTICE '';
    RAISE NOTICE '👤 USUÁRIO CONFIGURADO:';
    RAISE NOTICE '   ID: %', user_id;
    RAISE NOTICE '   Nome: Rcarraro';
    RAISE NOTICE '   Email: rcarrarocoach@gmail.com';
    RAISE NOTICE '   Role: admin';
    RAISE NOTICE '   Status: active';
    RAISE NOTICE '';
END $$;

-- PASSO 3: Verificar se foi criado corretamente
SELECT
    '✅ USUÁRIO ADMIN CONFIGURADO' as status,
    id,
    name,
    email,
    role,
    status,
    created_at
FROM public.organizers
WHERE email = 'rcarrarocoach@gmail.com';

-- PASSO 4: Verificar vinculação com auth.users
SELECT
    CASE
        WHEN au.id IS NOT NULL THEN '✅ VINCULADO COM AUTH'
        ELSE '⚠️  PRECISA FAZER SIGNUP'
    END as auth_status,
    o.name,
    o.email,
    o.role,
    au.email as auth_email,
    au.created_at as auth_created_at
FROM public.organizers o
LEFT JOIN auth.users au ON o.email = au.email
WHERE o.email = 'rcarrarocoach@gmail.com';

-- ============================================================================
-- INSTRUÇÕES PARA ATIVAR A AUTENTICAÇÃO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 COMO ATIVAR A AUTENTICAÇÃO:';
    RAISE NOTICE '';
    RAISE NOTICE '📱 OPÇÃO 1 - Via Aplicação (Recomendado):';
    RAISE NOTICE '   1. Acesse sua aplicação';
    RAISE NOTICE '   2. Vá para a página de SIGNUP (não login)';
    RAISE NOTICE '   3. Use: rcarrarocoach@gmail.com';
    RAISE NOTICE '   4. Senha: M&151173c@';
    RAISE NOTICE '   5. Complete o signup';
    RAISE NOTICE '';
    RAISE NOTICE '🖥️  OPÇÃO 2 - Via Supabase Dashboard:';
    RAISE NOTICE '   1. Acesse o Supabase Dashboard';
    RAISE NOTICE '   2. Vá em Authentication > Users';
    RAISE NOTICE '   3. Clique em "Add user"';
    RAISE NOTICE '   4. Email: rcarrarocoach@gmail.com';
    RAISE NOTICE '   5. Senha: M&151173c@';
    RAISE NOTICE '   6. Marque "Auto Confirm User"';
    RAISE NOTICE '   7. Clique em "Create user"';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE:';
    RAISE NOTICE '   - Use SIGNUP, não LOGIN na primeira vez';
    RAISE NOTICE '   - O sistema vinculará automaticamente as contas';
    RAISE NOTICE '   - Após o signup, poderá fazer login normalmente';
    RAISE NOTICE '';
END $$;
