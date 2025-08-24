-- =====================================================
-- PARTE 2: CORREÇÃO DAS POLÍTICAS PARA EVENTS
-- =====================================================

-- Remover política pública perigosa
DROP POLICY IF EXISTS "Events are public for reading" ON public.events;

-- Criar políticas granulares e seguras
CREATE POLICY "Public can view active events basic info" ON public.events
    FOR SELECT USING (
        status = 'active'
    );

CREATE POLICY "Organizers can manage own events" ON public.events
    FOR ALL USING (
        organizer_id = auth.uid() OR is_admin_user()
    );

-- Habilitar RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;