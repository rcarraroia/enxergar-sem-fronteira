-- =====================================================
-- TESTE DE INSERÇÃO NA TABELA PATIENTS
-- =====================================================
-- Script para testar e diagnosticar problemas de RLS

-- 1. Verificar estrutura da tabela
\d patients;

-- 2. Verificar RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'patients';

-- 3. Listar políticas
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'patients';

-- 4. Testar inserção simples
SELECT 'Testando inserção...' as status;

-- 5. Inserção de teste (igual ao formulário)
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'RENATO TESTE',
  'pablook1515@yahoo.com.br',
  '31989527170',
  '11228730695',
  '1991-03-17',
  true
) RETURNING id, nome, email;

-- 6. Verificar se foi inserido
SELECT id, nome, email, created_at
FROM patients
WHERE email = 'pablook1515@yahoo.com.br'
ORDER BY created_at DESC
LIMIT 1;
