-- =====================================================
-- DEBUG COMPLETO DO PROBLEMA RLS
-- =====================================================

-- 1. Verificar se RLS está realmente habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- 2. Listar TODAS as políticas atuais
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
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 4. Testar inserção direta (deve funcionar)
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'DEBUG TEST',
  'debug.test@example.com',
  '11999999999',
  '77777777777',
  '1990-01-01',
  true
) RETURNING id, nome, email, created_at;

-- 5. Verificar se foi inserido
SELECT COUNT(*) as total_patients FROM public.patients;

-- 6. Limpar teste
DELETE FROM public.patients WHERE email = 'debug.test@example.com';

-- 7. Verificar se há algum problema com a API key
SELECT current_user, session_user;

-- 8. Verificar se há triggers que podem estar interferindo
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'patients'
AND event_object_schema = 'public';

-- 9. SOLUÇÃO DRÁSTICA: Desabilitar RLS completamente (temporário)
-- ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;

SELECT 'Debug completo executado!' as status;
