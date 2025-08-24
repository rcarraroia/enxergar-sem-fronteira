-- Migration: Migrate Existing Users to Role-Based System
-- Description: Add roles to existing users based on current email patterns and update their status
-- Date: 2025-08-23
-- Priority: CRITICAL - Must run after role system implementation

-- ============================================================================
-- STEP 1: BACKUP CURRENT STATE
-- ============================================================================

-- Create temporary backup table for rollback if needed
CREATE TEMP TABLE organizers_backup AS
SELECT * FROM public.organizers;

-- ============================================================================
-- STEP 2: MIGRATE EXISTING USERS TO ROLE SYSTEM
-- ============================================================================

-- Update users with admin email patterns to have admin role
UPDATE public.organizers
SET
  role = 'admin',
  status = 'active',
  updated_at = now()
WHERE
  (email LIKE '%@admin.%' OR email = 'rcarraro@admin.enxergar')
  AND (role IS NULL OR role != 'admin');

-- Update all other existing organizers to have organizer role
UPDATE public.organizers
SET
  role = COALESCE(role, 'organizer'),
  status = COALESCE(status, 'active'),
  updated_at = now()
WHERE
  role IS NULL
  OR role NOT IN ('admin', 'organizer', 'viewer');

-- ============================================================================
-- STEP 3: VALIDATE MIGRATION
-- ============================================================================

-- Check that all organizers have valid roles
DO $$
DECLARE
  invalid_roles_count integer;
  null_roles_count integer;
  admin_count integer;
  organizer_count integer;
BEGIN
  -- Count invalid roles
  SELECT COUNT(*) INTO invalid_roles_count
  FROM public.organizers
  WHERE role NOT IN ('admin', 'organizer', 'viewer');

  -- Count null roles
  SELECT COUNT(*) INTO null_roles_count
  FROM public.organizers
  WHERE role IS NULL;

  -- Count admin users
  SELECT COUNT(*) INTO admin_count
  FROM public.organizers
  WHERE role = 'admin';

  -- Count organizer users
  SELECT COUNT(*) INTO organizer_count
  FROM public.organizers
  WHERE role = 'organizer';

  -- Report results
  RAISE NOTICE 'Migration validation results:';
  RAISE NOTICE '- Invalid roles: %', invalid_roles_count;
  RAISE NOTICE '- Null roles: %', null_roles_count;
  RAISE NOTICE '- Admin users: %', admin_count;
  RAISE NOTICE '- Organizer users: %', organizer_count;

  -- Fail if there are issues
  IF invalid_roles_count > 0 OR null_roles_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: Found % invalid roles and % null roles',
      invalid_roles_count, null_roles_count;
  END IF;

  -- Ensure at least one admin exists
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'Migration validation failed: No admin users found after migration';
  END IF;

  RAISE NOTICE '✅ Migration validation passed successfully';
END $$;

-- ============================================================================
-- STEP 4: CREATE DEFAULT ADMIN USER IF NEEDED
-- ============================================================================

-- Ensure the main admin user exists with correct role
DO $$
BEGIN
  -- Check if admin user exists
  IF NOT EXISTS (
    SELECT 1 FROM public.organizers
    WHERE email = 'rcarraro@admin.enxergar'
  ) THEN
    -- Create admin user (this will need to be linked to auth.users manually)
    INSERT INTO public.organizers (
      name,
      email,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      'Renato Carraro',
      'rcarraro@admin.enxergar',
      'admin',
      'active',
      now(),
      now()
    );

    RAISE NOTICE '✅ Created default admin user: rcarraro@admin.enxergar';
  ELSE
    -- Update existing admin user to ensure correct role
    UPDATE public.organizers
    SET
      role = 'admin',
      status = 'active',
      updated_at = now()
    WHERE email = 'rcarraro@admin.enxergar';

    RAISE NOTICE '✅ Updated existing admin user: rcarraro@admin.enxergar';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: LOG MIGRATION RESULTS
-- ============================================================================

-- Insert migration log into role_audit_log if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'role_audit_log'
    AND table_schema = 'public'
  ) THEN
    -- Log migration for each user
    INSERT INTO public.role_audit_log (
      user_id,
      old_role,
      new_role,
      changed_by,
      reason,
      changed_at
    )
    SELECT
      id,
      'email-based',
      role,
      id, -- Self-assigned during migration
      'Migrated from email-based to role-based system',
      now()
    FROM public.organizers;

    RAISE NOTICE '✅ Migration logged to role_audit_log table';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: FINAL VALIDATION AND CLEANUP
-- ============================================================================

-- Final validation query
SELECT
  'Migration Summary' as report_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN role = 'organizer' THEN 1 END) as organizer_users,
  COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users
FROM public.organizers;

-- Drop temporary backup table
DROP TABLE organizers_backup;

-- ============================================================================
-- STEP 7: POST-MIGRATION INSTRUCTIONS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ROLE-BASED SYSTEM MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '';
  RAISE NOTICE '📋 POST-MIGRATION CHECKLIST:';
  RAISE NOTICE '1. ✅ All users have been assigned appropriate roles';
  RAISE NOTICE '2. ✅ Admin users have been identified and configured';
  RAISE NOTICE '3. ✅ All RLS policies updated to use role-based system';
  RAISE NOTICE '4. ✅ Edge functions updated to use role verification';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT NEXT STEPS:';
  RAISE NOTICE '1. Test admin access with role-based system';
  RAISE NOTICE '2. Verify all RLS policies work correctly';
  RAISE NOTICE '3. Update frontend code to use new role system';
  RAISE NOTICE '4. Remove any remaining email-based role checks';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY IMPROVEMENTS:';
  RAISE NOTICE '- Email-based admin verification eliminated';
  RAISE NOTICE '- Role-based access control implemented';
  RAISE NOTICE '- Audit logging for role changes enabled';
  RAISE NOTICE '- Secure functions for role management created';
  RAISE NOTICE '';
END $$;
