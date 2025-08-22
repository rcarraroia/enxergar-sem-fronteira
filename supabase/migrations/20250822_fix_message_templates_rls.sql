-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA MÓDULO DE MENSAGENS
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin can manage templates" ON message_templates;
DROP POLICY IF EXISTS "Admin can manage automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Admin can view all messages" ON messages;
DROP POLICY IF EXISTS "Admin can view message logs" ON message_logs;

-- Criar políticas mais flexíveis baseadas em email admin
CREATE POLICY "Admin can manage templates" ON message_templates FOR ALL USING (
  -- Permitir para usuários autenticados com email admin
  auth.jwt() ->> 'email' LIKE '%@admin.%' OR
  -- Ou se existe na tabela organizers (fallback)
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Admin can manage automation rules" ON automation_rules FOR ALL USING (
  -- Permitir para usuários autenticados com email admin
  auth.jwt() ->> 'email' LIKE '%@admin.%' OR
  -- Ou se existe na tabela organizers (fallback)
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Admin can view all messages" ON messages FOR SELECT USING (
  -- Permitir para usuários autenticados com email admin
  auth.jwt() ->> 'email' LIKE '%@admin.%' OR
  -- Ou se existe na tabela organizers (fallback)
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Admin can view message logs" ON message_logs FOR SELECT USING (
  -- Permitir para usuários autenticados com email admin
  auth.jwt() ->> 'email' LIKE '%@admin.%' OR
  -- Ou se existe na tabela organizers (fallback)
  EXISTS (
    SELECT 1 FROM public.organizers 
    WHERE id = auth.uid()
  )
);

-- Manter políticas do sistema para inserção/atualização
-- (já existem e estão funcionando)