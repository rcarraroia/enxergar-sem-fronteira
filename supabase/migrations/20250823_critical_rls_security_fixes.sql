-- =====================================================
-- CORREÇÕES CRÍTICAS DE SEGURANÇA RLS
-- =====================================================
-- Data: 2025-08-23
-- Prioridade: CRÍTICA
-- Descrição: Corrige vulnerabilidades críticas identificadas na auditoria

-- ============================================================================
-- 1. VERIFICAR E ADICIONAR COLUNA ROLE SE NECESSÁRIO
-- ============================================================================

-- Adicionar coluna role se não existir (safe operation)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.organizers 
        ADD COLUMN role text DEFAULT 'organizer' 
        CHECK (role IN ('admin', 'organizer', 'viewer'));
        
        -- Criar índice para performance
        CREATE INDEX idx_organizers_role_security ON public.organizers(role, status);
        
        -- Atualizar usuários admin conhecidos
        UPDATE public.organizers 
        SET role = 'admin' 
        WHERE email IN ('rcarraro@admin.enxergar');
        
        -- Coluna role adicionada à tabela organizers
    ELSE
        -- Coluna role já existe na tabela organizers
    END IF;
END $$;

-- ============================================================================
-- 2. CRIAR FUNÇÃO SEGURA DE VERIFICAÇÃO DE ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE id = auth.uid() 
        AND role = 'admin' 
        AND status = 'active'
    );
END;
$$;

COMMENT ON FUNCTION is_admin_user() IS 'Função segura para verificar se usuário atual é admin ativo';

-- ============================================================================
-- 3. CORRIGIR POLÍTICAS RLS PARA EVENTS (CRÍTICO)
-- ============================================================================

-- Remover política pública perigosa
DROP POLICY IF EXISTS "Events are public for reading" ON public.events;

-- Criar políticas granulares e seguras
CREATE POLICY "Public can view active events basic info" ON public.events
    FOR SELECT USING (
        status = 'active'
        -- Apenas eventos ativos são visíveis publicamente
    );

CREATE POLICY "Organizers can manage own events" ON public.events
    FOR ALL USING (
        organizer_id = auth.uid() OR is_admin_user()
    );

-- ============================================================================
-- 4. CORRIGIR POLÍTICAS RLS PARA REGISTRATIONS (CRÍTICO)
-- ============================================================================

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

-- ============================================================================
-- 5. CORRIGIR POLÍTICAS RLS PARA PATIENTS (CRÍTICO)
-- ============================================================================

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Sistema e admins podem ver patients" ON public.patients;
DROP POLICY IF EXISTS "Admins podem ver patients" ON public.patients;

-- Criar políticas seguras
CREATE POLICY "System can insert patients" ON public.patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage patients" ON public.patients
    FOR ALL USING (is_admin_user());

-- ============================================================================
-- 6. CORRIGIR POLÍTICAS RLS PARA ORGANIZERS
-- ============================================================================

-- Remover políticas baseadas em email pattern
DROP POLICY IF EXISTS "Admins podem ver todos organizers" ON public.organizers;

-- Criar políticas seguras
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

-- ============================================================================
-- 7. CORRIGIR POLÍTICAS PARA NOTIFICATION_TEMPLATES
-- ============================================================================

-- Remover políticas baseadas em email pattern
DROP POLICY IF EXISTS "Admin can manage templates" ON notification_templates;
DROP POLICY IF EXISTS "Admin users can manage notification templates" ON notification_templates;

-- Criar política segura
CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (is_admin_user());

-- ============================================================================
-- 8. CORRIGIR POLÍTICAS PARA REMINDER_JOBS
-- ============================================================================

-- Remover políticas baseadas em email pattern
DROP POLICY IF EXISTS "Admin can view message logs" ON reminder_jobs;
DROP POLICY IF EXISTS "Admin users can manage reminder jobs" ON reminder_jobs;

-- Criar políticas seguras
CREATE POLICY "System can manage reminder jobs" ON reminder_jobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view reminder jobs" ON reminder_jobs
    FOR SELECT USING (is_admin_user());

CREATE POLICY "Organizers can view own event reminder jobs" ON reminder_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.event_dates ed ON ed.event_id = e.id
            WHERE ed.id = event_date_id 
            AND (e.organizer_id = auth.uid() OR is_admin_user())
        )
    );

-- ============================================================================
-- 9. REMOVER CHAVES DE API DO BANCO (PREPARAÇÃO)
-- ============================================================================

-- Comentar as colunas perigosas (não remover ainda para não quebrar o sistema)
COMMENT ON COLUMN public.organizers.asaas_api_key IS 'DEPRECATED: Mover para variáveis de ambiente - RISCO DE SEGURANÇA';
COMMENT ON COLUMN public.organizers.whatsapp_api_key IS 'DEPRECATED: Mover para variáveis de ambiente - RISCO DE SEGURANÇA';

-- ============================================================================
-- 10. LOG DA CORREÇÃO DE SEGURANÇA
-- ============================================================================

INSERT INTO public.system_settings (key, value, description) VALUES (
    'critical_rls_security_fixes',
    jsonb_build_object(
        'implemented_at', now(),
        'description', 'Correções críticas de segurança RLS identificadas na auditoria',
        'fixes_applied', ARRAY[
            'Removidas políticas públicas perigosas',
            'Implementado sistema de roles seguro',
            'Criada função is_admin_user() segura',
            'Corrigidas políticas baseadas em email pattern',
            'Implementadas políticas granulares por tabela'
        ],
        'tables_affected', ARRAY['events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs'],
        'security_level', 'CRITICAL',
        'migration_version', '20250823_critical_rls_security_fixes'
    ),
    'Log das correções críticas de segurança RLS'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- ============================================================================
-- 11. VERIFICAÇÕES DE SEGURANÇA
-- ============================================================================

-- Verificar se todas as tabelas têm RLS habilitado
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('events', 'registrations', 'patients', 'organizers', 'notification_templates', 'reminder_jobs')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        -- RLS habilitado para tabela
    END LOOP;
END $$;

-- CORREÇÕES CRÍTICAS DE SEGURANÇA RLS APLICADAS COM SUCESSO
-- PRÓXIMO PASSO: Mover chaves de API para variáveis de ambiente
-- RECOMENDADO: Executar testes de segurança para validar as correções