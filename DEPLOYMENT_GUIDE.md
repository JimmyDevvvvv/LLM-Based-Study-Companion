# Deployment Guide - Easiest Way 🚀

## Overview
- **Backend**: Render (Free tier)
- **Frontend**: Vercel (Free tier)
- **Database**: MongoDB Atlas (Free tier)

Total cost: **$0/month** ✨

---

## Step 1: Setup MongoDB Atlas (5 minutes)

### 1.1 Create Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free account
3. Create a new cluster (choose FREE M0 tier)

### 1.2 Configure Database
1. **Database Access**: Create a database user
   - Click "Database Access" → "Add New Database User"
   - Username: `studymind`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"

2. **Network Access**: Allow connections
   - Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm

3. **Get Connection String**:
   - Click "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://studymind:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/studymind?retryWrites=true&w=majority`

---

## Step 2: Deploy Backend to Render (10 minutes)

### 2.1 Prepare Repository
1. Push your code to GitHub:
```bash
cd d:\Pycharm\Hackthon\LLM-Based-Study-Companion-Tool
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/studymind-ai.git
git push -u origin main
```

### 2.2 Deploy on Render
1. Go to [Render](https://render.com/) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `studymind-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: `Free`

### 2.3 Add Environment Variables
In Render dashboard, add these environment variables:

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://studymind:PASSWORD@cluster0.xxxxx.mongodb.net/studymind
JWT_SECRET=your-long-random-secret-key-here
PORT=5000
```

**Generate JWT_SECRET**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Your backend URL will be: `https://studymind-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 3.2 Deploy via Vercel Dashboard
1. Go to [Vercel](https://vercel.com/) and sign up
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.3 Add Environment Variable
In Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://studymind-backend.onrender.com
```

### 3.4 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Your frontend URL will be: `https://studymind-ai.vercel.app`

---

## Step 4: Update CORS (Important!)

After deployment, update backend CORS to allow your Vercel domain:

Edit `backend/app.py`:
```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://studymind-ai.vercel.app",  # Your Vercel URL
            "http://localhost:3000"  # For local development
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

Commit and push to trigger redeployment:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

---

## Alternative: Deploy Both on Render

If you prefer everything on Render:

### Backend (same as above)

### Frontend on Render
1. Click "New +" → "Static Site"
2. Connect repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build && npm run export`
   - **Publish Directory**: `out`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

---

## Quick Deploy with Railway (Alternative)

Railway is even simpler but has limited free tier:

1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects and deploys both services
5. Add environment variables in Railway dashboard
6. Done! ✨

---

## Testing Your Deployment

1. Visit your frontend URL
2. Click "Sign Up"
3. Create an account
4. Test chat functionality
5. Verify all features work

---

## Troubleshooting

### Backend Issues

**"Database connection failed"**
- Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0)
- Verify MONGODB_URI is correct
- Check database user credentials

**"Auth not configured"**
- Ensure JWT_SECRET is set in Render environment variables
- Redeploy after adding variables

**"CORS error"**
- Update CORS origins in app.py
- Include your Vercel domain
- Redeploy backend

### Frontend Issues

**"Failed to fetch"**
- Check NEXT_PUBLIC_API_URL is correct
- Ensure backend is running (check Render logs)
- Verify CORS is configured

**"Build failed"**
- Check Node version (should be 16+)
- Clear build cache and redeploy
- Check for TypeScript errors

---

## Free Tier Limits

### Render
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Auto-sleep after 15 min inactivity
- ✅ Wakes up on request (slight delay)

### Vercel
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions

### MongoDB Atlas
- ✅ 512MB storage
- ✅ Shared RAM
- ✅ Perfect for small projects

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Backend deployed to Render
- [ ] All environment variables set
- [ ] Frontend deployed to Vercel
- [ ] CORS updated with production URL
- [ ] Test signup/login works
- [ ] Test all features
- [ ] Custom domain configured (optional)

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Render
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records

---

## Monitoring

### Render
- View logs: Dashboard → Logs
- Monitor metrics: Dashboard → Metrics

### Vercel
- View deployments: Dashboard → Deployments
- Check analytics: Dashboard → Analytics

### MongoDB Atlas
- Monitor usage: Dashboard → Metrics
- View logs: Dashboard → Activity Feed

---

## Cost Optimization

All services are FREE, but if you need to upgrade:

- **Render Pro**: $7/month (no sleep, better performance)
- **Vercel Pro**: $20/month (more bandwidth, team features)
- **MongoDB M10**: $0.08/hour (dedicated cluster)

---

## Support

If you encounter issues:
1. Check Render/Vercel logs
2. Verify environment variables
3. Test backend API directly
4. Check MongoDB connection
5. Review CORS configuration

Happy deploying! 🎉
