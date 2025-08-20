
-- Atualizar o campo is_super_admin para true para o usuário específico
UPDATE auth.users 
SET is_super_admin = true 
WHERE email = 'rcarraro@admin.enxergar';
