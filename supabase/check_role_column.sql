-- ITEM 2: Coluna role em organizers
SELECT 'Coluna role em organizers' as item,
       CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NÃO EXISTE' END as status
FROM information_schema.columns 
WHERE table_name = 'organizers' AND column_name = 'role';