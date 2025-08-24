-- =====================================================
-- CORREÇÃO: Acesso aos Relatórios para Administradores
-- =====================================================
-- Problema: Políticas RLS muito restritivas bloqueando relatórios
-- Solução: Permitir acesso completo para admins em consultas de relatório

-- ============================================================================
-- 1. CORRIGIR POLÍTICA DE REGISTRATIONS PARA RELATÓRIOS
-- ============================================================================

-- A política atual só permite ver registrations de eventos próprios
-- Vamos adicionar uma política específica para admins verem todos os registrations

CREATE POLICY "Admins can view all registrations for reports" ON public.registrations
    FOR SELECT USING (is_admin_user());

-- ============================================================================
-- 2. CORRIGIR POLÍTICA DE PATIENTS PARA RELATÓRIOS
-- ============================================================================

-- Admins já podem ver todos os patients, mas vamos garantir que a política está ativa
-- A política "Admins can manage patients" já existe e deve funcionar

-- ============================================================================
-- 3. CORRIGIR POLÍTICA DE EVENT_DATES PARA RELATÓRIOS
-- ============================================================================

-- Verificar se event_dates tem políticas adequadas
-- Criar política para admins se não existir

DO $
BEGIN
    -- Verificar se já existe política para event_dates
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'event_dates' 
        AND policyname LIKE '%admin%'
    ) THEN
        -- Criar política para admins acessarem todas as event_dates
        EXECUTE 'CREATE POLICY "Admins can view all event dates" ON public.event_dates
                 FOR SELECT USING (is_admin_user())';
    END IF;
END $;

-- ============================================================================
-- 4. GARANTIR QUE EVENTS PERMITE ACESSO ADMIN COMPLETO
-- ============================================================================

-- Verificar se existe política adequada para admins em events
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events' 
        AND policyname LIKE '%admin%'
        AND cmd = 'SELECT'
    ) THEN
        -- Criar política específica para admins verem todos os eventos
        EXECUTE 'CREATE POLICY "Admins can view all events" ON public.events
                 FOR SELECT USING (is_admin_user())';
    END IF;
END $;

-- ============================================================================
-- 5. TESTAR ACESSO COMO ADMIN
-- ============================================================================

-- Verificar se as políticas estão funcionando
SELECT 'Testando políticas para relatórios...' as status;

-- Listar todas as políticas relevantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('registrations', 'patients', 'event_dates', 'events')
AND (policyname ILIKE '%admin%' OR policyname ILIKE '%report%')
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. LOG DA CORREÇÃO
-- ============================================================================

INSERT INTO public.system_settings (key, value, description) VALUES (
    'reports_access_fix',
    jsonb_build_object(
        'implemented_at', now(),
        'description', 'Correção de acesso aos relatórios para administradores',
        'issue', 'Políticas RLS muito restritivas bloqueando relatórios',
        'solution', 'Adicionadas políticas específicas para admins acessarem dados de relatórios',
        'tables_affected', ARRAY['registrations', 'patients', 'event_dates', 'events'],
        'policies_added', ARRAY[
            'Admins can view all registrations for reports',
            'Admins can view all event dates',
            'Admins can view all events'
        ]
    ),
    'Correção de acesso aos relatórios'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- CORREÇÃO DE ACESSO AOS RELATÓRIOS APLICADA
-- Os administradores agora devem conseguir acessar todos os dados necessários