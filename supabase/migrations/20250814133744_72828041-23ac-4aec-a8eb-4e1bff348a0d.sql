
-- Adicionar campos necessários na tabela organizers para perfil completo
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_reminders": true,
  "sms_reminders": false,
  "event_updates": true,
  "registration_notifications": true
}';
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Atualizar políticas RLS para organizadores

-- Organizadores podem ver apenas seus eventos
DROP POLICY IF EXISTS "Organizadores veem seus eventos" ON public.events;
CREATE POLICY "Organizadores veem seus eventos" 
ON public.events FOR SELECT 
USING (organizer_id = auth.uid() OR is_admin_user());

-- Organizadores podem editar apenas seus eventos
DROP POLICY IF EXISTS "Organizadores editam seus eventos" ON public.events;
CREATE POLICY "Organizadores editam seus eventos" 
ON public.events FOR UPDATE 
USING (organizer_id = auth.uid() OR is_admin_user());

-- Organizadores podem criar eventos (com seu próprio ID)
DROP POLICY IF EXISTS "Organizadores criam eventos" ON public.events;
CREATE POLICY "Organizadores criam eventos" 
ON public.events FOR INSERT 
WITH CHECK (organizer_id = auth.uid() OR is_admin_user());

-- Organizadores podem excluir seus eventos
DROP POLICY IF EXISTS "Organizadores excluem seus eventos" ON public.events;
CREATE POLICY "Organizadores excluem seus eventos" 
ON public.events FOR DELETE 
USING (organizer_id = auth.uid() OR is_admin_user());

-- Organizadores veem inscrições de seus eventos
DROP POLICY IF EXISTS "Organizadores veem suas inscrições" ON public.registrations;
CREATE POLICY "Organizadores veem suas inscrições" 
ON public.registrations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = registrations.event_date_id 
    AND events.organizer_id = auth.uid()
  ) OR is_admin_user()
);

-- Organizadores podem atualizar inscrições de seus eventos
DROP POLICY IF EXISTS "Organizadores atualizam suas inscrições" ON public.registrations;
CREATE POLICY "Organizadores atualizam suas inscrições" 
ON public.registrations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.event_dates ed ON e.id = ed.event_id
    WHERE ed.id = registrations.event_date_id 
    AND e.organizer_id = auth.uid()
  ) OR is_admin_user()
);

-- Organizadores veem event_dates de seus eventos
DROP POLICY IF EXISTS "Organizadores veem suas event dates" ON public.event_dates;
CREATE POLICY "Organizadores veem suas event dates" 
ON public.event_dates FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_dates.event_id 
    AND events.organizer_id = auth.uid()
  ) OR is_admin_user()
);

-- Organizadores podem criar event_dates para seus eventos
DROP POLICY IF EXISTS "Organizadores criam event dates" ON public.event_dates;
CREATE POLICY "Organizadores criam event dates" 
ON public.event_dates FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_dates.event_id 
    AND events.organizer_id = auth.uid()
  ) OR is_admin_user()
);

-- Organizadores podem atualizar event_dates de seus eventos
DROP POLICY IF EXISTS "Organizadores atualizam event dates" ON public.event_dates;
CREATE POLICY "Organizadores atualizam event dates" 
ON public.event_dates FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_dates.event_id 
    AND events.organizer_id = auth.uid()
  ) OR is_admin_user()
);

-- Organizadores podem excluir event_dates de seus eventos
DROP POLICY IF EXISTS "Organizadores excluem event dates" ON public.event_dates;
CREATE POLICY "Organizadores excluem event dates" 
ON public.event_dates FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_dates.event_id 
    AND events.organizer_id = auth.uid()
  ) OR is_admin_user()
);

-- Atualizar função para determinar se usuário é organizador
CREATE OR REPLACE FUNCTION public.is_organizer_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o email do usuário atual contém @organizer.
  RETURN (
    SELECT CASE 
      WHEN auth.email() LIKE '%@organizer.%' THEN true
      ELSE false
    END
  );
END;
$$;
