-- =====================================================
-- LISTAR POLÍTICAS PERIGOSAS AINDA EXISTENTES
-- =====================================================

SELECT 
    tablename,
    policyname,
    cmd as operacao,
    qual as condicao,
    'POLÍTICA PERIGOSA' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND (
    policyname ILIKE '%public%reading%' OR 
    policyname ILIKE '%are public%' OR
    qual = 'true'
)
ORDER BY tablename, policyname;