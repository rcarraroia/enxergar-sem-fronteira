
-- Adicionar constraint única para CPF na tabela patients
ALTER TABLE public.patients ADD CONSTRAINT unique_cpf UNIQUE (cpf);

-- Criar função para validar CPF único antes da inserção
CREATE OR REPLACE FUNCTION validate_unique_patient()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe um paciente com o mesmo CPF
  IF EXISTS (SELECT 1 FROM public.patients WHERE cpf = NEW.cpf AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
    RAISE EXCEPTION 'Já existe um paciente cadastrado com este CPF: %', NEW.cpf;
  END IF;
  
  -- Verificar se já existe um paciente com o mesmo email
  IF EXISTS (SELECT 1 FROM public.patients WHERE email = NEW.email AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
    RAISE EXCEPTION 'Já existe um paciente cadastrado com este email: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a validação antes de inserir/atualizar
CREATE TRIGGER trigger_validate_unique_patient
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_patient();
