
-- Primeiro, vamos criar uma função security definer para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o email do usuário atual contém @admin.
  RETURN (
    SELECT CASE 
      WHEN auth.email() LIKE '%@admin.%' THEN true
      ELSE false
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Remover as políticas existentes que causam recursão
DROP POLICY IF EXISTS "Admins podem ver todos organizers" ON public.organizers;
DROP POLICY IF EXISTS "Admins podem criar eventos" ON public.events;
DROP POLICY IF EXISTS "Admins podem editar eventos" ON public.events;
DROP POLICY IF EXISTS "Admins podem excluir eventos" ON public.events;
DROP POLICY IF EXISTS "Admins podem ver transações" ON public.asaas_transactions;
DROP POLICY IF EXISTS "Admins podem ver patients" ON public.patients;

-- Recriar as políticas usando a função security definer
CREATE POLICY "Admins podem ver todos organizers" 
  ON public.organizers 
  FOR SELECT 
  USING (public.is_admin_user());

CREATE POLICY "Admins podem criar eventos" 
  ON public.events 
  FOR INSERT 
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins podem editar eventos" 
  ON public.events 
  FOR UPDATE 
  USING (public.is_admin_user()) 
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins podem excluir eventos" 
  ON public.events 
  FOR DELETE 
  USING (public.is_admin_user());

CREATE POLICY "Admins podem ver transações" 
  ON public.asaas_transactions 
  FOR ALL 
  USING (public.is_admin_user());

CREATE POLICY "Admins podem ver patients" 
  ON public.patients 
  FOR SELECT 
  USING (public.is_admin_user());
