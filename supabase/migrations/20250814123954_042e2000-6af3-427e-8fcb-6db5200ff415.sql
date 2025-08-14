
-- Criar tabela de campanhas
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_id UUID REFERENCES public.events(id),
  goal_amount DECIMAL(10,2),
  current_amount DECIMAL(10,2) DEFAULT 0,
  suggested_amounts JSONB DEFAULT '[25, 50, 100, 200]'::jsonb,
  allow_custom_amount BOOLEAN DEFAULT true,
  allow_subscriptions BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  image_url TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.organizers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de doações
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) NOT NULL,
  donor_name VARCHAR(255),
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  donation_type VARCHAR(20) NOT NULL DEFAULT 'one_time',
  payment_id VARCHAR(255) UNIQUE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  asaas_subscription_id VARCHAR(255),
  split_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de assinaturas
CREATE TABLE public.donation_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id),
  campaign_id UUID REFERENCES public.campaigns(id),
  subscriber_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  asaas_subscription_id VARCHAR(255) UNIQUE,
  next_charge_date DATE,
  total_charges INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para campaigns
CREATE POLICY "Campanhas são públicas para leitura" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar campanhas" ON public.campaigns
  FOR ALL USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Políticas RLS para donations
CREATE POLICY "Admins podem ver doações" ON public.donations
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Sistema pode inserir doações" ON public.donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sistema pode atualizar doações" ON public.donations
  FOR UPDATE USING (true);

-- Políticas RLS para donation_subscriptions
CREATE POLICY "Admins podem ver assinaturas" ON public.donation_subscriptions
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Sistema pode gerenciar assinaturas" ON public.donation_subscriptions
  FOR ALL USING (true);

-- Índices para performance
CREATE INDEX idx_campaigns_slug ON public.campaigns(slug);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_event_id ON public.campaigns(event_id);
CREATE INDEX idx_donations_campaign_id ON public.donations(campaign_id);
CREATE INDEX idx_donations_payment_id ON public.donations(payment_id);
CREATE INDEX idx_donations_status ON public.donations(payment_status);
CREATE INDEX idx_subscriptions_campaign_id ON public.donation_subscriptions(campaign_id);
CREATE INDEX idx_subscriptions_email ON public.donation_subscriptions(subscriber_email);
CREATE INDEX idx_subscriptions_asaas_id ON public.donation_subscriptions(asaas_subscription_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.donation_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
