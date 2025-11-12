# Netlify Function 404 - Complete Diagnostic Checklist

## ⚠️ CRITICAL: Check These First

### 1. Is the Function Deployed?

**In Netlify Dashboard:**
1. Go to your site: https://app.netlify.com/sites/llm-based-study-companion
2. Click **Functions** tab (in the top menu)
3. **Do you see `api` listed?**
   - ✅ **YES** → Function is deployed, issue is with redirect/routing
   - ❌ **NO** → Function is NOT being detected/deployed (see step 2)

### 2. Check Build Logs for Function Detection

**In Netlify Dashboard:**
1. Go to **Deploys** tab
2. Click on latest deploy
3. Click **View build log**
4. **Search for:**
   - `Detected function: api`
   - `Python function detected`
   - `netlify/functions`
   - Any errors about functions

**What to look for:**
- ✅ If you see "Detected function: api" → Function is detected
- ❌ If you see nothing about functions → Function is NOT detected
- ❌ If you see errors → Note the error message

### 3. Test Direct Function URL

**Try these URLs in your browser:**

1. `https://llm-based-study-companion.netlify.app/.netlify/functions/api/health`
   - ✅ Works → Function is deployed, redirect is broken
   - ❌ 404 → Function is NOT deployed

2. `https://llm-based-study-companion.netlify.app/.netlify/functions/test`
   - ✅ Works → Functions work, but `api` function has issues
   - ❌ 404 → Functions aren't deploying at all

### 4. Verify File Structure

**Your repo should have:**
```
netlify/
  functions/
    api.py          ← MUST exist (single file, not directory)
    test.py         ← Test function
    requirements.txt
```

**Check:**
- ✅ `api.py` exists at `netlify/functions/api.py`
- ✅ `api.py` has `def handler(event, context):` function
- ❌ NO `api/__init__.py` directory (delete if exists)

### 5. Check Function Logs

**If function IS deployed:**
1. Go to **Functions** tab
2. Click on `api` function
3. Click **Logs** tab
4. Try accessing `/api/health` again
5. **Check logs for:**
   - Import errors
   - Runtime errors
   - Any Python errors

## Common Issues & Fixes

### Issue 1: Function Not Detected

**Symptoms:**
- Function doesn't appear in Functions tab
- Build logs show no function detection

**Possible Causes:**
1. Wrong file structure (using `api/__init__.py` instead of `api.py`)
2. Functions directory path wrong in `netlify.toml`
3. Python not installed during build

**Fix:**
- Ensure `netlify/functions/api.py` exists (single file)
- Verify `netlify.toml` has: `directory = "netlify/functions"`
- Check build logs for Python installation

### Issue 2: Function Deployed But 404

**Symptoms:**
- Function appears in Functions tab
- Direct URL `/.netlify/functions/api/health` works
- But `/api/health` returns 404

**Possible Causes:**
1. Redirect not working
2. Next.js plugin interfering
3. Redirect order wrong

**Fix:**
- Check redirect in `netlify.toml` is before catch-all
- Try accessing direct function URL first
- Check if Next.js plugin is interfering

### Issue 3: Function Errors

**Symptoms:**
- Function appears in Functions tab
- Function logs show errors

**Possible Causes:**
1. Missing dependencies
2. Import errors
3. Environment variables not set

**Fix:**
- Check `requirements.txt` has all packages
- Check function logs for specific errors
- Verify environment variables are set

## Quick Test

**After deploying, run this test:**

1. Visit: `https://llm-based-study-companion.netlify.app/.netlify/functions/test`
   - Should return: `{"status": "test function works"}`
   - If this works → Functions are working, `api` function has issues
   - If this 404s → Functions aren't deploying at all

2. Visit: `https://llm-based-study-companion.netlify.app/.netlify/functions/api/health`
   - Should return: `{"status": "healthy", ...}`
   - If this works → Function works, redirect is issue
   - If this 404s → Function not deployed

3. Visit: `https://llm-based-study-companion.netlify.app/api/health`
   - Should return: `{"status": "healthy", ...}`
   - If this works → Everything works! ✅
   - If this 404s → Redirect is broken

## Next Steps Based on Results

**If function NOT detected:**
- Check file structure
- Verify `netlify.toml` configuration
- Check build logs for errors

**If function detected but direct URL 404s:**
- Check function logs for errors
- Verify dependencies installed
- Check environment variables

**If direct URL works but redirect doesn't:**
- Check redirect configuration
- Verify redirect order
- Check Next.js plugin interference

**If everything 404s:**
- Function isn't deploying
- Check build configuration
- Verify file structure

