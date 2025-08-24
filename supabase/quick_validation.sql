-- =====================================================
-- VALIDAÇÃO RÁPIDA DAS CORREÇÕES DE SEGURANÇA
-- =====================================================

-- 1. Verificar se a função is_admin_user() foi criada
SELECT 'Função is_admin_user()' as item, 
       CASE WHEN COUNT(*) > 0 THEN '✅ CRIADA' ELSE '❌ NÃO EXISTE' END as status
FROM pg_proc WHERE proname = 'is_admin_user';

-- 2. Verificar se a coluna role foi adicionada
SELECT 'Coluna role em organizers' as item,
       CASE WHEN COUNT(*) > 0 THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
FROM information_schema.columns 
WHERE table_name = 'organizers' AND column_name = 'role';

-- 3. Verificar usuários admin
SELECT 'Usuários com role admin' as item,
       CONCAT(COUNT(*), ' usuários') as status
FROM public.organizers WHERE role = 'admin';

-- 4. Verificar se políticas perigosas foram removidas
SELECT 'Políticas públicas perigosas' as item,
       CASE WHEN COUNT(*) = 0 THEN '✅ REMOVIDAS' ELSE CONCAT('❌ AINDA EXISTEM: ', COUNT(*)) END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND (policyname ILIKE '%public%reading%' OR qual = 'true');

-- 5. Verificar RLS habilitado nas tabelas críticas
SELECT 'RLS habilitado' as item,
       CONCAT(COUNT(*), ' de 6 tabelas') as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs')
AND rowsecurity = true;

-- 6. Verificar log da migração
SELECT 'Log da migração' as item,
       CASE WHEN COUNT(*) > 0 THEN '✅ REGISTRADO' ELSE '❌ NÃO ENCONTRADO' END as status
FROM public.system_settings 
WHERE key = 'critical_rls_security_fixes';