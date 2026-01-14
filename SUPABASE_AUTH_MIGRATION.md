# Supabase Auth Migration Complete ✅

**Date:** January 14, 2026  
**Changes:** Migrated from JWT to Supabase Auth exclusively for both dev and production

---

## 🎯 What Changed

### Backend Changes

1. **Removed JWT Authentication**
   - All JWT token generation functions marked as deprecated
   - Auth middleware now only validates Supabase tokens
   - All auth endpoints (`/login`, `/register`, `/customer/login`, etc.) now use Supabase Auth exclusively

2. **Database Configuration**
   - SQLite support disabled
   - PostgreSQL (Supabase) required for all environments
   - Dev and prod now use the same database technology (PostgreSQL)

3. **Simplified Auth Flow**
   - Single authentication path (Supabase)
   - Auto-sync users from Supabase to local database
   - Consistent behavior across all environments

### Frontend Changes

1. **Supabase Auth Only**
   - Removed JWT localStorage persistence logic
   - AdminAuthContext now only uses Supabase sessions
   - Automatic token refresh handled by Supabase

---

## 🚀 How to Use

### Environment Setup

**Backend `.env` (required variables):**
```env
ENVIRONMENT=development  # or production

# PostgreSQL Database (Supabase)
DATABASE_URL=postgresql://postgres.kuytxnogtogxtmhhqfku:...@aws-0-us-west-2.pooler.supabase.com:6543/postgres

# Supabase Auth (required)
SUPABASE_URL=https://kuytxnogtogxtmhhqfku.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Frontend `.env` (required variables):**
```env
VITE_API_URL=http://localhost:8000  # dev
VITE_ENVIRONMENT=development  # or production

# Supabase Auth (required)
VITE_SUPABASE_URL=https://kuytxnogtogxtmhhqfku.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 👤 Creating Owner Account

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/kuytxnogtogxtmhhqfku
2. Navigate to: **Authentication** → **Users**
3. Click **"Add User"** or **"Create new user"**
4. Fill in:
   - Email: your@email.com
   - Password: (your password)
   - **Auto Confirm User:** ✅ Check this!
5. Click **"Create User"**

### Method 2: Register via Admin Page

1. Go to: http://localhost:5173/admin/register
2. Register with email and password
3. This creates user in Supabase + syncs to database with role=CUSTOMER

### Promoting to Owner

After creating the account via either method:

```bash
cd /Users/jbshome/Desktop/mo-s-burrito-app-main/backend
python3 make_owner.py your@email.com
```

---

## 🔄 Authentication Flow

```
┌─────────────────────────────────────────┐
│  1. User Registers/Logs in              │
│     → Supabase validates credentials    │
│     → Returns Supabase access token     │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  2. Backend Receives Request            │
│     → Validates Supabase token          │
│     → Looks up user in PostgreSQL       │
│     → Auto-creates if doesn't exist     │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│  3. Request Authorized                  │
│     → User data from PostgreSQL         │
│     → Role-based access control         │
└─────────────────────────────────────────┘
```

---

## 📊 Dev vs Prod

| Aspect | Development | Production |
|--------|-------------|------------|
| **Auth** | Supabase Auth | Supabase Auth |
| **Database** | PostgreSQL (Supabase) | PostgreSQL (Supabase) |
| **Same DB?** | ✅ Can use same project | ✅ Or separate project |
| **Tokens** | Supabase tokens | Supabase tokens |

**Note:** Dev and prod can use:
- **Same Supabase project + Same database** (current setup)
- **Same Supabase project + Different databases** (set different DATABASE_URL)
- **Different Supabase projects** (separate auth & databases)

---

## ✅ Benefits

1. **Simpler Code**
   - No JWT token management
   - No localStorage token persistence
   - Single authentication path

2. **More Reliable**
   - Supabase handles token refresh
   - Built-in session management
   - Automatic token validation

3. **Consistent Behavior**
   - Same auth system everywhere
   - No dev vs prod differences
   - Predictable authentication flow

4. **Better Security**
   - Industry-standard auth
   - Built-in security features
   - Regular security updates from Supabase

---

## 🗑️ What Was Removed

### Backend
- JWT token generation (`create_access_token`, `create_refresh_token`)
- JWT validation (`decode_token`)
- Password hashing for local auth (`get_password_hash`, `verify_password`)
- Local email/password authentication (`authenticate_user`)
- SQLite database support
- Environment-based auth switching (JWT for dev, Supabase for prod)

### Frontend
- JWT localStorage persistence
- JWT token refresh logic
- Environment-based auth checks

---

## 🧪 Testing

1. **Start Backend:**
   ```bash
   cd /Users/jbshome/Desktop/mo-s-burrito-app-main/backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd /Users/jbshome/Desktop/mo-s-burrito-app-main
   npm run dev
   ```

3. **Create Owner & Login:**
   - Create user in Supabase dashboard
   - Run: `python3 make_owner.py your@email.com`
   - Login at: http://localhost:5173/admin/login

4. **Verify:**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Token refresh works automatically
   - ✅ Navigation doesn't log you out
   - ✅ Refresh page keeps you logged in

---

## 🆘 Troubleshooting

### "Supabase credentials must be set"
- Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are in your `.env` files
- Restart backend/frontend after adding

### "DATABASE_URL must be set"
- Add PostgreSQL connection string to backend `.env`
- Get it from: Supabase Dashboard → Settings → Database → Connection string

### Login fails with 401
- Check that user exists in Supabase dashboard
- Verify password is correct
- Check backend logs for detailed error

### User not found after login
- Check if user is in PostgreSQL database
- User should auto-create on first Supabase login
- Check backend logs for auto-sync messages

---

## 📝 Notes

- **Backward compatibility:** JWT functions still exist but are deprecated
- **Migration:** Old JWT-based users won't work - they need to register via Supabase
- **Database:** Both dev and prod now use PostgreSQL (no SQLite)
- **Clean slate:** This is a fresh start with Supabase Auth only

---

**Migration completed successfully! 🎉**
