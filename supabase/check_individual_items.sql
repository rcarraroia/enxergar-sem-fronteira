-- =====================================================
-- VERIFICAÇÃO INDIVIDUAL DOS ITENS DE SEGURANÇA
-- =====================================================

-- ITEM 1: Função is_admin_user()
SELECT 'Função is_admin_user()' as item, 
       CASE WHEN COUNT(*) > 0 THEN 'CRIADA' ELSE 'NÃO EXISTE' END as status
FROM pg_proc WHERE proname = 'is_admin_user';