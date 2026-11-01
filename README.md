# FresherAI — VS Code Rebuild

Beginner-friendly VS Code implementation of the existing FresherAI application. The code is simplified and organized by responsibility while preserving the product flow and four AI-agent responsibilities.

## Stack
React + JavaScript/JSX + HTML, CSS/Tailwind, React Router, Node.js + Express, Supabase/PostgreSQL/Auth/Storage, Google Gemini + Vercel AI SDK, Zod, and jsPDF.

## Folders
`frontend/` = UI and browser code  
`backend/` = server/API/AI code  
`database/` = PostgreSQL/Supabase migrations  
`authentication/` = authentication notes  
`api/` = Vercel adapter

## Run
```bash
npm ci
cp .env.example .env
# Fill in the Supabase URL/publishable key and Gemini API key in .env
npm run dev
```

The local frontend listens on port 5173 and the API on port 5001 by default. `npm run dev` checks the existing services before starting another pair. It reuses a fully healthy pair; if it finds the stale interview module, it sends `SIGTERM` only to listeners whose working directory is this project, then starts a fresh pair. It refuses to stop listeners that cannot be verified as this project. To inspect a port on macOS, run `lsof -nP -iTCP:5173 -sTCP:LISTEN` or use the corresponding backend port. If both ports are free, the frontend and backend start together and a startup failure in either stops its sibling. Set `VITE_PORT`, `PORT`, and `FRONTEND_URL` together when you intentionally need different development ports; the Vite API proxy follows `PORT`. Keep Gemini credentials server-side; only the Supabase URL and publishable key use the `VITE_` prefix. Vercel uses the same build (`npm run build`) and emits `frontend/dist`.

## Local Gemini key pool

Set `GEMINI_API_KEYS` in the project-root `.env` file as a comma-separated list. For seven keys, use `GEMINI_API_KEYS=key1,key2,key3,key4,key5,key6,key7`. Replace or remove entries in that file to change the pool, then restart the backend. The existing `GEMINI_API_KEY` is used when the pool variable is empty or absent. Keep both variables server-side and never give either a `VITE_` prefix. After a retryable failure, each eligible key is tried at most once for that model; model-specific or malformed-output errors can advance through the existing model list. A shared 60-second request deadline bounds all attempts. Retryable failures put keys into an in-memory cooldown with increasing duration. Cooldown state is local to each running backend instance, and keys may still share project-level quota.

## Vercel environment

Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`), `GEMINI_API_KEYS` (comma-separated server-side keys; `GEMINI_API_KEY` remains supported for a single key), and `FRONTEND_URL` in the Vercel project settings. Set `FRONTEND_URL` to the deployed site origin. The Supabase URL and publishable key are browser-visible by design; keep Gemini credentials server-side and do not use a Supabase service-role key for user requests. Keys may share project-level quotas, so a pool cannot bypass those limits.
