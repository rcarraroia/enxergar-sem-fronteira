-- FUNÇÕES SQL PARA MÓDULO DE CAMPANHAS
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-21

-- ============================================================================
-- PARTE 1: Criar tabelas necessárias (se não existirem)
-- ============================================================================

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    goal_amount numeric(10,2) NOT NULL CHECK (goal_amount > 0),
    raised_amount numeric(10,2) DEFAULT 0 CHECK (raised_amount >= 0),
    start_date date NOT NULL,
    end_date date NOT NULL CHECK (end_date > start_date),
    status text DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'completed', 'draft')),
    donation_type text DEFAULT 'both' CHECK (donation_type IN ('one_time', 'recurring', 'both')),
    suggested_amounts jsonb DEFAULT '[25, 50, 100, 250, 500]',
    allow_custom_amount boolean DEFAULT true,
    created_by uuid REFERENCES organizers(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de doações
CREATE TABLE IF NOT EXISTS public.donations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
    organizer_id uuid REFERENCES organizers(id),
    donor_name text NOT NULL,
    donor_email text NOT NULL,
    amount numeric(10,2) NOT NULL CHECK (amount > 0),
    donation_type text NOT NULL CHECK (donation_type IN ('one_time', 'recurring')),
    is_recurring_subsequent boolean DEFAULT false,
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    asaas_payment_id text,
    asaas_subscription_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de splits de doação
CREATE TABLE IF NOT EXISTS public.donation_splits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    donation_id uuid REFERENCES donations(id) ON DELETE CASCADE,
    total_amount numeric(10,2) NOT NULL,
    ong_amount numeric(10,2) NOT NULL DEFAULT 0,          -- ONG Coração Valente
    project_amount numeric(10,2) NOT NULL DEFAULT 0,      -- Projeto Visão Itinerante
    renum_amount numeric(10,2) NOT NULL DEFAULT 0,        -- Renum (Sistema)
    promoter_amount numeric(10,2) NOT NULL DEFAULT 0,     -- Promoter Local
    organizer_id uuid REFERENCES organizers(id),
    split_type text NOT NULL CHECK (split_type IN ('first_donation', 'recurring_subsequent', 'promoter_fallback')),
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_organizer ON donations(organizer_id);
CREATE INDEX IF NOT EXISTS idx_donation_splits_donation ON donation_splits(donation_id);

-- ============================================================================
-- PARTE 2: Função para buscar todas as campanhas (bypass RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_campaigns()
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    goal_amount numeric,
    raised_amount numeric,
    start_date date,
    end_date date,
    status text,
    donation_type text,
    suggested_amounts jsonb,
    allow_custom_amount boolean,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER -- Bypassa RLS
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.goal_amount,
        c.raised_amount,
        c.start_date,
        c.end_date,
        c.status,
        c.donation_type,
        c.suggested_amounts,
        c.allow_custom_amount,
        c.created_by,
        c.created_at,
        c.updated_at
    FROM public.campaigns c
    ORDER BY c.created_at DESC;
END;
$$;

-- ============================================================================
-- PARTE 3: Função para estatísticas de campanhas
-- ============================================================================

CREATE OR REPLACE FUNCTION get_campaign_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats jsonb;
    total_campaigns integer;
    active_campaigns integer;
    total_raised numeric;
    total_donors integer;
    avg_donation numeric;
    completion_rate numeric;
BEGIN
    -- Total de campanhas
    SELECT COUNT(*) INTO total_campaigns FROM campaigns;
    
    -- Campanhas ativas
    SELECT COUNT(*) INTO active_campaigns FROM campaigns WHERE status = 'active';
    
    -- Total arrecadado
    SELECT COALESCE(SUM(raised_amount), 0) INTO total_raised FROM campaigns;
    
    -- Total de doadores únicos
    SELECT COUNT(DISTINCT donor_email) INTO total_donors FROM donations WHERE payment_status = 'completed';
    
    -- Doação média
    SELECT COALESCE(AVG(amount), 0) INTO avg_donation FROM donations WHERE payment_status = 'completed';
    
    -- Taxa de conclusão (campanhas que atingiram a meta)
    SELECT 
        CASE 
            WHEN total_campaigns > 0 THEN 
                (COUNT(*) FILTER (WHERE raised_amount >= goal_amount) * 100.0 / total_campaigns)
            ELSE 0 
        END INTO completion_rate
    FROM campaigns;
    
    -- Montar JSON de resposta
    stats := jsonb_build_object(
        'total_campaigns', total_campaigns,
        'active_campaigns', active_campaigns,
        'total_raised', total_raised,
        'total_donors', total_donors,
        'avg_donation', avg_donation,
        'completion_rate', completion_rate
    );
    
    RETURN stats;
END;
$$;

-- ============================================================================
-- PARTE 4: Função para criar campanha (bypass RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_create_campaign(
    p_title text,
    p_description text,
    p_goal_amount numeric,
    p_start_date date,
    p_end_date date,
    p_donation_type text,
    p_suggested_amounts numeric[],
    p_allow_custom_amount boolean
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_campaign_id uuid;
    current_user_email text;
    current_user_id uuid;
BEGIN
    -- Verificar se o usuário atual é admin
    current_user_email := auth.jwt() ->> 'email';
    
    -- Buscar ID do usuário admin
    SELECT id INTO current_user_id
    FROM public.organizers 
    WHERE email = current_user_email 
    AND (role = 'admin' OR email LIKE '%@admin.%')
    AND status = 'active';
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é admin ativo';
    END IF;
    
    -- Log para debug
    RAISE NOTICE 'Criando campanha: % por %', p_title, current_user_email;
    
    -- Validações
    IF p_start_date >= p_end_date THEN
        RAISE EXCEPTION 'Data de início deve ser anterior à data de fim';
    END IF;
    
    IF p_goal_amount <= 0 THEN
        RAISE EXCEPTION 'Meta de arrecadação deve ser maior que zero';
    END IF;
    
    -- Inserir campanha
    INSERT INTO public.campaigns (
        title,
        description,
        goal_amount,
        start_date,
        end_date,
        donation_type,
        suggested_amounts,
        allow_custom_amount,
        created_by,
        status
    ) VALUES (
        p_title,
        p_description,
        p_goal_amount,
        p_start_date,
        p_end_date,
        p_donation_type,
        to_jsonb(p_suggested_amounts),
        p_allow_custom_amount,
        current_user_id,
        'active'
    ) RETURNING id INTO new_campaign_id;
    
    RAISE NOTICE 'Campanha criada com ID: %', new_campaign_id;
    
    RETURN new_campaign_id;
END;
$$;

-- ============================================================================
-- PARTE 5: Função para atualizar campanha
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_update_campaign(
    p_campaign_id uuid,
    p_title text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_goal_amount numeric DEFAULT NULL,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_donation_type text DEFAULT NULL,
    p_suggested_amounts numeric[] DEFAULT NULL,
    p_allow_custom_amount boolean DEFAULT NULL,
    p_status text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_email text;
    update_count integer;
BEGIN
    -- Verificar se o usuário atual é admin
    current_user_email := auth.jwt() ->> 'email';
    
    IF NOT EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = current_user_email 
        AND (role = 'admin' OR email LIKE '%@admin.%')
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é admin ativo';
    END IF;
    
    -- Atualizar apenas campos fornecidos
    UPDATE public.campaigns SET
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        goal_amount = COALESCE(p_goal_amount, goal_amount),
        start_date = COALESCE(p_start_date, start_date),
        end_date = COALESCE(p_end_date, end_date),
        donation_type = COALESCE(p_donation_type, donation_type),
        suggested_amounts = COALESCE(to_jsonb(p_suggested_amounts), suggested_amounts),
        allow_custom_amount = COALESCE(p_allow_custom_amount, allow_custom_amount),
        status = COALESCE(p_status, status),
        updated_at = now()
    WHERE id = p_campaign_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RAISE EXCEPTION 'Campanha não encontrada: %', p_campaign_id;
    END IF;
    
    RAISE NOTICE 'Campanha % atualizada com sucesso', p_campaign_id;
    
    RETURN true;
END;
$$;

-- ============================================================================
-- PARTE 6: Função para deletar campanha
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_delete_campaign(
    p_campaign_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_email text;
    campaign_title text;
    donations_count integer;
    delete_count integer;
BEGIN
    -- Verificar se o usuário atual é admin
    current_user_email := auth.jwt() ->> 'email';
    
    IF NOT EXISTS (
        SELECT 1 FROM public.organizers 
        WHERE email = current_user_email 
        AND (role = 'admin' OR email LIKE '%@admin.%')
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: usuário não é admin ativo';
    END IF;
    
    -- Verificar se a campanha existe
    SELECT title INTO campaign_title
    FROM public.campaigns 
    WHERE id = p_campaign_id;
    
    IF campaign_title IS NULL THEN
        RAISE EXCEPTION 'Campanha não encontrada: %', p_campaign_id;
    END IF;
    
    -- Verificar se há doações associadas
    SELECT COUNT(*) INTO donations_count
    FROM public.donations 
    WHERE campaign_id = p_campaign_id;
    
    IF donations_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir a campanha "%" pois ela possui % doação(ões) associada(s)', 
                        campaign_title, donations_count;
    END IF;
    
    -- Deletar campanha
    DELETE FROM public.campaigns 
    WHERE id = p_campaign_id;
    
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    
    IF delete_count = 0 THEN
        RAISE EXCEPTION 'Falha ao deletar campanha %', p_campaign_id;
    END IF;
    
    RAISE NOTICE 'Campanha "%" deletada com sucesso', campaign_title;
    
    RETURN true;
END;
$$;

-- ============================================================================
-- PARTE 7: Função para processar doação com split automático
-- ============================================================================

CREATE OR REPLACE FUNCTION process_donation_with_split(
    p_campaign_id uuid,
    p_amount numeric,
    p_donor_email text,
    p_donor_name text,
    p_donation_type text,
    p_promoter_id uuid DEFAULT NULL,
    p_is_recurring_subsequent boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_donation_id uuid;
    new_split_id uuid;
    split_type text;
    ong_amount numeric := 0;
    project_amount numeric := 0;
    renum_amount numeric := 0;
    promoter_amount numeric := 0;
    promoter_has_api_key boolean := false;
    result jsonb;
BEGIN
    -- Verificar se a campanha existe e está ativa
    IF NOT EXISTS (SELECT 1 FROM campaigns WHERE id = p_campaign_id AND status = 'active') THEN
        RAISE EXCEPTION 'Campanha não encontrada ou inativa: %', p_campaign_id;
    END IF;
    
    -- Verificar se o promoter tem API Key válida (se fornecido)
    IF p_promoter_id IS NOT NULL THEN
        SELECT (asaas_api_key IS NOT NULL AND asaas_api_key != '') 
        INTO promoter_has_api_key
        FROM organizers 
        WHERE id = p_promoter_id AND status = 'active';
    END IF;
    
    -- Determinar tipo de split e calcular valores
    IF p_is_recurring_subsequent THEN
        -- Doações recorrentes subsequentes: 75% Renum + 25% Projeto
        split_type := 'recurring_subsequent';
        renum_amount := p_amount * 0.75;
        project_amount := p_amount * 0.25;
        ong_amount := 0;
        promoter_amount := 0;
    ELSE
        -- Doações pontuais e 1ª recorrente: 25% cada
        IF p_promoter_id IS NOT NULL AND promoter_has_api_key THEN
            split_type := 'first_donation';
            ong_amount := p_amount * 0.25;
            project_amount := p_amount * 0.25;
            renum_amount := p_amount * 0.25;
            promoter_amount := p_amount * 0.25;
        ELSE
            -- Promoter sem API Key: 25% vai para ONG
            split_type := 'promoter_fallback';
            ong_amount := p_amount * 0.50;  -- 25% normal + 25% do promoter
            project_amount := p_amount * 0.25;
            renum_amount := p_amount * 0.25;
            promoter_amount := 0;
        END IF;
    END IF;
    
    -- Inserir doação
    INSERT INTO public.donations (
        campaign_id,
        organizer_id,
        donor_name,
        donor_email,
        amount,
        donation_type,
        is_recurring_subsequent,
        payment_status
    ) VALUES (
        p_campaign_id,
        p_promoter_id,
        p_donor_name,
        p_donor_email,
        p_amount,
        p_donation_type,
        p_is_recurring_subsequent,
        'completed'
    ) RETURNING id INTO new_donation_id;
    
    -- Inserir split
    INSERT INTO public.donation_splits (
        donation_id,
        total_amount,
        ong_amount,
        project_amount,
        renum_amount,
        promoter_amount,
        organizer_id,
        split_type
    ) VALUES (
        new_donation_id,
        p_amount,
        ong_amount,
        project_amount,
        renum_amount,
        promoter_amount,
        p_promoter_id,
        split_type
    ) RETURNING id INTO new_split_id;
    
    -- Atualizar valor arrecadado da campanha
    UPDATE public.campaigns 
    SET raised_amount = raised_amount + p_amount,
        updated_at = now()
    WHERE id = p_campaign_id;
    
    -- Preparar resultado
    result := jsonb_build_object(
        'donation_id', new_donation_id,
        'split_id', new_split_id,
        'amount', p_amount,
        'split_type', split_type,
        'ong_amount', ong_amount,
        'project_amount', project_amount,
        'renum_amount', renum_amount,
        'promoter_amount', promoter_amount,
        'promoter_has_api_key', promoter_has_api_key
    );
    
    RAISE NOTICE 'Doação processada: % (Split: %)', p_amount, split_type;
    
    RETURN result;
END;
$$;

-- ============================================================================
-- PARTE 8: Dar permissões para as funções
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_all_campaigns TO public;
GRANT EXECUTE ON FUNCTION get_campaign_stats TO public;
GRANT EXECUTE ON FUNCTION admin_create_campaign TO public;
GRANT EXECUTE ON FUNCTION admin_update_campaign TO public;
GRANT EXECUTE ON FUNCTION admin_delete_campaign TO public;
GRANT EXECUTE ON FUNCTION process_donation_with_split TO public;

-- ============================================================================
-- PARTE 9: Inserir dados de teste
-- ============================================================================

-- Inserir campanha de teste
INSERT INTO public.campaigns (
    title,
    description,
    goal_amount,
    start_date,
    end_date,
    status,
    donation_type,
    suggested_amounts,
    allow_custom_amount,
    created_by
) VALUES (
    'Campanha de Natal 2024',
    'Arrecadação para atendimentos especiais durante o período natalino',
    50000.00,
    '2024-12-01',
    '2024-12-31',
    'active',
    'both',
    '[25, 50, 100, 250, 500]',
    true,
    (SELECT id FROM organizers WHERE email = 'rcarraro@admin.enxergar' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Log da criação
INSERT INTO public.system_settings (key, value, description) VALUES (
    'campaigns_module_setup',
    jsonb_build_object(
        'created_at', now(),
        'tables_created', true,
        'functions_created', true,
        'test_data_inserted', true,
        'version', '20250821_campaigns_v1'
    ),
    'Campaigns module setup completed'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ MÓDULO DE CAMPANHAS CONFIGURADO!';
    RAISE NOTICE '📊 Tabelas criadas: campaigns, donations, donation_splits';
    RAISE NOTICE '🔧 Funções criadas: get_all_campaigns, admin_create_campaign, etc.';
    RAISE NOTICE '🎯 Regras de split implementadas conforme documentação';
    RAISE NOTICE '🧪 Dados de teste inseridos';
END $$;