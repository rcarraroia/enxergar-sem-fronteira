
-- Tabela para configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
('social_links', '{"facebook": "", "instagram": "", "linkedin": ""}', 'Links das redes sociais'),
('logo_header', '""', 'URL da logo colorida para o cabeçalho (recomendado: 200x50px)'),
('logo_footer', '""', 'URL da logo branca para o rodapé (recomendado: 150x40px)'),
('project_name', '"Enxergar sem Fronteiras"', 'Nome do projeto'),
('project_description', '"Democratizando o acesso à saúde oftalmológica"', 'Descrição do projeto');

-- Tabela para tokens de acesso únicos para pacientes
CREATE TABLE public.patient_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_access_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_settings
CREATE POLICY "Admins podem gerenciar configurações" 
  ON public.system_settings 
  FOR ALL 
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Todos podem ler configurações públicas" 
  ON public.system_settings 
  FOR SELECT 
  USING (key IN ('project_name', 'project_description', 'social_links', 'logo_header', 'logo_footer'));

-- Políticas RLS para patient_access_tokens
CREATE POLICY "Sistema pode gerenciar tokens" 
  ON public.patient_access_tokens 
  FOR ALL 
  USING (true);

-- Atualizar a tabela organizers para incluir status
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.organizers(id);
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE;
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;
