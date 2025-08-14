
-- Corrigir estrutura da tabela system_settings para resolver erro 409
DROP TABLE IF EXISTS public.system_settings CASCADE;

CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Recriar policies
CREATE POLICY "Admins podem gerenciar configurações" 
  ON public.system_settings 
  FOR ALL 
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Todos podem ler configurações públicas" 
  ON public.system_settings 
  FOR SELECT 
  USING (key = ANY (ARRAY['project_name', 'project_description', 'social_links', 'logo_header', 'logo_footer']));

-- Inserir dados padrão
INSERT INTO public.system_settings (key, value, description) VALUES
('social_links', '{"facebook": "", "instagram": "", "linkedin": ""}', 'Links das redes sociais'),
('logo_header', '""', 'URL da logo colorida para o cabeçalho'),
('logo_footer', '""', 'URL da logo branca para o rodapé'),
('project_name', '"Enxergar sem Fronteiras"', 'Nome do projeto'),
('project_description', '"Democratizando o acesso à saúde oftalmológica"', 'Descrição do projeto'),
('asaas_ong_coracao_valente', '""', 'API Key Asaas - ONG Coração Valente'),
('asaas_projeto_visao_itinerante', '""', 'API Key Asaas - Projeto Visão Itinerante'),
('asaas_renum_tecnologia', '""', 'API Key Asaas - Renum Tecnologia')
ON CONFLICT (key) DO NOTHING;
