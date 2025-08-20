-- CORREÇÃO IMEDIATA: Adicionar campo role e corrigir acesso admin
-- Execute este script diretamente no Supabase SQL Editor

-- 1. Adicionar campo role na tabela organizers
ALTER TABLE public.organizers 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer'));

-- 2. Adicionar comentário para documentação
COMMENT ON COLUMN public.organizers.role IS 'User role: admin or organizer. Replaces email-based role determination for security.';

-- 3. Atualizar usuários admin existentes baseado no email atual
UPDATE public.organizers 
SET role = 'admin' 
WHERE email LIKE '%@admin.%' OR email = 'rcarraro@admin.enxergar';

-- 4. Inserir admin principal se não existir
INSERT INTO public.organizers (name, email, status, role) 
VALUES ('Administrador Principal', 'rcarraro@admin.enxergar', 'active', 'admin')
ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    status = 'active',
    updated_at = now();

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_organizers_role ON public.organizers(role);
CREATE INDEX IF NOT EXISTS idx_organizers_email_status ON public.organizers(email, status);

-- 6. Verificar se o admin foi criado/atualizado
SELECT 
    name, 
    email, 
    status, 
    role,
    created_at,
    updated_at
FROM public.organizers 
WHERE role = 'admin' OR email LIKE '%admin%';

-- 7. Log da correção
INSERT INTO public.system_settings (key, value, description) VALUES (
    'admin_access_fix',
    jsonb_build_object(
        'fixed_at', now(),
        'description', 'Fixed admin access by adding role field and ensuring admin user exists',
        'admin_email', 'rcarraro@admin.enxergar',
        'status', 'completed'
    ),
    'Admin access fix completion log'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();