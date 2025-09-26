-- Verificar se o CPF 112.287.306-95 já existe
SELECT
  id,
  nome,
  email,
  cpf,
  created_at
FROM public.patients
WHERE cpf IN ('11228730695', '112.287.306-95')
ORDER BY created_at DESC;
