
-- Atualizar função is_admin_user para verificar a tabela organizers
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é um organizador com email de admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.organizers 
    WHERE id = auth.uid() 
    AND status = 'active'
    AND (email LIKE '%@admin.%' OR email = 'admin@enxergar.com' OR email = 'coracaovalenteorg@gmail.com')
  );
END;
$$;

-- Remover dados de teste específicos
DELETE FROM public.organizers 
WHERE email IN ('admin@enxergar.com', 'sp@enxergar.com', 'rj@enxergar.com');
