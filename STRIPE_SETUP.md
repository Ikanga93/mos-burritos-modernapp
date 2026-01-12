# Stripe Payment & Webhook Setup Guide

## Overview
This guide will help you set up Stripe payments and webhooks so that when a customer completes payment, the order is automatically confirmed and sent to the restaurant dashboard.

---

## Step 1: Get Your Stripe API Keys

### 1.1 Create/Login to Stripe Account
1. Go to https://dashboard.stripe.com/register
2. Create an account or login if you already have one

### 1.2 Get Your Test Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 1.3 Add Keys to Your App

**Backend (.env file):**
```bash
# Edit: backend/.env
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
```

**Frontend (.env file):**
```bash
# Edit: .env (in root directory)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

---

## Step 2: Set Up Webhook for Local Development

### 2.1 Install Stripe CLI
**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
Download from: https://github.com/stripe/stripe-cli/releases/latest

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2.2 Login to Stripe CLI
```bash
stripe login
```
This will open your browser to authenticate.

### 2.3 Forward Webhooks to Local Server

**Start your backend server first:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**In a new terminal, start webhook forwarding:**
```bash
stripe listen --forward-to localhost:8000/api/webhook/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 2.4 Add Webhook Secret to .env
Copy the webhook signing secret and add it to your backend `.env`:
```bash
# Edit: backend/.env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** Restart your backend server after adding the webhook secret!

---

## Step 3: Test the Payment Flow

### 3.1 Start All Services
1. **Backend** (Terminal 1):
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Stripe CLI** (Terminal 2):
   ```bash
   stripe listen --forward-to localhost:8000/api/webhook/stripe
   ```

3. **Frontend** (Terminal 3):
   ```bash
   npm run dev
   ```

### 3.2 Place a Test Order
1. Go to http://localhost:5173
2. Login or create an account
3. Add items to cart
4. Proceed to checkout
5. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

### 3.3 Verify Webhook Received
You should see in the Stripe CLI terminal:
```
✅ Order #123 confirmed via webhook - sent to restaurant #1
```

And in your backend terminal:
```
✅ Order #123 confirmed via webhook - sent to restaurant #1
```

### 3.4 Check Restaurant Dashboard
1. Login to admin dashboard: http://localhost:5173/admin/login
2. Go to Orders section
3. You should see the new order with status "CONFIRMED"

---

## Step 4: Production Deployment

### 4.1 Get Production Stripe Keys
1. Go to https://dashboard.stripe.com/apikeys (remove `/test`)
2. Activate your account (requires business details)
3. Copy your live keys (start with `pk_live_` and `sk_live_`)

### 4.2 Set Up Production Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click **+ Add endpoint**
3. Set endpoint URL: `https://your-production-domain.com/api/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### 4.3 Update Production Environment Variables

**Backend:**
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
FRONTEND_URL=https://your-production-domain.com
```

**Frontend:**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
```

---

## How It Works

### Payment Flow:
1. **Customer** places order and clicks "Confirm & Proceed to Payment"
2. **Frontend** calls backend `/api/create-checkout-session`
3. **Backend** creates Stripe Checkout Session
4. **Customer** is redirected to Stripe's hosted payment page
5. **Customer** enters card details and completes payment
6. **Stripe** sends webhook event `checkout.session.completed` to your server
7. **Backend** receives webhook, updates order status to `CONFIRMED` and `PAID`
8. **Order** now appears in restaurant dashboard as confirmed
9. **Customer** is redirected to success page

### Webhook Endpoint:
- **URL:** `http://localhost:8000/api/webhook/stripe` (local)
- **URL:** `https://your-domain.com/api/webhook/stripe` (production)
- **Events handled:**
  - `checkout.session.completed` - Payment successful, order confirmed
  - `payment_intent.succeeded` - Payment successful (alternative flow)
  - `payment_intent.payment_failed` - Payment failed, mark order as failed

---

## Troubleshooting

### Webhook not receiving events
- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:8000/api/webhook/stripe`
- Check that backend server is running on port 8000
- Verify STRIPE_WEBHOOK_SECRET is set in backend/.env
- Restart backend after adding webhook secret

### Payment succeeds but order not confirmed
- Check backend logs for webhook errors
- Verify order has `stripe_session_id` field populated
- Check database for order status updates

### "Invalid webhook signature" error
- Make sure STRIPE_WEBHOOK_SECRET matches what Stripe CLI shows
- Restart backend server after updating .env
- Don't modify the webhook payload

### Test card not working
- Use `4242 4242 4242 4242` for successful payment
- Use `4000 0000 0000 0002` to test card declined
- Any future expiry date works (e.g., 12/34)

---

## Test Cards

| Scenario | Card Number | Description |
|----------|------------|-------------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Declined | 4000 0000 0000 0002 | Card declined |
| Insufficient funds | 4000 0000 0000 9995 | Insufficient funds |
| 3D Secure | 4000 0025 0000 3155 | Requires authentication |

---

## Security Notes

- ✅ **Never commit** `.env` files to git
- ✅ Keep secret keys secure (starts with `sk_`)
- ✅ Publishable keys can be public (starts with `pk_`)
- ✅ Always verify webhook signatures in production
- ✅ Use HTTPS in production for webhook endpoint

---

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Stripe CLI: https://stripe.com/docs/stripe-cli
