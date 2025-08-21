-- CRIAÇÃO DIRETA DAS TABELAS DE CAMPANHAS
-- Execute este script no Supabase SQL Editor
-- Data: 2025-08-21

-- Criar tabela campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    goal_amount numeric(10,2) NOT NULL CHECK (goal_amount > 0),
    raised_amount numeric(10,2) DEFAULT 0,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'draft')),
    donation_type text DEFAULT 'both' CHECK (donation_type IN ('one_time', 'recurring', 'both')),
    suggested_amounts jsonb DEFAULT '[25, 50, 100, 250, 500]',
    allow_custom_amount boolean DEFAULT true,
    created_by_email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela donations
CREATE TABLE IF NOT EXISTS public.donations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
    organizer_id uuid REFERENCES organizers(id),
    donor_name text NOT NULL,
    donor_email text NOT NULL,
    amount numeric(10,2) NOT NULL CHECK (amount > 0),
    donation_type text NOT NULL CHECK (donation_type IN ('one_time', 'recurring')),
    is_recurring_subsequent boolean DEFAULT false,
    payment_status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now()
);

-- Função para buscar campanhas
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
        c.id, c.title, c.description, c.goal_amount, c.raised_amount,
        c.start_date, c.end_date, c.status, c.donation_type,
        c.suggested_amounts, c.allow_custom_amount, c.created_by_email,
        c.created_at, c.updated_at
    FROM public.campaigns c
    ORDER BY c.created_at DESC;
END;
$$;

-- Função para estatísticas
CREATE OR REPLACE FUNCTION get_campaign_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'total_campaigns', (SELECT COUNT(*) FROM campaigns),
        'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
        'total_raised', (SELECT COALESCE(SUM(raised_amount), 0) FROM campaigns),
        'total_donors', 0,
        'avg_donation', 0,
        'completion_rate', 0
    );
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION get_all_campaigns TO public;
GRANT EXECUTE ON FUNCTION get_campaign_stats TO public;

-- Inserir dados de teste
INSERT INTO campaigns (title, description, goal_amount, start_date, end_date, status, created_by_email)
VALUES ('Campanha de Natal 2024', 'Arrecadação para atendimentos especiais durante o período natalino', 50000, '2024-12-01', '2024-12-31', 'active', 'rcarraro@admin.enxergar')
ON CONFLICT DO NOTHING;

-- Verificar se foi criado
SELECT 'SETUP CONCLUÍDO - ' || COUNT(*) || ' campanhas criadas' as resultado FROM campaigns;