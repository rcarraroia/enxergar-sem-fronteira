
-- Migration: Create notification_templates table
-- Description: Add support for dynamic email and WhatsApp templates with admin-only access
-- Date: 2025-01-19

-- Create the notification_templates table
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
    subject TEXT,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE notification_templates IS 'Templates for email and WhatsApp notifications with dynamic variables';
COMMENT ON COLUMN notification_templates.name IS 'Unique identifier for the template (e.g., confirmacao_cadastro_email)';
COMMENT ON COLUMN notification_templates.type IS 'Type of notification: email or whatsapp';
COMMENT ON COLUMN notification_templates.subject IS 'Email subject line (required for email templates, optional for WhatsApp)';
COMMENT ON COLUMN notification_templates.content IS 'Template content with dynamic variables like {{patient_name}}';
COMMENT ON COLUMN notification_templates.is_active IS 'Whether the template is active and available for use';

-- Create indexes for performance
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX idx_notification_templates_name ON notification_templates(name);
CREATE INDEX idx_notification_templates_type_active ON notification_templates(type, is_active);

-- Enable Row Level Security
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admin-only access
CREATE POLICY "Admin users can manage notification templates" ON notification_templates
    FOR ALL USING (
        auth.jwt() ->> 'email' LIKE '%@admin.enxergar'
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_templates_updated_at();

-- Grant necessary permissions
GRANT ALL ON notification_templates TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
