-- =====================================================
-- PARTE 1: CONFIGURAÇÃO DA COLUNA ROLE E FUNÇÃO ADMIN
-- =====================================================

-- Adicionar coluna role se não existir
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
    END IF;
END $$;

-- Criar função segura de verificação de admin
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