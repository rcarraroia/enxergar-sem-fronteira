-- CORREÇÃO DE TELEFONES PROBLEMÁTICOS
-- Execute após identificar os problemas na validação

-- Backup adicional antes das correções
CREATE TABLE IF NOT EXISTS patients_backup_phone_fixes AS
SELECT id, telefone, nome
FROM patients
WHERE telefone !~ '^55[0-9]{10,11}$'
  AND telefone IS NOT NULL
  AND telefone != '';

-- 1. Corrigir telefones que ainda têm formatação
UPDATE patients
SET telefone = REGEXP_REPLACE(telefone, '[^0-9]', '', 'g')
WHERE telefone ~ '[^0-9]'
  AND telefone IS NOT NULL;

-- 2. Corrigir telefones muito longos (remover dígitos extras no final)
UPDATE patients
SET telefone = LEFT(telefone, 13)
WHERE LENGTH(telefone) > 13
  AND telefone ~ '^55[0-9]';

-- 3. Corrigir DDD inválido (55 + 0X para 55 + X)
UPDATE patients
SET telefone = '55' || SUBSTRING(telefone FROM 4)
WHERE telefone ~ '^55[0][1-9]';

-- 4. Corrigir telefones muito curtos (adicionar dígito 9 se necessário)
-- Apenas para celulares que podem estar sem o 9
UPDATE patients
SET telefone = SUBSTRING(telefone FROM 1 FOR 4) || '9' || SUBSTRING(telefone FROM 5)
WHERE LENGTH(telefone) = 12
  AND telefone ~ '^55[1-9]{2}[6-9]'  -- Parece celular sem o 9
  AND NOT telefone ~ '^55[1-9]{2}9';

-- 5. Remover telefones inválidos que não podem ser corrigidos
-- (Opcional - descomente se quiser limpar registros inválidos)
/*
UPDATE patients
SET telefone = NULL
WHERE telefone IS NOT NULL
  AND telefone != ''
  AND (
    LENGTH(telefone) < 10 OR
    LENGTH(telefone) > 15 OR
    NOT telefone ~ '^[0-9]+$'
  );
*/

-- Validação pós-correção
SELECT
  'Após Correções' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) as corretos,
  COUNT(CASE WHEN telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '' THEN 1 END) as ainda_problematicos
FROM patients;

-- Listar telefones que ainda têm problemas
SELECT
  'Ainda Problemáticos' as tipo,
  id,
  nome,
  telefone,
  CASE
    WHEN LENGTH(telefone) < 12 THEN 'Muito curto'
    WHEN LENGTH(telefone) > 13 THEN 'Muito longo'
    WHEN NOT telefone ~ '^55' THEN 'Sem código 55'
    WHEN telefone ~ '^55[0]' THEN 'DDD inválido'
    ELSE 'Outro'
  END as problema
FROM patients
WHERE telefone IS NOT NULL
  AND telefone != ''
  AND telefone !~ '^55[0-9]{10,11}$'
LIMIT 20;
