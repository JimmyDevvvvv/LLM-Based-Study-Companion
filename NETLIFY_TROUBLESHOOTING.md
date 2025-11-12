# Netlify Function 404 Troubleshooting

## Current Issue
Getting 404 when accessing `/api/health` even after fixing function structure.

## Steps to Debug

### 1. Check if Function is Deployed

In Netlify Dashboard:
1. Go to your site → **Functions** tab
2. Check if `api` function is listed
3. If NOT listed, the function isn't being detected/deployed

### 2. Check Build Logs

In Netlify Dashboard:
1. Go to **Deploys** tab
2. Click on latest deploy → **View build log**
3. Look for:
   - Python installation
   - Function detection messages
   - Any errors related to `netlify/functions`

### 3. Check Function Logs

In Netlify Dashboard:
1. Go to **Functions** tab
2. Click on `api` function (if it exists)
3. Check **Logs** for runtime errors

### 4. Verify Function Structure

The function should be:
```
netlify/
  functions/
    api.py          ← Single file (NOT api/__init__.py)
    requirements.txt
```

### 5. Test Direct Function URL

Try accessing the function directly (bypassing redirect):
- `https://llm-based-study-companion.netlify.app/.netlify/functions/api/health`

If this works but `/api/health` doesn't, the redirect is the issue.
If this also 404s, the function isn't deployed.

### 6. Manual Function Installation

If automatic installation isn't working, you may need to:

1. **In Netlify Dashboard**:
   - Site settings → **Functions**
   - Set **Install command**: `cd netlify/functions && pip install -r requirements.txt -t .`

2. **Or update build command** in `netlify.toml`:
   ```toml
   [build]
   command = "cd frontend && npm ci && npm run build && cd ../netlify/functions && pip install -r requirements.txt -t ."
   ```

### 7. Check Environment Variables

Ensure these are set in Netlify:
- `GEMINI_API_KEY`
- `MONGODB_URI`
- `JWT_SECRET`

### 8. Next.js Plugin Interference

The `@netlify/plugin-nextjs` might be interfering. Try:

1. Temporarily disable the plugin
2. Or ensure redirects are processed before Next.js routing

### 9. Alternative: Use External Backend

If Netlify Functions continue to fail, consider:
1. Deploy backend separately (Render, Railway, etc.)
2. Set `NEXT_PUBLIC_API_URL` in Netlify environment variables
3. Point to external backend URL

## Quick Test Commands

After deployment, test these URLs:
1. `/.netlify/functions/api/health` - Direct function call
2. `/api/health` - Through redirect
3. Check browser console for errors

## Common Issues

1. **Function not detected**: Check file structure and naming
2. **Dependencies not installed**: Check build logs for pip install
3. **Import errors**: Check function logs for Python import errors
4. **Redirect not working**: Check redirect order in netlify.toml
5. **Next.js interference**: Plugin might be catching requests first

