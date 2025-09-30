-- SCRIPT DE VALIDAÇÃO PÓS-MIGRAÇÃO DE TELEFONES
-- Execute este script após a migração para verificar os resultados

-- ==================================================
-- RELATÓRIO COMPLETO DE VALIDAÇÃO
-- ==================================================

-- 1. Estatísticas Gerais
SELECT
  '=== ESTATÍSTICAS GERAIS ===' as secao,
  '' as detalhe,
  '' as valor;

SELECT
  'Total de pacientes' as detalhe,
  COUNT(*)::text as valor
FROM patients
UNION ALL
SELECT
  'Com telefone preenchido' as detalhe,
  COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END)::text as valor
FROM patients
UNION ALL
SELECT
  'Formato correto (55DDDNNNNNNNNN)' as detalhe,
  COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END)::text as valor
FROM patients
UNION ALL
SELECT
  'Taxa de sucesso' as detalhe,
  COALESCE(
    ROUND(
      COUNT(CASE WHEN telefone ~ '^55[0-9]{10,11}$' THEN 1 END) * 100.0 /
      NULLIF(COUNT(CASE WHEN telefone IS NOT NULL AND telefone != '' THEN 1 END), 0),
      2
    )::text || '%',
    '0%'
  ) as valor
FROM patients;

-- 2. Análise por Tipo de Telefone
SELECT
  '=== ANÁLISE POR TIPO ===' as secao,
  '' as detalhe,
  '' as valor;

SELECT
  'Celulares (9 dígitos após DDD)' as detalhe,
  COUNT(CASE WHEN telefone ~ '^55[1-9]{2}9[0-9]{8}$' THEN 1 END)::text as valor
FROM patients
UNION ALL
SELECT
  'Fixos (8 dígitos após DDD)' as detalhe,
  COUNT(CASE WHEN telefone ~ '^55[1-9]{2}[2-8][0-9]{7}$' THEN 1 END)::text as valor
FROM patients;

-- 3. Problemas Identificados
SELECT
  '=== PROBLEMAS IDENTIFICADOS ===' as secao,
  '' as problema,
  '' as quantidade;

SELECT
  'Telefones muito curtos (< 12 dígitos)' as problema,
  COUNT(CASE WHEN LENGTH(telefone) < 12 AND telefone IS NOT NULL AND telefone != '' THEN 1 END)::text as quantidade
FROM patients
UNION ALL
SELECT
  'Telefones muito longos (> 13 dígitos)' as problema,
  COUNT(CASE WHEN LENGTH(telefone) > 13 AND telefone IS NOT NULL THEN 1 END)::text as quantidade
FROM patients
UNION ALL
SELECT
  'Não começam com 55' as problema,
  COUNT(CASE WHEN telefone !~ '^55' AND telefone IS NOT NULL AND telefone != '' THEN 1 END)::text as quantidade
FROM patients
UNION ALL
SELECT
  'DDD inválido (começa com 0)' as problema,
  COUNT(CASE WHEN telefone ~ '^55[0][0-9]' THEN 1 END)::text as quantidade
FROM patients
UNION ALL
SELECT
  'Contém caracteres não numéricos' as problema,
  COUNT(CASE WHEN telefone ~ '[^0-9]' AND telefone IS NOT NULL THEN 1 END)::text as quantidade
FROM patients;

-- 4. Exemplos de Telefones Problemáticos
SELECT
  '=== TELEFONES PROBLEMÁTICOS ===' as secao,
  '' as id,
  '' as nome,
  '' as telefone,
  '' as problema;

SELECT
  'Exemplo' as secao,
  id::text,
  COALESCE(nome, 'N/A') as nome,
  COALESCE(telefone, 'NULL') as telefone,
  CASE
    WHEN telefone IS NULL OR telefone = '' THEN 'Vazio'
    WHEN LENGTH(telefone) < 12 THEN 'Muito curto'
    WHEN LENGTH(telefone) > 13 THEN 'Muito longo'
    WHEN NOT telefone ~ '^55' THEN 'Sem código 55'
    WHEN telefone ~ '^55[0]' THEN 'DDD inválido'
    WHEN telefone ~ '[^0-9]' THEN 'Caracteres inválidos'
    ELSE 'Outro problema'
  END as problema
FROM patients
WHERE telefone IS NULL
   OR telefone = ''
   OR telefone !~ '^55[0-9]{10,11}$'
ORDER BY
  CASE
    WHEN telefone IS NULL OR telefone = '' THEN 1
    WHEN LENGTH(telefone) < 12 THEN 2
    WHEN LENGTH(telefone) > 13 THEN 3
    WHEN NOT telefone ~ '^55' THEN 4
    WHEN telefone ~ '^55[0]' THEN 5
    ELSE 6
  END,
  nome
LIMIT 10;

-- 5. Comparação com Backup (se existir)
SELECT
  '=== COMPARAÇÃO COM BACKUP ===' as secao,
  '' as metrica,
  '' as valor;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients_backup_phone_migration') THEN
    -- Tabela de backup existe, fazer comparação
    PERFORM 1;
  ELSE
    -- Tabela de backup não existe
    INSERT INTO temp_results VALUES ('Backup não encontrado', 'Não é possível comparar', '');
  END IF;
END $$;

-- Comparação detalhada (só executa se backup existir)
SELECT
  'Registros alterados' as metrica,
  COUNT(*)::text as valor
FROM patients p
JOIN patients_backup_phone_migration pb ON p.id = pb.id
WHERE p.telefone != pb.telefone
  AND pb.telefone IS NOT NULL
UNION ALL
SELECT
  'Registros inalterados' as metrica,
  COUNT(*)::text as valor
FROM patients p
JOIN patients_backup_phone_migration pb ON p.id = pb.id
WHERE p.telefone = pb.telefone
  OR (p.telefone IS NULL AND pb.telefone IS NULL);

-- 6. Exemplos de Transformações Bem-Sucedidas
SELECT
  '=== TRANSFORMAÇÕES BEM-SUCEDIDAS ===' as secao,
  '' as original,
  '' as transformado,
  '' as nome;

SELECT
  'Exemplo' as secao,
  COALESCE(pb.telefone, 'N/A') as original,
  COALESCE(p.telefone, 'N/A') as transformado,
  COALESCE(p.nome, 'N/A') as nome
FROM patients p
JOIN patients_backup_phone_migration pb ON p.id = pb.id
WHERE p.telefone != pb.telefone
  AND p.telefone ~ '^55[0-9]{10,11}$'
  AND pb.telefone IS NOT NULL
ORDER BY p.nome
LIMIT 5;

-- 7. Recomendações
SELECT
  '=== RECOMENDAÇÕES ===' as secao,
  '' as recomendacao;

SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM patients WHERE telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '') = 0
    THEN '✅ Migração bem-sucedida! Todos os telefones estão no formato correto.'
    WHEN (SELECT COUNT(*) FROM patients WHERE telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '') < 10
    THEN '⚠️ Migração quase completa. Revisar manualmente os poucos casos problemáticos.'
    ELSE '❌ Migração com problemas. Revisar e corrigir telefones problemáticos antes de prosseguir.'
  END as recomendacao;

-- 8. Próximos Passos
SELECT
  '=== PRÓXIMOS PASSOS ===' as secao,
  '' as passo;

SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM patients WHERE telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '') = 0
    THEN '1. ✅ Testar envio de WhatsApp com alguns números'
    ELSE '1. ❌ Corrigir telefones problemáticos primeiro'
  END as passo
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM patients WHERE telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '') = 0
    THEN '2. ✅ Monitorar taxa de sucesso por 48h'
    ELSE '2. ❌ Re-executar migração após correções'
  END as passo
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM patients WHERE telefone !~ '^55[0-9]{10,11}$' AND telefone IS NOT NULL AND telefone != '') = 0
    THEN '3. ✅ Considerar adicionar constraint de validação'
    ELSE '3. ❌ Validar novamente após correções'
  END as passo
UNION ALL
SELECT '4. 📋 Manter backup por 7 dias' as passo;
