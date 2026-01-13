# Mo's Burrito App - Vercel Deployment Guide

This guide covers deploying your app to Vercel with serverless functions.

## Architecture Overview

- **Frontend**: React + Vite (Static Build)
- **Backend**: FastAPI (Vercel Serverless Functions)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (Google OAuth)
- **Payments**: Stripe (optional)

## Prerequisites

1. [Vercel Account](https://vercel.com) (free tier works)
2. [Supabase Project](https://supabase.com) (free tier works)
3. Domain (optional, Vercel provides free subdomain)

## Step 1: Prepare Supabase

### Get Your Database URL

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find the **Connection String** section
4. Copy the **Connection Pooling** URI (port 6543) - IMPORTANT for serverless!
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### Get Supabase Keys

1. Navigate to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `SUPABASE_URL`
   - **anon/public key**: `SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_KEY`

### Enable Google OAuth (if using)

1. Navigate to **Authentication** → **Providers**
2. Enable **Google**
3. Add your OAuth credentials
4. Add your Vercel domain to allowed redirect URLs:
   ```
   https://your-app.vercel.app/**
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Git (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New** → **Project**
4. Import your repository
5. Vercel will auto-detect settings (no changes needed)
6. Click **Deploy** (don't set env vars yet)

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add these variables for **Production** environment:

### Required Variables

| Variable | Value | Example |
|----------|-------|---------|
| `ENVIRONMENT` | `production` | `production` |
| `DATABASE_URL` | Your Supabase connection pooling URL | `postgresql://postgres.[ref]:[pw]@...pooler.supabase.com:6543/postgres` |
| `JWT_SECRET_KEY` | Random secure string (32+ chars) | `your-super-secret-jwt-key-change-this-in-production` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |
| `CORS_ORIGINS` | Your frontend domain(s) | `https://your-app.vercel.app` |

### Optional Variables (for Stripe)

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |

### Frontend Environment Variables

Also add these for the **frontend build** (prepend with `VITE_`):

| Variable | Value |
|----------|-------|
| `VITE_ENVIRONMENT` | `production` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_URL` | Leave empty (uses same domain) |

## Step 4: Redeploy

After setting environment variables:

1. Go to **Deployments** tab
2. Click on the three dots (•••) on the latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache** (optional)
5. Click **Redeploy**

## Step 5: Initialize Database

Your FastAPI app will auto-create tables on first run, but you may want to seed data:

### Option A: Use Supabase SQL Editor

1. Go to Supabase Dashboard → **SQL Editor**
2. Run your seed SQL manually

### Option B: Trigger via API

Make a request to your deployed API to trigger table creation:

```bash
curl https://your-app.vercel.app/health
```

## Verify Deployment

### Check Health Endpoint

```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Mo's Burritos API",
  "version": "1.0.0",
  "environment": "production"
}
```

### Check API Documentation

Visit: `https://your-app.vercel.app/api/docs`

### Check Frontend

Visit: `https://your-app.vercel.app`

## Troubleshooting

### "Too Many Connections" Error

- Make sure you're using the **connection pooling** URL (port 6543, not 5432)
- The code is already optimized with `pool_size=2` for serverless

### Database Connection Timeout

- Check that `DATABASE_URL` is correct
- Ensure Supabase project is not paused (free tier pauses after inactivity)
- Verify SSL mode is set to `require` in connection string

### CORS Errors

- Check `CORS_ORIGINS` includes your frontend domain
- Ensure no trailing slashes in domains
- For multiple domains: `https://domain1.com,https://domain2.com`

### Function Timeout (10s limit)

- Free tier: 10 seconds max
- Pro tier: 60 seconds max
- Optimize slow queries
- Consider breaking long operations into smaller functions

### Environment Variables Not Working

- Ensure variables are set for **Production** environment
- Redeploy after adding/changing variables
- Check spelling (case-sensitive)

### Build Fails

Check build logs in Vercel:
- Python dependencies issue? Check `backend/requirements.txt`
- Frontend build issue? Check `package.json` scripts

## Performance Optimization

### Cold Starts

- First request after inactivity: 1-3 seconds
- Subsequent requests: <100ms
- Consider Vercel Pro for better performance

### Database Queries

- Use indexes on frequently queried columns
- Minimize N+1 queries
- Use Supabase connection pooler (already configured)

### Caching

Add caching headers in FastAPI responses:

```python
@app.get("/api/locations")
async def get_locations(response: Response):
    response.headers["Cache-Control"] = "public, max-age=300"
    # ...
```

## Monitoring

### Vercel Analytics

Enable in Project Settings → **Analytics**

### Supabase Logs

Check database logs in Supabase Dashboard → **Logs**

### Custom Monitoring

Consider adding:
- [Sentry](https://sentry.io) for error tracking
- [LogTail](https://logtail.com) for log management

## Scaling Considerations

### Free Tier Limits

- Vercel: 100GB bandwidth/month, serverless execution time limits
- Supabase: 500MB database, 2GB bandwidth, 50,000 monthly active users

### When to Upgrade

Consider paid plans when:
- Traffic exceeds free tier limits
- Need longer function timeouts (60s)
- Need more database storage/connections
- Need team collaboration features

## Security Checklist

- [ ] Changed default admin password
- [ ] Using strong JWT_SECRET_KEY (32+ characters)
- [ ] DATABASE_URL uses SSL (`sslmode=require`)
- [ ] CORS_ORIGINS limited to your domains only
- [ ] Service keys stored as environment variables (not in code)
- [ ] Supabase RLS (Row Level Security) enabled
- [ ] Rate limiting configured (consider Vercel Pro)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure Stripe webhooks (if using payments)
3. Set up monitoring and alerts
4. Configure backups in Supabase
5. Enable Supabase RLS policies
6. Set up CI/CD for automated testing

---

**Congratulations!** Your app is now running on Vercel serverless infrastructure! 🎉
