-- Corrige definitivamente a função get_registration_details com tipos corretos
-- Remove TIMESTAMPTZ e usa os tipos reais das colunas

DROP FUNCTION IF EXISTS get_registration_details(uuid);

CREATE OR REPLACE FUNCTION get_registration_details(reg_id UUID)
RETURNS TABLE (
  registration_id UUID,
  patient_id UUID,
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  patient_cpf TEXT,
  patient_birthdate DATE,
  event_id UUID,
  event_name TEXT,
  event_description TEXT,
  event_date_id UUID,
  event_date DATE,
  event_start_time TIME,
  event_end_time TIME,
  event_location TEXT,
  registration_status TEXT,
  registration_created_at TIMESTAMP,  -- Removido TZ
  attendance_confirmed BOOLEAN,
  attendance_confirmed_at TIMESTAMP,  -- Removido TZ
  purchased_glasses BOOLEAN,
  glasses_purchase_amount DECIMAL,
  process_completed BOOLEAN,
  completed_at TIMESTAMP,  -- Removido TZ
  attended_by TEXT,
  organizer_name TEXT,
  organizer_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    p.id,
    p.nome,
    p.email,
    p.telefone,
    p.cpf,
    p.data_nascimento,
    e.id,
    e.title,
    e.description,
    ed.id,
    ed.date,
    ed.start_time,
    ed.end_time,
    e.location,
    r.status,
    r.created_at::TIMESTAMP,  -- Cast para TIMESTAMP sem TZ
    r.attendance_confirmed,
    r.attendance_confirmed_at::TIMESTAMP,  -- Cast para TIMESTAMP sem TZ
    r.purchased_glasses,
    r.glasses_purchase_amount,
    r.process_completed,
    r.completed_at::TIMESTAMP,  -- Cast para TIMESTAMP sem TZ
    r.attended_by,
    o.name,
    o.email
  FROM registrations r
  JOIN patients p ON r.patient_id = p.id
  JOIN event_dates ed ON r.event_date_id = ed.id
  JOIN events e ON ed.event_id = e.id
  LEFT JOIN organizers o ON e.organizer_id = o.id
  WHERE r.id = reg_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_registration_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_registration_details(UUID) TO anon;

-- Também corrige a função get_reminder_registrations se ela existir
DROP FUNCTION IF EXISTS get_reminder_registrations();

CREATE OR REPLACE FUNCTION get_reminder_registrations()
RETURNS TABLE (
    registration_id UUID,
    patient_name TEXT,
    phone TEXT,
    date DATE,
    start_time TIME,
    event_name TEXT,
    event_location TEXT,
    hours_until_event INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as registration_id,
        p.nome as patient_name,
        p.telefone as phone,
        ed.date,
        ed.start_time,
        e.title as event_name,
        e.location as event_location,
        EXTRACT(HOUR FROM (ed.date + ed.start_time - NOW()))::INTEGER as hours_until_event
    FROM registrations r
    JOIN patients p ON r.patient_id = p.id
    JOIN event_dates ed ON r.event_date_id = ed.id
    JOIN events e ON ed.event_id = e.id
    WHERE ed.date + ed.start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
       OR ed.date + ed.start_time BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '70 minutes';
END;
$$ LANGUAGE plpgsql;
