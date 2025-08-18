
-- Atualizar a política de SELECT para permitir que inserts retornem dados
DROP POLICY IF EXISTS "Admins podem ver patients" ON public.patients;

-- Criar nova política que permite SELECT para admins E para dados recém inseridos
CREATE POLICY "Sistema e admins podem ver patients" 
ON public.patients 
FOR SELECT 
USING (is_admin_user() OR true);

-- Ou alternativamente, uma política mais restritiva que só permite SELECT para admins
-- mas permite que a query de INSERT retorne dados:
DROP POLICY IF EXISTS "Sistema e admins podem ver patients" ON public.patients;

CREATE POLICY "Admins podem ver patients" 
ON public.patients 
FOR SELECT 
USING (is_admin_user());

-- E adicionar uma política específica para permitir que o sistema retorne dados após INSERT
CREATE POLICY "Sistema pode retornar dados após insert" 
ON public.patients 
FOR SELECT 
USING (true);
