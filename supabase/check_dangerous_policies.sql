-- ITEM 4: Políticas perigosas removidas
SELECT 'Políticas públicas perigosas' as item,
       CASE WHEN COUNT(*) = 0 THEN 'REMOVIDAS' ELSE CONCAT('AINDA EXISTEM: ', COUNT(*)) END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND (policyname ILIKE '%public%reading%' OR qual = 'true');