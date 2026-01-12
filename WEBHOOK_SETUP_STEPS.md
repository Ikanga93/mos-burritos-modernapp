# Stripe Webhook Setup - Step by Step

## ✅ Step 1: Stripe CLI Installed
Stripe CLI has been installed successfully!

---

## 📝 Step 2: Login to Stripe CLI

Run this command in your terminal:

```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to login to your Stripe account
3. Ask for permission to let the CLI access your account
4. Return to terminal once authenticated

**Note:** If you don't have a Stripe account yet, create one at https://dashboard.stripe.com/register

---

## 🚀 Step 3: Start Your Backend Server

Open a **NEW terminal window/tab** and run:

```bash
cd /Users/jbshome/Desktop/mo-s-burrito-app-main/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Keep this terminal running!

---

## 🎧 Step 4: Start Stripe Webhook Listener

Open **ANOTHER terminal window/tab** and run:

```bash
stripe listen --forward-to localhost:8000/api/webhook/stripe
```

You should see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

**IMPORTANT:** Copy the webhook secret (the part that starts with `whsec_`)

Keep this terminal running too!

---

## 🔑 Step 5: Add Webhook Secret to .env

1. Open the file: `backend/.env`
2. Find the line: `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`
3. Replace `whsec_your_webhook_secret` with the secret you copied
4. Save the file

Example:
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghij
```

---

## 🔄 Step 6: Restart Backend

Go back to the terminal where your backend is running:
1. Press `Ctrl + C` to stop it
2. Restart it:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 🎨 Step 7: Start Frontend

Open **ANOTHER terminal window/tab** and run:

```bash
cd /Users/jbshome/Desktop/mo-s-burrito-app-main
npm run dev
```

---

## 🧪 Step 8: Test the Webhook!

1. Go to http://localhost:5173
2. Login or create an account
3. Add items to cart
4. Proceed to checkout
5. Use Stripe test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** `12/34` (any future date)
   - **CVC:** `123` (any 3 digits)
   - **ZIP:** `12345` (any 5 digits)
6. Complete the payment

---

## ✅ What to Expect

### In Stripe CLI Terminal:
You should see:
```
webhook received! 🎉
checkout.session.completed
```

### In Backend Terminal:
You should see:
```
✅ Order #123 confirmed via webhook - sent to restaurant #1
```

### In Admin Dashboard:
1. Go to http://localhost:5173/admin/login
2. Login with admin credentials
3. Check the Orders page
4. You should see the new order with status "CONFIRMED"!

---

## 🏃 Quick Reference - All Commands

Once everything is set up, you need these 3 terminals running:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Stripe Webhooks:**
```bash
stripe listen --forward-to localhost:8000/api/webhook/stripe
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

---

## ⚠️ Troubleshooting

### "Please login first" error
Run: `stripe login` and authenticate in the browser

### Webhook not receiving events
- Make sure backend is running on port 8000
- Check that Stripe CLI is running with no errors
- Verify the webhook secret is in backend/.env

### Backend crashes after adding webhook secret
- Restart the backend server
- Check for typos in the .env file

### Payment succeeds but order not confirmed
- Check backend terminal for errors
- Verify webhook secret is correct
- Look for logs starting with "✅ Order #"

---

## 📱 Current Status

- [x] Stripe CLI installed
- [ ] Stripe CLI authenticated (`stripe login`)
- [ ] Backend server running
- [ ] Stripe webhook listener running
- [ ] Webhook secret added to .env
- [ ] Frontend running
- [ ] Test payment completed

---

## 🎯 Next Step

**Run this command to login to Stripe:**
```bash
stripe login
```

Then follow the steps above!
