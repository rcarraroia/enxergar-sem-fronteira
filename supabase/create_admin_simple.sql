-- ============================================================================
-- SCRIPT SIMPLES: Criar Usuário Admin
-- Email: rcarrarocoach@gmail.com
-- Senha: M&151173c@ (para usar no signup do Supabase Auth)
-- Nome: Rcarraro
-- ============================================================================

-- Inserir novo usuário admin (ou atualizar se já existir)
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
)
ON CONFLICT (email)
DO UPDATE SET
    name = EXCLUDED.name,
    role = 'admin',
    status = 'active',
    updated_at = now();

-- Verificar se foi criado/atualizado
SELECT
    'Usuário Admin Configurado' as status,
    id,
    name,
    email,
    role,
    status,
    created_at
FROM public.organizers
WHERE email = 'rcarrarocoach@gmail.com';

-- ============================================================================
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Acesse a aplicação e faça signup com:
--    - Email: rcarrarocoach@gmail.com
--    - Senha: M&151173c@
-- 3. O sistema automaticamente vinculará as contas
-- ============================================================================
