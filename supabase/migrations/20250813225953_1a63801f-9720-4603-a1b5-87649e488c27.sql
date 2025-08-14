
-- Inserir usuário admin diretamente na tabela organizers
-- Usando email admin para garantir acesso administrativo
INSERT INTO public.organizers (
  id,
  name,
  email,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Renato Carraro',
  'rcarraro@admin.enxergar',
  now(),
  now()
);

-- Criar usuário de autenticação correspondente
-- Nota: O Supabase criará automaticamente na tabela auth.users quando fizer login
