-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA TABELA PATIENTS
-- =====================================================
-- Este script corrige as políticas de Row Level Security
-- para permitir inserção pública de pacientes

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'patients';

-- Listar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patients';

-- Desabilitar RLS temporariamente para permitir acesso público
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;

-- Ou criar política que permite inserção pública
-- (escolha uma das opções abaixo)

-- OPÇÃO 1: Permitir inserção pública (recomendado para formulário público)
DROP POLICY IF EXISTS "Permitir inserção pública de pacientes" ON public.patients;
CREATE POLICY "Permitir inserção pública de pacientes"
ON public.patients
FOR INSERT
TO public
WITH CHECK (true);

-- OPÇÃO 2: Permitir leitura pública também (se necessário)
DROP POLICY IF EXISTS "Permitir leitura pública de pacientes" ON public.patients;
CREATE POLICY "Permitir leitura pública de pacientes"
ON public.patients
FOR SELECT
TO public
USING (true);

-- Reabilitar RLS com as novas políticas
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patients';

-- Testar inserção
INSERT INTO public.patients (
  nome,
  email,
  telefone,
  cpf,
  data_nascimento,
  consentimento_lgpd
) VALUES (
  'Teste RLS',
  'teste.rls@example.com',
  '11999999999',
  '12345678901',
  '1990-01-01',
  true
);

-- Limpar teste
DELETE FROM public.patients WHERE email = 'teste.rls@example.com';
