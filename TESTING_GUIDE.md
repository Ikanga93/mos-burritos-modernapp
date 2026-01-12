# Testing Guide: Dual Auth & Database System

This guide helps you test the dual authentication and database system in both development and production modes.

## Prerequisites

1. **Backend dependencies installed:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Frontend dependencies installed:**
   ```bash
   npm install
   ```

3. **Environment files configured:**
   - Copy `backend/env.development.example` to `backend/.env`
   - Copy `env.development.example` to `.env`

## Testing Development Mode (JWT + SQLite)

### Setup

1. **Configure backend environment:**
   ```bash
   cd backend
   # Ensure .env has:
   # ENVIRONMENT=development
   # DATABASE_URL=sqlite:///./mos_burritos.db
   ```

2. **Configure frontend environment:**
   ```bash
   # Ensure .env has:
   # VITE_ENVIRONMENT=development
   # VITE_API_URL=http://localhost:8000
   ```

3. **Initialize database (if needed):**
   ```bash
   cd backend
   python seed_db.py
   ```

### Test Steps

1. **Start backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   
   Expected: Server starts on http://localhost:8000

2. **Start frontend:**
   ```bash
   npm run dev
   ```
   
   Expected: App starts on http://localhost:5173

3. **Test Customer Registration:**
   - Navigate to http://localhost:5173/register
   - Create a new customer account with email/password
   - Expected: Successfully register and auto-login
   - Verify: Check `customerAccessToken` in localStorage
   - Verify: JWT token format (three Base64 segments separated by dots)

4. **Test Customer Login:**
   - Logout and navigate to /login
   - Login with registered credentials
   - Expected: Successfully authenticate
   - Verify: Can access menu and cart

5. **Test Admin Login:**
   - Navigate to http://localhost:5173/admin/login
   - Login with owner account (default: from seed_db.py)
   - Expected: Successfully authenticate
   - Verify: Can access admin dashboard

6. **Test Token Refresh:**
   - After login, wait for token to expire (30 minutes default) or manually delete `customerAccessToken`
   - Make an API request (e.g., view menu)
   - Expected: Token automatically refreshes using refresh token
   - Verify: New `customerAccessToken` in localStorage

7. **Verify Database:**
   ```bash
   cd backend
   sqlite3 mos_burritos.db
   SELECT * FROM users;
   ```
   Expected: See registered users with `supabase_id` = NULL

### Development Mode Checklist

- [ ] Customer registration works
- [ ] Customer login works
- [ ] Admin login works
- [ ] JWT tokens are stored in localStorage
- [ ] Token refresh works automatically
- [ ] Data persists in SQLite database
- [ ] No Supabase API calls made (check Network tab)

## Testing Production Mode (Supabase Auth + PostgreSQL)

### Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create a new project
   - Note: Project URL, Anon Key, Service Key, Database Password

2. **Configure backend environment:**
   ```bash
   cd backend
   # Update .env with:
   # ENVIRONMENT=production
   # DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   # SUPABASE_URL=https://[PROJECT-REF].supabase.co
   # SUPABASE_ANON_KEY=your-anon-key
   # SUPABASE_SERVICE_KEY=your-service-key
   ```

3. **Configure frontend environment:**
   ```bash
   # Update .env with:
   # VITE_ENVIRONMENT=production
   # VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   # VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Migrate database schema:**
   ```bash
   cd backend
   # Option 1: Create tables only
   python -c "from app.database import engine, Base; Base.metadata.create_all(engine)"
   
   # Option 2: Migrate existing data from SQLite
   python scripts/migrate_to_supabase.py
   ```

### Test Steps

1. **Start backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   
   Expected: Server starts and connects to PostgreSQL
   Check logs for: "Connecting to PostgreSQL"

2. **Start frontend:**
   ```bash
   npm run dev
   ```

3. **Test Customer Registration (Supabase):**
   - Navigate to http://localhost:5173/register
   - Create a new customer account
   - Expected: Account created in Supabase Auth
   - Verify in Supabase Dashboard → Authentication → Users
   - Verify: Supabase session in browser (Application → Storage)

4. **Test Customer Login (Supabase):**
   - Logout and login with registered credentials
   - Expected: Authenticate via Supabase
   - Verify: Session stored in Supabase client
   - Verify: User record in PostgreSQL has `supabase_id` populated

5. **Test Token Validation:**
   - Make API requests while logged in
   - Expected: Supabase token sent in Authorization header
   - Backend validates token with Supabase Auth
   - User data loaded from PostgreSQL

6. **Test Admin Login (Still JWT):**
   - Navigate to /admin/login
   - Login with owner account
   - Expected: Successfully authenticate with JWT
   - Note: Admin auth still uses JWT even in production

7. **Verify Database:**
   - Go to Supabase Dashboard → Table Editor
   - Check `users` table
   - Expected: See users with `supabase_id` populated
   - Expected: Foreign keys maintained

### Production Mode Checklist

- [ ] Backend connects to PostgreSQL
- [ ] Customer registration creates Supabase Auth user
- [ ] Customer login uses Supabase Auth
- [ ] Supabase session tokens used for API requests
- [ ] User data synced to PostgreSQL with `supabase_id`
- [ ] Admin login still works with JWT
- [ ] Token refresh works via Supabase
- [ ] Data persists in PostgreSQL

## Common Issues & Debugging

### Issue: "Could not validate credentials"

**Development Mode:**
- Check if JWT_SECRET_KEY is set in backend/.env
- Verify token in localStorage is valid
- Check token expiration

**Production Mode:**
- Check Supabase credentials in .env
- Verify Supabase session is active
- Check CORS settings

### Issue: "Database connection failed"

**Development Mode:**
- Ensure mos_burritos.db exists
- Check DATABASE_URL points to correct path

**Production Mode:**
- Verify DATABASE_URL is correct
- Check Supabase database password
- Ensure SSL mode is enabled
- Check network connectivity to Supabase

### Issue: "Supabase client not initialized"

**Frontend:**
- Check VITE_ENVIRONMENT=production
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Rebuild frontend: `npm run build`

### Issue: Token refresh fails

**Development Mode:**
- Check refresh token in localStorage
- Verify /api/auth/refresh endpoint works

**Production Mode:**
- Check Supabase session refresh
- Verify refresh token is valid
- Check Supabase project status

## Testing Environment Switching

1. **Start in development mode:**
   - Test customer login/register
   - Note data in SQLite

2. **Switch to production mode:**
   - Update both frontend and backend .env files
   - Restart servers
   - Test customer login/register
   - Note data in PostgreSQL

3. **Switch back to development:**
   - Update both .env files back
   - Restart servers
   - Original SQLite data should still be there

Expected: App works seamlessly in both modes without code changes.

## Automated Testing

### Backend API Tests

```bash
cd backend
# Test development mode
ENVIRONMENT=development pytest tests/

# Test production mode (requires Supabase setup)
ENVIRONMENT=production pytest tests/
```

### Frontend E2E Tests

```bash
# Run with Playwright or Cypress
npm run test:e2e
```

## Monitoring & Logging

### Development Mode

- Check backend logs: Terminal running uvicorn
- Check frontend logs: Browser console
- Check database: SQLite CLI or DB Browser

### Production Mode

- Check backend logs: Terminal running uvicorn
- Check Supabase logs: Supabase Dashboard → Logs
- Check database: Supabase Dashboard → Table Editor
- Monitor auth: Supabase Dashboard → Authentication

## Performance Testing

### Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load_test.py --host=http://localhost:8000
```

### Database Performance

- SQLite: Fast for development, single-user
- PostgreSQL: Optimized for production, multiple connections

## Security Testing

### Development Mode Checklist

- [ ] JWT secret is strong and secret
- [ ] Tokens expire appropriately
- [ ] Refresh tokens are secure
- [ ] Passwords are hashed

### Production Mode Checklist

- [ ] Supabase keys are kept secret
- [ ] Service role key never exposed to frontend
- [ ] SSL connections enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Supabase RLS policies configured

## Next Steps

After testing both modes successfully:

1. **Deploy to production:**
   - Set up production environment variables
   - Deploy backend to hosting service
   - Deploy frontend to CDN/hosting
   - Run migration script for existing data

2. **Monitor in production:**
   - Set up error tracking (Sentry, etc.)
   - Monitor Supabase usage and performance
   - Set up database backups
   - Configure alerting

3. **Maintain:**
   - Keep dependencies updated
   - Monitor Supabase quota
   - Regular database backups
   - Security audits
