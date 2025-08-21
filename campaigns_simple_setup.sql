-- SETUP SIMPLES PARA CAMPANHAS
-- Execute este script primeiro para criar as tabelas básicas
-- Data: 2025-08-21

-- ============================================================================
-- PARTE 1: Verificar estrutura da tabela organizers
-- ============================================================================

-- Verificar colunas da tabela organizers
SELECT 
    'COLUNAS DA TABELA ORGANIZERS' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'organizers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- PARTE 2: Criar tabelas básicas sem referências complexas
-- ============================================================================

-- Tabela de campanhas (simples)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    goal_amount numeric(10,2) NOT NULL CHECK (goal_amount > 0),
    raised_amount numeric(10,2) DEFAULT 0 CHECK (raised_amount >= 0),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'completed', 'draft')),
    donation_type text DEFAULT 'both' CHECK (donation_type IN ('one_time', 'recurring', 'both')),
    suggested_amounts jsonb DEFAULT '[25, 50, 100, 250, 500]',
    allow_custom_amount boolean DEFAULT true,
    created_by_email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de doações (simples)
CREATE TABLE IF NOT EXISTS public.donations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
    promoter_email text,
    donor_name text NOT NULL,
    donor_email text NOT NULL,
    amount numeric(10,2) NOT NULL CHECK (amount > 0),
    donation_type text NOT NULL CHECK (donation_type IN ('one_time', 'recurring')),
    is_recurring_subsequent boolean DEFAULT false,
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela de splits (simples)
CREATE TABLE IF NOT EXISTS public.donation_splits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    donation_id uuid REFERENCES donations(id) ON DELETE CASCADE,
    total_amount numeric(10,2) NOT NULL,
    ong_amount numeric(10,2) NOT NULL DEFAULT 0,
    project_amount numeric(10,2) NOT NULL DEFAULT 0,
    renum_amount numeric(10,2) NOT NULL DEFAULT 0,
    promoter_amount numeric(10,2) NOT NULL DEFAULT 0,
    promoter_email text,
    split_type text NOT NULL CHECK (split_type IN ('first_donation', 'recurring_subsequent', 'promoter_fallback')),
    created_at timestamp with time zone DEFAULT now()
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_id);

-- ============================================================================
-- PARTE 3: Função simples para buscar campanhas
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
    created_by_email text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
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
        c.created_by_email,
        c.created_at,
        c.updated_at
    FROM public.campaigns c
    ORDER BY c.created_at DESC;
END;
$$;

-- ============================================================================
-- PARTE 4: Função para estatísticas básicas
-- ============================================================================

CREATE OR REPLACE FUNCTION get_campaign_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_campaigns', COALESCE((SELECT COUNT(*) FROM campaigns), 0),
        'active_campaigns', COALESCE((SELECT COUNT(*) FROM campaigns WHERE status = 'active'), 0),
        'total_raised', COALESCE((SELECT SUM(raised_amount) FROM campaigns), 0),
        'total_donors', COALESCE((SELECT COUNT(DISTINCT donor_email) FROM donations WHERE payment_status = 'completed'), 0),
        'avg_donation', COALESCE((SELECT AVG(amount) FROM donations WHERE payment_status = 'completed'), 0),
        'completion_rate', 0
    ) INTO stats;
    
    RETURN stats;
END;
$$;

-- ============================================================================
-- PARTE 5: Função para criar campanha
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
BEGIN
    -- Obter email do usuário atual
    current_user_email := auth.jwt() ->> 'email';
    
    -- Validações básicas
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
        created_by_email,
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
        current_user_email,
        'active'
    ) RETURNING id INTO new_campaign_id;
    
    RAISE NOTICE 'Campanha criada: % por %', p_title, current_user_email;
    
    RETURN new_campaign_id;
END;
$$;

-- ============================================================================
-- PARTE 6: Dar permissões
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_all_campaigns TO public;
GRANT EXECUTE ON FUNCTION get_campaign_stats TO public;
GRANT EXECUTE ON FUNCTION admin_create_campaign TO public;

-- ============================================================================
-- PARTE 7: Inserir dados de teste
-- ============================================================================

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
    created_by_email
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
    'rcarraro@admin.enxergar'
) ON CONFLICT DO NOTHING;

-- Mensagem final
SELECT 'SETUP BÁSICO DE CAMPANHAS CONCLUÍDO!' as resultado;