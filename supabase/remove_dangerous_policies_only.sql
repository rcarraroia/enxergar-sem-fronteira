-- =====================================================
-- REMOÇÃO APENAS DAS POLÍTICAS PERIGOSAS
-- =====================================================

-- Remover apenas as políticas perigosas identificadas
DROP POLICY IF EXISTS "Sistema pode gerenciar assinaturas" ON donation_subscriptions;
DROP POLICY IF EXISTS "Event dates são públicas para leitura" ON event_dates;
DROP POLICY IF EXISTS "Events são públicos para leitura" ON events;
DROP POLICY IF EXISTS "System can update messages" ON messages;
DROP POLICY IF EXISTS "Sistema pode gerenciar tokens" ON patient_access_tokens;
DROP POLICY IF EXISTS "Sistema pode retornar dados após insert" ON patients;
DROP POLICY IF EXISTS "Registrations públicas para leitura" ON registrations;

-- Habilitar RLS nas tabelas (safe operation)
ALTER TABLE donation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access_tokens ENABLE ROW LEVEL SECURITY;