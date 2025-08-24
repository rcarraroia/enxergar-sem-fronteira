-- Quick Role System Validation
-- Description: Simple validation script for role-based system
-- Date: 2025-08-23

-- ============================================================================
-- BASIC VALIDATION CHECKS
-- ============================================================================

-- 1. Check if role column exists
SELECT
  'Role Column' as check_item,
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
  'Role: ' || COALESCE(role, 'NULL') as role_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM public.organizers
GROUP BY role
ORDER BY role;

-- 3. Check if is_admin_user function exists
SELECT
  'Admin Function' as check_item,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_proc
WHERE proname = 'is_admin_user';

-- 4. Test admin function (if logged in as admin)
SELECT
  'Admin Test' as check_item,
  CASE
    WHEN is_admin_user() THEN '✅ ADMIN ACCESS'
    ELSE '❌ NO ADMIN ACCESS'
  END as status;

-- 5. Check current user info
SELECT
  'Current User' as info_type,
  auth.uid() as user_id,
  auth.email() as user_email;

-- 6. Check if current user is in organizers table
SELECT
  'User in Organizers' as check_item,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ FOUND'
    ELSE '❌ NOT FOUND'
  END as status,
  MAX(role) as user_role,
  MAX(status) as user_status
FROM public.organizers
WHERE id = auth.uid();

-- 7. Check admin users
SELECT
  'Admin Users Found' as info_type,
  name,
  email,
  role,
  status
FROM public.organizers
WHERE role = 'admin'
ORDER BY created_at;

-- 8. Check helper functions
SELECT
  'Helper Functions' as check_item,
  proname as function_name,
  '✅ EXISTS' as status
FROM pg_proc
WHERE proname IN ('has_role', 'get_user_role', 'assign_user_role')
ORDER BY proname;

-- ============================================================================
-- SECURITY VALIDATION
-- ============================================================================

-- 9. Check for users with null roles
SELECT
  'Null Roles' as check_item,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ NONE'
    ELSE '⚠️ FOUND'
  END as status
FROM public.organizers
WHERE role IS NULL;

-- 10. Check for invalid roles
SELECT
  'Invalid Roles' as check_item,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ ALL VALID'
    ELSE '⚠️ INVALID FOUND'
  END as status
FROM public.organizers
WHERE role NOT IN ('admin', 'organizer', 'viewer');

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT '=== VALIDATION SUMMARY ===' as summary;

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
  current_user_role text;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO admin_count FROM public.organizers WHERE role = 'admin';
  SELECT COUNT(*) INTO null_roles FROM public.organizers WHERE role IS NULL;
  SELECT role INTO current_user_role FROM public.organizers WHERE id = auth.uid();

  RAISE NOTICE '';
  RAISE NOTICE '📋 VALIDATION RESULTS:';
  RAISE NOTICE '';

  IF admin_count = 0 THEN
    RAISE NOTICE '🚨 CRITICAL: No admin users found!';
  ELSE
    RAISE NOTICE '✅ Admin users: %', admin_count;
  END IF;

  IF null_roles > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % users have null roles', null_roles;
  ELSE
    RAISE NOTICE '✅ All users have roles assigned';
  END IF;

  IF current_user_role IS NOT NULL THEN
    RAISE NOTICE '✅ Current user role: %', current_user_role;
  ELSE
    RAISE NOTICE '⚠️  Current user not found in organizers table';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '1. Ensure at least one admin user exists';
  RAISE NOTICE '2. Test admin access in application';
  RAISE NOTICE '3. Verify RLS policies work correctly';
  RAISE NOTICE '';
END $$;
