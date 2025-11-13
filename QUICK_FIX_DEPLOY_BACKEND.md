# 🚀 QUICK FIX: Deploy Backend Separately (5 Minutes)

## Why This Works
- Netlify Functions are complex and unreliable for Flask apps
- Separate backend is simpler and more reliable
- Your frontend is already configured to use external URLs!

## Step-by-Step (5 Minutes)

### 1. Deploy Backend to Render (FREE)

1. **Go to Render**: https://render.com
2. **Sign up/Login** (free account)
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure:**
   - **Name:** `studymind-backend` (or any name)
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Instance Type:** `Free`

6. **Add Environment Variables:**
   - `GEMINI_API_KEY` = your Gemini API key
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = generate a random secret (use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
   - `PORT` = `5000`

7. **Click "Create Web Service"**
8. **Wait 5-10 minutes** for deployment
9. **Get your backend URL:** `https://studymind-backend.onrender.com` (or whatever name you chose)

### 2. Test Backend

Visit: `https://studymind-backend.onrender.com/health`
- Should return: `{"status": "healthy", ...}`

### 3. Update CORS in Backend

Edit `backend/app.py` line 39-45:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://llm-based-study-companion.netlify.app",  # Your Netlify URL
            "http://localhost:3000"  # For local dev
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

Commit and push:
```bash
git add backend/app.py
git commit -m "Update CORS for Netlify frontend"
git push
```

Render will auto-redeploy.

### 4. Set Environment Variable in Netlify

1. **Netlify Dashboard** → Your site → **Site settings** → **Environment variables**
2. **Add variable:**
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://studymind-backend.onrender.com` (your Render URL)
3. **Save**

### 5. Redeploy Netlify

1. **Netlify Dashboard** → **Deploys** tab
2. **Trigger deploy** → **Deploy site**
3. **Wait 2-3 minutes**

### 6. Test!

Visit: https://llm-based-study-companion.netlify.app
- Open browser console (F12)
- Should see: `[API Config] Using NEXT_PUBLIC_API_URL: https://studymind-backend.onrender.com`
- Should see: `✅ API connection successful!`
- Test signup, login, chat - everything should work!

## ✅ Done!

**Total time: 5-10 minutes**
**Cost: $0 (free tiers)**
**Result: Everything works!**

---

## Alternative: Railway (Even Simpler)

If Render doesn't work, try Railway:
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Add service → Select `backend` folder
5. Add environment variables
6. Done! (Railway auto-detects Python)

---

## Why This is Better

✅ **Reliable** - Separate backend always works
✅ **Simple** - No function complexity
✅ **Debuggable** - Easy to check logs
✅ **Free** - Render/Railway free tiers
✅ **Fast** - 5 minutes to set up
✅ **Your frontend already supports this!** - Just set the env var

Your frontend code already checks for `NEXT_PUBLIC_API_URL` first, so this will work immediately!

