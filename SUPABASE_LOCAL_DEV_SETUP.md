# Supabase Local Development Setup

## Problem
You're using the same Supabase project for both dev and production, causing:
- Users authenticated in production don't exist in your local SQLite database
- Dashboard shows no data because users/orders aren't synced
- Can't safely test without affecting production data

## Solution: Supabase Local Development

Run a complete local Supabase instance for development with separate auth and database.

---

## Setup Instructions

### Step 1: Install Supabase CLI

```bash
# Install globally via npm
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Install Docker Desktop

Supabase local development requires Docker.

1. Download and install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Start Docker Desktop
3. Verify it's running:
   ```bash
   docker --version
   ```

### Step 3: Initialize Supabase in Your Project

```bash
cd /Users/jbshome/Desktop/mo-s-burrito-app-main

# Initialize Supabase (creates supabase/ directory)
supabase init
```

This creates a `supabase/` folder with configuration files.

### Step 4: Start Local Supabase Services

```bash
# Start all Supabase services locally
supabase start
```

**Important:** This will take a few minutes the first time as it downloads Docker images.

You'll see output like:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these credentials!** You'll need them for your environment configuration.

### Step 5: Update Development Environment Files

#### Frontend `.env` (development)

```env
# Environment
VITE_ENVIRONMENT=development

# API URL
VITE_API_URL=http://localhost:8000

# Local Supabase (from supabase start output)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Copy from supabase start
```

#### Backend `.env` (development)

```env
# Environment
ENVIRONMENT=development

# Use Supabase PostgreSQL locally instead of SQLite
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# JWT Settings (still needed for fallback)
JWT_SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Local Supabase Auth (from supabase start output)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Copy from supabase start
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Copy from supabase start

# Stripe (test keys for dev)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 6: Apply Your Database Schema to Local Supabase

You need to create your tables in the local Supabase PostgreSQL database:

```bash
cd backend

# Activate your virtual environment
source venv/bin/activate

# Run migrations or create tables
# Option A: If you have migrations
alembic upgrade head

# Option B: If you're using SQLAlchemy's create_all
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

### Step 7: Configure Google OAuth (Optional)

If your app uses Google Sign In, you'll need to set up OAuth:

**Option A: Separate Dev Credentials (Recommended)**
- See [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md) for detailed setup
- Create separate Google OAuth credentials for development
- Configure in Supabase Studio (http://localhost:54323)

**Option B: Reuse Production Credentials**
- Use your existing Google OAuth credentials
- Add `http://localhost:54321/auth/v1/callback` to redirect URIs in Google Cloud Console
- Configure in Supabase Studio with same credentials as prod

### Step 8: Access Supabase Studio (Local Dashboard)

Open http://localhost:54323 in your browser to:
- View your local database tables
- Manage authentication users
- Configure OAuth providers (Google, GitHub, etc.)
- Test SQL queries
- View logs

### Step 9: Start Your Application

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend
npm run dev
```

---

## How It Works Now

### Development Flow (Local Supabase)
```
User Login
   ↓
Frontend → Supabase Auth (localhost:54321)
   ↓
Backend validates token with Local Supabase
   ↓
Backend syncs user to Local PostgreSQL (localhost:54322)
   ↓
User data, orders, etc. stored in LOCAL database
   ↓
Dashboard shows data from LOCAL database
```

### Production Flow (Production Supabase)
```
User Login
   ↓
Frontend → Supabase Auth (your-project.supabase.co)
   ↓
Backend validates token with Production Supabase
   ↓
Backend syncs user to Production PostgreSQL
   ↓
Dashboard shows data from PRODUCTION database
```

**Key Benefit:** Completely isolated environments!

---

## Useful Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase (keeps data)
supabase stop

# Stop and reset all data (fresh start)
supabase stop --no-backup
supabase start

# View local Supabase status
supabase status

# View local database migrations
supabase migration list

# Generate SQL migration from changes
supabase db diff -f migration_name

# Apply migrations to local database
supabase db reset

# Link to remote Supabase project (optional, for syncing)
supabase link --project-ref your-project-ref
```

---

## Common Issues & Solutions

### Issue: "Docker not running"
**Solution:** Start Docker Desktop application

### Issue: Port conflicts (54321, 54322, etc. already in use)
**Solution:** 
```bash
# Stop other services using those ports, or
# Configure custom ports in supabase/config.toml
```

### Issue: Backend can't connect to local Supabase
**Solution:** 
1. Verify `supabase status` shows "running"
2. Check DATABASE_URL uses correct port (54322)
3. Verify SUPABASE_URL uses http://localhost:54321

### Issue: Tables don't exist in local database
**Solution:**
```bash
cd backend
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

---

## Migrating Existing SQLite Data (Optional)

If you want to move your existing dev data to local Supabase:

```bash
# Export from SQLite
sqlite3 backend/mos_burritos.db .dump > data_dump.sql

# Import to local Supabase PostgreSQL
psql postgresql://postgres:postgres@localhost:54322/postgres < data_dump.sql
```

Note: You may need to adjust SQL syntax differences between SQLite and PostgreSQL.

---

## Production Deployment (No Changes Needed)

Your production environment continues to use your production Supabase project:

```env
# Production .env
ENVIRONMENT=production
DATABASE_URL=postgresql://... # Your production Supabase DB
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_KEY=your-prod-service-key
```

---

## Alternative: Separate Supabase Dev Project

If you prefer not to run local Supabase, you can create a separate Supabase project for development:

1. Go to https://supabase.com
2. Create a new project called "mo-burritos-dev"
3. Use its credentials in your development .env files
4. Keep your original project for production

**Pros:** No Docker/CLI setup needed
**Cons:** Requires internet connection, costs may apply

---

## Summary

✅ **Development:** Local Supabase (localhost) with separate database  
✅ **Production:** Production Supabase with production database  
✅ **Complete isolation:** No risk of affecting production data  
✅ **Realistic testing:** Same tech stack as production  
✅ **Fast development:** No network latency, offline capable  

Start Supabase local development with:
```bash
supabase start
```

Stop with:
```bash
supabase stop
```
