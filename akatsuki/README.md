# Akatsuki — matches the "Technical Approach" diagram

Three services now, matching the diagram's boxes:

```
frontend/   Next.js/React — "Frontend & User Interaction"
gateway/    Node.js/Express — "Backend Server": auth, MongoDB, Bhashini translation
backend/    Python/FastAPI+LangGraph — "Agentic Platform": the 4-agent graph, PostGIS
supabase/   schema.sql — hazard zones, PFZ zones, advisories (unchanged)
```

Request flow: **frontend -> gateway (auth + translate) -> backend (agents) -> gateway (translate back + log) -> frontend**.
The browser never talks to `backend/` directly anymore.

## 1. Supabase — unchanged
Same as before: paste `supabase/schema.sql` into the SQL editor, verify with the
`check_hazard_zone` queries.

## 2. MongoDB Atlas (new)
cloud.mongodb.com -> free cluster -> Database Access (create a user) -> Network
Access (allow your IP, or 0.0.0.0/0 for a hackathon demo) -> copy the connection
string into `gateway/.env` as `MONGODB_URI`.

## 3. Backend (Python — same as before, one change)
```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill OPENAI_API_KEY, SUPABASE_*, DATABASE_URL
python -m app.scripts.seed_embeddings
uvicorn app.main:app --reload --port 8000
```
CORS on this service now only needs to allow the **gateway's** origin
(`http://localhost:4000` locally) — the browser never calls it directly.

## 4. Gateway (Node/Express — new)
```bash
cd gateway
npm install
cp .env.example .env      # fill MONGODB_URI, SESSION_SECRET, BHASHINI_*, AGENTIC_PLATFORM_URL
npm run dev                # http://localhost:4000
```

## 5. Frontend (same as before, one change)
```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL now points at the GATEWAY, not the Python service
npm run dev                        # http://localhost:3000
```
`.env.local` should read `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Verification
```bash
curl http://localhost:8000/health          # Python service — direct check only
curl http://localhost:4000/health          # Gateway — {"status":"ok","mongo_configured":true,...}

curl -X POST http://localhost:4000/api/auth/signup -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

curl -X POST http://localhost:4000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"Can I fish at 16.0, 86.5?","language":"en"}'
```
Then open the UI: sign up, ask a question, switch language, check MongoDB Atlas
-> Collections -> `conversations` for the logged interaction, and `users` for
your new account.

## What's still open (per the earlier feasibility discussion)
- MOSDAC / VEDAS / a real INCOIS PFZ feed are gated behind ISRO/govt portal
  access, not self-serve APIs — still using Open-Meteo + your own PostGIS
  mock data for these, same as before. Pitch this as "planned integration,
  pending API access," not as already live.
- Voice query isn't wired in yet — Bhashini's ASR endpoint or the browser's
  Web Speech API are the two paths, neither built yet.

## Deploying the new pieces
- **Gateway**: same Render pattern as the backend — new Web Service, root
  directory `gateway`, build `npm install`, start `npm start`. Add all the
  `.env` vars from step 4 in Render's dashboard, plus set
  `AGENTIC_PLATFORM_URL` to your already-deployed Python service's Render URL.
- **Frontend**: change `NEXT_PUBLIC_API_URL` (Vercel env var or GitHub Actions
  variable) to the **gateway's** deployed URL, not the Python service's.
- **Backend**: no redeploy needed beyond the CORS_ORIGINS env var update
  (set it to the gateway's deployed URL instead of the frontend's).
