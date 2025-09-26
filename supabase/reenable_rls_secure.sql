-- =====================================================
-- REABILITAR RLS COM POLÍTICAS CORRETAS
-- =====================================================
-- Execute APENAS depois de confirmar que as inscrições funcionam

-- 1. Reabilitar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas simples e funcionais
CREATE POLICY "allow_insert_patients"
ON public.patients
FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_select_patients_by_organizers"
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

-- 3. Verificar políticas criadas
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'patients'
ORDER BY policyname;

SELECT 'RLS reabilitado com segurança!' as status;
