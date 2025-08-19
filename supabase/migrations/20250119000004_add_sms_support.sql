-- Add SMS support to notification templates
-- This migration adds SMS as a supported template type and creates default SMS templates

-- Update the type constraint to include SMS
ALTER TABLE notification_templates 
DROP CONSTRAINT IF EXISTS notification_templates_type_check;

ALTER TABLE notification_templates 
ADD CONSTRAINT notification_templates_type_check 
CHECK (type IN ('email', 'whatsapp', 'sms'));

-- Insert default SMS templates
INSERT INTO notification_templates (name, type, content, is_active, created_at, updated_at) VALUES
-- SMS Reminder 24h
('lembrete_sms_24h', 'sms', 
'🔔 ENXERGAR: Olá {{patient_name}}! Lembrete: você tem atendimento AMANHÃ ({{event_date}}) às {{event_time}} em {{event_location}}. Chegue 30min antes. Endereço: {{event_address}}', 
true, NOW(), NOW()),

-- SMS Reminder 48h
('lembrete_sms_48h', 'sms',
'🔔 ENXERGAR: Olá {{patient_name}}! Lembrete: você tem atendimento em 2 DIAS ({{event_date}}) às {{event_time}} em {{event_location}}. Anote: {{event_address}}. Chegue 30min antes!',
true, NOW(), NOW()),

-- SMS Confirmation
('confirmacao_sms', 'sms',
'✅ ENXERGAR: {{patient_name}}, sua inscrição foi CONFIRMADA! {{event_title}} em {{event_date}} às {{event_time}}. Local: {{event_location}} - {{event_address}}. Chegue 30min antes. Até lá!',
true, NOW(), NOW()),

-- SMS Cancellation
('cancelamento_sms', 'sms',
'❌ ENXERGAR: {{patient_name}}, sua inscrição para {{event_title}} em {{event_date}} foi CANCELADA. Para reagendar, entre em contato conosco. Obrigado!',
true, NOW(), NOW())

ON CONFLICT (name) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- Create index for SMS templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_sms 
ON notification_templates(type, is_active) 
WHERE type = 'sms';

-- Update system settings to track SMS usage
INSERT INTO system_settings (key, value, description, created_at, updated_at) VALUES
('sms_enabled', 'true', 'Whether SMS notifications are enabled', NOW(), NOW()),
('sms_provider', 'vonage', 'SMS provider being used (vonage, twilio, etc)', NOW(), NOW()),
('last_sms_sent', '{}', 'Last SMS sent timestamp and details', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Add comment to table
COMMENT ON COLUMN notification_templates.type IS 'Type of notification: email, whatsapp, or sms';