-- =====================================================
-- VERIFICAR CONFLITO DE CPF
-- =====================================================

-- 1. Verificar se o CPF específico já existe
SELECT
  id,
  nome,
  email,
  cpf,
  created_at
FROM public.patients
WHERE cpf = '11228730695'
ORDER BY created_at DESC;

-- 2. Verificar se o EMAIL já existe
SELECT
  id,
  nome,
  email,
  cpf,
  created_at
FROM public.patients
WHERE email = 'pablook1515@yahoo.com.br'
ORDER BY created_at DESC;

-- 3. Verificar constraints UNIQUE da tabela
SELECT
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'patients'
AND constraint_type = 'UNIQUE'
ORDER BY constraint_name;

-- 4. Contar total de registros
SELECT COUNT(*) as total_patients FROM public.patients;

-- 5. Ver últimos 5 registros
SELECT
  id,
  nome,
  email,
  cpf,
  created_at
FROM public.patients
ORDER BY created_at DESC
LIMIT 5;
