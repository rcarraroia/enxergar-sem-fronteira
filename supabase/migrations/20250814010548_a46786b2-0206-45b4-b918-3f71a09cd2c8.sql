
-- Criar tabela para múltiplas datas por evento
CREATE TABLE public.event_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  available_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.event_dates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para event_dates
CREATE POLICY "Event dates são públicas para leitura" 
  ON public.event_dates 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins podem criar event dates" 
  ON public.event_dates 
  FOR INSERT 
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins podem editar event dates" 
  ON public.event_dates 
  FOR UPDATE 
  USING (is_admin_user()) 
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins podem excluir event dates" 
  ON public.event_dates 
  FOR DELETE 
  USING (is_admin_user());

-- Migrar dados existentes da tabela events para event_dates
INSERT INTO public.event_dates (event_id, date, start_time, end_time, total_slots, available_slots)
SELECT 
  id as event_id,
  date,
  start_time,
  end_time,
  total_slots,
  available_slots
FROM public.events;

-- Remover colunas antigas da tabela events (agora serão gerenciadas via event_dates)
ALTER TABLE public.events 
DROP COLUMN date,
DROP COLUMN start_time,
DROP COLUMN end_time,
DROP COLUMN total_slots,
DROP COLUMN available_slots;

-- Modificar tabela registrations para referenciar event_date_id ao invés de event_id
ALTER TABLE public.registrations 
ADD COLUMN event_date_id UUID REFERENCES public.event_dates(id) ON DELETE CASCADE;

-- Migrar registrations existentes para usar event_date_id
UPDATE public.registrations 
SET event_date_id = (
  SELECT ed.id 
  FROM public.event_dates ed 
  WHERE ed.event_id = registrations.event_id 
  LIMIT 1
);

-- Tornar event_date_id obrigatório e remover event_id
ALTER TABLE public.registrations 
ALTER COLUMN event_date_id SET NOT NULL,
DROP COLUMN event_id;

-- Modificar tabela patient_access_tokens para usar event_date_id
ALTER TABLE public.patient_access_tokens 
ADD COLUMN event_date_id UUID REFERENCES public.event_dates(id) ON DELETE CASCADE;

-- Migrar tokens existentes
UPDATE public.patient_access_tokens 
SET event_date_id = (
  SELECT ed.id 
  FROM public.event_dates ed 
  WHERE ed.event_id = patient_access_tokens.event_id 
  LIMIT 1
);

-- Tornar event_date_id obrigatório e remover event_id
ALTER TABLE public.patient_access_tokens 
ALTER COLUMN event_date_id SET NOT NULL,
DROP COLUMN event_id;

-- Criar índices para melhor performance
CREATE INDEX idx_event_dates_event_id ON public.event_dates(event_id);
CREATE INDEX idx_event_dates_date ON public.event_dates(date);
CREATE INDEX idx_registrations_event_date_id ON public.registrations(event_date_id);
CREATE INDEX idx_patient_access_tokens_event_date_id ON public.patient_access_tokens(event_date_id);
