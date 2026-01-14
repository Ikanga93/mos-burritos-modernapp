# Google OAuth Setup for Dev and Production

## ✅ Quick Answer: Does Google Accept Localhost?

**YES!** Google OAuth fully supports `localhost` for development without requiring domain verification.

👉 **See:** [GOOGLE_OAUTH_LOCALHOST_GUIDE.md](./GOOGLE_OAUTH_LOCALHOST_GUIDE.md) for detailed localhost setup and troubleshooting.

---

## Best Practice: Separate Credentials for Each Environment

For security and isolation, create separate Google OAuth credentials for development and production.

---

## Setup for Development (Local Supabase)

### Step 1: Create Development OAuth Credentials in Google Cloud

1. **Go to Google Cloud Console:**
   - Navigate to https://console.cloud.google.com/
   - Select your existing project OR create a new one called "mo-burritos-dev"

2. **Enable Google+ API (if not already enabled):**
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

3. **Create OAuth Client ID:**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - If prompted to configure OAuth consent screen, do that first (select "External" for testing)
   
4. **Configure OAuth Client:**
   - **Application type:** Web application
   - **Name:** Mo's Burritos - Development
   
5. **Add Authorized Redirect URIs:**
   
   **For Local Supabase (Option 1):**
   ```
   http://localhost:54321/auth/v1/callback
   ```
   
   **For Separate Dev Supabase Project (Option 2):**
   ```
   https://your-dev-project.supabase.co/auth/v1/callback
   ```
   
   **For Frontend Callback:**
   ```
   http://localhost:5173/auth/callback
   ```

6. **Save and Copy Credentials:**
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**
   - Keep these safe!

### Step 2: Configure Supabase with Dev Credentials

#### For Local Supabase (Option 1):

1. **Access Local Supabase Studio:**
   - Start local Supabase: `supabase start`
   - Open http://localhost:54323

2. **Enable Google Provider:**
   - Go to **Authentication** → **Providers**
   - Find **Google** and click to expand
   - Toggle **Enable Sign in with Google**

3. **Enter Your Dev Credentials:**
   - **Client ID:** Paste your development Client ID
   - **Client Secret:** Paste your development Client Secret
   - Click **Save**

#### For Separate Dev Supabase Project (Option 2):

1. **Access Dev Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your development project

2. **Enable Google Provider:**
   - Navigate to **Authentication** → **Providers**
   - Click on **Google**
   - Toggle **Google Enabled**

3. **Enter Your Dev Credentials:**
   - **Client ID (for OAuth):** Paste your development Client ID
   - **Client Secret (for OAuth):** Paste your development Client Secret
   - Click **Save**

---

## Setup for Production

### Step 1: Create Production OAuth Credentials in Google Cloud

1. **Go to Google Cloud Console:**
   - Navigate to https://console.cloud.google.com/
   - Use the same project OR create a separate "mo-burritos-prod" project

2. **Create Another OAuth Client ID:**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   
3. **Configure Production OAuth Client:**
   - **Application type:** Web application
   - **Name:** Mo's Burritos - Production
   
4. **Add Production Authorized Redirect URIs:**
   ```
   https://your-production-project.supabase.co/auth/v1/callback
   https://your-production-domain.com/auth/callback
   https://your-vercel-app.vercel.app/auth/callback
   ```

5. **Save and Copy Production Credentials:**
   - Copy the production **Client ID** and **Client Secret**

### Step 2: Configure Production Supabase

1. **Access Production Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your **production** project

2. **Enable Google Provider:**
   - Navigate to **Authentication** → **Providers**
   - Click on **Google**
   - Toggle **Google Enabled**

3. **Enter Production Credentials:**
   - **Client ID (for OAuth):** Paste your production Client ID
   - **Client Secret (for OAuth):** Paste your production Client Secret
   - Click **Save**

---

## Alternative: Reuse Same Credentials (Not Recommended)

If you want to use the **same** Google OAuth credentials for both dev and prod:

### Pros:
- ✅ Simpler setup (only one set of credentials)
- ✅ Less management overhead

### Cons:
- ❌ Less secure (if dev credentials leak, prod is compromised)
- ❌ Can't independently rotate secrets
- ❌ Dev and prod analytics mixed together
- ❌ More redirect URLs in one client (messier)

### How to do it:

1. **Use your existing production credentials**

2. **Add ALL redirect URLs to ONE OAuth client:**
   ```
   # Production
   https://your-production-project.supabase.co/auth/v1/callback
   https://your-production-domain.com/auth/callback
   
   # Development (Local Supabase)
   http://localhost:54321/auth/v1/callback
   http://localhost:5173/auth/callback
   
   # Development (Separate Dev Project)
   https://your-dev-project.supabase.co/auth/v1/callback
   ```

3. **Use the same Client ID and Secret in both environments**

4. **Configure both Supabase projects with the same credentials**

---

## Environment Variables Reference

After setting up Google OAuth, update your environment files:

### Development (Local Supabase) - Frontend `.env`

```env
VITE_ENVIRONMENT=development
VITE_API_URL=http://localhost:8000

# Local Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-supabase-anon-key
```

### Development (Local Supabase) - Backend `.env`

```env
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Local Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-supabase-anon-key
SUPABASE_SERVICE_KEY=your-local-supabase-service-key

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Production - Frontend `.env.production`

```env
VITE_ENVIRONMENT=production
VITE_API_URL=https://your-api.vercel.app

# Production Supabase
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### Production - Backend `.env`

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://your-production-db-url

# Production Supabase
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_KEY=your-production-service-key

FRONTEND_URL=https://your-production-domain.com
CORS_ORIGINS=https://your-production-domain.com
```

---

## Testing Google OAuth

### Development Testing:

1. **Start your local environment:**
   ```bash
   # Terminal 1: Start local Supabase
   supabase start
   
   # Terminal 2: Start backend
   cd backend && source venv/bin/activate && uvicorn app.main:app --reload
   
   # Terminal 3: Start frontend
   npm run dev
   ```

2. **Test sign in:**
   - Go to http://localhost:5173
   - Click "Sign in with Google"
   - You should be redirected to Google
   - After authentication, redirected back to your app
   - Check Supabase Studio (http://localhost:54323) to see the user created

### Production Testing:

1. **Deploy your app to production**
2. **Visit your production URL**
3. **Click "Sign in with Google"**
4. **Verify user appears in production Supabase dashboard**

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in your request doesn't match any authorized URIs in Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Verify the redirect URI matches exactly (check for http vs https, trailing slashes, etc.)
4. Common correct URIs:
   - Local Supabase: `http://localhost:54321/auth/v1/callback`
   - Dev Supabase: `https://xxxxx.supabase.co/auth/v1/callback`
   - Production: `https://your-project.supabase.co/auth/v1/callback`

### Error: "invalid_client"

**Cause:** Client ID or Secret is incorrect.

**Solution:**
1. Verify you copied the correct credentials from Google Cloud Console
2. Check for extra spaces or missing characters
3. Regenerate the secret if needed

### Users can sign in but don't appear in database

**Cause:** Backend middleware isn't syncing users properly.

**Solution:**
1. Check backend logs for errors
2. Verify `SUPABASE_SERVICE_KEY` is set correctly
3. Check that database tables exist:
   ```bash
   # For local PostgreSQL
   psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt"
   ```

### OAuth works locally but not in production

**Cause:** Redirect URIs not set for production domain.

**Solution:**
1. Add your production domain to Google OAuth redirect URIs
2. Update Supabase Auth settings to include your production URL
3. Verify environment variables are set correctly in your hosting provider

---

## Summary

✅ **Recommended:** Create separate Google OAuth credentials for dev and prod  
✅ **Development:** Use http://localhost:54321/auth/v1/callback (local Supabase)  
✅ **Production:** Use https://your-project.supabase.co/auth/v1/callback  
✅ **Security:** Keep dev and prod credentials separate  
✅ **Testing:** Always test OAuth flow after setup  

For more help, see:
- [SUPABASE_LOCAL_DEV_SETUP.md](./SUPABASE_LOCAL_DEV_SETUP.md)
- [DEV_ENVIRONMENT_OPTIONS.md](./DEV_ENVIRONMENT_OPTIONS.md)
