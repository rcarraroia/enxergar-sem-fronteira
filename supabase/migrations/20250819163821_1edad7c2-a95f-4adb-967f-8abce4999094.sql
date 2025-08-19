
-- Migration: Create reminder_jobs table for queue management
-- Description: Add table to track reminder sending jobs
-- Date: 2025-01-19

-- Create the reminder_jobs table
CREATE TABLE reminder_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    event_date_id UUID NOT NULL REFERENCES event_dates(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '48h', 'confirmation')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    email_sent BOOLEAN DEFAULT FALSE,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments
COMMENT ON TABLE reminder_jobs IS 'Queue for reminder notifications to be sent to patients';
COMMENT ON COLUMN reminder_jobs.reminder_type IS 'Type of reminder: 24h, 48h, or confirmation';
COMMENT ON COLUMN reminder_jobs.scheduled_for IS 'When the reminder should be sent';
COMMENT ON COLUMN reminder_jobs.sent_at IS 'When the reminder was actually sent';
COMMENT ON COLUMN reminder_jobs.status IS 'Current status of the reminder job';

-- Create indexes for performance
CREATE INDEX idx_reminder_jobs_status ON reminder_jobs(status);
CREATE INDEX idx_reminder_jobs_scheduled ON reminder_jobs(scheduled_for);
CREATE INDEX idx_reminder_jobs_patient ON reminder_jobs(patient_id);
CREATE INDEX idx_reminder_jobs_event_date ON reminder_jobs(event_date_id);
CREATE INDEX idx_reminder_jobs_type ON reminder_jobs(reminder_type);

-- Create composite indexes for common queries
CREATE INDEX idx_reminder_jobs_pending ON reminder_jobs(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_reminder_jobs_patient_event ON reminder_jobs(patient_id, event_date_id, reminder_type);

-- Enable Row Level Security
ALTER TABLE reminder_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admin access
CREATE POLICY "Admin users can manage reminder jobs" ON reminder_jobs
    FOR ALL USING (
        auth.jwt() ->> 'email' LIKE '%@admin.enxergar'
    );

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_reminder_jobs_updated_at
    BEFORE UPDATE ON reminder_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_templates_updated_at();

-- Grant permissions
GRANT ALL ON reminder_jobs TO authenticated;
