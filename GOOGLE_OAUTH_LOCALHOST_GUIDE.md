# Google OAuth with Localhost - Complete Guide

## Common Question: "Will Google accept localhost?"

**YES!** ✅ Google OAuth fully supports localhost for development without requiring domain verification.

---

## What You'll See in Google Cloud Console

### Step 1: Create OAuth Client ID

1. Go to https://console.cloud.google.com/
2. Select or create your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**

### Step 2: Configure OAuth Consent Screen (First Time Only)

If this is your first OAuth client, Google will ask you to configure the consent screen:

1. **User Type:**
   - Select **External** (works for testing, any Google account can sign in)
   - Click **Create**

2. **App Information:**
   - **App name:** Mo's Burritos Dev (or any name)
   - **User support email:** Your email
   - **Developer contact email:** Your email
   - Click **Save and Continue**

3. **Scopes:**
   - Click **Save and Continue** (default scopes are fine)

4. **Test Users (Optional):**
   - You can add specific test users, OR
   - Leave empty to allow any Google account during development
   - Click **Save and Continue**

5. **Summary:**
   - Review and click **Back to Dashboard**

**Note:** For development, your app stays in "Testing" mode, which is perfect. You don't need to verify your domain or publish the app!

### Step 3: Create the OAuth Client

1. **Application type:** 
   - Select **Web application**

2. **Name:**
   - Enter: "Mo's Burritos - Development" (or any name you prefer)

3. **Authorized JavaScript origins (Optional for this setup):**
   - You can leave this empty for OAuth flow
   - Or add: `http://localhost:5173` (your frontend)

4. **Authorized redirect URIs:** ⭐ **THIS IS THE IMPORTANT PART**

   Click **+ ADD URI** and add these one by one:

   **For Local Supabase:**
   ```
   http://localhost:54321/auth/v1/callback
   ```

   **For Frontend Callback (optional but recommended):**
   ```
   http://localhost:5173/auth/callback
   ```

   **Screenshots of what you'll see:**
   ```
   Authorized redirect URIs

   ┌─────────────────────────────────────────────────────┐
   │ http://localhost:54321/auth/v1/callback            │ 🗑️
   └─────────────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────────────┐
   │ http://localhost:5173/auth/callback                │ 🗑️
   └─────────────────────────────────────────────────────┘

   + ADD URI
   ```

5. **Click Create**

### Step 4: Copy Your Credentials

You'll see a popup with your credentials:

```
OAuth client created

Your Client ID:
┌─────────────────────────────────────────────────────────────┐
│ 1234567890-abcdefghijklmnop.apps.googleusercontent.com     │ 📋
└─────────────────────────────────────────────────────────────┘

Your Client Secret:
┌─────────────────────────────────────────────────────────────┐
│ GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz                          │ 📋
└─────────────────────────────────────────────────────────────┘

⚠️ Keep your client secret confidential
```

**IMPORTANT:** 
- ✅ Copy both values NOW
- ✅ Save them securely (you'll need them for Supabase)
- ⚠️ The secret is shown only once (but you can create a new one later if needed)

---

## Configure in Supabase

### For Local Supabase:

1. **Start Supabase:**
   ```bash
   supabase start
   ```

2. **Open Supabase Studio:**
   - Go to http://localhost:54323
   - Click on **Authentication** (icon on left sidebar)
   - Click on **Providers**

3. **Enable Google:**
   - Find **Google** in the list
   - Toggle it **ON** (to the right)
   - You'll see these fields:

   ```
   Google enabled ●────────────────────○ [Toggle ON]
   
   Client ID (for OAuth) *
   ┌─────────────────────────────────────────────────────────────┐
   │ Paste your Client ID here                                   │
   └─────────────────────────────────────────────────────────────┘
   
   Client Secret (for OAuth) *
   ┌─────────────────────────────────────────────────────────────┐
   │ Paste your Client Secret here                               │
   └─────────────────────────────────────────────────────────────┘
   
   [Save]
   ```

4. **Paste your credentials and Save**

---

## Testing: Does Localhost Really Work?

### Quick Test:

1. **Start everything:**
   ```bash
   # Terminal 1: Supabase
   supabase start
   
   # Terminal 2: Backend
   cd backend && source venv/bin/activate && uvicorn app.main:app --reload
   
   # Terminal 3: Frontend
   npm run dev
   ```

2. **Open your app:**
   - Go to http://localhost:5173

3. **Try Google Sign In:**
   - Click "Sign in with Google" button
   - You should see Google's consent screen
   - Select your Google account
   - You'll be redirected back to http://localhost:5173

4. **Verify it worked:**
   - You should be logged in
   - Open http://localhost:54323 (Supabase Studio)
   - Go to **Authentication** → **Users**
   - You should see your Google user in the list!

---

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch" Error

**Error message:**
```
Error 400: redirect_uri_mismatch
The redirect URI in the request: http://localhost:54321/auth/v1/callback 
does not match the ones authorized for the OAuth client.
```

**Cause:** The redirect URI doesn't match exactly (even a trailing slash matters!)

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth client
3. Check **Authorized redirect URIs**
4. Make sure it matches EXACTLY:
   - ✅ `http://localhost:54321/auth/v1/callback`
   - ❌ NOT `http://localhost:54321/auth/v1/callback/` (trailing slash)
   - ❌ NOT `https://localhost:54321/auth/v1/callback` (https vs http)

### Issue: "This app isn't verified" Warning

**What you see:**
```
Google hasn't verified this app

This app hasn't been verified by Google yet. Only proceed if you 
know and trust the developer.

[Back to safety]  [Continue]
```

**This is NORMAL for development!**

**Solution:**
- Click **Continue** or **Advanced** → **Go to [App Name] (unsafe)**
- This warning only appears in development
- For production, you would need to verify your domain and app

**Why this happens:**
- Your app is in "Testing" mode
- You haven't published or verified it
- This is expected and safe for your own development

### Issue: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured properly.

**Solution:**
1. Go to Google Cloud Console
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Complete all required fields
4. Set **Publishing status** to "Testing"
5. Add your Google account as a test user (if needed)

### Issue: Works in Google Cloud but Supabase can't authenticate

**Cause:** Client credentials not configured in Supabase, or wrong credentials.

**Solution:**
1. Verify credentials in Supabase Studio (http://localhost:54323)
2. Make sure there are no extra spaces when copying
3. Try regenerating the secret in Google Cloud if needed

---

## Important Notes About Localhost

### ✅ What's Allowed (No Verification Needed):

- `http://localhost` on any port
- `http://127.0.0.1` on any port
- Works immediately, no waiting
- No domain ownership verification required

### ⚠️ What Requires Verification:

- Custom domains (e.g., `myapp.com`)
- Local development domains (e.g., `myapp.local`, `myapp.test`)
- IP addresses other than loopback (e.g., `192.168.1.100`)
- Wildcard redirects (e.g., `*.myapp.com`)

### 🔒 Security Notes:

- Localhost OAuth is only for **development**
- Never use localhost redirects in production
- Keep your Client Secret confidential
- Don't commit credentials to git

---

## For Production (When You're Ready)

When you deploy to production:

1. **Create a separate OAuth client** (recommended)
2. **Add production redirect URIs:**
   ```
   https://your-app.vercel.app/auth/callback
   https://your-production-supabase.co/auth/v1/callback
   ```
3. **Verify your domain** (Google will guide you through this)
4. **Submit for verification** (if you want to remove the warning)

---

## Summary

✅ **Google OAuth FULLY supports localhost**  
✅ **No domain verification needed for development**  
✅ **Works on any port (54321, 5173, etc.)**  
✅ **"This app isn't verified" warning is normal in dev**  
✅ **Just add `http://localhost:PORT/path` to redirect URIs**  

**You're good to go with localhost!** 🚀

---

## Quick Reference: Redirect URIs for Each Setup

### Local Supabase (Recommended):
```
http://localhost:54321/auth/v1/callback
http://localhost:5173/auth/callback
```

### Separate Dev Supabase Project:
```
https://your-dev-project.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
```

### Production:
```
https://your-production-project.supabase.co/auth/v1/callback
https://your-domain.com/auth/callback
```

---

Need more help? See:
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Complete OAuth setup guide
- [SUPABASE_LOCAL_DEV_SETUP.md](./SUPABASE_LOCAL_DEV_SETUP.md) - Local Supabase setup
