# Railway Backend Deployment Checklist

## Required Environment Variables

Make sure all these environment variables are set in your Railway backend service:

### Core Configuration
```
ENVIRONMENT=production
FRONTEND_URL=https://www.mosburritos.us
```

### CORS Configuration (CRITICAL)
```
CORS_ORIGINS=https://mosburritos.us,https://www.mosburritos.us,http://localhost:5173,http://localhost:3000
```

**Why this is important**: Without the correct CORS origins, your frontend will get "CORS policy" errors and users will be logged out during checkout.

### Database (Supabase)
```
DATABASE_URL=postgresql://postgres.[your-project]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Stripe Payment Processing
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## How to Add/Update Variables

### Method 1: Railway Dashboard
1. Go to https://railway.app/dashboard
2. Select your backend service
3. Click "Variables" tab
4. Add or edit variables
5. Railway will automatically redeploy

### Method 2: Railway CLI
```bash
cd backend
railway link  # If not already linked
railway variables set CORS_ORIGINS="https://mosburritos.us,https://www.mosburritos.us,http://localhost:5173,http://localhost:3000"
railway variables set FRONTEND_URL="https://www.mosburritos.us"
railway variables set ENVIRONMENT="production"
```

## Verify Deployment

After setting environment variables:

1. Check Railway deployment logs for any errors
2. Visit your backend health endpoint: `https://web-production-93566.up.railway.app/health`
3. Test frontend authentication flow
4. Check browser console for CORS errors (should be none)

## Common Issues

### CORS Errors
**Symptom**: "Access-Control-Allow-Origin" errors in browser console
**Fix**: Add your frontend domain to `CORS_ORIGINS`

### Database Connection Errors
**Symptom**: "Connection refused" or "timeout" errors
**Fix**: Use Supabase connection pooler URL (port 6543, not 5432)

### Authentication Failures
**Symptom**: Users logged out during checkout
**Fix**:
1. Ensure `CORS_ORIGINS` includes your frontend domain
2. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
3. Check that `FRONTEND_URL` matches your actual frontend domain

### Stripe Webhook Issues
**Symptom**: Orders not confirming after payment
**Fix**:
1. Update Stripe webhook endpoint to: `https://web-production-93566.up.railway.app/api/webhook/stripe`
2. Ensure `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard

## Monitoring

After deployment, monitor:
- Railway deployment logs
- Frontend browser console
- Supabase auth dashboard
- Stripe payment dashboard
