# Netlify Function 404 Fix

## Problem
Getting 404 errors when accessing `/api/health` on Netlify.

## Solution

Netlify Python functions need to be structured as **single files**, not directories with `__init__.py`.

### Changes Made:

1. **Created `netlify/functions/api.py`** (single file instead of `api/__init__.py`)
   - This creates the function at `/.netlify/functions/api`
   - The redirect `/api/*` → `/.netlify/functions/api/:splat` will work

2. **Updated `netlify.toml`**
   - Removed `node_bundler` settings (only for Node.js functions)
   - Kept redirect order correct (API redirects before catch-all)

## Next Steps:

1. **Commit and push**:
   ```bash
   git add netlify/functions/api.py netlify.toml
   git commit -m "Fix Netlify Function structure for Python"
   git push
   ```

2. **Wait for Netlify to redeploy** (or trigger manually)

3. **Test**:
   - Visit: `https://llm-based-study-companion.netlify.app/api/health`
   - Should return: `{"status": "healthy", ...}`

## If Still Getting 404:

1. **Check Netlify Function logs**:
   - Go to Netlify Dashboard → Your site → Functions tab
   - Look for errors in the `api` function logs

2. **Verify function is deployed**:
   - In Netlify Dashboard → Functions
   - You should see `api` function listed
   - If not, check build logs for errors

3. **Check environment variables**:
   - Ensure `GEMINI_API_KEY`, `MONGODB_URI`, `JWT_SECRET` are set
   - Functions need these to initialize properly

4. **Verify Python dependencies**:
   - Check that `netlify/functions/requirements.txt` includes all needed packages
   - Netlify should install them during build

## Function Structure:

```
netlify/
  functions/
    api.py          ← Single file (not api/__init__.py)
    requirements.txt
```

The function at `api.py` creates the endpoint `/.netlify/functions/api`, which is then accessible via `/api/*` through the redirect rule.

