# Job Recipe – Product Requirements Doc

## Original Problem Statement
AI-powered career development platform combining LinkedIn + Indeed + ChatGPT + LeetCode + InterviewBit. Helps students/freshers/professionals discover jobs, improve resumes, close skill gaps, prep for interviews, track growth. Dark mode + orange, glassmorphism, premium responsive UI.

## Architecture
- Frontend: React 19 + Tailwind + Framer Motion + shadcn/ui (dark theme, black bg, orange #FF5A1F accent, Clash Display + Satoshi fonts from Fontshare)
- Backend: FastAPI + Motor (MongoDB) + emergentintegrations (Gemini 3 Flash) + JWT + bcrypt
- Auth: Email/password (JWT) + Emergent-managed Google OAuth (cookie + Bearer)
- LLM: Gemini 3 Flash via EMERGENT_LLM_KEY (with graceful deterministic fallbacks)

## Personas
- Student / Fresher preparing for first job
- Working professional switching roles
- Recruiter (future phase)

## MVP – Implemented (Feb 2026)
1. Landing (hero, features grid, CTA) — /
2. Auth: Register, Login, Emergent Google, AuthCallback — /login, /register
3. Dashboard shell with 11-item sidebar — /app
4. Aggregated Dashboard (ATS, skill match, interview avg, applications funnel)
5. Profile editor (bio, links, skills chips, preferred roles, salary, mode)
6. Resume upload (PDF/DOCX) → AI parse via Gemini → editable cards
7. ATS Score analyzer (100-point + 6 sub-scores + strengths/weaknesses/improvements)
8. Skill Gap Analysis (target-role match %, missing/priority skills, resources)
9. Career Roadmap timeline (7 phases: Foundation → Job Ready)
10. Job Recommendations feed (12 seeded jobs, sorted by match %, filters)
11. Job Match Score modal + Save/Apply
12. AI Career Coach chatbot (persistent history)
13. AI Mock Interview: HR / Technical / Behavioral / Managerial × Easy/Medium/Hard, 5-question flow, evaluation with 6 sub-scores
14. Cover Letter Generator (tailored per company + JD, save history)
15. Application Tracker Kanban (Saved / Applied / Interview / Offer / Rejected)

## Backlog (P1/P2)
- Coding sandbox with test cases (Python/Java/JS/C++) — LeetCode-style
- Voice / video mock interview (STT/TTS via ElevenLabs / OpenAI Whisper)
- Real job API (LinkedIn/Indeed) instead of seed
- Recruiter portal (JD upload, candidate ranking, ATS screening)
- Admin panel (users, jobs, analytics)
- Notifications + email verification + 2FA
- Calendar (interview schedule, deadlines)
- Resume Builder w/ PDF templates
- Portfolio Generator (Step 8C)
- Career Twin recalculation before/after comparison
- Gamification badges & streaks
- Daily challenges
- Hired celebration screen with confetti

## Key files
- Backend: /app/backend/server.py (single-file API — 24 endpoints)
- Frontend: /app/frontend/src/App.js, /app/frontend/src/pages/*.jsx (13 pages), /app/frontend/src/lib/{api,auth}.js(x)
- Env: /app/backend/.env (MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, JWT_SECRET)
- Design: /app/design_guidelines.json
