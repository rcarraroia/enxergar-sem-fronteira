
-- Criar função para verificar se um email é de organizador
CREATE OR REPLACE FUNCTION public.is_organizer_email(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organizers 
    WHERE email = email_to_check 
    AND status = 'active'
  );
END;
$$;

-- Atualizar função is_organizer_user para usar a nova lógica
CREATE OR REPLACE FUNCTION public.is_organizer_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o email do usuário atual existe na tabela organizers
  RETURN public.is_organizer_email(auth.email());
END;
$$;
