-- Testar acesso aos dados necessários para relatórios
-- Simular consulta do hook useRegistrationsFiltered

-- 1. Testar acesso básico às tabelas
SELECT 'Testando acesso às tabelas...' as status;

-- Contar registros em cada tabela
SELECT 'registrations' as tabela, count(*) as total FROM registrations;
SELECT 'patients' as tabela, count(*) as total FROM patients;
SELECT 'event_dates' as tabela, count(*) as total FROM event_dates;
SELECT 'events' as tabela, count(*) as total FROM events;

-- 2. Testar a consulta completa do hook
SELECT 'Testando consulta completa...' as status;

SELECT 
  r.id,
  r.status,
  r.created_at,
  r.updated_at,
  r.event_date_id,
  p.id as patient_id,
  p.nome,
  p.email,
  p.telefone,
  p.data_nascimento,
  p.diagnostico,
  ed.id as event_date_id,
  ed.date,
  ed.start_time,
  ed.end_time,
  ed.total_slots,
  ed.available_slots,
  e.id as event_id,
  e.title,
  e.location,
  e.city,
  e.address
FROM registrations r
JOIN patients p ON r.patient_id = p.id
JOIN event_dates ed ON r.event_date_id = ed.id
JOIN events e ON ed.event_id = e.id
ORDER BY r.created_at DESC
LIMIT 5;

-- 3. Testar cidades únicas
SELECT 'Testando cidades únicas...' as status;

SELECT DISTINCT city 
FROM events 
WHERE city IS NOT NULL AND city != '' 
ORDER BY city;

-- 4. Verificar se há dados recentes
SELECT 'Verificando dados recentes...' as status;

SELECT 
  'registrations' as tabela,
  count(*) as total,
  max(created_at) as ultimo_registro
FROM registrations
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

SELECT 
  'events' as tabela,
  count(*) as total,
  max(created_at) as ultimo_evento
FROM events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';