# Authentication Debugging Instructions

## 🔍 How to Debug the 401 Error

I've added comprehensive logging to help diagnose the authentication issue. Follow these steps:

### Step 1: Clear Everything and Start Fresh

1. Open your browser console (F12 or Cmd+Option+I)
2. Run this in the console to clear all auth data:
```javascript
localStorage.clear()
location.reload()
```

### Step 2: Log In and Watch the Console

1. Log in to the admin panel again
2. Watch the browser console for messages like:
   - `[Admin Auth] Storing tokens after login`
   - `[Admin Auth] Access Token: eyJ...`
   - `[Admin Auth] Login successful - User: your@email.com Role: owner`

3. If you DON'T see these messages, the login itself is failing

### Step 3: Try to Add a Location

1. Navigate to the Locations page
2. Try to add a new location
3. Watch BOTH the browser console AND the terminal running the backend

**In Browser Console, look for:**
- `[Admin API] Making request to /locations with token: eyJ...`
- `[Admin Auth] Attempting to refresh token...` (if token needs refresh)
- `[Admin Auth] Token refreshed successfully` (if refresh works)

**In Backend Terminal, look for:**
- `[AUTH MIDDLEWARE] Authenticating request - Token: eyJ...`
- `[AUTH] Token decoded successfully for user: your@email.com`
- `[AUTH MIDDLEWARE] Authentication successful for: your@email.com`

OR errors like:
- `[AUTH] JWT decode error: ...`
- `[AUTH MIDDLEWARE] Token decode failed`
- `[AUTH MIDDLEWARE] Authentication failed - no user found`

### Step 4: Share the Console Output

Copy and paste the console output (both browser and backend) so I can see exactly what's happening.

## 🔧 Quick Fixes to Try

### Fix 1: Check if Backend is Running
Make sure your backend server is running on port 8000.

### Fix 2: Check Environment Variables
In your backend, check if `.env` file exists and has:
```
ENVIRONMENT=development
JWT_SECRET_KEY=your-secret-key-here
```

### Fix 3: Verify Database
The user account must exist in the database and be active. Check with:
```bash
cd backend
python view_users.py
```

### Fix 4: Check Token in Browser
Open browser console and run:
```javascript
console.log('Access Token:', localStorage.getItem('adminAccessToken'))
console.log('Refresh Token:', localStorage.getItem('adminRefreshToken'))
```

If either is `null`, the login didn't store tokens properly.

## 🚨 Common Issues

1. **JWT_SECRET_KEY mismatch** - Backend restarted with different secret
2. **Database issue** - User doesn't exist or is inactive
3. **CORS issue** - Backend rejecting requests from frontend
4. **Token expired immediately** - System clock issue

## 📝 What to Send Me

Please share:
1. Browser console output (all lines with `[Admin Auth]` or `[Admin API]`)
2. Backend terminal output (all lines with `[AUTH]`)
3. Result of running `localStorage.getItem('adminAccessToken')` in console
4. Your backend environment (development/production)
