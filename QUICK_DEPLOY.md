# 🚀 Quick Deploy - 3 Steps Only!

## The Absolute Easiest Way

### Option 1: Railway (Recommended - 5 minutes total)

**Why Railway?**
- ✅ Auto-detects everything
- ✅ One-click deploy
- ✅ Free tier available
- ✅ No configuration needed

**Steps:**

1. **Setup MongoDB Atlas** (2 minutes)
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Create free cluster
   - Get connection string
   - Save it!

2. **Deploy on Railway** (2 minutes)
   - Go to https://railway.app
   - Click "Start a New Project"
   - Click "Deploy from GitHub repo"
   - Select this repository
   - Railway will auto-detect and deploy!

3. **Add Environment Variables** (1 minute)
   - In Railway dashboard, click your service
   - Go to "Variables" tab
   - Add:
     ```
     GEMINI_API_KEY=your_key
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=random-long-string-here
     NEXT_PUBLIC_API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
     ```
   - Done! ✨

**Your app will be live at**: `https://your-app.up.railway.app`

---

### Option 2: Render + Vercel (10 minutes)

**Backend (Render):**
1. Push code to GitHub
2. Go to https://render.com
3. New Web Service → Connect GitHub
4. Root Directory: `backend`
5. Add environment variables
6. Deploy!

**Frontend (Vercel):**
1. Go to https://vercel.com
2. Import GitHub repository
3. Root Directory: `frontend`
4. Add `NEXT_PUBLIC_API_URL` variable
5. Deploy!

Full guide: See `DEPLOYMENT_GUIDE.md`

---

### Option 3: Heroku (Classic)

**Backend:**
```bash
cd backend
heroku create studymind-backend
heroku config:set GEMINI_API_KEY=your_key
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

**Frontend:**
```bash
cd frontend
vercel
```

---

## What You Need Before Deploying

1. **MongoDB Connection String**
   - Get from MongoDB Atlas (free)
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/studymind`

2. **Gemini API Key**
   - Get from https://makersuite.google.com/app/apikey
   - Free tier available

3. **JWT Secret**
   - Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - Or use any long random string

---

## After Deployment

1. Visit your frontend URL
2. Sign up for an account
3. Start using StudyMind AI!

---

## Need Help?

- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- Check service logs for errors
- Verify all environment variables are set
- Test backend API directly at `/health` endpoint

---

## Estimated Time

- **Railway**: 5 minutes
- **Render + Vercel**: 10 minutes
- **Heroku**: 15 minutes

Choose Railway for the fastest deployment! 🚀
