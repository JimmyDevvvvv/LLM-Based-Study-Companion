UPDATE: API Base URL Configuration
=================================

Context
-------
While running the Next.js frontend you hit repeated `net::ERR_CONNECTION_REFUSED` failures and JSON parse errors. The hard-coded `localhost:5000` URLs meant the app could only ever talk to a backend on that exact host/port. When run from another machine/interface or when the backend isn’t available, the health check responded with HTML (`<!DOCTYPE ...`), causing the `Unexpected token '<'` error.

Work Summary
------------
1. Centralized API resolution in `frontend/config/api.ts` so the app:
   - Prefers the env var `NEXT_PUBLIC_API_URL` when set.
   - Detects loopback/private-network hosts at runtime and uses the current protocol + hostname + optional `NEXT_PUBLIC_API_PORT` (default `5000`).
   - Falls back to `/api` for Netlify/serverless deployments.
2. Exposed endpoint helpers (`API_ENDPOINTS`) for all routes, including nested auth paths, and reused the shared request helpers (`apiUtils`).
3. Replaced every hard-coded `http://127.0.0.1:5000` and `http://localhost:5000` string with the centralized endpoints across:
   - `frontend/utils/authClient.ts`
   - Hooks: `useChatHistory.ts`, `useTone.ts`
   - Components: `UploadView.tsx`, `QuizGenerator.tsx`, `ContentGeneration.tsx`, `HistoryView.tsx`, `ProjectIdeas.tsx`, `HelpMentor.tsx`, `AdminTools.tsx`, `GradingFeedback.tsx`
4. Updated `frontend/env.example.txt` to document the new `NEXT_PUBLIC_API_PORT`.

Environment Variables
---------------------
Set these in your `.env.local` (or build environment):
```
NEXT_PUBLIC_API_URL=<full base URL, e.g. https://api.example.com>
NEXT_PUBLIC_API_PORT=5000  # optional; used when URL not provided
```

How to Use
----------
1. Define `NEXT_PUBLIC_API_URL` if your backend is exposed via HTTPS or a different host/port.
2. Alternatively, run the frontend on the same LAN and set `NEXT_PUBLIC_API_PORT` so the app automatically targets `http(s)://<your-host>:<port>`.
3. Restart the Next.js dev server so it picks up new env variables.
4. Reload the app and confirm:
   - `/api/health` fetch logs “✅ API connection successful!”
   - Generated content, uploads, tone updates, grading, and admin utilities succeed without connection warnings.

Testing Performed
-----------------
- `npm run lint` (via `read_lints`) reported no new TypeScript or ESLint violations on the updated files.
- Manual verification: fetch endpoints now point to `API_ENDPOINTS.*` helpers instead of hard-coded URLs.

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

