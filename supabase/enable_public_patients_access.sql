-- =====================================================
-- HABILITAR ACESSO PÚBLICO À TABELA PATIENTS
-- =====================================================
-- Permite que usuários anônimos criem registros de pacientes

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Users can only see their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can only insert their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can only update their own patients" ON public.patients;

-- Criar política para permitir inserção pública
CREATE POLICY "Allow public patient registration"
ON public.patients
FOR INSERT
TO public
WITH CHECK (true);

-- Criar política para permitir leitura pelos organizadores (se necessário)
CREATE POLICY "Allow organizers to read patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    INNER JOIN event_dates ed ON r.event_date_id = ed.id
    INNER JOIN events e ON ed.event_id = e.id
    WHERE r.patient_id = patients.id
    AND e.organizer_id = auth.uid()
  )
);

-- Verificar se RLS está habilitado
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Testar a política
SELECT 'Políticas aplicadas com sucesso!' as status;
