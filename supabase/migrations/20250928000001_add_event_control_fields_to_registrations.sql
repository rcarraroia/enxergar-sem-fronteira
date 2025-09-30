-- Migration: Add event control fields to registrations table
-- Date: 2025-09-28
-- Purpose: Add fields for event control interface (attendance, glasses purchase, process completion)
-- SAFE FOR PRODUCTION: Only adds new fields with default values, no RLS/policies/triggers

-- Create backup table structure (safety measure)
CREATE TABLE IF NOT EXISTS registrations_backup_20250928 AS
SELECT * FROM registrations LIMIT 0;

-- Add new fields to registrations table
-- Using IF NOT EXISTS to prevent errors if fields already exist
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS purchased_glasses BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS glasses_purchase_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS process_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS attended_by VARCHAR(255);

-- Create simple indexes for performance (safe for production)
CREATE INDEX IF NOT EXISTS idx_registrations_attendance_confirmed
ON registrations(attendance_confirmed);

CREATE INDEX IF NOT EXISTS idx_registrations_purchased_glasses
ON registrations(purchased_glasses);

CREATE INDEX IF NOT EXISTS idx_registrations_process_completed
ON registrations(process_completed);

-- Add comments for documentation
COMMENT ON COLUMN registrations.attendance_confirmed IS 'Whether patient attended the event';
COMMENT ON COLUMN registrations.attendance_confirmed_at IS 'Timestamp when attendance was confirmed';
COMMENT ON COLUMN registrations.purchased_glasses IS 'Whether patient purchased glasses';
COMMENT ON COLUMN registrations.glasses_purchase_amount IS 'Amount paid for glasses in BRL';
COMMENT ON COLUMN registrations.process_completed IS 'Whether the entire process is completed';
COMMENT ON COLUMN registrations.completed_at IS 'Timestamp when process was completed';
COMMENT ON COLUMN registrations.attended_by IS 'Name of staff member who handled the patient';
