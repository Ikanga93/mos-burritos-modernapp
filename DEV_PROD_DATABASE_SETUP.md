# Development vs Production Database Setup

## ⚠️ IMPORTANT: Supabase Auth + Local Database Limitation

If you're using Supabase Auth in development with a local database (SQLite), you may encounter issues where:
- Users authenticated via Supabase don't appear in your local database
- Dashboard shows no data because users/orders aren't synced
- You're sharing the same Supabase project between dev and prod (risky!)

**SOLUTION:** See [`SUPABASE_LOCAL_DEV_SETUP.md`](./SUPABASE_LOCAL_DEV_SETUP.md) for setting up a completely local Supabase environment for development.

---

## Current Setup Options

### Option 1: Local Supabase (Recommended) ✨

✅ **Development (Local)**
- **Auth**: Local Supabase Auth (localhost:54321)
- **Database**: Local PostgreSQL via Supabase (localhost:54322)
- **Why**: Complete isolation, mirrors production, no data conflicts

✅ **Production (Deployed)**
- **Auth**: Production Supabase
- **Database**: Production PostgreSQL (Supabase)
- **Why**: Scalable, production-ready, persistent

👉 **Setup Guide:** [`SUPABASE_LOCAL_DEV_SETUP.md`](./SUPABASE_LOCAL_DEV_SETUP.md)

---

### Option 2: SQLite + Shared Supabase (Legacy)

⚠️ **Development (Local)**
- **Auth**: Supabase (shared with prod)
- **Database**: SQLite (`backend/mos_burritos.db`)
- **Why**: Fast, no external dependencies
- **Limitation**: Users from prod Supabase won't exist in local SQLite

✅ **Production (Deployed)**
- **Auth**: Supabase
- **Database**: PostgreSQL (Supabase or other provider)
- **Why**: Scalable, production-ready, persistent

## How It Works

Your backend middleware (`backend/app/middleware/auth.py`) already has **auto-sync** logic:
1. User logs in via Supabase (Google OAuth or email/password)
2. Backend receives Supabase token
3. Backend checks if user exists in **local database** (SQLite in dev, PostgreSQL in prod)
4. If user doesn't exist → **auto-creates** user in local database
5. If user exists but not linked → **links** to Supabase ID

This means:
- ✅ You can use Supabase auth in both dev and prod
- ✅ Each environment uses its own database
- ✅ Users are automatically synced to the appropriate database

## Current Configuration

### Development (.env)
```env
ENVIRONMENT=development
# SQLite for dev (auto-configured, or explicitly set):
DATABASE_URL=sqlite:///./mos_burritos.db

# Supabase auth (shared)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Production (.env.production)
```env
ENVIRONMENT=production
# PostgreSQL for production:
DATABASE_URL=postgresql://user:password@host:5432/database

# Supabase auth (same as dev)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## The Real Issue: Backend Server Not Running! 🚨

Your dashboard is empty because **the backend server is not running**.

### How to Start the Backend:

1. **Open a new terminal** (or use an existing one)

2. **Navigate to backend directory:**
   ```bash
   cd /Users/jbshome/Desktop/mo-s-burrito-app-main/backend
   ```

3. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Start the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **You should see:**
   ```
   🚀 Starting Mo's Burritos Backend...
      Environment: development
      Database: SQLite (dev)
   ✅ Database tables created/verified
   
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

### How to Verify It's Working:

1. **Backend should be accessible at:**
   - http://localhost:8000
   - http://localhost:8000/docs (API documentation)

2. **Check the database in the logs:**
   - Should show "Database: SQLite (dev)" for development

3. **Test the dashboard:**
   - Login to admin panel
   - Dashboard should now load data from SQLite

## Frontend Configuration

Your frontend is already configured correctly:
```javascript
// src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

Make sure your `.env` (frontend) has:
```env
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## How Data Flows in Development

1. **User registers/logs in** → Supabase auth
2. **Backend receives request** → Validates Supabase token
3. **Backend checks SQLite** → Auto-creates user if needed
4. **User adds items to cart** → Stored in frontend localStorage
5. **User checks out** → Order created in SQLite
6. **Admin views dashboard** → Queries SQLite for orders

## Troubleshooting

### Dashboard shows no orders/users:
1. ✅ **Is backend running?** Check http://localhost:8000
2. ✅ **Check browser console** for API errors
3. ✅ **Check backend logs** for errors
4. ✅ **Verify database file exists:** `ls -la backend/mos_burritos.db`

### Orders not appearing after checkout:
1. Check Stripe webhook is configured
2. Check backend logs for payment webhook errors
3. Verify order was created in database:
   ```bash
   cd backend
   sqlite3 mos_burritos.db "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;"
   ```

### Users not syncing from Supabase:
1. Check backend logs for Supabase validation errors
2. Verify SUPABASE_ANON_KEY is correct in backend .env
3. Check middleware logs for auto-sync messages

## Production Deployment

When deploying to production:
1. Set `ENVIRONMENT=production` in your hosting provider
2. Set `DATABASE_URL` to your PostgreSQL connection string
3. Keep the same Supabase credentials (or use prod-specific ones)
4. The middleware will automatically use the production database

## Summary

✅ **You don't need to change anything in your code**
✅ **Just start the backend server**
✅ **Dev uses SQLite, Prod uses PostgreSQL**
✅ **Both use Supabase for auth**
✅ **Users auto-sync to the appropriate database**
