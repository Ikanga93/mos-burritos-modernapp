-- ================================================================
-- VERIFICATION SCRIPT
-- Run this after applying the fix to verify everything is correct
-- ================================================================

-- Check 1: Verify all auth users exist in public.users
SELECT '=== Check 1: Auth users synced to public.users ===' as check_name;
SELECT
    a.id as auth_id,
    a.email as auth_email,
    u.id as public_user_id,
    u.email as public_email,
    u.supabase_id,
    CASE
        WHEN u.id IS NULL THEN '❌ MISSING in public.users'
        WHEN u.supabase_id != a.id THEN '⚠️  MISMATCH supabase_id'
        ELSE '✅ OK'
    END as status
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.supabase_id;

-- Check 2: Verify no users with NULL supabase_id
SELECT '=== Check 2: Users with NULL supabase_id ===' as check_name;
SELECT
    id,
    email,
    supabase_id,
    '⚠️  This user has no Supabase link!' as warning
FROM public.users
WHERE supabase_id IS NULL;

-- If no rows returned, all users are properly linked ✅

-- Check 3: Verify no duplicate emails
SELECT '=== Check 3: Duplicate emails ===' as check_name;
SELECT
    email,
    COUNT(*) as user_count,
    '⚠️  Multiple users with same email!' as warning
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- If no rows returned, no duplicates ✅

-- Check 4: Verify orders are linked to valid users
SELECT '=== Check 4: Orders linked to valid users ===' as check_name;
SELECT
    o.customer_id,
    u.email as user_email,
    COUNT(o.id) as order_count,
    CASE
        WHEN u.id IS NULL AND o.customer_id IS NOT NULL THEN '❌ ORPHANED orders'
        ELSE '✅ OK'
    END as status
FROM public.orders o
LEFT JOIN public.users u ON o.customer_id = u.id
WHERE o.customer_id IS NOT NULL
GROUP BY o.customer_id, u.email, u.id;

-- Check 5: Summary
SELECT '=== Summary ===' as check_name;
SELECT
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.users) as public_users_count,
    (SELECT COUNT(*) FROM public.users WHERE supabase_id IS NOT NULL) as users_with_supabase_id,
    (SELECT COUNT(DISTINCT customer_id) FROM public.orders WHERE customer_id IS NOT NULL) as unique_order_customers;

SELECT '=== All checks complete ===' as status;
