# Development Environment Options

## The Problem You're Facing

You currently have:
- **Development:** Local SQLite database
- **Production:** Supabase PostgreSQL database
- **Both:** Using the SAME Supabase Auth project

This causes issues where users authenticated via Supabase (especially in production) don't exist in your local SQLite database, making your dashboard appear empty during development.

---

## Solution Options

### 🏆 Option 1: Local Supabase (Best for 2026)

**What it is:** Run a complete Supabase instance on your local machine using Docker

**Pros:**
- ✅ Complete isolation from production
- ✅ Exact same stack as production (PostgreSQL + Supabase Auth)
- ✅ Can test all Supabase features locally
- ✅ Works offline (no internet required once set up)
- ✅ No risk of accidentally affecting production data
- ✅ Free (runs on your computer)
- ✅ Easy database reset for testing

**Cons:**
- ❌ Requires Docker Desktop (2-3 GB download)
- ❌ Uses more system resources (RAM, CPU)
- ❌ Initial setup takes 10-15 minutes
- ❌ Need to run `supabase start` each time you develop

**Best for:**
- Professional development
- Teams
- When you need realistic testing
- Long-term projects

**Setup time:** 15-20 minutes (one-time)

**Quick Start:**
```bash
./setup-local-supabase.sh
```

**Full Guide:** [SUPABASE_LOCAL_DEV_SETUP.md](./SUPABASE_LOCAL_DEV_SETUP.md)

---

### Option 2: Separate Supabase Dev Project

**What it is:** Create a second Supabase project just for development

**Pros:**
- ✅ No Docker required
- ✅ Minimal setup (5 minutes)
- ✅ Same stack as production
- ✅ Works from anywhere (cloud-based)
- ✅ Low system resource usage

**Cons:**
- ❌ Requires internet connection
- ❌ May incur Supabase costs if you exceed free tier
- ❌ Data persists (not as easy to reset)
- ❌ Still using external service for development

**Best for:**
- Quick setup
- Low-resource computers
- When you can't install Docker

**Setup time:** 5 minutes

**How to set up:**

1. **Create a new Supabase project:**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name it "mo-burritos-dev" (or similar)
   - Choose a region and password
   - Wait for it to initialize (~2 minutes)

2. **Get your dev project credentials:**
   - Go to Project Settings → API
   - Copy: Project URL, anon key, service_role key
   - Go to Project Settings → Database
   - Copy: Connection string

3. **Update your development .env files:**

   **Frontend `.env`:**
   ```env
   VITE_ENVIRONMENT=development
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=https://your-dev-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-dev-anon-key
   ```

   **Backend `.env`:**
   ```env
   ENVIRONMENT=development
   DATABASE_URL=postgresql://postgres:[password]@db.your-dev-project.supabase.co:5432/postgres
   SUPABASE_URL=https://your-dev-project.supabase.co
   SUPABASE_ANON_KEY=your-dev-anon-key
   SUPABASE_SERVICE_KEY=your-dev-service-key
   ```

4. **Create tables in your dev database:**
   ```bash
   cd backend
   source venv/bin/activate
   python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
   ```

5. **Keep your production .env files separate** with your production Supabase credentials

---

### Option 3: Keep SQLite + Disable Supabase in Dev (Simplest)

**What it is:** Continue using SQLite, but don't use Supabase Auth in development

**Pros:**
- ✅ Simplest setup (no changes needed)
- ✅ Fast and lightweight
- ✅ No external dependencies
- ✅ Easy database reset

**Cons:**
- ❌ Different stack than production (SQLite vs PostgreSQL)
- ❌ Can't test Supabase Auth features locally
- ❌ Users must register separately in dev environment
- ❌ Not realistic for testing OAuth flows

**Best for:**
- Solo development
- When you don't need to test auth flows
- Rapid prototyping

**Setup time:** 0 minutes (already working)

**How to use:**

1. **Frontend `.env`:**
   ```env
   VITE_ENVIRONMENT=development
   VITE_API_URL=http://localhost:8000
   # Leave Supabase vars empty
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

2. **Backend `.env`:**
   ```env
   ENVIRONMENT=development
   DATABASE_URL=sqlite:///./mos_burritos.db
   # Leave Supabase vars empty
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_KEY=
   ```

3. **Create test users manually:**
   ```bash
   cd backend
   python -c "
   from app.database import SessionLocal
   from app.models.user import User, UserRole
   from app.services.auth import get_password_hash
   
   db = SessionLocal()
   
   # Create test admin
   admin = User(
       email='admin@test.com',
       password_hash=get_password_hash('admin123'),
       phone_number='+1234567890',
       role=UserRole.OWNER,
       full_name='Test Admin'
   )
   db.add(admin)
   db.commit()
   print('Test admin created: admin@test.com / admin123')
   "
   ```

---

## Comparison Table

| Feature | Local Supabase | Separate Dev Project | SQLite Only |
|---------|---------------|---------------------|-------------|
| **Setup Time** | 15-20 min | 5 min | 0 min |
| **System Requirements** | Docker (3GB+) | Minimal | Minimal |
| **Internet Required** | No | Yes | No |
| **Production Parity** | 100% | 100% | 70% |
| **Data Isolation** | Complete | Complete | N/A |
| **Easy Database Reset** | Yes | No | Yes |
| **Cost** | Free | Free tier limits | Free |
| **OAuth Testing** | Yes | Yes | No |

---

## My Recommendation

**For your situation, I recommend: Option 1 (Local Supabase)** ✨

**Why:**
1. You already have the issue of data not syncing - this solves it completely
2. You want to use Supabase in both dev and prod - this gives you exact parity
3. One-time setup gives you a professional development environment
4. Complete isolation means you can't accidentally break production

**Quick start:**
```bash
./setup-local-supabase.sh
```

Then follow the instructions in [SUPABASE_LOCAL_DEV_SETUP.md](./SUPABASE_LOCAL_DEV_SETUP.md)

---

## FAQ

### Q: Can I switch between options later?
**A:** Yes! Your code already supports all three options. Just change your .env files.

### Q: Will this affect my production environment?
**A:** No. Your production environment stays completely separate and unchanged.

### Q: Do I need to modify my code?
**A:** No. Your code is already designed to work with any of these options.

### Q: What if I don't have Docker?
**A:** Use Option 2 (Separate Dev Project) or Option 3 (SQLite Only).

### Q: How much disk space does Local Supabase use?
**A:** ~3-4 GB (including Docker images and database).

### Q: Can I use Local Supabase on M1/M2 Mac?
**A:** Yes! Supabase CLI fully supports Apple Silicon.

### Q: Will Google OAuth accept localhost for development?
**A:** Yes! Google explicitly supports localhost without requiring domain verification. See [GOOGLE_OAUTH_LOCALHOST_GUIDE.md](./GOOGLE_OAUTH_LOCALHOST_GUIDE.md) for details.

---

## Need Help?

See the detailed setup guide: [SUPABASE_LOCAL_DEV_SETUP.md](./SUPABASE_LOCAL_DEV_SETUP.md)
