# Fix Instructions: User Authentication Bug

## Problem Summary
All orders were being linked to the same user (`ikanga93@gmail.com`) regardless of who actually logged in and placed the order. This was caused by corrupted data in the `public.users` table and buggy OR query logic in the authentication middleware.

## Fix Overview
This fix has 2 parts:
1. **Database cleanup** - Sync users from `auth.users` to `public.users`
2. **Code fix** - Improve authentication query logic (already applied)

---

## PART 1: Apply Database Fix

### Step 1: Backup Your Database (IMPORTANT!)
Before making any changes, create a backup:

1. Go to your Supabase Dashboard
2. Navigate to Database → Backups
3. Create a manual backup
4. Wait for it to complete

### Step 2: Run the Fix SQL Script

1. Go to Supabase Dashboard → SQL Editor
2. Click "New query"
3. Open the file: `/Users/jbshome/Desktop/mo-s-burrito-app-main/backend/fix_user_sync.sql`
4. Copy ALL the SQL content
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Cmd+Enter)

### Step 3: Review the Output

The script will show you:
- ✅ Current state of your users
- ✅ What was deleted (corrupted user)
- ✅ What was created (3 proper user records)
- ✅ How many orders were updated
- ✅ Verification results

**Expected output:**
```
Current public.users: 1 row (ikanga93 with wrong ID)
Current auth.users: 3 rows
Orders linked to corrupted user: X orders
... (deletions and inserts) ...
VERIFICATION: 3 users in public.users
VERIFICATION: All orders linked correctly
Fix complete! ✅
```

### Step 4: Run Verification Script

1. Open a new SQL query
2. Open the file: `/Users/jbshome/Desktop/mo-s-burrito-app-main/backend/verify_fix.sql`
3. Copy and paste the content
4. Click **"Run"**

**Look for:**
- ✅ All 3 auth users have matching public.users records
- ✅ No NULL supabase_id values
- ✅ No duplicate emails
- ✅ No orphaned orders
- ✅ Counts match: 3 auth users = 3 public users

---

## PART 2: Code Fix (Already Applied)

The following code changes have been made:

### File 1: `backend/app/middleware/auth.py`
**Changed:** Replaced buggy OR query with sequential lookup:
- First tries to find user by `supabase_id` (most reliable)
- Then tries `email` (for legacy users)
- Then tries `phone` (for phone auth)
- Creates new user if not found

### File 2: `backend/app/routers/auth.py`
**Changed:** Fixed the login endpoint with same improved logic

---

## PART 3: Deploy and Test

### Step 1: Restart Your Backend
```bash
cd /Users/jbshome/Desktop/mo-s-burrito-app-main/backend

# If running locally with uvicorn:
# Stop the server (Ctrl+C) and restart:
uvicorn app.main:app --reload

# If deployed, redeploy your backend
```

### Step 2: Test with Multiple Users

**Test 1: Login with ikanga0911@gmail.com**
1. Log in with this account
2. Go to Profile page → Should show `ikanga0911@gmail.com` ✅
3. Place an order
4. Check database: Order should have `customer_id = 57cf8aed-21ca-4012-96cf-71e301744fd3` ✅

**Test 2: Login with gekuke01@gmail.com**
1. Log in with this account
2. Go to Profile page → Should show `gekuke01@gmail.com` ✅
3. Place an order
4. Check database: Order should have `customer_id = 2494acbc-0927-4cd2-b429-b583ec529323` ✅

**Test 3: Login with bal.julie25@gmail.com**
1. Log in with this account
2. Go to Profile page → Should show `bal.julie25@gmail.com` ✅
3. Place an order
4. Check database: Order should have `customer_id = e1881ae8-14e3-4ed7-9815-5512c813a549` ✅

**Test 4: New user signup**
1. Register a new account with email/password
2. Should create user in both auth.users and public.users ✅
3. Place an order
4. Should link to new user ID ✅

---

## Verification Queries

After testing, run these to verify everything:

```sql
-- Check user distribution in orders
SELECT
    u.email,
    COUNT(o.id) as order_count
FROM public.orders o
JOIN public.users u ON o.customer_id = u.id
GROUP BY u.email
ORDER BY order_count DESC;

-- This should show orders distributed across different users, not all under one email
```

---

## Rollback (If Something Goes Wrong)

If anything fails:
1. Go to Supabase Dashboard → Database → Backups
2. Restore the backup you created in Step 1
3. Contact support with error messages

---

## What Was Fixed

### Before Fix:
- ❌ Only 1 user in public.users (corrupted record)
- ❌ All orders linked to same customer_id
- ❌ Profile always showed ikanga93@gmail.com
- ❌ OR query returned wrong user

### After Fix:
- ✅ 3 users in public.users (matching auth.users)
- ✅ Orders correctly linked to actual customers
- ✅ Profile shows correct logged-in user
- ✅ Sequential query finds correct user
- ✅ New signups create proper records

---

## Support

If you encounter issues:
1. Check the verification script output
2. Look at backend logs for error messages
3. Share the output of verify_fix.sql
4. Check if backend restarted successfully
