
-- Adicionar configurações das API Keys das 3 entidades fixas
INSERT INTO public.system_settings (key, value, description) VALUES
('asaas_ong_coracao_valente', '""', 'API Key do Asaas da ONG Coração Valente (25% do split)'),
('asaas_projeto_visao_itinerante', '""', 'API Key do Asaas do Projeto Visão Itinerante (25% do split)'),
('asaas_renum_tecnologia', '""', 'API Key do Asaas da Renum Tecnologia (25% do split)')
ON CONFLICT (key) DO NOTHING;
