-- Validation Script: Role-Based System
-- Description: Validate that the role-based system is working correctly
-- Date: 2025-08-23

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- 1. Check if role column exists
SELECT
  'Role Column Status' as check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.columns
WHERE table_name = 'organizers'
AND column_name = 'role'
AND table_schema = 'public';

-- 2. Check role distribution
SELECT
  'Role Distribution' as check_name,
  role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM public.organizers
GROUP BY role
ORDER BY role;

-- 3. Check if is_admin_user function exists and is updated
SELECT
  'Admin Function Status' as check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_proc
WHERE proname = 'is_admin_user';

-- 4. Check function source to verify it uses role-based system
SELECT
  'Function Implementation' as check_name,
  CASE
    WHEN prosrc LIKE '%role = ''admin''%' THEN '✅ ROLE-BASED'
    WHEN prosrc LIKE '%@admin%' THEN '❌ EMAIL-BASED'
    ELSE '⚠️ UNKNOWN'
  END as status
FROM pg_proc
WHERE proname = 'is_admin_user';

-- 5. Check for any remaining email-based policies
SELECT
  'Email-based Policies' as check_name,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ NONE FOUND'
    ELSE '⚠️ FOUND - NEEDS REVIEW'
  END as status
FROM pg_policies
WHERE qual::text LIKE '%@admin%'
OR qual::text LIKE '%admin.%';

-- 6. List any email-based policies that need updating
SELECT
  'Policies Needing Update' as info,
  schemaname,
  tablename,
  policyname,
  qual::text as policy_definition
FROM pg_policies
WHERE qual::text LIKE '%@admin%'
OR qual::text LIKE '%admin.%'
ORDER BY tablename, policyname;

-- 7. Check admin users
SELECT
  'Admin Users' as check_name,
  name,
  email,
  role,
  status,
  created_at
FROM public.organizers
WHERE role = 'admin'
ORDER BY created_at;

-- 8. Check if audit table exists
SELECT
  'Audit Table Status' as check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables
WHERE table_name = 'role_audit_log'
AND table_schema = 'public';

-- 9. Test role functions (if current user is admin)
SELECT
  'Role Function Test' as check_name,
  'is_admin_user()' as function_name,
  CASE
    WHEN is_admin_user() THEN '✅ ADMIN ACCESS'
    ELSE '❌ NO ADMIN ACCESS'
  END as result;

-- 10. Check helper functions
SELECT
  'Helper Functions' as check_name,
  proname as function_name,
  '✅ EXISTS' as status
FROM pg_proc
WHERE proname IN ('has_role', 'get_user_role', 'assign_user_role')
ORDER BY proname;

-- ============================================================================
-- SECURITY VALIDATION
-- ============================================================================

-- Check that no users have null roles
SELECT
  'Null Roles Check' as check_name,
  COUNT(*) as null_role_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ NO NULL ROLES'
    ELSE '⚠️ NULL ROLES FOUND'
  END as status
FROM public.organizers
WHERE role IS NULL;

-- Check that all roles are valid
SELECT
  'Invalid Roles Check' as check_name,
  COUNT(*) as invalid_role_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ALL ROLES VALID'
    ELSE '⚠️ INVALID ROLES FOUND'
  END as status
FROM public.organizers
WHERE role NOT IN ('admin', 'organizer', 'viewer');

-- ============================================================================
-- PERFORMANCE CHECK
-- ============================================================================

-- Check if performance indexes exist
SELECT
  'Performance Indexes' as check_name,
  indexname,
  '✅ EXISTS' as status
FROM pg_indexes
WHERE tablename = 'organizers'
AND (indexname LIKE '%role%' OR indexname LIKE '%status%')
ORDER BY indexname;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT
  '=== ROLE SYSTEM VALIDATION SUMMARY ===' as summary;

SELECT
  'Total Users' as metric,
  COUNT(*) as value
FROM public.organizers
UNION ALL
SELECT
  'Admin Users' as metric,
  COUNT(*) as value
FROM public.organizers WHERE role = 'admin'
UNION ALL
SELECT
  'Organizer Users' as metric,
  COUNT(*) as value
FROM public.organizers WHERE role = 'organizer'
UNION ALL
SELECT
  'Viewer Users' as metric,
  COUNT(*) as value
FROM public.organizers WHERE role = 'viewer'
UNION ALL
SELECT
  'Active Users' as metric,
  COUNT(*) as value
FROM public.organizers WHERE status = 'active';

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

DO $$
DECLARE
  admin_count integer;
  null_roles integer;
  invalid_roles integer;
  email_policies integer;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO admin_count FROM public.organizers WHERE role = 'admin';
  SELECT COUNT(*) INTO null_roles FROM public.organizers WHERE role IS NULL;
  SELECT COUNT(*) INTO invalid_roles FROM public.organizers WHERE role NOT IN ('admin', 'organizer', 'viewer');
  SELECT COUNT(*) INTO email_policies FROM pg_policies WHERE qual::text LIKE '%@admin%';

  RAISE NOTICE '';
  RAISE NOTICE '📋 VALIDATION RECOMMENDATIONS:';
  RAISE NOTICE '';

  IF admin_count = 0 THEN
    RAISE NOTICE '🚨 CRITICAL: No admin users found. Create at least one admin user.';
  ELSE
    RAISE NOTICE '✅ Admin users: % found', admin_count;
  END IF;

  IF null_roles > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % users have null roles. Update them.', null_roles;
  ELSE
    RAISE NOTICE '✅ All users have valid roles assigned';
  END IF;

  IF invalid_roles > 0 THEN
    RAISE NOTICE '🚨 ERROR: % users have invalid roles. Fix immediately.', invalid_roles;
  ELSE
    RAISE NOTICE '✅ All roles are valid';
  END IF;

  IF email_policies > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % policies still use email-based verification. Update them.', email_policies;
  ELSE
    RAISE NOTICE '✅ No email-based policies found';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '1. Test admin access in application';
  RAISE NOTICE '2. Verify all RLS policies work correctly';
  RAISE NOTICE '3. Update frontend to use new role system';
  RAISE NOTICE '4. Monitor audit logs for role changes';
  RAISE NOTICE '';
END $$;
