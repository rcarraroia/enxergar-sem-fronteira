-- =====================================================
-- SOLUÇÃO TEMPORÁRIA: DESABILITAR RLS COMPLETAMENTE
-- =====================================================
-- ATENÇÃO: Isso remove toda a segurança da tabela patients
-- Use apenas temporariamente para resolver o problema urgente

-- 1. Desabilitar RLS completamente
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;

-- 2. Garantir permissões totais
GRANT ALL ON public.patients TO public;
GRANT ALL ON public.patients TO anon;
GRANT ALL ON public.patients TO authenticated;

-- 3. Verificar se RLS foi desabilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'patients';

-- 4. Teste de inserção
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'TESTE SEM RLS',
  'teste.sem.rls@example.com',
  '11999999999',
  '66666666666',
  '1990-01-01',
  true
) RETURNING id, nome, email, created_at;

-- 5. Limpar teste
DELETE FROM public.patients WHERE email = 'teste.sem.rls@example.com';

SELECT 'RLS DESABILITADO - Inscrições devem funcionar agora!' as status;

-- IMPORTANTE: Depois que confirmar que funciona,
-- reabilite RLS com políticas corretas para segurança!
