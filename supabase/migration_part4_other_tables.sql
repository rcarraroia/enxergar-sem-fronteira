-- =====================================================
-- PARTE 4: CORREÇÃO DAS OUTRAS TABELAS
-- =====================================================

-- PATIENTS
DROP POLICY IF EXISTS "Sistema e admins podem ver patients" ON public.patients;
DROP POLICY IF EXISTS "Admins podem ver patients" ON public.patients;

CREATE POLICY "System can insert patients" ON public.patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage patients" ON public.patients
    FOR ALL USING (is_admin_user());

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- ORGANIZERS
DROP POLICY IF EXISTS "Admins podem ver todos organizers" ON public.organizers;

CREATE POLICY "Organizers can view own data" ON public.organizers
    FOR SELECT USING (
        id = auth.uid() OR is_admin_user()
    );

CREATE POLICY "Organizers can update own data" ON public.organizers
    FOR UPDATE USING (
        id = auth.uid()
    );

CREATE POLICY "Admins can manage all organizers" ON public.organizers
    FOR ALL USING (is_admin_user());

ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- NOTIFICATION_TEMPLATES
DROP POLICY IF EXISTS "Admin can manage templates" ON notification_templates;
DROP POLICY IF EXISTS "Admin users can manage notification templates" ON notification_templates;

CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (is_admin_user());

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;