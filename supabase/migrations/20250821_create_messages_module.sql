-- =====================================================
-- MÓDULO DE MENSAGENS - ESTRUTURA DE DADOS
-- =====================================================

-- Tabela para armazenar templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  subject VARCHAR(500), -- Para emails
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array de variáveis disponíveis
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para armazenar regras de automação
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL, -- ex: 'on_registration_success'
  conditions JSONB DEFAULT '{}'::jsonb, -- Condições para ativar a regra
  template_id UUID REFERENCES message_templates(id),
  delay_minutes INTEGER DEFAULT 0, -- Delay antes do envio
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela principal para registrar mensagens enviadas
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('patient', 'promoter', 'donor', 'admin')),
  recipient_id UUID, -- ID do destinatário (pode ser patient_id, promoter_id, etc)
  recipient_contact VARCHAR(255) NOT NULL, -- Email, telefone, etc
  subject VARCHAR(500), -- Para emails
  content TEXT NOT NULL,
  template_id UUID REFERENCES message_templates(id),
  automation_rule_id UUID REFERENCES automation_rules(id),
  
  -- Status e controle de envio
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados e logs
  provider_response JSONB, -- Resposta da API (Resend, Vonage, etc)
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Contexto da mensagem
  context JSONB DEFAULT '{}'::jsonb, -- Dados adicionais (event_id, campaign_id, etc)
  variables JSONB DEFAULT '{}'::jsonb, -- Variáveis usadas na personalização
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs detalhados
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'sent', 'delivered', 'failed', 'webhook_received'
  event_data JSONB DEFAULT '{}'::jsonb,
  provider VARCHAR(50), -- 'resend', 'vonage', etc
  webhook_data JSONB, -- Dados do webhook recebido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_message_id ON message_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_event, is_active);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (apenas admins podem gerenciar)
CREATE POLICY "Admin can manage templates" ON message_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND status = 'active'
  )
);

CREATE POLICY "Admin can manage automation rules" ON automation_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND status = 'active'
  )
);

CREATE POLICY "Admin can view all messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND status = 'active'
  )
);

CREATE POLICY "System can insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update messages" ON messages FOR UPDATE USING (true);

CREATE POLICY "Admin can view message logs" ON message_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
    AND status = 'active'
  )
);

CREATE POLICY "System can insert message logs" ON message_logs FOR INSERT WITH CHECK (true);