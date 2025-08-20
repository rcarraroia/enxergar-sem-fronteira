
-- Adicionar campo role na tabela organizers
ALTER TABLE public.organizers 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'organizer';

-- Criar enum para roles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organizer_role') THEN
        CREATE TYPE organizer_role AS ENUM ('organizer', 'admin', 'superadmin');
    END IF;
END $$;

-- Atualizar o campo role para usar o enum
ALTER TABLE public.organizers 
ALTER COLUMN role TYPE organizer_role USING role::organizer_role;

-- Definir o usuário específico como superadmin
UPDATE public.organizers 
SET role = 'superadmin' 
WHERE email = 'rcarraro@admin.enxergar';

-- Atualizar a função is_admin_user para considerar o novo campo role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é um organizador com role de admin ou superadmin
  RETURN EXISTS (
    SELECT 1 
    FROM public.organizers 
    WHERE id = auth.uid() 
    AND status = 'active'
    AND role IN ('admin', 'superadmin')
  );
END;
$$;

-- Criar função específica para superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organizers 
    WHERE id = auth.uid() 
    AND status = 'active'
    AND role = 'superadmin'
  );
END;
$$;
