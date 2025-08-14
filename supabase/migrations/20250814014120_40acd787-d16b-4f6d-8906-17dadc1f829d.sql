
-- 1. Corrigir políticas RLS da tabela instituto_integration_queue
-- Remover política atual que permite acesso público
DROP POLICY IF EXISTS "Apenas sistema acessa fila integração" ON public.instituto_integration_queue;

-- Criar política mais restritiva - apenas funções do sistema
CREATE POLICY "Sistema e admins acessam fila integração" 
ON public.instituto_integration_queue 
FOR ALL 
USING (is_admin_user());

-- 2. Corrigir políticas RLS da tabela registrations  
-- Adicionar política para admins poderem gerenciar registrations
CREATE POLICY "Admins podem gerenciar registrations" 
ON public.registrations 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 3. Adicionar search_path nas funções para prevenir SQL injection
CREATE OR REPLACE FUNCTION public.trigger_valente_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.process_integration_queue()
RETURNS TABLE(queue_id uuid, patient_id uuid, payload jsonb, retries integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_queue_status(queue_id uuid, new_status text, error_msg text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verificar se o email do usuário atual contém @admin.
  RETURN (
    SELECT CASE 
      WHEN auth.email() LIKE '%@admin.%' THEN true
      ELSE false
    END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_access_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$function$;
