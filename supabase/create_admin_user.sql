-- ============================================================================
-- SCRIPT: Criar Novo Usuário Admin
-- Descrição: Adiciona um novo usuário administrador ao sistema
-- Data: 25 de Janeiro de 2025
-- Usuário: rcarrarocoach@gmail.com
-- ============================================================================

-- Verificar se o usuário já existe antes de criar
DO $$
DECLARE
    user_exists boolean := false;
    new_user_id uuid;
BEGIN
    -- Verificar se o usuário já existe
    SELECT EXISTS(
        SELECT 1 FROM public.organizers
        WHERE email = 'rcarrarocoach@gmail.com'
    ) INTO user_exists;

    IF user_exists THEN
        RAISE NOTICE '⚠️  Usuário já existe: rcarrarocoach@gmail.com';
        RAISE NOTICE '📝 Atualizando dados do usuário existente...';

        -- Atualizar usuário existente
        UPDATE public.organizers
        SET
            name = 'Rcarraro',
            role = 'admin',
            status = 'active',
            updated_at = now()
        WHERE email = 'rcarrarocoach@gmail.com'
        RETURNING id INTO new_user_id;

        RAISE NOTICE '✅ Usuário atualizado com sucesso! ID: %', new_user_id;
    ELSE
        RAISE NOTICE '📝 Criando novo usuário admin: rcarrarocoach@gmail.com';

        -- Criar novo usuário admin
        INSERT INTO public.organizers (
            name,
            email,
            role,
            status,
            created_at,
            updated_at
        ) VALUES (
            'Rcarraro',
            'rcarrarocoach@gmail.com',
            'admin',
            'active',
            now(),
            now()
        ) RETURNING id INTO new_user_id;

        RAISE NOTICE '✅ Usuário criado com sucesso! ID: %', new_user_id;
    END IF;

    -- Verificar se a tabela de auditoria existe e registrar a ação
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'role_audit_log'
        AND table_schema = 'public'
    ) THEN
        INSERT INTO public.role_audit_log (
            user_id,
            old_role,
            new_role,
            changed_by,
            reason,
            changed_at
        ) VALUES (
            new_user_id,
            CASE WHEN user_exists THEN 'existing' ELSE 'none' END,
            'admin',
            new_user_id,
            'Admin user created/updated via SQL script',
            now()
        );

        RAISE NOTICE '📋 Ação registrada no log de auditoria';
    END IF;

    -- Exibir informações do usuário criado/atualizado
    RAISE NOTICE '';
    RAISE NOTICE '👤 INFORMAÇÕES DO USUÁRIO:';
    RAISE NOTICE '   ID: %', new_user_id;
    RAISE NOTICE '   Nome: Rcarraro';
    RAISE NOTICE '   Email: rcarrarocoach@gmail.com';
    RAISE NOTICE '   Role: admin';
    RAISE NOTICE '   Status: active';
    RAISE NOTICE '';

END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Exibir dados do usuário criado para confirmação
SELECT
    '🎯 USUÁRIO ADMIN CRIADO/ATUALIZADO' as status,
    id,
    name,
    email,
    role,
    status,
    created_at,
    updated_at
FROM public.organizers
WHERE email = 'rcarrarocoach@gmail.com';

-- Exibir estatísticas dos usuários admin
SELECT
    '📊 ESTATÍSTICAS DE ADMINS' as report_type,
    COUNT(*) as total_admins,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_admins,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_admins
FROM public.organizers
WHERE role = 'admin';

-- ============================================================================
-- INSTRUÇÕES IMPORTANTES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 PRÓXIMOS PASSOS IMPORTANTES:';
    RAISE NOTICE '';
    RAISE NOTICE '1. 📧 CONFIGURAR AUTENTICAÇÃO:';
    RAISE NOTICE '   - O usuário precisa fazer signup no Supabase Auth com o email: rcarrarocoach@gmail.com';
    RAISE NOTICE '   - Senha: M&151173c@';
    RAISE NOTICE '   - Isso criará o registro correspondente na tabela auth.users';
    RAISE NOTICE '';
    RAISE NOTICE '2. 🔗 VINCULAR CONTAS:';
    RAISE NOTICE '   - Após o signup, o sistema automaticamente vinculará as contas';
    RAISE NOTICE '   - Verificar se o auth.uid() corresponde ao organizers.id';
    RAISE NOTICE '';
    RAISE NOTICE '3. ✅ TESTAR ACESSO:';
    RAISE NOTICE '   - Fazer login com as credenciais';
    RAISE NOTICE '   - Verificar se tem acesso às funcionalidades de admin';
    RAISE NOTICE '   - Testar as políticas RLS';
    RAISE NOTICE '';
    RAISE NOTICE '4. 🛡️  SEGURANÇA:';
    RAISE NOTICE '   - Alterar a senha após o primeiro login';
    RAISE NOTICE '   - Ativar 2FA se disponível';
    RAISE NOTICE '   - Verificar logs de acesso';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: Este script apenas cria o registro na tabela organizers.';
    RAISE NOTICE '    O usuário ainda precisa fazer signup no Supabase Auth para ativar a conta.';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- COMANDOS ÚTEIS PARA VERIFICAÇÃO
-- ============================================================================

-- Para verificar se o usuário foi criado corretamente:
-- SELECT * FROM public.organizers WHERE email = 'rcarrarocoach@gmail.com';

-- Para verificar todos os admins:
-- SELECT name, email, role, status FROM public.organizers WHERE role = 'admin';

-- Para verificar a vinculação com auth.users (após signup):
-- SELECT
--   o.name,
--   o.email,
--   o.role,
--   au.email as auth_email,
--   au.created_at as auth_created_at
-- FROM public.organizers o
-- LEFT JOIN auth.users au ON o.id = au.id
-- WHERE o.email = 'rcarrarocoach@gmail.com';
