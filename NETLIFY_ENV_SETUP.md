# Netlify Environment Variable Setup

## Quick Setup for Production

Your frontend is deployed at: **https://llm-based-study-companion.netlify.app**

Since both your backend and frontend are deployed on Netlify, the backend runs as a **Netlify Function** and is automatically accessible via the `/api` proxy.

## ✅ No Configuration Needed!

If your backend is deployed as a Netlify Function (which it is, based on your `netlify.toml`), the frontend will automatically use `/api` which proxies to `/.netlify/functions/api/`. **You don't need to set `NEXT_PUBLIC_API_URL`!**

The app will:
- Detect it's running on Netlify
- Use `/api` as the base URL
- Requests to `/api/*` will be proxied to your Netlify Function

## How It Works

Your `netlify.toml` has this redirect rule:
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
```

This means:
- Frontend requests to `/api/health` → Proxied to `/.netlify/functions/api/health`
- Frontend requests to `/api/chat` → Proxied to `/.netlify/functions/api/chat`
- And so on...

The Netlify Function at `netlify/functions/api/__init__.py` handles all these requests.

## Verify It's Working

1. Visit: https://llm-based-study-companion.netlify.app
2. Open browser console (F12)
3. Look for: `[API Config] Running on Netlify, using /api proxy to Netlify Functions`
4. Check for: `✅ API connection successful!`
5. Test the app - sign up, login, chat, etc.

## Environment Variables for Backend

Make sure your Netlify Function has access to these environment variables:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens

Set these in Netlify:
1. Go to **Site settings** → **Environment variables**
2. Add each variable
3. Redeploy

---

## Optional: Use External Backend

If you want to use an **external backend** (not Netlify Functions), you can set `NEXT_PUBLIC_API_URL`:

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click on your site: **llm-based-study-companion**
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable**
5. Set:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.com` (e.g., `https://your-backend.onrender.com`)
6. Click **Save**
7. Redeploy your site

## Troubleshooting

### Still seeing 404 errors?

1. **Check console logs**: Look for `[API Config]` messages
2. **Verify backend is running**: Visit `https://your-backend-url.com/health`
3. **Check CORS**: Ensure backend allows `https://llm-based-study-companion.netlify.app`
4. **Redeploy**: Environment variables require a new deployment

### Backend CORS Configuration

Update your backend `app.py` to allow Netlify:

```python
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://llm-based-study-companion.netlify.app",  # Your Netlify URL
            "http://localhost:3000"  # For local development
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

Then redeploy your backend.

## Example

If your backend is on Render at `https://studymind-backend.onrender.com`:

1. Set in Netlify: `NEXT_PUBLIC_API_URL=https://studymind-backend.onrender.com`
2. Redeploy Netlify site
3. Done! ✅

---

**Note**: Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser, so make sure your backend URL is correct and your backend has proper CORS configuration.

