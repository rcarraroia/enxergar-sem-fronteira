-- Verificar políticas RLS das tabelas usadas nos relatórios
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('registrations', 'patients', 'event_dates', 'events') 
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('registrations', 'patients', 'event_dates', 'events')
  AND schemaname = 'public';

-- Testar acesso direto às tabelas
SELECT 'registrations' as table_name, count(*) as total FROM registrations;
SELECT 'patients' as table_name, count(*) as total FROM patients;
SELECT 'event_dates' as table_name, count(*) as total FROM event_dates;
SELECT 'events' as table_name, count(*) as total FROM events;