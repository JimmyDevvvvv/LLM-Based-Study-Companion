UPDATE: API Base URL Configuration
=================================

Context
-------
While running the Next.js frontend you hit repeated `net::ERR_CONNECTION_REFUSED` failures and JSON parse errors. The hard-coded `localhost:5000` URLs meant the app could only ever talk to a backend on that exact host/port. When run from another machine/interface or when the backend isn’t available, the health check responded with HTML (`<!DOCTYPE ...`), causing the `Unexpected token '<'` error.

Work Summary
------------
1. Centralized API resolution in `frontend/config/api.ts` so the app:
   - Prefers the env var `NEXT_PUBLIC_API_URL` when set.
   - Detects loopback/private-network hosts at **runtime** (not module load time) and uses the current protocol + hostname + optional `NEXT_PUBLIC_API_PORT` (default `5000`).
   - Falls back to `/api` for Netlify/serverless deployments.
   - **FIX**: Endpoints now use getters/functions to resolve base URL at runtime, ensuring `window.location` is available when accessed.
2. Exposed endpoint helpers (`API_ENDPOINTS`) for all routes, including nested auth paths, and reused the shared request helpers (`apiUtils`).
3. Replaced every hard-coded `http://127.0.0.1:5000` and `http://localhost:5000` string with the centralized endpoints across:
   - `frontend/utils/authClient.ts`
   - Hooks: `useChatHistory.ts`, `useTone.ts`
   - Components: `UploadView.tsx`, `QuizGenerator.tsx`, `ContentGeneration.tsx`, `HistoryView.tsx`, `ProjectIdeas.tsx`, `HelpMentor.tsx`, `AdminTools.tsx`, `GradingFeedback.tsx`
4. Updated `frontend/env.example.txt` to document the new `NEXT_PUBLIC_API_PORT`.
5. Added console logging to help debug API URL resolution (check browser console for `[API Config]` messages).

Environment Variables
---------------------
Set these in your `.env.local` (or build environment):
```
NEXT_PUBLIC_API_URL=<full base URL, e.g. https://api.example.com>
NEXT_PUBLIC_API_PORT=5000  # optional; used when URL not provided
```

How to Use
----------
1. **For Local Development:**
   - Ensure your Flask backend is running on port 5000 (or your configured port)
   - The app will automatically detect `localhost` or `127.0.0.1` and use `http://localhost:5000` (or your configured port)
   - Check browser console for `[API Config]` messages to see which URL is being used
   
2. **For Custom Backend URL:**
   - Create `frontend/.env.local` file (or set in your deployment environment)
   - Add: `NEXT_PUBLIC_API_URL=http://your-backend-url:port`
   - Restart the Next.js dev server: `npm run dev`

3. **For Different Port:**
   - Set `NEXT_PUBLIC_API_PORT=5001` (or your port) in `.env.local`
   - The app will use `http://localhost:5001` automatically

4. **Restart Required:**
   - After changing environment variables, **restart the Next.js dev server**
   - Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)

5. **Verify Connection:**
   - Check browser console for `[API Config]` log messages
   - Look for "✅ API connection successful!" message
   - If you see 404 errors, check that:
     - Backend is running and accessible
     - CORS is configured correctly on the backend
     - The API URL in console matches your backend URL

Troubleshooting 404 Errors
---------------------------
If you're seeing 404 errors like `/api/health`, `/api/conversations/default_user`, etc.:

1. **Check Browser Console:**
   - Look for `[API Config]` messages to see which base URL is being resolved
   - If it shows `/api`, the localhost detection isn't working

2. **Verify Backend is Running:**
   ```bash
   # In backend directory
   python app.py
   # or
   flask run --port=5000
   ```
   - Test directly: `curl http://localhost:5000/health`
   - Should return: `{"status": "healthy"}`

3. **Set Environment Variable Explicitly:**
   - Create `frontend/.env.local`:
     ```
     NEXT_PUBLIC_API_URL=http://localhost:5000
     ```
   - Restart Next.js dev server completely (stop and start again)
   - Hard refresh browser

4. **Check CORS Configuration:**
   - Ensure backend `app.py` allows requests from `http://localhost:3000`
   - Example CORS config:
     ```python
     CORS(app, resources={
         r"/*": {
             "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }
     })
     ```

5. **Verify Port Match:**
   - Frontend expects backend on port 5000 by default
   - If backend runs on different port, set `NEXT_PUBLIC_API_PORT` or `NEXT_PUBLIC_API_URL`

Testing Performed
-----------------
- `npm run lint` (via `read_lints`) reported no new TypeScript or ESLint violations on the updated files.
- Manual verification: fetch endpoints now point to `API_ENDPOINTS.*` helpers instead of hard-coded URLs.
- Runtime URL resolution ensures `window.location` is available when endpoints are accessed.

Next Steps / Validation
-----------------------
- Start your backend (Flask or deployed API) and ensure CORS/host settings allow requests from the frontend origin.
- Run through flows: chat, content generation, quiz, grading, admin tools to confirm responses.
- Commit the changes and deploy; for Netlify/Vercel add the new environment variables to the project settings.

Rollback
--------
Revert the modified files if you need to return to the previous localhost-only setup:
- `frontend/config/api.ts`
- Hook/component files listed under “Work Summary”
- `frontend/env.example.txt`

Contact
-------
Reach out if you need help configuring deployment-specific env vars or adding health-check retries/timeouts.

