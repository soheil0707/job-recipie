# Job Recipe — Local Setup

## Requirements
- Node.js 18+ and Yarn
- Python 3.10+ and pip
- MongoDB (local install OR MongoDB Atlas free cluster)

## 1. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Emergent internal LLM library — install from the private index if you have access.
# If not, replace the LLM code with a public SDK (see notes below).
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

Create `backend/.env`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="jobrecipe"
CORS_ORIGINS="http://localhost:3000"
EMERGENT_LLM_KEY=<your key>
JWT_SECRET=<any long random string>
```

Run:
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

## 2. Frontend
```bash
cd frontend
yarn install
```

Create `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
```

Run:
```bash
yarn start
```
App will open on http://localhost:3000.

## 3. MongoDB
Any MongoDB instance works. Easiest options:
- **Local**: `brew install mongodb-community` (Mac) or Docker `docker run -d -p 27017:27017 mongo`
- **Atlas free tier**: get a connection string, paste into `MONGO_URL`

## 4. Test login
Use the register page to create an account. Email/password JWT auth is built-in.

## Notes on `emergentintegrations`
This library provides Gemini/Claude/GPT via one universal key. If you don't have access:
- Replace the `call_llm()` function in `backend/server.py` with a direct SDK call
  (e.g. `google-generativeai` for Gemini, `openai` for GPT, `anthropic` for Claude)
- Every LLM endpoint already has a deterministic fallback, so the app still functions if the key is missing.

## Emergent Google Auth
The Emergent-managed Google sign-in only works when deployed through Emergent. Locally, use email/password.

## Structure
```
backend/    FastAPI single-file API + .env
frontend/   React + Tailwind + shadcn UI
memory/     PRD.md, test_credentials.md
```
