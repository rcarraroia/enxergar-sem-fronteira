
-- Migration: 20250113213645_patient_access_tokens.sql
-- Criar tabela para tokens de acesso de pacientes
CREATE TABLE IF NOT EXISTS public.patient_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  event_date_id UUID NOT NULL REFERENCES public.event_dates(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_patient_access_tokens_patient_id ON public.patient_access_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_tokens_token ON public.patient_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_patient_access_tokens_expires_at ON public.patient_access_tokens(expires_at);

-- RLS
ALTER TABLE public.patient_access_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir que o sistema gerencie tokens
CREATE POLICY "Sistema pode gerenciar tokens" ON public.patient_access_tokens
  FOR ALL USING (true);

-- Function para gerar tokens aleatórios
CREATE OR REPLACE FUNCTION public.generate_access_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Migration: 20250113213646_campaigns.sql  
-- Criar tabela de campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  description TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  goal_amount NUMERIC DEFAULT 0,
  current_amount NUMERIC DEFAULT 0,
  suggested_amounts JSONB DEFAULT '[25, 50, 100, 200]'::jsonb,
  allow_custom_amount BOOLEAN DEFAULT true,
  allow_subscriptions BOOLEAN DEFAULT true,
  status VARCHAR DEFAULT 'active',
  image_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.organizers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para campanhas
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campanhas são públicas para leitura" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar campanhas" ON public.campaigns
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Migration: 20250113213647_donations.sql
-- Criar tabela de doações
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  donor_name VARCHAR,
  donor_email VARCHAR,
  donor_phone VARCHAR,
  donation_type VARCHAR NOT NULL DEFAULT 'one_time',
  payment_id VARCHAR,
  payment_status VARCHAR DEFAULT 'pending',
  asaas_subscription_id VARCHAR,
  split_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para doações
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver doações" ON public.donations
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Sistema pode inserir doações" ON public.donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar doações" ON public.donations
  FOR UPDATE USING (true);

-- Migration: 20250113213648_donation_subscriptions.sql
-- Criar tabela de assinaturas de doações
CREATE TABLE IF NOT EXISTS public.donation_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  donation_id UUID REFERENCES public.donations(id) ON DELETE SET NULL,
  subscriber_email VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR DEFAULT 'active',
  asaas_subscription_id VARCHAR,
  next_charge_date DATE,
  total_charges INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para assinaturas
ALTER TABLE public.donation_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver assinaturas" ON public.donation_subscriptions
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Sistema pode gerenciar assinaturas" ON public.donation_subscriptions
  FOR ALL USING (true);

-- Migration: 20250113213649_asaas_transactions.sql
-- Criar tabela para transações Asaas
CREATE TABLE IF NOT EXISTS public.asaas_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  split_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para transações Asaas
ALTER TABLE public.asaas_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver transações" ON public.asaas_transactions
  FOR ALL USING (is_admin_user());

-- Migration: 20250113213650_system_settings.sql
-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para configurações
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar configurações" ON public.system_settings
  FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Todos podem ler configurações públicas" ON public.system_settings
  FOR SELECT USING (key IN ('project_name', 'project_description', 'social_links', 'logo_header', 'logo_footer'));

-- Inserir configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
  ('project_name', 'Enxergar sem Fronteiras', 'Nome do projeto'),
  ('project_description', 'Sistema de gestão de eventos de saúde ocular', 'Descrição do projeto'),
  ('social_links', '{}', 'Links das redes sociais em formato JSON'),
  ('logo_header', '/lovable-uploads/logo512x512.png', 'URL do logo do header'),
  ('logo_footer', '/lovable-uploads/logo512x512.png', 'URL do logo do footer')
ON CONFLICT (key) DO NOTHING;

-- Adicionar triggers de updated_at para todas as tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers nas tabelas que têm updated_at
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'campaigns', 'donations', 'donation_subscriptions', 
        'asaas_transactions', 'system_settings'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON public.%s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;
