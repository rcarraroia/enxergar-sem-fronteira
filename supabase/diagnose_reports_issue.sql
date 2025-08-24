-- Diagnóstico completo do problema de relatórios

-- 1. Verificar estrutura e dados das tabelas principais
SELECT 'DIAGNÓSTICO: Contagem de registros por tabela' as status;

SELECT 'events' as tabela, count(*) as total FROM events;
SELECT 'event_dates' as tabela, count(*) as total FROM event_dates;
SELECT 'registrations' as tabela, count(*) as total FROM registrations;
SELECT 'patients' as tabela, count(*) as total FROM patients;

-- 2. Verificar eventos existentes
SELECT 'DIAGNÓSTICO: Eventos existentes' as status;

SELECT 
  id,
  title,
  city,
  location,
  created_at,
  status
FROM events 
ORDER BY created_at DESC;

-- 3. Verificar datas de eventos
SELECT 'DIAGNÓSTICO: Datas de eventos' as status;

SELECT 
  ed.id,
  ed.date,
  ed.start_time,
  ed.total_slots,
  ed.available_slots,
  e.title,
  e.city
FROM event_dates ed
JOIN events e ON ed.event_id = e.id
ORDER BY ed.date DESC;

-- 4. Verificar registros/inscrições
SELECT 'DIAGNÓSTICO: Registros de inscrições' as status;

SELECT 
  r.id,
  r.status,
  r.created_at,
  p.nome,
  e.title,
  e.city,
  ed.date
FROM registrations r
JOIN patients p ON r.patient_id = p.id
JOIN event_dates ed ON r.event_date_id = ed.id
JOIN events e ON ed.event_id = e.id
ORDER BY r.created_at DESC
LIMIT 10;

-- 5. Verificar se há problemas de relacionamento
SELECT 'DIAGNÓSTICO: Registros órfãos' as status;

-- Registros sem paciente
SELECT 'registrations_sem_patient' as problema, count(*) as total
FROM registrations r
LEFT JOIN patients p ON r.patient_id = p.id
WHERE p.id IS NULL;

-- Registros sem event_date
SELECT 'registrations_sem_event_date' as problema, count(*) as total
FROM registrations r
LEFT JOIN event_dates ed ON r.event_date_id = ed.id
WHERE ed.id IS NULL;

-- Event_dates sem evento
SELECT 'event_dates_sem_event' as problema, count(*) as total
FROM event_dates ed
LEFT JOIN events e ON ed.event_id = e.id
WHERE e.id IS NULL;

-- 6. Verificar políticas RLS que podem estar bloqueando
SELECT 'DIAGNÓSTICO: Políticas RLS ativas' as status;

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

-- 7. Testar consulta exata do hook
SELECT 'DIAGNÓSTICO: Teste da consulta do hook' as status;

SELECT 
  r.id,
  r.status,
  r.created_at,
  r.updated_at,
  r.event_date_id,
  r.patient_id,
  p.id as patient_id_check,
  p.nome,
  p.email,
  p.telefone,
  ed.id as event_date_id_check,
  ed.date,
  ed.start_time,
  e.id as event_id_check,
  e.title,
  e.city
FROM registrations r
LEFT JOIN patients p ON r.patient_id = p.id
LEFT JOIN event_dates ed ON r.event_date_id = ed.id
LEFT JOIN events e ON ed.event_id = e.id
ORDER BY r.created_at DESC
LIMIT 5;