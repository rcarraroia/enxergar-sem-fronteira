
-- Limpeza inteligente dos dados duplicados
-- Primeiro, vamos identificar e limpar apenas os verdadeiros duplicados

-- 1. Deletar duplicatas do Fabiano Lucas Dias (mantendo o mais recente)
WITH fabiano_duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY REPLACE(REPLACE(cpf, '.', ''), '-', '') ORDER BY created_at DESC) as rn
  FROM public.patients
  WHERE nome ILIKE '%fabiano%lucas%dias%'
)
DELETE FROM public.patients 
WHERE id IN (
  SELECT id FROM fabiano_duplicates WHERE rn > 1
);

-- 2. Deletar duplicatas da Luciene (mantendo o mais recente)
WITH luciene_duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY REPLACE(REPLACE(cpf, '.', ''), '-', '') ORDER BY created_at DESC) as rn
  FROM public.patients
  WHERE nome ILIKE '%luciene%emilia%'
)
DELETE FROM public.patients 
WHERE id IN (
  SELECT id FROM luciene_duplicates WHERE rn > 1
);

-- 3. Normalizar todos os CPFs existentes (remover pontos e hífens para consistência)
UPDATE public.patients 
SET cpf = REPLACE(REPLACE(cpf, '.', ''), '-', '')
WHERE cpf ~ '[.-]';

-- 4. Deletar registrações órfãs
DELETE FROM public.registrations 
WHERE patient_id NOT IN (SELECT id FROM public.patients);

-- 5. Verificação final - mostrar quantos registros existem por CPF
SELECT 
  cpf, 
  COUNT(*) as total_registros,
  STRING_AGG(nome, ' | ') as nomes
FROM public.patients 
GROUP BY cpf 
HAVING COUNT(*) > 1
ORDER BY total_registros DESC;
