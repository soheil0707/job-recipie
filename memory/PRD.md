# Job Recipe – PRD

## Overview
AI career platform (LinkedIn + Indeed + ChatGPT + LeetCode). Dark UI (black + orange #FF5A1F, Clash Display + Satoshi fonts). React + FastAPI + MongoDB + Gemini 3 Flash via Emergent LLM key.

## Personas
Students / freshers / working professionals switching roles + recruiters.

## Phase 1 – MVP (Feb 2026)
Auth (email/password + Emergent Google), Profile, Resume upload+AI parse, ATS Score, Skill Gap, Career Roadmap, 12 seeded Jobs w/ Match %, AI Career Coach chat, Mock Interview (4 rounds × 3 difficulties), Cover Letter, Kanban Application Tracker.

## Phase 2 – 17-step workflow (Feb 2026, iteration_2 100% tests pass)
- **Step 5 · Career Twin** — hiring probability, salary prediction, industry demand, competition, readiness score, time-to-ready
- **Step 8 · Preparation Hub** — Learning Hub (courses+videos+roadmaps), Resume Optimizer (before/after with ATS delta), Portfolio Generator (theme + public shareable URL)
- **Step 10 · Coding Assessment** — coding (in-browser JS execution + tests), MCQ, SQL, aptitude, debugging
- **Step 11 · Career Twin Recalc** — before/after comparison + boost %
- **Step 13 · App Assistant** — cold email + checklist + resume tips + interview reminder
- **Step 14 · Recruiter Dashboard** — JD upload + AI candidate ranking + shortlist (8 seeded candidates)
- **Step 15 · Analytics** — Recharts line/bar/pie + PDF download via jsPDF
- **Step 16 · Hired!** — canvas-confetti celebration + shareable text
- **PipelineTracker** — 17 step chips at top of every app page
- **Time-based greeting** ("Good morning/afternoon/evening/night, {name}")
- **Global widgets** — ChatWidget FAB (persistent AI coach popover), BadgesDrawer FAB (9 badges), Dashboard "Download report" PDF
- **Interview voice mode** — 🔊 speak question + 🎤 record answer (Web Speech API)
- **Resume** — LinkedIn URL import (mocked, no OAuth key required) + version history
- **Public** — /portfolio/{slug} publicly-shareable portfolio page

## Backlog
- Real STT/TTS (ElevenLabs/OpenAI) if user wants studio-quality voice
- Real LinkedIn OAuth (needs partnership approval)
- Live job APIs (Indeed/LinkedIn/Naukri)
- Admin panel + notifications + calendar + 2FA
- Refactor server.py (1155 lines) into routers/ modules (mentioned by testing agent)

## Test credentials
- Email: demo@jobrecipe.ai  Password: Demo@1234
