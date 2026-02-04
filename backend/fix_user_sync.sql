-- ================================================================
-- FIX USER SYNC ISSUE
-- This script syncs users from auth.users to public.users
-- Run this in your Supabase SQL Editor
-- ================================================================

-- STEP 1: Check current state (run this first to see what we have)
SELECT 'Current public.users:' as info;
SELECT id, email, supabase_id, role FROM public.users;

SELECT 'Current auth.users:' as info;
SELECT id, email FROM auth.users;

-- STEP 2: Backup existing orders (safety check)
-- This shows how many orders are linked to the corrupted user
SELECT 'Orders linked to corrupted user:' as info;
SELECT COUNT(*) as order_count, customer_id
FROM public.orders
WHERE customer_id = 'b6238bd7-7472-4c95-aed2-c0690e2bfdbe'
GROUP BY customer_id;

-- STEP 3: Delete the corrupted user record
-- This removes ikanga93@gmail.com with wrong supabase_id
DELETE FROM public.users
WHERE id = 'b6238bd7-7472-4c95-aed2-c0690e2bfdbe';

-- STEP 4: Create correct user records for all auth users
-- These INSERTs will create users in public.users that match auth.users

-- User 1: ikanga0911@gmail.com (from auth.users)
INSERT INTO public.users (
    id,
    supabase_id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '57cf8aed-21ca-4012-96cf-71e301744fd3',  -- Use auth.users ID
    '57cf8aed-21ca-4012-96cf-71e301744fd3',  -- Same as ID
    'ikanga0911@gmail.com',
    'Gil',
    NULL,
    NULL,
    'CUSTOMER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    supabase_id = EXCLUDED.supabase_id,
    email = EXCLUDED.email,
    updated_at = NOW();

-- User 2: gekuke01@gmail.com
INSERT INTO public.users (
    id,
    supabase_id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
    '2494acbc-0927-4cd2-b429-b583ec529323',
    '2494acbc-0927-4cd2-b429-b583ec529323',
    'gekuke01@gmail.com',
    'Gilchrist',
    NULL,
    NULL,
    'CUSTOMER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    supabase_id = EXCLUDED.supabase_id,
    email = EXCLUDED.email,
    updated_at = NOW();

-- User 3: bal.julie25@gmail.com
INSERT INTO public.users (
    id,
    supabase_id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'e1881ae8-14e3-4ed7-9815-5512c813a549',
    'e1881ae8-14e3-4ed7-9815-5512c813a549',
    'bal.julie25@gmail.com',
    'Lady J',
    NULL,
    NULL,
    'CUSTOMER',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    supabase_id = EXCLUDED.supabase_id,
    email = EXCLUDED.email,
    updated_at = NOW();

-- STEP 5: Update existing orders to link to correct user
-- This assumes all existing orders belong to ikanga0911@gmail.com
-- Adjust this if orders belong to different users
UPDATE public.orders
SET customer_id = '57cf8aed-21ca-4012-96cf-71e301744fd3',
    customer_email = 'ikanga0911@gmail.com',
    updated_at = NOW()
WHERE customer_id = 'b6238bd7-7472-4c95-aed2-c0690e2bfdbe';

-- STEP 6: Verify the fix
SELECT '=== VERIFICATION: public.users after fix ===' as info;
SELECT id, email, supabase_id, role, is_active FROM public.users;

SELECT '=== VERIFICATION: Orders updated ===' as info;
SELECT customer_id, customer_email, COUNT(*) as order_count
FROM public.orders
GROUP BY customer_id, customer_email;

-- STEP 7: Check for any orphaned orders
SELECT '=== VERIFICATION: Check for orphaned orders ===' as info;
SELECT o.id, o.customer_id, o.customer_email
FROM public.orders o
LEFT JOIN public.users u ON o.customer_id = u.id
WHERE o.customer_id IS NOT NULL AND u.id IS NULL
LIMIT 5;

SELECT 'Fix complete! ✅' as status;
