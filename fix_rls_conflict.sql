-- CORREÇÃO: Remover política RLS conflitante
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-20

-- ============================================================================
-- PROBLEMA IDENTIFICADO:
-- A política "Organizers podem gerenciar seus próprios dados (ALL)" 
-- está conflitando com INSERT porque usa auth.uid() = id
-- Mas novos organizers não têm auth.uid() ainda!
-- ============================================================================

-- PARTE 1: Remover política conflitante
DROP POLICY IF EXISTS "Organizers podem gerenciar seus próprios dados" ON public.organizers;

-- PARTE 2: Criar políticas específicas e corretas

-- Política para SELECT (admins podem ver todos)
CREATE POLICY "Admins can select all organizers" ON public.organizers
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- Política para INSERT (admins podem criar)
-- (Esta já existe, mas vamos recriar para garantir)
DROP POLICY IF EXISTS "Admin can insert organizers" ON public.organizers;
CREATE POLICY "Admin can insert organizers" ON public.organizers
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- Política para UPDATE (admins podem atualizar todos)
CREATE POLICY "Admins can update all organizers" ON public.organizers
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- Política para DELETE (admins podem deletar)
CREATE POLICY "Admins can delete organizers" ON public.organizers
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.organizers 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin' 
            AND status = 'active'
        )
    );

-- ============================================================================
-- VERIFICAÇÃO: Listar políticas após correção
-- ============================================================================

SELECT 
    'POLÍTICAS APÓS CORREÇÃO' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'organizers' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Log da correção
INSERT INTO public.system_settings (key, value, description) VALUES (
    'organizers_rls_conflict_fix',
    jsonb_build_object(
        'fixed_at', now(),
        'problem', 'Política ALL conflitando com INSERT',
        'solution', 'Políticas específicas por operação',
        'version', '20250820_conflict_fix'
    ),
    'Fixed RLS policy conflict for organizers table'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();