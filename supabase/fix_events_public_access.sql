-- ============================================================================
-- FIX: Corrigir acesso público aos eventos
-- ============================================================================
-- Problema: Política RLS verifica status = 'active' mas eventos usam status = 'open'
-- Solução: Atualizar política para permitir acesso a eventos com status = 'open'

-- Remover política atual que verifica 'active'
DROP POLICY IF EXISTS "Public can view active events basic info" ON public.events;
DROP POLICY IF EXISTS "Public can view active events" ON public.events;

-- Criar nova política que permite acesso a eventos 'open' (públicos)
CREATE POLICY "Public can view open events" ON public.events
    FOR SELECT USING (
        status = 'open'
    );

-- Manter políticas existentes para organizadores e admins
-- (não alterar as outras políticas)

-- Log da correção
INSERT INTO public.system_settings (key, value, description, updated_at)
VALUES (
    'events_public_access_fix',
    '{"applied": true, "date": "2025-09-25", "issue": "RLS policy checking active but events use open status"}',
    'Fix applied to allow public access to events with status = open',
    now()
) ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = EXCLUDED.updated_at;
