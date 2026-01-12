# Dual Authentication & Database System - Implementation Summary

This document describes the implemented dual authentication and database system for Mo's Burrito App.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENT                              │
│                                                                 │
│  Development              │              Production            │
│  ─────────────            │              ──────────            │
│  • ENVIRONMENT=dev        │              • ENVIRONMENT=prod    │
│  • JWT Auth               │              • Supabase Auth       │
│  • SQLite DB              │              • PostgreSQL DB       │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Overview

### ✅ Completed Components

1. **Environment Configuration**
   - `backend/env.development.example` - Development template
   - `backend/env.production.example` - Production template
   - `env.development.example` - Frontend development template
   - `env.production.example` - Frontend production template
   - `ENVIRONMENT_SETUP.md` - Setup guide

2. **Backend Database Layer** (`backend/app/database.py`)
   - Environment-aware database connection
   - SQLite for development with thread-safety
   - PostgreSQL for production with:
     - Connection pooling (size: 10, max overflow: 20)
     - Pre-ping health checks
     - SSL requirement for Supabase
     - Connection recycling (1 hour)

3. **Backend Authentication Middleware** (`backend/app/middleware/auth.py`)
   - Environment-aware token validation
   - Development: JWT token validation via `decode_token()`
   - Production: Supabase token validation via `get_supabase_user_from_token()`
   - Auto-sync users from Supabase to local database
   - Role-based access control
   - Pre-built dependencies:
     - `get_current_user()` - Get authenticated user
     - `get_current_admin_user()` - Require admin role
     - `require_owner` - Owner only
     - `require_manager_or_above` - Owner/Manager
     - `require_staff_or_above` - Owner/Manager/Staff

4. **Frontend Supabase Client** (`src/services/supabaseClient.js`)
   - Lazy initialization (production only)
   - Session management
   - Token refresh handling
   - Helper functions:
     - `getSupabaseClient()` - Get client instance
     - `isSupabaseEnabled()` - Check if Supabase is active
     - `getSupabaseSession()` - Get current session
     - `getSupabaseUser()` - Get current user
     - `signOutSupabase()` - Sign out

5. **Frontend API Client** (`src/services/api/apiClient.js`)
   - Environment-aware token injection
   - Development: JWT from localStorage
   - Production: Supabase session token
   - Automatic token refresh on 401
   - Separate clients for customer and admin

6. **Frontend Auth Context** (`src/contexts/CustomerAuthContext.jsx`)
   - Environment-aware authentication
   - Development: JWT-based login/register
   - Production: Supabase-based login/register
   - Unified interface for both modes
   - Automatic session restoration

7. **Database Migration Script** (`backend/scripts/migrate_to_supabase.py`)
   - Migrate data from SQLite to PostgreSQL
   - Handles all tables and relationships
   - UUID preservation
   - Foreign key constraint validation
   - Batch processing for large datasets
   - Verification step

8. **Package Dependencies**
   - Backend: Already has `supabase>=2.0.0` in requirements.txt
   - Frontend: Added `@supabase/supabase-js@^2.39.0` to package.json

## How It Works

### Development Mode Flow

```
User Login Request
      ↓
Frontend → POST /api/auth/login (email, password)
      ↓
Backend: Validate credentials in SQLite
      ↓
Backend: Generate JWT tokens
      ↓
Frontend: Store tokens in localStorage
      ↓
Subsequent Requests: Authorization: Bearer <JWT>
      ↓
Backend Middleware: Validate JWT → Load user from SQLite
```

### Production Mode Flow

```
User Login Request
      ↓
Frontend → POST /api/auth/supabase/login (email, password)
      ↓
Backend: Validate credentials with Supabase Auth
      ↓
Backend: Get Supabase user → Sync to PostgreSQL
      ↓
Backend: Return Supabase tokens
      ↓
Frontend: Supabase client stores session
      ↓
Subsequent Requests: Authorization: Bearer <Supabase-Token>
      ↓
Backend Middleware: Validate with Supabase → Load user from PostgreSQL
```

## Key Files Modified

### Backend
- ✅ `app/database.py` - PostgreSQL connection pooling
- ✅ `app/middleware/auth.py` - Environment-aware auth
- ✅ `app/config.py` - Already had environment switching
- ✅ `app/services/supabase_auth.py` - Already existed
- ✅ `scripts/migrate_to_supabase.py` - New migration script

### Frontend
- ✅ `services/supabaseClient.js` - New Supabase client
- ✅ `services/api/apiClient.js` - Environment-aware token handling
- ✅ `contexts/CustomerAuthContext.jsx` - Environment-aware auth
- ✅ `package.json` - Added @supabase/supabase-js

### Documentation
- ✅ `ENVIRONMENT_SETUP.md` - Setup instructions
- ✅ `TESTING_GUIDE.md` - Testing procedures
- ✅ `DUAL_AUTH_IMPLEMENTATION.md` - This document

## Environment Variables

### Backend Development
```env
ENVIRONMENT=development
DATABASE_URL=sqlite:///./mos_burritos.db
JWT_SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Backend Production
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET_KEY=your-production-secret
```

### Frontend Development
```env
VITE_ENVIRONMENT=development
VITE_API_URL=http://localhost:8000
```

### Frontend Production
```env
VITE_ENVIRONMENT=production
VITE_API_URL=https://api.your-domain.com
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment Checklist

### Initial Setup

1. **Create Supabase Project**
   - [ ] Sign up at https://supabase.com
   - [ ] Create new project
   - [ ] Copy Project URL
   - [ ] Copy API Keys (Anon and Service Role)
   - [ ] Note Database Password

2. **Configure Production Environment**
   - [ ] Copy `backend/env.production.example` to `backend/.env`
   - [ ] Fill in Supabase credentials
   - [ ] Copy `env.production.example` to `.env.production`
   - [ ] Fill in Supabase URL and Anon Key

3. **Migrate Database**
   - [ ] Run: `python backend/scripts/migrate_to_supabase.py`
   - [ ] Verify data in Supabase Dashboard
   - [ ] Test connections

4. **Deploy Backend**
   - [ ] Deploy to hosting service (Railway, Render, etc.)
   - [ ] Set environment variables
   - [ ] Set ENVIRONMENT=production
   - [ ] Test API endpoints

5. **Deploy Frontend**
   - [ ] Build: `npm run build`
   - [ ] Deploy to hosting (Vercel, Netlify, etc.)
   - [ ] Set environment variables
   - [ ] Test authentication flow

### Testing Production

- [ ] Customer registration works
- [ ] Customer login works  
- [ ] Admin login works
- [ ] Tokens refresh automatically
- [ ] Data persists in PostgreSQL
- [ ] Supabase Auth users created
- [ ] No errors in logs

## Switching Between Environments

The system automatically detects the environment based on the `ENVIRONMENT` variable. No code changes required!

**To use development mode:**
```bash
# Backend
ENVIRONMENT=development uvicorn app.main:app --reload

# Frontend
VITE_ENVIRONMENT=development npm run dev
```

**To use production mode:**
```bash
# Backend
ENVIRONMENT=production uvicorn app.main:app

# Frontend
VITE_ENVIRONMENT=production npm run build && npm run preview
```

## Security Considerations

### Development Mode
- JWT secret should be strong even in development
- SQLite database should not be committed to git
- Keep .env files in .gitignore

### Production Mode
- Never expose Supabase service role key to frontend
- Use environment variables for all secrets
- Enable Supabase Row Level Security (RLS)
- Use SSL for all connections
- Rotate keys regularly
- Monitor Supabase logs for suspicious activity

## Troubleshooting

### "Could not validate credentials"
- Check environment variables are set correctly
- Verify token is present in request
- Check token hasn't expired
- Ensure Supabase credentials are correct (production)

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check database password
- Ensure SSL mode is enabled (production)
- Test network connectivity to Supabase

### "Supabase client not initialized"
- Check VITE_ENVIRONMENT=production
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Rebuild frontend after env changes

### Migration script fails
- Check source SQLite database exists
- Verify PostgreSQL connection string
- Ensure target database is empty or use --force flag
- Check for foreign key constraint violations

## Performance Optimization

### Development (SQLite)
- Single connection, suitable for development
- Fast for local development
- Limited concurrent users

### Production (PostgreSQL)
- Connection pooling: 10 connections with 20 overflow
- Pre-ping for connection health
- Connection recycling every hour
- SSL for security
- Optimized for concurrent users

## Monitoring & Observability

### Metrics to Track
- Authentication success/failure rates
- Token refresh frequency
- Database connection pool usage
- API response times
- Supabase quota usage

### Recommended Tools
- Sentry for error tracking
- Supabase Dashboard for auth/database monitoring
- CloudWatch/Datadog for metrics
- LogRocket for session replay

## Future Enhancements

### Potential Improvements
1. Multi-factor authentication (MFA) via Supabase
2. Social login (Google, Facebook) via Supabase
3. Phone OTP authentication (already partially implemented)
4. Real-time features using Supabase Realtime
5. File storage using Supabase Storage
6. Database backups automation
7. Blue-green deployment strategy
8. A/B testing framework
9. Feature flags
10. Advanced monitoring and alerting

## Support & Resources

### Documentation
- Supabase Docs: https://supabase.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- SQLAlchemy Docs: https://docs.sqlalchemy.org
- React Docs: https://react.dev

### Getting Help
- Check `ENVIRONMENT_SETUP.md` for setup instructions
- Check `TESTING_GUIDE.md` for testing procedures
- Review Supabase Dashboard logs
- Check backend logs for errors
- Review browser console for frontend errors

## Credits

Implemented dual authentication and database system supporting:
- Development: JWT + SQLite
- Production: Supabase Auth + PostgreSQL

All components are environment-aware and switch automatically based on configuration.
