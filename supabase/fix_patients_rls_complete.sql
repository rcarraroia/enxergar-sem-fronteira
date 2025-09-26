-- =====================================================
-- CORREÇÃO COMPLETA E DEFINITIVA DO RLS PATIENTS
-- =====================================================

-- 1. Desabilitar RLS temporariamente para limpeza
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'patients'
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.patients';
    END LOOP;
END $$;

-- 3. Garantir permissões básicas na tabela
GRANT INSERT, SELECT ON public.patients TO public;
GRANT INSERT, SELECT ON public.patients TO anon;
GRANT ALL ON public.patients TO authenticated;

-- 4. Reabilitar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 5. Criar política MUITO permissiva para inserção pública
CREATE POLICY "allow_public_insert_patients"
ON public.patients
FOR INSERT
TO public, anon
WITH CHECK (true);

-- 6. Criar política para leitura por organizadores autenticados
CREATE POLICY "allow_organizer_select_patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    INNER JOIN event_dates ed ON r.event_date_id = ed.id
    INNER JOIN events e ON ed.event_id = e.id
    WHERE r.patient_id = patients.id
    AND e.organizer_id = auth.uid()
  )
  OR
  -- Permitir que vejam seus próprios dados se for o mesmo usuário
  auth.uid()::text = id::text
);

-- 7. Política para atualização (apenas próprios dados)
CREATE POLICY "allow_self_update_patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- 8. Verificar se as políticas foram criadas
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

-- 9. Teste final de inserção
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'TESTE FINAL RLS',
  'teste.final.rls@example.com',
  '11999999999',
  '99999999999',
  '1990-01-01',
  true
) RETURNING id, nome, email, created_at;

-- 10. Limpar teste
DELETE FROM public.patients WHERE email = 'teste.final.rls@example.com';

SELECT 'RLS configurado com sucesso para acesso público!' as status;
