# Owner Account Setup Guide

## Summary

Your app **does NOT auto-create** any default accounts in production for security reasons.

The `admin@mosburrito.com` account was likely created by:
- Running the seed script manually (`python backend/seed_db.py`)
- A previous version of the code
- Manual database entry

## Step-by-Step: Remove Default Admin & Create Your Own

### Step 1: Delete the Default Admin Account

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste and run this SQL:

```sql
-- Check what users exist
SELECT id, email, role, first_name, last_name, created_at
FROM users
ORDER BY created_at;

-- Delete the admin@mosburrito.com account
DELETE FROM users WHERE email = 'admin@mosburrito.com';

-- Verify no owner exists
SELECT COUNT(*) as owner_count FROM users WHERE role = 'owner';
-- Should return: owner_count = 0
```

#### Option B: Using Supabase Table Editor

1. Go to Supabase Dashboard → **Table Editor**
2. Click on the `users` table
3. Find the row where email = `admin@mosburrito.com`
4. Click the row → Click the **Delete** button
5. Confirm deletion

### Step 2: Verify No Owner Exists

Check via API:

```bash
curl https://your-app.vercel.app/api/users/check-owner-exists
```

**Expected response:**
```json
{"exists": false}
```

If it returns `{"exists": true}`, there's still an owner account. Repeat Step 1.

### Step 3: Create Your Own Owner Account

#### Option A: Using cURL

```bash
curl -X POST https://your-app.vercel.app/api/users/register-owner \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePassword123!",
    "first_name": "Your",
    "last_name": "Name",
    "phone": "+15551234567"
  }'
```

**Expected response:**
```json
{
  "id": "uuid-here",
  "email": "your-email@example.com",
  "first_name": "Your",
  "last_name": "Name",
  "phone": "+15551234567",
  "role": "owner",
  "is_active": true,
  "created_at": "2026-01-13T..."
}
```

#### Option B: Using Postman/Insomnia

1. Create a new POST request
2. URL: `https://your-app.vercel.app/api/users/register-owner`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "your-email@example.com",
  "password": "YourSecurePassword123!",
  "first_name": "Your",
  "last_name": "Name",
  "phone": "+15551234567"
}
```
5. Send the request

#### Option C: Using Your Frontend

If you have an owner registration page in your app, use that to create the account.

### Step 4: Login with Your New Account

1. Go to your app: `https://your-app.vercel.app`
2. Login with your new email and password
3. Verify you have owner access

## Important Notes

### Security

- ✅ **No auto-creation**: The app no longer auto-creates default accounts
- ✅ **One owner only**: The `/register-owner` endpoint only works when NO owner exists
- ✅ **Protection added**: The seed script now refuses to run in production

### Seed Script Warning

The `backend/seed_db.py` script is **ONLY for local development**. It:
- Creates test accounts with weak passwords
- Should **NEVER** be run in production
- Is now protected and will refuse to run if `ENVIRONMENT=production`

### Owner Registration Endpoint

- **Endpoint**: `POST /api/users/register-owner`
- **Protection**: Only works when no owner account exists
- **Error if owner exists**: "An owner account already exists"
- **One-time use**: After creating your owner, this endpoint becomes inaccessible

### For Additional Staff

After creating your owner account, use the owner dashboard to:
- Create manager accounts: `POST /api/users` (owner only)
- Create staff accounts: `POST /api/users` (owner only)
- Assign users to locations: `POST /api/users/assign-location` (owner only)

## Troubleshooting

### "An owner account already exists"

**Solution**: Follow Step 1 to delete the existing owner account, then try again.

### "Email already registered"

**Solution**: The email you're trying to use is already in the database. Either:
- Use a different email
- Delete that user from the database first

### Can't access Supabase Dashboard

**Solution**:
1. Go to [supabase.com](https://supabase.com)
2. Sign in with the account you used to create the project
3. Select your project from the dashboard

### Created owner but can't log in

**Possible issues**:
1. **Wrong endpoint**: Make sure you're using `/api/auth/login` (not `/api/auth/customer/login`)
2. **Wrong password**: Double-check your password
3. **Supabase auth mismatch**: In production, the app might be using Supabase auth instead of JWT

**Check which auth method**:
- Development (local): Uses JWT authentication
- Production (Vercel): Uses Supabase authentication

If using Supabase in production, you may need to create the account through Supabase Auth as well.

## Need Help?

If you're still having issues:

1. Check Vercel deployment logs for errors
2. Check Supabase logs: Dashboard → Logs
3. Verify all environment variables are set correctly
4. Check the API docs: `https://your-app.vercel.app/api/docs`

## Summary of Changes Made

✅ Verified no auto-creation code in production
✅ Added production protection to seed script
✅ Updated README.md to remove default credentials
✅ Added clear warnings to seed_db.py
✅ Created this setup guide

Your app is now secure and ready for your custom owner account! 🎉
