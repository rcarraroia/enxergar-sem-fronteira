-- TESTE: Verificar promoters atuais
-- Execute para ver se o novo promoter foi criado

SELECT 
    'PROMOTERS ATUAIS' as info,
    name,
    email,
    status,
    created_at
FROM get_all_promoters()
ORDER BY created_at DESC
LIMIT 10;