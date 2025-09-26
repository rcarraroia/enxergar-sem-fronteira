-- =====================================================
-- DIAGNÓSTICO COMPLETO DAS POLÍTICAS RLS PATIENTS (CORRIGIDO)
-- =====================================================

-- 1. Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- 2. Listar TODAS as políticas da tabela patients
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 3. Verificar permissões da tabela
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'patients'
AND table_schema = 'public';

-- 4. Verificar usuário atual
SELECT current_user, session_user;

-- 5. Tentar inserção de teste simples
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'TESTE DIAGNOSTICO',
  'teste.diagnostico@example.com',
  '11999999999',
  '12345678901',
  '1990-01-01',
  true
) RETURNING id, nome, email;

-- 6. Limpar teste
DELETE FROM public.patients WHERE email = 'teste.diagnostico@example.com';

-- 7. Verificar se há triggers
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'patients';

-- 8. Verificar constraints
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'patients'
AND table_schema = 'public';
