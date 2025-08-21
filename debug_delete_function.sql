-- DEBUG: Testar a função de delete diretamente
-- Execute para ver o que está acontecendo

-- Testar a função diretamente com o ID que "foi deletado"
SELECT 
    'TESTE DIRETO DA FUNÇÃO' as info,
    admin_delete_organizer('eefaf213-9773-4863-9e3d-8797172473f4') as result;

-- Se der erro, vamos ver os detalhes
-- Verificar se a função existe
SELECT 
    'FUNÇÃO EXISTE?' as info,
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'admin_delete_organizer';

-- Verificar se há políticas RLS bloqueando DELETE
SELECT 
    'POLÍTICAS DELETE' as info,
    policyname,
    cmd,
    with_check,
    qual
FROM pg_policies 
WHERE tablename = 'organizers' AND cmd = 'DELETE';