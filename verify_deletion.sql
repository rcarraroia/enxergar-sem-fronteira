-- VERIFICAR: Se o promoter foi realmente deletado
-- Execute para confirmar

SELECT 
    'VERIFICAÇÃO DE EXCLUSÃO' as info,
    COUNT(*) as total_promoters
FROM get_all_promoters();

-- Verificar se o Teste UID ainda existe
SELECT 
    'TESTE UID AINDA EXISTE?' as info,
    COUNT(*) as count
FROM get_all_promoters()
WHERE id = 'eefaf213-9773-4863-9e3d-8797172473f4';

-- Listar todos os promoters atuais
SELECT 
    'PROMOTERS ATUAIS' as info,
    name,
    email,
    id
FROM get_all_promoters()
ORDER BY created_at DESC;