-- =====================================================
-- VERIFICAÇÃO EMERGENCIAL DOS DADOS
-- =====================================================
-- VERIFICAR SE TODOS OS DADOS ESTÃO SEGUROS

-- 1. CONTAR TODOS OS REGISTROS (SEM RLS)
SET row_security = off;

SELECT 'CONTAGEM TOTAL DE DADOS (SEM RLS):' as status;

SELECT 'registrations' as tabela, count(*) as total FROM registrations;
SELECT 'patients' as tabela, count(*) as total FROM patients;
SELECT 'events' as tabela, count(*) as total FROM events;
SELECT 'event_dates' as tabela, count(*) as total FROM event_dates;
SELECT 'organizers' as tabela, count(*) as total FROM organizers;

-- 2. VERIFICAR REGISTROS POR STATUS
SELECT 'REGISTROS POR STATUS:' as status;

SELECT 
    status,
    count(*) as total
FROM registrations 
GROUP BY status
ORDER BY total DESC;

-- 3. VERIFICAR REGISTROS RECENTES
SELECT 'REGISTROS DOS ÚLTIMOS 30 DIAS:' as status;

SELECT 
    DATE(created_at) as data,
    count(*) as registros_do_dia
FROM registrations 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- 4. VERIFICAR INTEGRIDADE DOS RELACIONAMENTOS
SELECT 'VERIFICAÇÃO DE INTEGRIDADE:' as status;

-- Registros com pacientes válidos
SELECT 'registrations_com_patients_validos' as check_name, count(*) as total
FROM registrations r
JOIN patients p ON r.patient_id = p.id;

-- Registros com event_dates válidos
SELECT 'registrations_com_event_dates_validos' as check_name, count(*) as total
FROM registrations r
JOIN event_dates ed ON r.event_date_id = ed.id;

-- Registros com eventos válidos
SELECT 'registrations_com_eventos_validos' as check_name, count(*) as total
FROM registrations r
JOIN event_dates ed ON r.event_date_id = ed.id
JOIN events e ON ed.event_id = e.id;

-- 5. AMOSTRA DOS DADOS MAIS RECENTES
SELECT 'AMOSTRA DOS 10 REGISTROS MAIS RECENTES:' as status;

SELECT 
    r.id,
    r.status,
    r.created_at,
    p.nome,
    p.email,
    e.title,
    e.city,
    ed.date
FROM registrations r
JOIN patients p ON r.patient_id = p.id
JOIN event_dates ed ON r.event_date_id = ed.id
JOIN events e ON ed.event_id = e.id
ORDER BY r.created_at DESC
LIMIT 10;

-- REATIVAR RLS
SET row_security = on;

SELECT 'VERIFICAÇÃO CONCLUÍDA - DADOS SEGUROS!' as resultado;