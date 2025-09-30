-- Script de validação da migração
-- Execute este script para verificar se a migração pode ser aplicada com segurança

-- 1. Verificar se a tabela registrations existe
SELECT
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name = 'registrations';

-- 2. Verificar campos existentes na tabela registrations
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- 3. Verificar se os novos campos já existem (para evitar erro na migração)
SELECT
    column_name
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name IN (
    'attendance_confirmed',
    'attendance_confirmed_at',
    'purchased_glasses',
    'glasses_purchase_amount',
    'process_completed',
    'completed_at',
    'attended_by'
);

-- 4. Contar registros existentes (para backup)
SELECT COUNT(*) as total_registrations FROM registrations;

-- 5. Verificar se há inscrições recentes (últimas 24h)
SELECT COUNT(*) as recent_registrations
FROM registrations
WHERE created_at > NOW() - INTERVAL '24 hours';
