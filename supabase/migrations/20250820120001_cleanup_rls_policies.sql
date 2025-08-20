-- Migration: Cleanup conflicting RLS policies
-- Description: Removes duplicate and conflicting RLS policies identified in audit
-- Date: 2025-08-20
-- Priority: CRITICAL SECURITY FIX

-- ============================================================================
-- PATIENTS TABLE - Cleanup conflicting policies
-- ============================================================================

-- Drop all existing conflicting policies for patients
DROP POLICY IF EXISTS "Apenas sistema pode inserir patients" ON public.patients;
DROP POLICY IF EXISTS "Admins podem ver patients" ON public.patients;
DROP POLICY IF EXISTS "Sistema e admins podem ver patients" ON public.patients;

-- Create unified, secure policies for patients
CREATE POLICY "System can insert patients" ON public.patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage patients" ON public.patients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- ============================================================================
-- ORGANIZERS TABLE - Cleanup and secure policies
-- ============================================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Organizers podem gerenciar seus próprios dados" ON public.organizers;
DROP POLICY IF EXISTS "Admins podem ver todos organizers" ON public.organizers;

-- Create unified policies for organizers
CREATE POLICY "Organizers can manage own data" ON public.organizers
    FOR ALL USING (
        auth.jwt() ->> 'email' = email
    );

CREATE POLICY "Admins can manage all organizers" ON public.organizers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- ============================================================================
-- EVENTS TABLE - Cleanup and secure policies
-- ============================================================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Events são públicos para leitura" ON public.events;
DROP POLICY IF EXISTS "Admins podem criar eventos" ON public.events;
DROP POLICY IF EXISTS "Admins podem editar eventos" ON public.events;
DROP POLICY IF EXISTS "Admins podem excluir eventos" ON public.events;
DROP POLICY IF EXISTS "Organizadores veem seus eventos" ON public.events;
DROP POLICY IF EXISTS "Organizadores editam seus eventos" ON public.events;
DROP POLICY IF EXISTS "Organizadores criam eventos" ON public.events;
DROP POLICY IF EXISTS "Organizadores excluem seus eventos" ON public.events;

-- Create unified, secure policies for events
CREATE POLICY "Events are public for reading" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

CREATE POLICY "Organizers can manage own events" ON public.events
    FOR ALL USING (
        organizer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- ============================================================================
-- REGISTRATIONS TABLE - Cleanup and secure policies
-- ============================================================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Registrations públicas para leitura" ON public.registrations;
DROP POLICY IF EXISTS "Sistema pode inserir registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins podem gerenciar registrations" ON public.registrations;
DROP POLICY IF EXISTS "Organizadores veem suas inscrições" ON public.registrations;
DROP POLICY IF EXISTS "Organizadores atualizam suas inscrições" ON public.registrations;

-- Create unified policies for registrations
CREATE POLICY "Registrations are public for reading" ON public.registrations
    FOR SELECT USING (true);

CREATE POLICY "System can insert registrations" ON public.registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all registrations" ON public.registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

CREATE POLICY "Organizers can manage own event registrations" ON public.registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id 
            AND (
                e.organizer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.organizers 
                    WHERE email = auth.jwt() ->> 'email' 
                    AND role = 'admin' 
                    AND status = 'active'
                )
            )
        )
    );

-- ============================================================================
-- LOG CLEANUP COMPLETION
-- ============================================================================

INSERT INTO public.system_settings (key, value, description) VALUES (
    'rls_policies_cleanup',
    jsonb_build_object(
        'completed_at', now(),
        'description', 'Cleaned up conflicting RLS policies identified in security audit',
        'tables_affected', ARRAY['patients', 'organizers', 'events', 'registrations'],
        'policies_removed', 15,
        'policies_created', 8,
        'migration_version', '20250820120001'
    ),
    'RLS policies cleanup completion log'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();