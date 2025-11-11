# Deployment Checklist ✅

## Pre-Deployment

### 1. Get Required Credentials
- [ ] MongoDB Atlas connection string
  - Sign up at https://www.mongodb.com/cloud/atlas
  - Create free M0 cluster
  - Create database user
  - Whitelist all IPs (0.0.0.0/0)
  - Copy connection string

- [ ] Gemini API Key
  - Get from https://makersuite.google.com/app/apikey
  - Free tier available

- [ ] Generate JWT Secret
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```

### 2. Prepare Code
- [ ] Code pushed to GitHub
- [ ] All dependencies in requirements.txt
- [ ] gunicorn added to requirements.txt ✅ (already done)
- [ ] Environment variables documented

---

## Deployment Steps

### Option A: Railway (Easiest - Recommended)

- [ ] Go to https://railway.app
- [ ] Sign up / Login
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select your repository
- [ ] Add environment variables:
  - `GEMINI_API_KEY`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_API_URL` (use Railway's public domain)
- [ ] Wait for deployment (2-3 minutes)
- [ ] Test your app!

**Done! Your app is live!** 🎉

---

### Option B: Render + Vercel

#### Backend (Render)
- [ ] Go to https://render.com
- [ ] New Web Service
- [ ] Connect GitHub repository
- [ ] Configure:
  - Root Directory: `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `gunicorn app:app`
- [ ] Add environment variables:
  - `GEMINI_API_KEY`
  - `MONGODB_URI`
  - `JWT_SECRET`
- [ ] Deploy
- [ ] Copy backend URL (e.g., https://studymind-backend.onrender.com)

#### Frontend (Vercel)
- [ ] Go to https://vercel.com
- [ ] Import GitHub repository
- [ ] Configure:
  - Root Directory: `frontend`
  - Framework: Next.js
- [ ] Add environment variable:
  - `NEXT_PUBLIC_API_URL` = your Render backend URL
- [ ] Deploy
- [ ] Copy frontend URL

#### Update CORS
- [ ] Edit `backend/app.py`
- [ ] Add your Vercel URL to CORS origins
- [ ] Commit and push to redeploy

---

## Post-Deployment

### 1. Test Backend
- [ ] Visit `https://your-backend-url.com/health`
- [ ] Should return:
  ```json
  {
    "status": "healthy",
    "model": "gemini-2.5-pro",
    "database": "connected",
    "auth": "configured"
  }
  ```

### 2. Test Frontend
- [ ] Visit your frontend URL
- [ ] Sign up for an account
- [ ] Test login
- [ ] Send a chat message
- [ ] Upload a file
- [ ] Generate content
- [ ] Check grading feature
- [ ] Test quiz generation

### 3. Verify Features
- [ ] Authentication works
- [ ] Chat responses working
- [ ] File upload working
- [ ] Content generation working
- [ ] Grading working
- [ ] Quiz generation working
- [ ] Conversation history saving
- [ ] User preferences saving

---

## Troubleshooting

### Backend Issues
- [ ] Check Render/Railway logs
- [ ] Verify MongoDB connection string
- [ ] Ensure all environment variables are set
- [ ] Test database connection

### Frontend Issues
- [ ] Check Vercel deployment logs
- [ ] Verify NEXT_PUBLIC_API_URL is correct
- [ ] Check browser console for errors
- [ ] Test API endpoint directly

### CORS Issues
- [ ] Verify frontend URL in CORS origins
- [ ] Include both http and https if needed
- [ ] Redeploy backend after CORS changes

---

## Environment Variables Reference

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studymind
JWT_SECRET=your-long-random-secret-key
PORT=5000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Success Criteria

✅ Backend health check returns "healthy"
✅ Frontend loads without errors
✅ Can sign up new account
✅ Can log in
✅ Chat functionality works
✅ File upload works
✅ All features accessible

---

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/alerts
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Create backup strategy
- [ ] Document API for users
- [ ] Create user guide

---

## Free Tier Limits

**Railway**: 500 hours/month + $5 credit
**Render**: 750 hours/month
**Vercel**: Unlimited deployments, 100GB bandwidth
**MongoDB Atlas**: 512MB storage

All sufficient for a personal/demo project! 🎉

---

## Support Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

---

**Estimated Total Time**: 10-15 minutes
**Cost**: $0/month (free tier)
**Difficulty**: Easy 🟢
