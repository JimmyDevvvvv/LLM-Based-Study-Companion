# Railway Deployment Fix - Monorepo Issue

## Problem
Railway can't auto-detect your app because it's a monorepo (backend + frontend in one repo).

## Solution: Deploy as Two Separate Services

### **Step 1: Delete Current Deployment**
1. Go to Railway dashboard
2. Delete the failed deployment
3. Start fresh

### **Step 2: Deploy Backend Service**

1. **Create New Service**
   - Click "New" → "GitHub Repo"
   - Select your repository
   
2. **Configure Backend**
   - Click on the service → Settings
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   
3. **Add Environment Variables**
   ```
   GEMINI_API_KEY=your_gemini_key
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. **Deploy** - Click "Deploy"

### **Step 3: Deploy Frontend Service**

1. **Add Another Service**
   - In same project, click "New" → "GitHub Repo"
   - Select same repository again
   
2. **Configure Frontend**
   - Click on the service → Settings
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   
3. **Add Environment Variable**
   - Get your backend URL from Railway (e.g., `https://studymind-backend-production.up.railway.app`)
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
   ```

4. **Deploy** - Click "Deploy"

### **Step 4: Update CORS**

After both services are deployed:

1. Get your frontend URL from Railway
2. Update `backend/app.py` CORS configuration:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://your-frontend-url.up.railway.app",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

3. Commit and push to trigger backend redeployment

---

## Alternative: Use Railway CLI

If the UI is confusing, use the CLI:

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login
```bash
railway login
```

### Deploy Backend
```bash
cd backend
railway init
railway up
railway variables set GEMINI_API_KEY=your_key
railway variables set MONGODB_URI=your_mongodb_uri
railway variables set JWT_SECRET=your_secret
```

### Deploy Frontend
```bash
cd ../frontend
railway init
railway up
railway variables set NEXT_PUBLIC_API_URL=your_backend_url
```

---

## Even Easier: Use Render + Vercel Instead

If Railway is too confusing, try this simpler approach:

### **Backend on Render** (5 min)
1. Go to https://render.com
2. New Web Service
3. Connect GitHub
4. **Root Directory**: `backend`
5. **Build Command**: `pip install -r requirements.txt`
6. **Start Command**: `gunicorn app:app`
7. Add environment variables
8. Deploy

### **Frontend on Vercel** (3 min)
1. Go to https://vercel.com
2. Import GitHub repo
3. **Root Directory**: `frontend`
4. Framework: Next.js (auto-detected)
5. Add `NEXT_PUBLIC_API_URL` variable
6. Deploy

**This is actually easier than Railway for monorepos!**

---

## Files I Created

✅ `railway.json` - Railway config (root)
✅ `backend/nixpacks.toml` - Backend build config
✅ `frontend/nixpacks.toml` - Frontend build config

These files tell Railway how to build each service.

---

## Quick Decision Guide

**Use Railway if:**
- You want everything in one platform
- You're okay with manual service configuration
- You have time to set up two services

**Use Render + Vercel if:**
- You want the easiest deployment
- You prefer specialized platforms
- You want better free tier limits

---

## My Recommendation

**Go with Render + Vercel** for your monorepo. It's actually easier:

1. **Render** handles Python/Flask perfectly
2. **Vercel** is built for Next.js
3. Both auto-detect settings
4. Better free tiers
5. Less configuration needed

Total time: **8 minutes** vs Railway's **15 minutes** for monorepos.

---

## Next Steps

**Option A: Continue with Railway**
1. Push the new config files I created
2. Delete failed deployment
3. Create two separate services (backend + frontend)
4. Set root directories for each

**Option B: Switch to Render + Vercel**
1. Follow `DEPLOYMENT_GUIDE.md`
2. Much simpler for monorepos
3. Better documentation

Your choice! 🚀
