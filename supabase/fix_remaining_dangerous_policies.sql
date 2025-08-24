-- =====================================================
-- CORREÇÃO DAS POLÍTICAS PERIGOSAS RESTANTES
-- =====================================================

-- 1. DONATION_SUBSCRIPTIONS - Remover política perigosa
DROP POLICY IF EXISTS "Sistema pode gerenciar assinaturas" ON donation_subscriptions;

-- Criar política segura para donation_subscriptions
CREATE POLICY "System can manage donation subscriptions" ON donation_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view donation subscriptions" ON donation_subscriptions
    FOR SELECT USING (is_admin_user());

-- 2. EVENT_DATES - Remover política perigosa
DROP POLICY IF EXISTS "Event dates são públicas para leitura" ON event_dates;

-- Criar política segura para event_dates
CREATE POLICY "Public can view active event dates" ON event_dates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e 
            WHERE e.id = event_id AND e.status = 'active'
        )
    );

CREATE POLICY "Organizers can manage own event dates" ON event_dates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events e 
            WHERE e.id = event_id 
            AND (e.organizer_id = auth.uid() OR is_admin_user())
        )
    );

-- 3. EVENTS - Remover política perigosa (já deveria ter sido removida)
DROP POLICY IF EXISTS "Events são públicos para leitura" ON events;

-- 4. MESSAGES - Remover política perigosa
DROP POLICY IF EXISTS "System can update messages" ON messages;

-- Criar políticas seguras para messages
CREATE POLICY "System can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view messages" ON messages
    FOR SELECT USING (is_admin_user());

-- 5. PATIENT_ACCESS_TOKENS - Remover política perigosa
DROP POLICY IF EXISTS "Sistema pode gerenciar tokens" ON patient_access_tokens;

-- Criar políticas seguras para patient_access_tokens
CREATE POLICY "System can manage patient tokens" ON patient_access_tokens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can select patient tokens" ON patient_access_tokens
    FOR SELECT USING (true);

-- 6. PATIENTS - Remover política perigosa
DROP POLICY IF EXISTS "Sistema pode retornar dados após insert" ON patients;

-- 7. REGISTRATIONS - Remover política perigosa (já deveria ter sido removida)
DROP POLICY IF EXISTS "Registrations públicas para leitura" ON registrations;

-- Habilitar RLS em todas as tabelas afetadas
ALTER TABLE donation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access_tokens ENABLE ROW LEVEL SECURITY;