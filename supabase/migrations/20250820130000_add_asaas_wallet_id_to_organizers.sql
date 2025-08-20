-- Migration: Add asaas_wallet_id field to organizers table
-- Description: Adds wallet ID field for Asaas payment splits (25% commission)
-- Date: 2025-08-20

-- Add asaas_wallet_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizers' 
        AND column_name = 'asaas_wallet_id'
    ) THEN
        ALTER TABLE public.organizers 
        ADD COLUMN asaas_wallet_id text;
        
        -- Add comment for documentation
        COMMENT ON COLUMN public.organizers.asaas_wallet_id IS 'Asaas Wallet ID for payment splits (25% commission to promoter)';
        
        -- Create index for performance
        CREATE INDEX idx_organizers_asaas_wallet ON public.organizers(asaas_wallet_id) WHERE asaas_wallet_id IS NOT NULL;
    END IF;
END $$;

-- Log the migration
INSERT INTO public.system_settings (key, value, description) VALUES (
    'migration_asaas_wallet_id',
    jsonb_build_object(
        'implemented_at', now(),
        'description', 'Added asaas_wallet_id field to organizers table for payment splits',
        'commission_percentage', 25,
        'migration_version', '20250820130000'
    ),
    'Migration: Asaas Wallet ID field for promoter payment splits'
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = now();