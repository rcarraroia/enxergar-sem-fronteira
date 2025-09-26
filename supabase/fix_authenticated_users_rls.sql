-- =====================================================
-- CORREÇÃO RLS PARA USUÁRIOS AUTENTICADOS
-- =====================================================
-- O problema é que usuários logados (authenticated) precisam de políticas específicas

-- 1. Verificar políticas atuais
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 2. Adicionar política para usuários autenticados poderem inserir pacientes
CREATE POLICY "allow_authenticated_insert_patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Adicionar política para usuários autenticados poderem ler pacientes
CREATE POLICY "allow_authenticated_select_patients"
ON public.patients
FOR SELECT
TO authenticated
USING (true);

-- 4. Verificar se as novas políticas foram criadas
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 5. Teste de inserção como usuário autenticado
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'TESTE AUTHENTICATED',
  'teste.authenticated@example.com',
  '11999999999',
  '88888888888',
  '1990-01-01',
  true
) RETURNING id, nome, email, created_at;

-- 6. Limpar teste
DELETE FROM public.patients WHERE email = 'teste.authenticated@example.com';

SELECT 'Políticas para usuários autenticados criadas com sucesso!' as status;
