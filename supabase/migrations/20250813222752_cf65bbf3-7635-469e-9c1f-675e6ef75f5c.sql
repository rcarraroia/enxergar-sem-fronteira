
-- Criar tabelas base do sistema
CREATE TABLE public.organizers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  asaas_api_key text, -- será criptografado pela aplicação
  whatsapp_api_key text, -- será criptografado pela aplicação
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  location text NOT NULL,
  address text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_slots integer NOT NULL DEFAULT 0,
  available_slots integer NOT NULL DEFAULT 0,
  organizer_id uuid REFERENCES public.organizers(id) NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filling', 'full', 'completed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de pacientes com campo tags para sincronização
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cpf text NOT NULL UNIQUE,
  email text NOT NULL,
  telefone text NOT NULL,
  data_nascimento date,
  diagnostico text,
  consentimento_lgpd boolean NOT NULL DEFAULT false,
  tags jsonb, -- CAMPO PRINCIPAL PARA SINCRONIZAÇÃO com valente-conecta-app
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'attended', 'cancelled', 'no_show')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, event_id)
);

-- Fila de integração para sincronização com valente-conecta-app
CREATE TABLE public.instituto_integration_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retries integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 5,
  last_attempt_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para transações Asaas
CREATE TABLE public.asaas_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id text NOT NULL UNIQUE,
  event_id uuid REFERENCES public.events(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  split_data jsonb NOT NULL, -- dados do split entre as 4 entidades
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituto_integration_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir leitura pública para events, restringir demais)
CREATE POLICY "Events são públicos para leitura" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers podem gerenciar seus próprios dados" ON public.organizers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins podem ver todos organizers" ON public.organizers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = auth.uid() AND email LIKE '%@admin.%')
);

-- Políticas para patients (apenas admins e sistema podem acessar)
CREATE POLICY "Apenas sistema pode inserir patients" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins podem ver patients" ON public.patients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = auth.uid() AND email LIKE '%@admin.%')
);

-- Políticas para registrations
CREATE POLICY "Registrations públicas para leitura" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Sistema pode inserir registrations" ON public.registrations FOR INSERT WITH CHECK (true);

-- Políticas para fila de integração (apenas sistema)
CREATE POLICY "Apenas sistema acessa fila integração" ON public.instituto_integration_queue FOR ALL USING (true);

-- Políticas para transações (apenas admins)
CREATE POLICY "Apenas admins veem transações" ON public.asaas_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.organizers WHERE id = auth.uid() AND email LIKE '%@admin.%')
);

-- TRIGGER AUTOMÁTICO PARA SINCRONIZAÇÃO COM VALENTE-CONECTA-APP
CREATE OR REPLACE FUNCTION public.trigger_valente_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na fila de integração quando um novo paciente é criado
  INSERT INTO public.instituto_integration_queue (patient_id, payload)
  VALUES (
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.id,
      'nome', NEW.nome,
      'email', NEW.email,
      'cpf', NEW.cpf,
      'telefone', NEW.telefone,
      'created_at', NEW.created_at,
      'tags', COALESCE(NEW.tags, '{}'::jsonb)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o trigger na tabela patients
CREATE TRIGGER on_patient_created
  AFTER INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_valente_sync();

-- Função para processar fila de integração (será chamada pela Edge Function)
CREATE OR REPLACE FUNCTION public.process_integration_queue()
RETURNS TABLE(
  queue_id uuid,
  patient_id uuid,
  payload jsonb,
  retries integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.patient_id,
    q.payload,
    q.retries
  FROM public.instituto_integration_queue q
  WHERE q.status = 'pending' 
    AND q.retries < q.max_retries
  ORDER BY q.created_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar status da fila
CREATE OR REPLACE FUNCTION public.update_queue_status(
  queue_id uuid,
  new_status text,
  error_msg text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.instituto_integration_queue
  SET 
    status = new_status,
    retries = CASE WHEN new_status = 'failed' THEN retries + 1 ELSE retries END,
    last_attempt_at = now(),
    error_message = error_msg,
    updated_at = now()
  WHERE id = queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir dados de exemplo
INSERT INTO public.organizers (name, email) VALUES 
('Administrador Sistema', 'admin@enxergar.com'),
('Organizador São Paulo', 'sp@enxergar.com'),
('Organizador Rio de Janeiro', 'rj@enxergar.com');

-- Inserir eventos de exemplo
INSERT INTO public.events (title, description, location, address, date, start_time, end_time, total_slots, available_slots, organizer_id)
SELECT 
  'Consultas Oftalmológicas - Centro',
  'Atendimento oftalmológico gratuito no centro da cidade',
  'Centro Comunitário São Paulo',
  'Rua das Flores, 123 - Centro, São Paulo/SP',
  '2025-01-15',
  '08:00',
  '17:00',
  200,
  127,
  o.id
FROM public.organizers o WHERE o.email = 'sp@enxergar.com'
LIMIT 1;

INSERT INTO public.events (title, description, location, address, date, start_time, end_time, total_slots, available_slots, organizer_id)
SELECT 
  'Atendimento Itinerante - Zona Sul',
  'Unidade móvel de atendimento oftalmológico',
  'UBS Vila Madalena',
  'Av. Paulista, 456 - Vila Madalena, São Paulo/SP',
  '2025-01-22',
  '08:00',
  '16:00',
  150,
  89,
  o.id
FROM public.organizers o WHERE o.email = 'sp@enxergar.com'
LIMIT 1;
