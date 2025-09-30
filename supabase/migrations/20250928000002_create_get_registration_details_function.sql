-- Migration: Create get_registration_details function
-- Date: 2025-09-28
-- Purpose: Create function to get complete registration details for webhook integration

-- Create function to get registration details with all related data
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
  registration_created_at TIMESTAMP,
  attendance_confirmed BOOLEAN,
  attendance_confirmed_at TIMESTAMP,
  purchased_glasses BOOLEAN,
  glasses_purchase_amount DECIMAL,
  process_completed BOOLEAN,
  completed_at TIMESTAMP,
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
    r.id as registration_id,
    p.id as patient_id,
    p.nome as patient_name,
    p.email as patient_email,
    p.telefone as patient_phone,
    p.cpf as patient_cpf,
    p.data_nascimento as patient_birthdate,
    e.id as event_id,
    e.name as event_name,
    e.description as event_description,
    ed.id as event_date_id,
    ed.date as event_date,
    ed.start_time as event_start_time,
    ed.end_time as event_end_time,
    e.location as event_location,
    r.status as registration_status,
    r.created_at as registration_created_at,
    r.attendance_confirmed,
    r.attendance_confirmed_at,
    r.purchased_glasses,
    r.glasses_purchase_amount,
    r.process_completed,
    r.completed_at,
    r.attended_by,
    o.name as organizer_name,
    o.email as organizer_email
  FROM registrations r
  JOIN patients p ON r.patient_id = p.id
  JOIN event_dates ed ON r.event_date_id = ed.id
  JOIN events e ON ed.event_id = e.id
  LEFT JOIN organizers o ON e.organizer_id = o.id
  WHERE r.id = reg_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_registration_details(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_registration_details(UUID) IS 'Returns complete registration details including patient, event, and organizer information for webhook integration';
