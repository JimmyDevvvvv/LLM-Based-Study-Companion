# Solutions for Netlify 404 Issue

## Option 1: Deploy Backend Separately (RECOMMENDED - Easiest)

**Why this works:**
- Netlify Functions have limitations with complex Flask apps
- Separate backend is more reliable and easier to debug
- You can use free tiers (Render, Railway, etc.)

**Steps:**

1. **Deploy Backend to Render** (5 minutes):
   - Go to https://render.com
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - Add env vars: `GEMINI_API_KEY`, `MONGODB_URI`, `JWT_SECRET`
   - Deploy!

2. **Get Backend URL:**
   - Render gives you: `https://your-backend.onrender.com`
   - Test: `https://your-backend.onrender.com/health`

3. **Update Netlify:**
   - Netlify Dashboard → Site settings → Environment variables
   - Add: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
   - Redeploy

4. **Update CORS in backend/app.py:**
   ```python
   CORS(app, resources={
       r"/*": {
           "origins": [
               "https://llm-based-study-companion.netlify.app",
               "http://localhost:3000"
           ],
           "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
           "allow_headers": ["Content-Type", "Authorization"]
       }
   })
   ```

**Result:** ✅ Works immediately, no function complexity

---

## Option 2: Use Next.js API Routes (Alternative)

Convert Flask routes to Next.js API routes.

**Pros:**
- Everything in one place
- No separate backend needed

**Cons:**
- Need to rewrite Flask routes to Next.js
- More work

---

## Option 3: Fix Netlify Functions (Current Approach)

**If you want to continue with Netlify Functions:**

1. **Check if functions are detected:**
   - Netlify Dashboard → Functions tab
   - Are `api` and `test` listed?

2. **If NOT listed, check:**
   - Build logs for "Detected function"
   - File structure (must be `api.py`, not `api/__init__.py`)
   - `netlify.toml` configuration

3. **If listed but 404:**
   - Check function logs for errors
   - Test direct URL: `/.netlify/functions/api/health`
   - Check redirect configuration

---

## My Recommendation: Option 1

**Deploy backend separately on Render** - it's:
- ✅ Faster to set up (5 minutes)
- ✅ More reliable
- ✅ Easier to debug
- ✅ Free tier available
- ✅ No function complexity

The frontend is already configured to use `NEXT_PUBLIC_API_URL` if set, so you just need to:
1. Deploy backend to Render
2. Set `NEXT_PUBLIC_API_URL` in Netlify
3. Update CORS
4. Done! ✅

---

## Quick Render Deployment

1. Go to https://render.com
2. Sign up/login
3. New → Web Service
4. Connect your GitHub repo
5. Settings:
   - **Name:** `studymind-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Add environment variables:
   - `GEMINI_API_KEY=your_key`
   - `MONGODB_URI=your_mongodb_uri`
   - `JWT_SECRET=your_secret`
   - `PORT=5000`
7. Deploy!
8. Get URL: `https://studymind-backend.onrender.com`
9. Set in Netlify: `NEXT_PUBLIC_API_URL=https://studymind-backend.onrender.com`

**Total time: 5-10 minutes, guaranteed to work!**

