-- =====================================================
-- AUDITORIA DE CHAVES DE API NO BANCO DE DADOS
-- =====================================================
-- Identificar todas as chaves de API armazenadas no banco

-- 1. VERIFICAR CHAVES NA TABELA ORGANIZERS
SELECT 'AUDITORIA: Chaves de API na tabela organizers' as status;

SELECT 
    id,
    name,
    email,
    CASE 
        WHEN asaas_api_key IS NOT NULL AND asaas_api_key != '' 
        THEN 'SIM - ' || LEFT(asaas_api_key, 10) || '...' 
        ELSE 'NÃO' 
    END as tem_asaas_key,
    CASE 
        WHEN whatsapp_api_key IS NOT NULL AND whatsapp_api_key != '' 
        THEN 'SIM - ' || LEFT(whatsapp_api_key, 10) || '...' 
        ELSE 'NÃO' 
    END as tem_whatsapp_key,
    created_at
FROM organizers
WHERE asaas_api_key IS NOT NULL 
   OR whatsapp_api_key IS NOT NULL
ORDER BY created_at DESC;

-- 2. CONTAR TOTAL DE CHAVES ARMAZENADAS
SELECT 'CONTAGEM DE CHAVES ARMAZENADAS:' as status;

SELECT 
    'asaas_api_keys' as tipo_chave,
    COUNT(*) as total_chaves
FROM organizers 
WHERE asaas_api_key IS NOT NULL AND asaas_api_key != '';

SELECT 
    'whatsapp_api_keys' as tipo_chave,
    COUNT(*) as total_chaves
FROM organizers 
WHERE whatsapp_api_key IS NOT NULL AND whatsapp_api_key != '';

-- 3. VERIFICAR OUTRAS TABELAS QUE PODEM TER CHAVES
SELECT 'VERIFICANDO OUTRAS TABELAS:' as status;

-- Verificar se há chaves em system_settings
SELECT 
    key,
    CASE 
        WHEN key ILIKE '%api%' OR key ILIKE '%key%' OR key ILIKE '%secret%'
        THEN 'POSSÍVEL CHAVE: ' || LEFT(value::text, 50) || '...'
        ELSE 'OK'
    END as status_seguranca
FROM system_settings
WHERE key ILIKE '%api%' 
   OR key ILIKE '%key%' 
   OR key ILIKE '%secret%'
   OR key ILIKE '%token%';

-- 4. VERIFICAR COLUNAS COM NOMES SUSPEITOS
SELECT 'VERIFICANDO ESTRUTURA DAS TABELAS:' as status;

SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    column_name ILIKE '%api%' 
    OR column_name ILIKE '%key%' 
    OR column_name ILIKE '%secret%' 
    OR column_name ILIKE '%token%'
    OR column_name ILIKE '%password%'
)
ORDER BY table_name, column_name;

-- 5. RECOMENDAÇÕES DE SEGURANÇA
SELECT 'RECOMENDAÇÕES DE SEGURANÇA:' as status;

SELECT 
    'CRÍTICO: Mover chaves de API para variáveis de ambiente' as recomendacao,
    'As chaves encontradas devem ser movidas para .env e removidas do banco' as acao_necessaria;

SELECT 'AUDITORIA DE CHAVES CONCLUÍDA' as resultado;