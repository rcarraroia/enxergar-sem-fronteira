
-- Deletar registros duplicados de pacientes, mantendo apenas o mais recente por CPF
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY cpf ORDER BY created_at DESC) as rn
  FROM public.patients
)
DELETE FROM public.patients 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Deletar registrações órfãs (que referenciam pacientes que foram deletados)
DELETE FROM public.registrations 
WHERE patient_id NOT IN (SELECT id FROM public.patients);

-- Mostrar quantos registros foram mantidos por CPF para verificação
SELECT cpf, COUNT(*) as total_registros
FROM public.patients 
GROUP BY cpf 
HAVING COUNT(*) > 1;
