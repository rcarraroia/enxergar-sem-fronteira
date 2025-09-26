-- =====================================================
-- TESTE EXATO DA INSERÇÃO QUE ESTÁ FALHANDO
-- =====================================================

-- 1. Verificar RLS atual
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- 2. Listar políticas atuais
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 3. Testar inserção EXATA como no formulário
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'RENATO',
  'pablook1515@yahoo.com.br',
  '31989527170',
  '11228730695',
  '1991-03-17',
  true
) RETURNING id, nome, email, created_at;

-- 4. Se funcionou, limpar o teste
DELETE FROM public.patients WHERE email = 'pablook1515@yahoo.com.br';

-- 5. Verificar se há algum problema com campos específicos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'patients'
AND table_schema = 'public'
ORDER BY ordinal_position;
