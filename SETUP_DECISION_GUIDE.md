# Setup Decision Guide: Which Approach Should I Use?

## Quick Decision Tree

```
Do you have Docker Desktop installed (or willing to install it)?
│
├─ YES → Use Local Supabase (Option 1) ✨ RECOMMENDED
│         Run: ./setup-local-supabase.sh
│         Supabase runs on: http://localhost:54321
│         Database runs on: localhost:54322
│
└─ NO → Use Separate Dev Supabase Project (Option 2)
          Create manually on: https://supabase.com
          Supabase runs on: https://your-dev-project.supabase.co
          Database runs on: Supabase cloud
```

---

## Option 1: Local Supabase (Recommended)

### What is it?
Runs a **complete Supabase instance on your computer** using Docker.

### How to set up:

**Step 1: Run the automated script**
```bash
./setup-local-supabase.sh
```

**What this does:**
- ✅ Installs Supabase CLI
- ✅ Checks if Docker is running
- ✅ Runs `supabase init` (creates local config)
- ✅ Runs `supabase start` (starts local Supabase)
- ✅ Shows you credentials to copy

**Step 2: Copy credentials to `.env` files**

The script will output something like:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Frontend `.env`:**
```env
VITE_ENVIRONMENT=development
VITE_API_URL=http://localhost:8000

# Local Supabase credentials from script output
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGci... # Copy from script output
```

**Backend `.env`:**
```env
ENVIRONMENT=development

# Local Supabase database from script output
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Local Supabase auth from script output
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGci... # Copy from script output
SUPABASE_SERVICE_KEY=eyJhbGci... # Copy from script output

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Step 3: Configure Google OAuth (if using)**
- Open http://localhost:54323 (Supabase Studio)
- Go to Authentication → Providers → Google
- Add your Google OAuth credentials

**Step 4: Create database tables**
```bash
cd backend
source venv/bin/activate
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

**Step 5: Start your app**
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev
```

### Important Notes:
- ⚠️ You need to run `supabase start` every time you develop
- 💾 Data persists between restarts
- 🛑 Use `supabase stop` when done
- 🔄 Use `supabase stop --no-backup && supabase start` for fresh reset

---

## Option 2: Separate Dev Supabase Project

### What is it?
Creates a **separate cloud project** on supabase.com for development.

### How to set up:

**Step 1: Create project on Supabase.com**
1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Name: "mo-burritos-dev"
4. Choose region and set password
5. Wait 2-3 minutes for project creation

**Step 2: Get credentials**
1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - anon key
   - service_role key
3. Go to **Settings** → **Database**
4. Copy: Connection string

**Step 3: Update `.env` files**

**Frontend `.env`:**
```env
VITE_ENVIRONMENT=development
VITE_API_URL=http://localhost:8000

# Dev Supabase project credentials
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Backend `.env`:**
```env
ENVIRONMENT=development

# Dev Supabase database
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# Dev Supabase auth
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Step 4: Configure Google OAuth**
1. Go to Supabase dashboard for your dev project
2. Authentication → Providers → Google
3. Add your Google OAuth credentials

**Step 5: Create database tables**
```bash
cd backend
source venv/bin/activate
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

**Step 6: Start your app**
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2: Frontend
npm run dev
```

### Important Notes:
- ☁️ Always requires internet connection
- 💰 Free tier limits apply
- 📊 Data persists in cloud
- 🌐 Accessible from anywhere

---

## How the App Knows Which Supabase to Use

### It's All Based on Environment Variables!

The app reads different `.env` files depending on the mode:

### Development Mode:

**Frontend reads: `.env`**
```env
VITE_SUPABASE_URL=http://localhost:54321          ← Local Supabase
# OR
VITE_SUPABASE_URL=https://dev-project.supabase.co ← Dev cloud project
```

**Backend reads: `.env`**
```env
ENVIRONMENT=development
SUPABASE_URL=http://localhost:54321          ← Local Supabase
# OR
SUPABASE_URL=https://dev-project.supabase.co ← Dev cloud project
```

### Production Mode:

**Frontend reads: `.env.production`** (when you run `npm run build`)
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co ← Production Supabase
```

**Backend reads: `.env`** (on your production server)
```env
ENVIRONMENT=production
SUPABASE_URL=https://prod-project.supabase.co ← Production Supabase
```

### How Switching Works:

#### **Local Development:**
```bash
# Your .env files point to localhost or dev Supabase
npm run dev              # Frontend uses .env
uvicorn app.main:app     # Backend uses .env
```

#### **Production Build:**
```bash
# Create production build
npm run build            # Uses .env.production

# Deploy backend with ENVIRONMENT=production
# Backend uses production credentials from hosting provider's env vars
```

---

## File Structure for Environment Variables

```
your-project/
├── .env                          # Frontend & Backend DEV config
│   └── VITE_SUPABASE_URL=http://localhost:54321 (or dev cloud)
│
├── .env.production              # Frontend PROD config
│   └── VITE_SUPABASE_URL=https://prod.supabase.co
│
└── backend/
    └── .env                     # Backend config (reads ENVIRONMENT var)
        ├── ENVIRONMENT=development    (local dev)
        └── ENVIRONMENT=production     (on production server)
```

---

## Common Confusion: Script vs Manual

### ❌ Common Misunderstanding:

"I need to choose between running the script OR creating a project on supabase.com"

### ✅ Actual Truth:

These are **two completely different approaches**:

| Method | What It Creates | Where It Runs |
|--------|----------------|---------------|
| **Script** (`./setup-local-supabase.sh`) | Local Supabase instance | Your computer (Docker) |
| **Manual** (supabase.com) | Cloud Supabase project | Supabase cloud |

You pick ONE approach based on your preference!

---

## Which Should You Choose?

### Choose Local Supabase (Script) if:
- ✅ You have Docker Desktop or can install it
- ✅ You want complete isolation
- ✅ You want to work offline
- ✅ You want easy database reset for testing
- ✅ You want 100% production parity

### Choose Separate Dev Project (Manual) if:
- ✅ You can't or don't want to install Docker
- ✅ You have limited disk space (<5GB free)
- ✅ You want to access dev data from multiple machines
- ✅ You prefer cloud-based development

---

## Step-by-Step: After You Choose

### If You Choose Local Supabase:

1. **Run the script:**
   ```bash
   ./setup-local-supabase.sh
   ```

2. **Copy the credentials shown** to your `.env` files

3. **Start Supabase each time you develop:**
   ```bash
   supabase start
   ```

4. **Access local Supabase Studio:**
   http://localhost:54323

### If You Choose Separate Dev Project:

1. **Go to supabase.com** and create a new project

2. **Copy credentials from dashboard** to your `.env` files

3. **No need to start/stop anything** - it's always running in cloud

4. **Access Supabase dashboard:**
   https://supabase.com/dashboard/project/your-project-id

---

## Production Setup (Same for Both Options)

Regardless of which dev option you choose, production setup is the same:

1. **Create a separate production Supabase project** on supabase.com

2. **Set production environment variables** on your hosting provider:
   ```env
   ENVIRONMENT=production
   SUPABASE_URL=https://prod-project.supabase.co
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_KEY=...
   DATABASE_URL=postgresql://...
   ```

3. **Frontend `.env.production`:**
   ```env
   VITE_ENVIRONMENT=production
   VITE_SUPABASE_URL=https://prod-project.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

---

## Quick Reference: URLs for Each Setup

### Local Supabase (Option 1):
```
Development:
  - Supabase API: http://localhost:54321
  - Database: localhost:54322
  - Studio: http://localhost:54323
  - Your backend: http://localhost:8000
  - Your frontend: http://localhost:5173

Production:
  - Supabase API: https://prod-project.supabase.co
  - Database: Supabase cloud
  - Your backend: https://your-api.vercel.app
  - Your frontend: https://your-app.vercel.app
```

### Separate Dev Project (Option 2):
```
Development:
  - Supabase API: https://dev-project.supabase.co
  - Database: Supabase cloud
  - Your backend: http://localhost:8000
  - Your frontend: http://localhost:5173

Production:
  - Supabase API: https://prod-project.supabase.co
  - Database: Supabase cloud
  - Your backend: https://your-api.vercel.app
  - Your frontend: https://your-app.vercel.app
```

---

## Summary

✅ **Script = Local Supabase on your computer**  
✅ **Manual = Cloud Supabase project on supabase.com**  
✅ **App knows which to use from `.env` files**  
✅ **Development uses `.env`**  
✅ **Production uses `.env.production`**  
✅ **Choose ONE approach for dev, keep production separate**  

---

## My Recommendation

🏆 **Use Local Supabase (run the script)** if you can install Docker.

**Why?**
- Complete isolation from production
- Exact same stack as production
- Can reset database easily
- Works offline
- Free and fast

**Quick start:**
```bash
./setup-local-supabase.sh
```

Then follow the instructions to copy credentials to your `.env` files!
