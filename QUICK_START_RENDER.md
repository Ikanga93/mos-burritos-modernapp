# 🚀 Quick Start: Deploy to Render in 10 Minutes

## Prerequisites
- [ ] GitHub account
- [ ] Render account (free)
- [ ] Stripe account (for payments)
- [ ] Code pushed to GitHub

---

## Step 1: Set Up Database (2 minutes)

### Choose Neon.tech (Recommended)

1. Go to **[neon.tech](https://neon.tech)** → Sign up (no credit card)
2. Click **"Create Project"**
3. Name: `mos-burritos-db`
4. Click **"Create Project"**
5. **Copy the connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
6. **Save it** - you'll need this in Step 3!

✅ Done! Your free 3GB PostgreSQL database is ready.

---

## Step 2: Deploy to Render (3 minutes)

### A. Push Your Code

```bash
cd /Users/jbshome/Desktop/mo-s-burrito-app-main
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### B. Deploy on Render

1. Go to **[render.com](https://render.com)** → Sign up

2. Click **"New +" → "Blueprint"**

3. **Connect GitHub:**
   - Authorize Render to access your repos
   - Select: `mo-s-burrito-app-main`

4. **Render detects `render.yaml`** → Click **"Apply"**

5. Wait 2-3 minutes for deployment...

✅ Your backend is live at: `https://mos-burritos-api-XXXX.onrender.com`

---

## Step 3: Configure Environment Variables (3 minutes)

After deployment, click your service → **Environment** tab:

### Required Variables (Add These Now):

```bash
# 1. Database (from Step 1)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# 2. Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app

# 3. Same as frontend URL
CORS_ORIGINS=https://your-app.vercel.app

# 4. Stripe Secret Key (get from Stripe Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# 5. Stripe Webhook Secret (we'll get this in Step 4)
# Leave empty for now, add after Step 4
```

**Save Changes** → Service will automatically redeploy

---

## Step 4: Set Up Stripe Webhook (2 minutes)

1. Go to **[Stripe Dashboard](https://dashboard.stripe.com)** → Developers → **Webhooks**

2. Click **"Add endpoint"**

3. **Endpoint URL:**
   ```
   https://your-render-app.onrender.com/api/webhook/stripe
   ```
   (Replace with your actual Render URL)

4. **Select events:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

5. **Add endpoint** → Click **"Reveal"** under "Signing secret"

6. **Copy the webhook secret** (starts with `whsec_`)

7. Go back to **Render** → Environment tab → Add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

8. Service auto-redeploys with new config

✅ Stripe is connected!

---

## Step 5: Update Vercel Frontend (1 minute)

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**

2. Select your project → **Settings** → **Environment Variables**

3. Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   ```
   (Use your actual Render URL, no trailing slash)

4. **Save** → Vercel redeploys automatically

✅ Frontend connected to backend!

---

## Step 6: Test Everything (2 minutes)

### Test Backend:

Visit: `https://your-render-app.onrender.com/health`

Should see:
```json
{
  "status": "healthy",
  "service": "Mo's Burritos API",
  "version": "1.0.0"
}
```

### Test API Docs:

Visit: `https://your-render-app.onrender.com/docs`

You should see the interactive API documentation!

### Test Frontend:

1. Visit your Vercel app
2. Browse menu
3. Add items to cart
4. Try to place an order
5. Complete Stripe test payment

Use Stripe test card:
- Card: `4242 4242 4242 4242`
- Date: Any future date
- CVC: Any 3 digits

✅ Everything working!

---

## 🎉 You're Live!

Your app is now deployed:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-app.onrender.com
- **Database:** Neon PostgreSQL (free)
- **Payments:** Stripe

---

## ⚠️ Important: Free Tier Limitation

**Cold Starts:** Render's free tier spins down after 15 minutes of inactivity. First request takes ~30 seconds to wake up.

### Quick Fix: Keep-Alive Ping

**Option 1: Cron-job.org (Easiest)**

1. Go to **[cron-job.org](https://cron-job.org)**
2. Create free account
3. **Create new cron job:**
   - URL: `https://your-render-app.onrender.com/health`
   - Schedule: Every 14 minutes
   - Save

**Option 2: UptimeRobot**

1. Go to **[uptimerobot.com](https://uptimerobot.com)**
2. Add new monitor
3. Type: HTTP(s)
4. URL: Your health endpoint
5. Interval: 5 minutes

✅ Your backend stays warm!

---

## 📋 Environment Variables Summary

Here's everything you need in Render:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `ENVIRONMENT` | `production` | Auto-set by render.yaml |
| `DATABASE_URL` | `postgresql://...` | Neon.tech dashboard |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel deployment |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Same as FRONTEND_URL |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks |
| `JWT_SECRET_KEY` | Auto-generated | Leave as auto-generated |

---

## 🔧 Troubleshooting

### "Service Unavailable"
- **Wait 30 seconds** - it's waking up from sleep
- Check Render logs for errors

### "Database Connection Error"
- Verify `DATABASE_URL` is correct
- Make sure it ends with `?sslmode=require`

### "CORS Error" in browser
- Check `FRONTEND_URL` and `CORS_ORIGINS` match your Vercel URL
- No trailing slashes!

### Stripe Payment Fails
- Verify `STRIPE_SECRET_KEY` is correct
- Check webhook endpoint URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### Cold Start Too Slow
- Set up keep-alive ping (see above)
- Or upgrade to $7/month plan (always-on)

---

## 🎯 Going Production

When ready for real customers:

1. **Switch to Live Stripe Keys:**
   - Get from: Stripe Dashboard → Developers → API Keys
   - Toggle "View test data" OFF
   - Copy live keys

2. **Update Render Environment:**
   ```
   STRIPE_SECRET_KEY=sk_live_your_live_key
   ```

3. **Create Live Webhook:**
   - New endpoint in Stripe (production mode)
   - Get new `STRIPE_WEBHOOK_SECRET`
   - Update in Render

4. **Test with Real Card:**
   - Use a real credit card (small test transaction)
   - Verify order completes
   - Check Stripe dashboard

---

## 💰 Costs

- Render Web Service: **FREE**
- Neon Database: **FREE** (3GB)
- Stripe: 2.9% + 30¢ per transaction
- Keep-alive Ping: **FREE**
- Vercel Frontend: **FREE**

**Total: $0/month + transaction fees** 🎉

---

## 📞 Support

- **Render Issues:** Check logs in Render dashboard
- **Database Issues:** Neon dashboard → Support
- **Stripe Issues:** Stripe dashboard → Support docs
- **Backend Errors:** Check `/docs` endpoint for API testing

---

## ✅ Deployment Checklist

- [ ] Database created (Neon)
- [ ] Code pushed to GitHub
- [ ] Deployed to Render
- [ ] Environment variables configured
- [ ] Stripe webhook created
- [ ] Vercel updated with backend URL
- [ ] Health check working
- [ ] Test order completed
- [ ] Keep-alive ping set up (optional)

---

**🎊 Congratulations! Your app is live!**

Share your Vercel URL and start getting orders! 🌯
