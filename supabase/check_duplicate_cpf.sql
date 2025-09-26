-- =====================================================
-- VERIFICAR CPF DUPLICADO
-- =====================================================

-- 1. Verificar se o CPF já existe (com e sem formatação)
SELECT
  id,
  nome,
  email,
  cpf,
  created_at
FROM public.patients
WHERE cpf IN ('11228730695', '112.287.306-95')
ORDER BY created_at DESC;

-- 2. Contar quantos registros com esse CPF existem
SELECT
  cpf,
  COUNT(*) as quantidade
FROM public.patients
WHERE cpf IN ('11228730695', '112.287.306-95')
GROUP BY cpf;

-- 3. Verificar se há CPFs duplicados na tabela
SELECT
  cpf,
  COUNT(*) as quantidade
FROM public.patients
GROUP BY cpf
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 4. Verificar últimos registros criados
SELECT
  id,
  nome,
  email,
  cpf,
  created_at
FROM public.patients
ORDER BY created_at DESC
LIMIT 10;
