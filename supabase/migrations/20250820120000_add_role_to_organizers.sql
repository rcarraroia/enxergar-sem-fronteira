-- Migration: Add role field to organizers table for secure role management
-- Description: Fixes critical security vulnerability by moving role determination from email pattern to database
-- Date: 2025-08-20
-- Priority: CRITICAL SECURITY FIX

-- Add role column to organizers table
ALTER TABLE public.organizers 
ADD COLUMN role text DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer'));

-- Add comment for documentation
COMMENT ON COLUMN public.organizers.role IS 'User role: admin or organizer. Replaces email-based role determination for security.';

-- Update existing admin users (based on current email pattern)
UPDATE public.organizers 
SET role = 'admin' 
WHERE email LIKE '%@admin.%' OR email = 'rcarraro@admin.enxergar';

-- Create index for performance
CREATE INDEX idx_organizers_role ON public.organizers(role);
CREATE INDEX idx_organizers_email_status ON public.organizers(email, status);

-- Update RLS policies to use role field instead of email pattern
DROP POLICY IF EXISTS "Admin users can manage notification templates" ON notification_templates;
CREATE POLICY "Admin users can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Admin users can manage reminder jobs" ON reminder_jobs;
CREATE POLICY "Admin users can manage reminder jobs" ON reminder_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- Log the security fix
INSERT INTO public.system_settings (key, value, description) VALUES (
    'security_fix_role_auth',
    jsonb_build_object(
        'implemented_at', now(),
        'description', 'Fixed critical authentication vulnerability by moving role determination from email pattern to database field',
        'affected_policies', ARRAY['notification_templates', 'reminder_jobs'],
        'migration_version', '20250820120000'
    ),
    'Security fix: Role-based authentication implementation'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();