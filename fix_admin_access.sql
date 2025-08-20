-- CORREÇÃO URGENTE: Garantir acesso admin para rcarraro@admin.enxergar
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela organizers existe e tem o usuário
SELECT * FROM organizers WHERE email = 'rcarraro@admin.enxergar';

-- 2. Se não existir, criar o registro
INSERT INTO organizers (name, email, status, role) 
VALUES ('Admin Sistema', 'rcarraro@admin.enxergar', 'active', 'admin')
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  status = 'active',
  updated_at = now();

-- 3. Verificar se o campo role existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizers' AND column_name = 'role') THEN
        ALTER TABLE organizers ADD COLUMN role text DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer'));
        UPDATE organizers SET role = 'admin' WHERE email LIKE '%@admin.%' OR email = 'rcarraro@admin.enxergar';
    END IF;
END $$;

-- 4. Confirmar que o usuário está configurado corretamente
SELECT email, role, status FROM organizers WHERE email = 'rcarraro@admin.enxergar';