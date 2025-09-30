-- ⚠️ MIGRAÇÃO DE NÚMEROS DE TELEFONE PARA FORMATO INTERNACIONAL
-- ⚠️ EXECUTAR EM HORÁRIO DE BAIXO MOVIMENTO
-- ⚠️ BACKUP OBRIGATÓRIO ANTES DE EXECUTAR

-- ==================================================
-- FASE 1: BACKUP DE SEGURANÇA
-- ==================================================

-- 1. Criar backup da tabela patients
CREATE TABLE IF NOT EXISTS patients_backup_phone_migration AS
SELECT id, telefone, nome, email, created_at
FROM patients;

-- Verificar backup criado
SELECT
  COUNT(*) as total_backup,
  COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END) as com_telefone
FROM patients_backup_phone_migration;

-- ==================================================
-- FASE 2: ANÁLISE PRÉ-MIGRAÇÃO
-- ==================================================

-- Analisar situação atual dos telefones
SELECT
  'Análise Pré-Migração' as fase,
  COUNT(*) as total,
  COUNT(CASE WHEN telefone IS NULL OR telefone = '' THEN 1 END) as sem_telefone,
  COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) as ja_formatados,
  COUNT(CASE WHEN telefone !~ '^55' AND telefone IS NOT NULL AND telefone != '' THEN 1 END) as precisam_55,
  COUNT(CASE WHEN telefone ~ '[^0-9]' THEN 1 END) as com_formatacao
FROM patients;

-- Mostrar exemplos de telefones que serão alterados
SELECT
  'Exemplos que serão alterados' as tipo,
  telefone as telefone_atual,
  '55' || REGEXP_REPLACE(telefone, '[^0-9]', '', 'g') as telefone_novo
FROM patients
WHERE telefone IS NOT NULL
  AND telefone != ''
  AND NOT telefone ~ '^55'
LIMIT 10;

-- ==================================================
-- FASE 3: MIGRAÇÃO DOS DADOS
-- ==================================================

-- 3.1. Atualizar telefones que não começam com 55
UPDATE patients
SET
  telefone = '55' || REGEXP_REPLACE(telefone, '[^0-9]', '', 'g'),
  updated_at = NOW()
WHERE telefone IS NOT NULL
  AND telefone != ''
  AND NOT telefone ~ '^55';

-- 3.2. Limpar formatação de telefones que já têm 55
UPDATE patients
SET
  telefone = REGEXP_REPLACE(telefone, '[^0-9]', '', 'g'),
  updated_at = NOW()
WHERE telefone ~ '[^0-9]'
  AND telefone IS NOT NULL;

-- ==================================================
-- FASE 4: VALIDAÇÃO PÓS-MIGRAÇÃO
-- ==================================================

-- 4.1. Estatísticas gerais pós-migração
SELECT
  'Pós-Migração' as fase,
  COUNT(*) as total,
  COUNT(CASE WHEN telefone IS NULL OR telefone = '' THEN 1 END) as sem_telefone,
  COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) as formato_correto,
  COUNT(CASE WHEN telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '' THEN 1 END) as formato_incorreto,
  ROUND(
    COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END), 0),
    2
  ) as percentual_sucesso
FROM patients;

-- 4.2. Listar telefones com formato suspeito para revisão manual
SELECT
  'Telefones Suspeitos' as tipo,
  id,
  nome,
  telefone,
  CASE
    WHEN LENGTH(telefone) < 12 THEN 'Muito curto'
    WHEN LENGTH(telefone) > 13 THEN 'Muito longo'
    WHEN NOT telefone ~ '^55[1-9]' THEN 'DDD inválido'
    ELSE 'Outro problema'
  END as problema
FROM patients
WHERE telefone IS NOT NULL
  AND telefone != ''
  AND telefone !~ '^55[0-9]{10,11}$'
ORDER BY problema, nome
LIMIT 20;

-- 4.3. Comparação antes/depois (usando backup)
SELECT
  'Comparação' as tipo,
  p.id,
  p.nome,
  pb.telefone as telefone_original,
  p.telefone as telefone_migrado
FROM patients p
JOIN patients_backup_phone_migration pb ON p.id = pb.id
WHERE pb.telefone != p.telefone
  AND pb.telefone IS NOT NULL
ORDER BY p.nome
LIMIT 10;

-- ==================================================
-- FASE 5: CONSTRAINT DE VALIDAÇÃO (OPCIONAL)
-- ==================================================

-- Adicionar constraint para garantir formato correto no futuro
-- DESCOMENTE APENAS APÓS CONFIRMAR QUE A MIGRAÇÃO FOI BEM-SUCEDIDA

-- ALTER TABLE patients
-- ADD CONSTRAINT check_phone_format
-- CHECK (telefone IS NULL OR telefone ~ '^55[0-9]{10,11}$');

-- ==================================================
-- ROLLBACK (SE NECESSÁRIO)
-- ==================================================

-- SCRIPT DE ROLLBACK - EXECUTAR APENAS SE HOUVER PROBLEMAS
-- DESCOMENTE E EXECUTE APENAS SE NECESSÁRIO:

/*
-- Restaurar telefones do backup
UPDATE patients p
SET telefone = pb.telefone
FROM patients_backup_phone_migration pb
WHERE p.id = pb.id;

-- Verificar rollback
SELECT COUNT(*) as telefones_restaurados
FROM patients p
JOIN patients_backup_phone_migration pb ON p.id = pb.id
WHERE p.telefone = pb.telefone;
*/

-- ==================================================
-- LIMPEZA (APÓS 7 DIAS DE CONFIRMAÇÃO)
-- ==================================================

-- EXECUTAR APENAS APÓS 7 DIAS E CONFIRMAÇÃO DE QUE TUDO ESTÁ OK:
-- DROP TABLE patients_backup_phone_migration;
