
-- Inserir o usuário admin na tabela organizers
-- Substitua 'USER_ID_AQUI' pelo ID real do usuário criado no painel do Supabase
INSERT INTO public.organizers (id, name, email)
VALUES (
  'USER_ID_AQUI', -- Substitua pelo UUID do usuário criado
  'Roberto Carraro',
  'rcarraro@admin.enxergar'
);
