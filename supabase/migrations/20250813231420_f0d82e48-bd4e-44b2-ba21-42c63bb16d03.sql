
-- Atualizar políticas RLS para permitir CRUD completo de eventos para administradores
-- Política para INSERT de eventos (apenas admins)
CREATE POLICY "Admins podem criar eventos" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizers 
    WHERE organizers.id = auth.uid() 
    AND organizers.email LIKE '%@admin.%'
  )
);

-- Política para UPDATE de eventos (apenas admins)
CREATE POLICY "Admins podem editar eventos" 
ON public.events 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizers 
    WHERE organizers.id = auth.uid() 
    AND organizers.email LIKE '%@admin.%'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizers 
    WHERE organizers.id = auth.uid() 
    AND organizers.email LIKE '%@admin.%'
  )
);

-- Política para DELETE de eventos (apenas admins)
CREATE POLICY "Admins podem excluir eventos" 
ON public.events 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organizers 
    WHERE organizers.id = auth.uid() 
    AND organizers.email LIKE '%@admin.%'
  )
);
