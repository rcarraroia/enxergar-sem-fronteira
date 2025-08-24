-- =====================================================
-- PARTE 3: CORREÇÃO DAS POLÍTICAS PARA REGISTRATIONS
-- =====================================================

-- Remover política pública perigosa
DROP POLICY IF EXISTS "Registrations are public for reading" ON public.registrations;

-- Criar políticas seguras baseadas em ownership
CREATE POLICY "Organizers can view own event registrations" ON public.registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.event_dates ed ON ed.event_id = e.id
            WHERE ed.id = event_date_id 
            AND (e.organizer_id = auth.uid() OR is_admin_user())
        )
    );

CREATE POLICY "System can insert registrations" ON public.registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizers can manage own event registrations" ON public.registrations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.event_dates ed ON ed.event_id = e.id
            WHERE ed.id = event_date_id 
            AND (e.organizer_id = auth.uid() OR is_admin_user())
        )
    );

-- Habilitar RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;