-- ITEM 5: RLS habilitado nas tabelas críticas
SELECT 'RLS habilitado' as item,
       CONCAT(COUNT(*), ' de 6 tabelas') as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs')
AND rowsecurity = true;