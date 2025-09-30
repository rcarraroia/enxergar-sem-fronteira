-- CORREÇÃO ESPECÍFICA DOS TELEFONES PROBLEMÁTICOS IDENTIFICADOS
-- Baseado na análise dos dados reais

-- Backup dos registros que serão alterados
CREATE TABLE IF NOT EXISTS patients_backup_specific_fixes AS
SELECT id, telefone, nome
FROM patients
WHERE id IN (
  '87f67a2b-72dc-4ed4-b930-7b2e14e2def2',
  '0b4efbef-4611-42ed-858a-98acb629294a',
  'bd899d72-6fc0-419f-a404-ff3aaa98abed',
  'f6cbdb19-87f5-4c80-80b6-cb2d6615c7f7',
  '7862e372-ed94-4192-a63f-df39cf4769fc',
  'ffe924b9-8243-467f-ae7c-a0da9a72acea',
  '88b181f8-4c7e-4aeb-b738-746b61baa85e',
  'b86d93b8-e44c-4e57-b069-36a4a242f280',
  '39b08a7e-8ed2-4e16-b6be-dee4c5fd9719',
  'bbc18c12-1d6e-426c-aa9c-faabf3a9d2f2',
  '5ac81c7c-c64a-4046-920f-215a1800d4f7',
  '820c3631-fac5-458e-b370-1fb41a974d50'
);

-- Mostrar situação atual
SELECT 'ANTES DA CORREÇÃO' as status, id, nome, telefone, LENGTH(telefone) as tamanho
FROM patients
WHERE id IN (
  '87f67a2b-72dc-4ed4-b930-7b2e14e2def2',
  '0b4efbef-4611-42ed-858a-98acb629294a',
  'bd899d72-6fc0-419f-a404-ff3aaa98abed',
  'f6cbdb19-87f5-4c80-80b6-cb2d6615c7f7',
  '7862e372-ed94-4192-a63f-df39cf4769fc',
  'ffe924b9-8243-467f-ae7c-a0da9a72acea',
  '88b181f8-4c7e-4aeb-b738-746b61baa85e',
  'b86d93b8-e44c-4e57-b069-36a4a242f280',
  '39b08a7e-8ed2-4e16-b6be-dee4c5fd9719',
  'bbc18c12-1d6e-426c-aa9c-faabf3a9d2f2',
  '5ac81c7c-c64a-4046-920f-215a1800d4f7',
  '820c3631-fac5-458e-b370-1fb41a974d50'
)
ORDER BY LENGTH(telefone), nome;

-- ==================================================
-- CORREÇÕES ESPECÍFICAS
-- ==================================================

-- 1. TELEFONE MUITO CURTO (Maria José Sampaio: 55995139655)
-- Parece que falta o DDD. Assumindo DDD 31 (padrão da região)
UPDATE patients
SET telefone = '5531' || SUBSTRING(telefone FROM 3)
WHERE id = '87f67a2b-72dc-4ed4-b930-7b2e14e2def2'
  AND telefone = '55995139655';

-- 2. TELEFONES MUITO LONGOS - Remover dígitos extras
-- Padrão: manter apenas os primeiros 13 dígitos (55 + DDD + 9 dígitos)

-- Albertina da Silva Roque: 55319962288189 → 5531996228818 (remover últimos 2)
UPDATE patients
SET telefone = LEFT(telefone, 13)
WHERE id = '0b4efbef-4611-42ed-858a-98acb629294a'
  AND LENGTH(telefone) > 13;

-- Arquimedes Batista: 55031988232890 → 5503198823289 (remover último)
-- Mas tem DDD 03 que é inválido, corrigir para 31
UPDATE patients
SET telefone = '5531' || SUBSTRING(telefone FROM 5, 9)
WHERE id = 'bd899d72-6fc0-419f-a404-ff3aaa98abed'
  AND telefone LIKE '55031%';

-- Celia Maria: 55319997792516 → 5531999779251 (remover último)
UPDATE patients
SET telefone = LEFT(telefone, 13)
WHERE id = 'f6cbdb19-87f5-4c80-80b6-cb2d6615c7f7'
  AND LENGTH(telefone) > 13;

-- Eudes Bandeira: 555531987034429 → 5531987034429 (remover 55 duplicado)
UPDATE patients
SET telefone = SUBSTRING(telefone FROM 3)
WHERE id = '7862e372-ed94-4192-a63f-df39cf4769fc'
  AND telefone LIKE '5555%';

-- Isaque Vieira: 55031999498681 → 5531999498681 (corrigir DDD 03→31)
UPDATE patients
SET telefone = '5531' || SUBSTRING(telefone FROM 5)
WHERE id = 'ffe924b9-8243-467f-ae7c-a0da9a72acea'
  AND telefone LIKE '55031%';

-- Jussara Dutra: 55031986012437 → 5531986012437 (corrigir DDD 03→31)
UPDATE patients
SET telefone = '5531' || SUBSTRING(telefone FROM 5)
WHERE id = '88b181f8-4c7e-4aeb-b738-746b61baa85e'
  AND telefone LIKE '55031%';

-- Luciene Batista: 55031999124986 → 5531999124986 (corrigir DDD 03→31)
UPDATE patients
SET telefone = '5531' || SUBSTRING(telefone FROM 5)
WHERE id = 'b86d93b8-e44c-4e57-b069-36a4a242f280'
  AND telefone LIKE '55031%';

-- Renato Carraro: 555533998384177 → 5533998384177 (remover 55 duplicado)
UPDATE patients
SET telefone = SUBSTRING(telefone FROM 3)
WHERE id = '39b08a7e-8ed2-4e16-b6be-dee4c5fd9719'
  AND telefone LIKE '5555%';

-- RENATO MAGNO: 555533998384177 → 5533998384177 (remover 55 duplicado)
UPDATE patients
SET telefone = SUBSTRING(telefone FROM 3)
WHERE id = 'bbc18c12-1d6e-426c-aa9c-faabf3a9d2f2'
  AND telefone LIKE '5555%';

-- Selma Andrade: 55319988290664 → 5531998829066 (remover último)
UPDATE patients
SET telefone = LEFT(telefone, 13)
WHERE id = '5ac81c7c-c64a-4046-920f-215a1800d4f7'
  AND LENGTH(telefone) > 13;

-- Yan Henrique: 55031989315155 → 5531989315155 (corrigir DDD 03→31)
UPDATE patients
SET telefone = '5531' || SUBSTRING(telefone FROM 5)
WHERE id = '820c3631-fac5-458e-b370-1fb41a974d50'
  AND telefone LIKE '55031%';

-- ==================================================
-- VALIDAÇÃO PÓS-CORREÇÃO
-- ==================================================

-- Mostrar situação após correção
SELECT 'APÓS CORREÇÃO' as status, id, nome, telefone, LENGTH(telefone) as tamanho,
  CASE
    WHEN telefone ~ '^55[0-9]{10,11}$' THEN '✅ Válido'
    ELSE '❌ Ainda inválido'
  END as validacao
FROM patients
WHERE id IN (
  '87f67a2b-72dc-4ed4-b930-7b2e14e2def2',
  '0b4efbef-4611-42ed-858a-98acb629294a',
  'bd899d72-6fc0-419f-a404-ff3aaa98abed',
  'f6cbdb19-87f5-4c80-80b6-cb2d6615c7f7',
  '7862e372-ed94-4192-a63f-df39cf4769fc',
  'ffe924b9-8243-467f-ae7c-a0da9a72acea',
  '88b181f8-4c7e-4aeb-b738-746b61baa85e',
  'b86d93b8-e44c-4e57-b069-36a4a242f280',
  '39b08a7e-8ed2-4e16-b6be-dee4c5fd9719',
  'bbc18c12-1d6e-426c-aa9c-faabf3a9d2f2',
  '5ac81c7c-c64a-4046-920f-215a1800d4f7',
  '820c3631-fac5-458e-b370-1fb41a974d50'
)
ORDER BY validacao, nome;

-- Comparação antes/depois
SELECT
  'COMPARAÇÃO' as tipo,
  p.nome,
  pb.telefone as antes,
  p.telefone as depois,
  CASE
    WHEN p.telefone ~ '^55[0-9]{10,11}$' THEN '✅'
    ELSE '❌'
  END as status
FROM patients p
JOIN patients_backup_specific_fixes pb ON p.id = pb.id
ORDER BY status DESC, p.nome;

-- Estatística final
SELECT
  'RESULTADO FINAL' as tipo,
  COUNT(*) as total_corrigidos,
  COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) as validos,
  COUNT(CASE WHEN telefone !~ '^55[0-9]{10,11}$' THEN 1 END) as ainda_invalidos,
  ROUND(
    COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) * 100.0 / COUNT(*),
    1
  ) || '%' as taxa_sucesso
FROM patients
WHERE id IN (
  '87f67a2b-72dc-4ed4-b930-7b2e14e2def2',
  '0b4efbef-4611-42ed-858a-98acb629294a',
  'bd899d72-6fc0-419f-a404-ff3aaa98abed',
  'f6cbdb19-87f5-4c80-80b6-cb2d6615c7f7',
  '7862e372-ed94-4192-a63f-df39cf4769fc',
  'ffe924b9-8243-467f-ae7c-a0da9a72acea',
  '88b181f8-4c7e-4aeb-b738-746b61baa85e',
  'b86d93b8-e44c-4e57-b069-36a4a242f280',
  '39b08a7e-8ed2-4e16-b6be-dee4c5fd9719',
  'bbc18c12-1d6e-426c-aa9c-faabf3a9d2f2',
  '5ac81c7c-c64a-4046-920f-215a1800d4f7',
  '820c3631-fac5-458e-b370-1fb41a974d50'
);
