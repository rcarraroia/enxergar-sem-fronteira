-- CORREÇÃO URGENTE: Criar funções que estão faltando para Campanhas
-- Execute este SQL no Supabase SQL Editor

-- ============================================================================
-- REMOVER FUNÇÕES EXISTENTES PRIMEIRO
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_campaign_stats();
DROP FUNCTION IF EXISTS public.admin_create_campaign(text, text, numeric, date, date, text, jsonb, boolean);

-- ============================================================================
-- FUNÇÃO: admin_create_campaign
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_create_campaign(
    p_title text,
    p_description text,
    p_goal_amount numeric,
    p_start_date date,
    p_end_date date,
    p_donation_type text DEFAULT 'both',
    p_suggested_amounts jsonb DEFAULT '[25, 50, 100, 250, 500]',
    p_allow_custom_amount boolean DEFAULT true
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign_id uuid;
    v_result json;
    v_user_email text;
BEGIN
    -- Verificar se o usuário está autenticado
    v_user_email := auth.email();
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se é admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = v_user_email 
        AND (
            email LIKE '%@admin.enxergar%' 
            OR email = 'rcarraro@admin.enxergar'
            OR email = 'admin@enxergarsemfronteira.com.br'
        )
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar campanhas';
    END IF;

    -- Validações básicas
    IF p_title IS NULL OR trim(p_title) = '' THEN
        RAISE EXCEPTION 'Título é obrigatório';
    END IF;

    IF p_description IS NULL OR trim(p_description) = '' THEN
        RAISE EXCEPTION 'Descrição é obrigatória';
    END IF;

    IF p_goal_amount IS NULL OR p_goal_amount <= 0 THEN
        RAISE EXCEPTION 'Meta de arrecadação deve ser maior que zero';
    END IF;

    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Datas de início e fim são obrigatórias';
    END IF;

    IF p_end_date <= p_start_date THEN
        RAISE EXCEPTION 'Data de fim deve ser posterior à data de início';
    END IF;

    -- Criar a campanha
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
        trim(p_title),
        trim(p_description),
        p_goal_amount,
        p_start_date,
        p_end_date,
        p_donation_type,
        p_suggested_amounts,
        p_allow_custom_amount,
        v_user_email,
        'active'
    ) RETURNING id INTO v_campaign_id;

    -- Retornar resultado
    SELECT json_build_object(
        'id', v_campaign_id,
        'title', p_title,
        'description', p_description,
        'goal_amount', p_goal_amount,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'donation_type', p_donation_type,
        'status', 'active',
        'created_by_email', v_user_email,
        'created_at', now()
    ) INTO v_result;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar campanha: %', SQLERRM;
END;
$$;

-- ============================================================================
-- FUNÇÃO: get_campaign_stats
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_campaign_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
    v_user_email text;
BEGIN
    -- Verificar se o usuário está autenticado
    v_user_email := auth.email();
    
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se é admin
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = v_user_email 
        AND (
            email LIKE '%@admin.enxergar%' 
            OR email = 'rcarraro@admin.enxergar'
            OR email = 'admin@enxergarsemfronteira.com.br'
        )
    ) THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem ver estatísticas';
    END IF;

    -- Calcular estatísticas
    SELECT json_build_object(
        'total_campaigns', COALESCE((SELECT COUNT(*) FROM campaigns), 0),
        'active_campaigns', COALESCE((SELECT COUNT(*) FROM campaigns WHERE status = 'active'), 0),
        'total_raised', COALESCE((SELECT SUM(raised_amount) FROM campaigns), 0),
        'total_donors', COALESCE((SELECT COUNT(DISTINCT donor_email) FROM donations), 0)
    ) INTO v_result;

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao buscar estatísticas: %', SQLERRM;
END;
$$;

-- ============================================================================
-- PERMISSÕES RLS
-- ============================================================================

-- Habilitar RLS nas tabelas (se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'donations') THEN
        ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Política para campanhas (admins podem ver tudo)
DROP POLICY IF EXISTS "Admins podem gerenciar campanhas" ON public.campaigns;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        EXECUTE 'CREATE POLICY "Admins podem gerenciar campanhas" ON public.campaigns
            FOR ALL USING (
                auth.email() LIKE ''%@admin.enxergar%'' 
                OR auth.email() = ''rcarraro@admin.enxergar''
                OR auth.email() = ''admin@enxergarsemfronteira.com.br''
            )';
    END IF;
END $$;

-- Política para doações (admins podem ver tudo)
DROP POLICY IF EXISTS "Admins podem gerenciar doações" ON public.donations;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'donations') THEN
        EXECUTE 'CREATE POLICY "Admins podem gerenciar doações" ON public.donations
            FOR ALL USING (
                auth.email() LIKE ''%@admin.enxergar%'' 
                OR auth.email() = ''rcarraro@admin.enxergar''
                OR auth.email() = ''admin@enxergarsemfronteira.com.br''
            )';
    END IF;
END $$;

-- ============================================================================
-- GRANTS DE PERMISSÃO
-- ============================================================================

-- Permitir execução das funções para usuários autenticados
GRANT EXECUTE ON FUNCTION public.admin_create_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_stats TO authenticated;

-- Permitir acesso às tabelas para usuários autenticados (se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'donations') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
    END IF;
END $$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.admin_create_campaign IS 'Cria uma nova campanha de doação (apenas admins)';
COMMENT ON FUNCTION public.get_campaign_stats IS 'Retorna estatísticas das campanhas (apenas admins)';

-- Finalizado
SELECT 'Funções de campanhas criadas com sucesso!' as resultado;