# 🔐 Criar Usuário Admin via Supabase Dashboard

## Problema Atual
O usuário foi criado na tabela `organizers` mas não existe no Supabase Auth, por isso está dando erro "Invalid login credentials".

## ✅ Solução: Criar no Supabase Auth Dashboard

### Passo 1: Acessar o Dashboard
1. Acesse o **Supabase Dashboard**
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**

### Passo 2: Adicionar Usuário
1. Clique no botão **"Add user"**
2. Preencha os dados:
   - **Email**: `rcarrarocoach@gmail.com`
   - **Password**: `M&151173c@`
   - **Auto Confirm User**: ✅ **Marcar esta opção**
   - **Email Confirm**: ✅ **Marcar esta opção**
3. Clique em **"Create user"**

### Passo 3: Verificar Vinculação
Execute este SQL no **SQL Editor** para verificar se as contas foram vinculadas:

```sql
-- Verificar vinculação entre auth.users e organizers
SELECT
    CASE
        WHEN au.id IS NOT NULL THEN '✅ CONTAS VINCULADAS'
        ELSE '❌ CONTAS NÃO VINCULADAS'
    END as status,
    o.id as organizer_id,
    o.name,
    o.email,
    o.role,
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at
FROM public.organizers o
LEFT JOIN auth.users au ON o.email = au.email
WHERE o.email = 'rcarrarocoach@gmail.com';
```

### Passo 4: Testar Login
1. Acesse sua aplicação
2. Faça **LOGIN** (não signup) com:
   - **Email**: `rcarrarocoach@gmail.com`
   - **Senha**: `M&151173c@`
3. Deve funcionar normalmente agora

## 🔧 Alternativa: Via SQL (Se tiver permissões)

Se você tiver permissões para inserir diretamente na tabela `auth.users`, pode executar:

```sql
-- ATENÇÃO: Só funciona se você tiver permissões de superuser
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    new_email,
    invited_at,
    action_link,
    email_change,
    email_change_confirm_status,
    banned_until,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change_token_current,
    email_change_token_new,
    recovery_token,
    aud,
    role
)
SELECT
    o.id,
    'rcarrarocoach@gmail.com',
    crypt('M&151173c@', gen_salt('bf')), -- Senha criptografada
    now(),
    null,
    now(),
    null,
    null,
    null,
    null,
    null,
    null,
    0,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    now(),
    now(),
    null,
    null,
    null,
    null,
    now(),
    null,
    null,
    null,
    'authenticated',
    'authenticated'
FROM public.organizers o
WHERE o.email = 'rcarrarocoach@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.email = 'rcarrarocoach@gmail.com'
);
```

## ⚠️ Recomendação
**Use o método do Dashboard** (Passo 1-4) pois é mais seguro e garantido que funcione.

## 🎯 Resultado Esperado
Após seguir os passos, você deve conseguir fazer login com:
- **Email**: `rcarrarocoach@gmail.com`
- **Senha**: `M&151173c@`
- **Acesso**: Completo como administrador
