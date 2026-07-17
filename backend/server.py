from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, io, json, uuid, logging, re, bcrypt, jwt as pyjwt, httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = 'HS256'

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Job Recipe API")
api = APIRouter(prefix="/api")

# ---------- Helpers ----------
def now_utc():
    return datetime.now(timezone.utc)

def make_jwt(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": now_utc() + timedelta(days=7)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(request: Request) -> Dict[str, Any]:
    # Try Bearer JWT first
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]

    if token:
        # Try JWT
        try:
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except Exception:
            pass
        # Try emergent session token
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            exp = session["expires_at"]
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > now_utc():
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user

    # Cookie fallback
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            exp = session["expires_at"]
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > now_utc():
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user

    raise HTTPException(status_code=401, detail="Not authenticated")

async def call_llm(system: str, prompt: str, session_id: Optional[str] = None) -> str:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id or f"sess-{uuid.uuid4().hex[:12]}",
            system_message=system,
        ).with_model("gemini", "gemini-3-flash-preview")
        resp = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if hasattr(ev, "content"):
                resp += ev.content
        return resp.strip()
    except Exception as e:
        logger.warning(f"LLM call failed: {e}")
        return ""

def extract_json(text: str) -> Any:
    """Robustly extract JSON from LLM output."""
    text = text.strip()
    # Strip code fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        # Try to find outer braces
        m = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                pass
    return None

# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class SessionExchangeIn(BaseModel):
    session_id: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[List[Dict[str, Any]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    achievements: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    expected_salary: Optional[str] = None
    work_mode: Optional[str] = None
    picture: Optional[str] = None

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None

class SkillGapIn(BaseModel):
    target_role: str

class CoverLetterIn(BaseModel):
    company: str
    role: str
    job_description: Optional[str] = ""

class MockInterviewStartIn(BaseModel):
    role: str
    round_type: str  # HR, Technical, Behavioral, Managerial
    difficulty: str  # Easy, Medium, Hard
    company: Optional[str] = None

class MockAnswerIn(BaseModel):
    interview_id: str
    answer: str

class JobMatchIn(BaseModel):
    job_id: str

class AppTrackerCreate(BaseModel):
    job_id: str
    status: str  # saved, applied, interview, offer, rejected, withdrawn
    notes: Optional[str] = ""

class AppTrackerUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn):
    exists = await db.users.find_one({"email": body.email}, {"_id": 0})
    if exists:
        raise HTTPException(400, "Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    pw_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    doc = {
        "user_id": user_id,
        "email": body.email,
        "name": body.name,
        "password_hash": pw_hash,
        "auth_provider": "email",
        "picture": "",
        "created_at": now_utc().isoformat(),
        "profile": {},
    }
    await db.users.insert_one(doc)
    token = make_jwt(user_id)
    return {"token": token, "user": {"user_id": user_id, "email": body.email, "name": body.name, "picture": ""}}

@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Invalid credentials")
    if not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Invalid credentials")
    token = make_jwt(user["user_id"])
    return {"token": token, "user": {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", "")}}

@api.post("/auth/session")
async def session_exchange(body: SessionExchangeIn, response: Response):
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
        )
        if r.status_code != 200:
            raise HTTPException(401, "Invalid session")
        data = r.json()

    email = data["email"]
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email.split("@")[0]),
            "picture": data.get("picture", ""),
            "auth_provider": "google",
            "created_at": now_utc().isoformat(),
            "profile": {},
        }
        await db.users.insert_one(user)
    session_token = data["session_token"]
    expires_at = now_utc() + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now_utc().isoformat(),
    })
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7*24*3600,
    )
    return {"token": session_token, "user": {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", "")}}

@api.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", "")}

@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# ---------- Profile ----------
@api.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    return {
        "user_id": user["user_id"], "email": user["email"], "name": user["name"],
        "picture": user.get("picture", ""), "profile": user.get("profile", {}),
    }

@api.put("/profile")
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    top_level = {}
    if "name" in updates:
        top_level["name"] = updates.pop("name")
    if "picture" in updates:
        top_level["picture"] = updates.pop("picture")
    prof = user.get("profile", {})
    prof.update(updates)
    top_level["profile"] = prof
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": top_level})
    return {"ok": True}

# ---------- Resume Parser & ATS ----------
def parse_resume_file(content: bytes, filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return "\n".join((p.extract_text() or "") for p in reader.pages)
    if ext in ("docx", "doc"):
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    return content.decode("utf-8", errors="ignore")

@api.post("/resume/upload")
async def resume_upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    content = await file.read()
    text = parse_resume_file(content, file.filename or "resume.pdf")
    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    system = "You are a resume parser. Return STRICT JSON only, no prose."
    prompt = f"""Parse this resume and return JSON with keys:
skills (array of strings), education (array of {{degree, institution, year}}), experience (array of {{title, company, duration, description}}), projects (array of {{name, description, tech}}), certifications (array of strings), achievements (array of strings), languages (array of strings), contact (object with email, phone, location, linkedin, github).

RESUME TEXT:
{text[:8000]}

Return ONLY the JSON object."""
    raw = await call_llm(system, prompt)
    parsed = extract_json(raw) or {}

    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {
        "resume_text": text[:20000],
        "resume_parsed": parsed,
        "resume_filename": file.filename,
        "resume_uploaded_at": now_utc().isoformat(),
    }})
    return {"parsed": parsed, "filename": file.filename}

@api.get("/resume")
async def get_resume(user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "resume_parsed": 1, "resume_filename": 1, "resume_text": 1})
    return {"parsed": doc.get("resume_parsed", {}) if doc else {}, "filename": doc.get("resume_filename") if doc else None, "has_text": bool(doc.get("resume_text")) if doc else False}

@api.post("/resume/ats")
async def ats_score(user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    text = doc.get("resume_text", "") if doc else ""
    if not text:
        raise HTTPException(400, "Upload a resume first")

    system = "You are an ATS resume analyzer. Return STRICT JSON only."
    prompt = f"""Analyze this resume for ATS compatibility. Return JSON:
{{
  "ats_score": <int 0-100>,
  "formatting": <int 0-100>,
  "keywords": <int 0-100>,
  "readability": <int 0-100>,
  "grammar": <int 0-100>,
  "experience_quality": <int 0-100>,
  "skills_coverage": <int 0-100>,
  "missing_sections": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."]
}}

RESUME:
{text[:6000]}

Return ONLY JSON."""
    raw = await call_llm(system, prompt)
    data = extract_json(raw) or {"ats_score": 60, "improvements": ["Could not analyze fully"]}
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"ats_result": data, "ats_computed_at": now_utc().isoformat()}})
    return data

@api.get("/resume/ats")
async def get_ats(user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "ats_result": 1})
    return doc.get("ats_result", {}) if doc else {}

# ---------- Skill Gap & Roadmap ----------
@api.post("/skill-gap")
async def skill_gap(body: SkillGapIn, user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    skills = (doc.get("resume_parsed", {}) or {}).get("skills", []) + (doc.get("profile", {}) or {}).get("skills", [])
    skills = list({s.lower() if isinstance(s, str) else str(s) for s in skills})

    system = "You are a career skills analyst. Return STRICT JSON only."
    prompt = f"""Target role: {body.target_role}
Current skills: {json.dumps(skills)}

Return JSON:
{{
  "target_role": "{body.target_role}",
  "match_percentage": <int 0-100>,
  "strengths": ["skills user already has that match"],
  "weaknesses": ["areas needing improvement"],
  "missing_skills": ["skills missing"],
  "priority_skills": ["top 5 to learn first"],
  "learning_resources": [{{"skill": "...", "resource": "...", "url": ""}}],
  "estimated_time_weeks": <int>
}}

Return ONLY JSON."""
    raw = await call_llm(system, prompt)
    data = extract_json(raw)
    if not data or not isinstance(data, dict) or "match_percentage" not in data:
        # Deterministic fallback so UI always renders
        known = ["python", "javascript", "react", "sql", "aws", "docker", "kubernetes", "node.js", "java", "typescript", "system design", "machine learning", "pytorch", "tensorflow"]
        matched = [s for s in known if s in {x.lower() for x in skills}]
        data = {
            "target_role": body.target_role,
            "match_percentage": min(len(matched) * 12, 95) if matched else 20,
            "strengths": matched[:5] or ["Foundational programming exposure"],
            "weaknesses": ["Limited breadth vs required role", "Needs stronger portfolio"],
            "missing_skills": [k for k in known if k not in matched][:8],
            "priority_skills": [k for k in known if k not in matched][:5],
            "learning_resources": [{"skill": s, "resource": f"Official docs & tutorials for {s}", "url": ""} for s in [k for k in known if k not in matched][:5]],
            "estimated_time_weeks": 12,
        }
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"skill_gap": data, "target_role": body.target_role}})
    return data

@api.get("/skill-gap")
async def get_skill_gap(user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "skill_gap": 1})
    return doc.get("skill_gap", {}) if doc else {}

@api.post("/roadmap")
async def roadmap(body: SkillGapIn, user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    skills = (doc.get("resume_parsed", {}) or {}).get("skills", [])

    system = "You are a career coach. Return STRICT JSON only."
    prompt = f"""Create a career roadmap for target role: {body.target_role}
Current skills: {json.dumps(skills)}

Return JSON:
{{
  "target_role": "{body.target_role}",
  "steps": [
    {{"phase": "Foundation", "title": "...", "duration_weeks": 4, "items": ["skill 1", "skill 2"], "resources": ["..."]}},
    {{"phase": "Core Skills", "title": "...", "duration_weeks": 6, "items": ["..."], "resources": ["..."]}},
    {{"phase": "Projects", "title": "Build 2 mini projects", "duration_weeks": 4, "items": ["..."], "resources": []}},
    {{"phase": "Major Project", "title": "...", "duration_weeks": 6, "items": ["..."], "resources": []}},
    {{"phase": "Certifications", "title": "...", "duration_weeks": 3, "items": ["..."], "resources": []}},
    {{"phase": "Mock Interviews", "title": "...", "duration_weeks": 2, "items": ["..."], "resources": []}},
    {{"phase": "Job Ready", "title": "Apply to jobs", "duration_weeks": 2, "items": ["..."], "resources": []}}
  ]
}}

Return ONLY JSON."""
    raw = await call_llm(system, prompt)
    data = extract_json(raw)
    if not data or not data.get("steps"):
        # Deterministic 7-phase fallback
        data = {
            "target_role": body.target_role,
            "steps": [
                {"phase": "Foundation", "title": "Fundamentals & Setup", "duration_weeks": 4, "items": ["Programming basics", "Data structures", "Git & terminal"], "resources": ["freeCodeCamp", "CS50"]},
                {"phase": "Core Skills", "title": f"Master core {body.target_role} skills", "duration_weeks": 6, "items": ["Frameworks", "Databases", "APIs"], "resources": ["Official docs", "YouTube tutorials"]},
                {"phase": "Projects", "title": "Build 2 mini projects", "duration_weeks": 4, "items": ["Todo app", "REST API"], "resources": []},
                {"phase": "Major Project", "title": "One portfolio-worthy project", "duration_weeks": 6, "items": ["Full-stack app", "Deploy & document"], "resources": []},
                {"phase": "Certifications", "title": "Earn 1-2 relevant certs", "duration_weeks": 3, "items": ["Cloud cert", "Language cert"], "resources": []},
                {"phase": "Mock Interviews", "title": "Practice 10+ mock rounds", "duration_weeks": 2, "items": ["HR", "Technical", "Behavioral"], "resources": []},
                {"phase": "Job Ready", "title": "Apply to jobs", "duration_weeks": 2, "items": ["Polish resume", "Apply 5/day"], "resources": []},
            ],
        }
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"roadmap": data}})
    return data

@api.get("/roadmap")
async def get_roadmap(user=Depends(get_current_user)):
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "roadmap": 1})
    return doc.get("roadmap", {}) if doc else {}

# ---------- Jobs ----------
SEED_JOBS = [
    {"job_id": "job_001", "title": "Software Engineer", "company": "Google", "logo": "https://logo.clearbit.com/google.com", "location": "Bangalore, India", "mode": "Hybrid", "salary": "₹18-32 LPA", "experience": "2-4 years", "skills": ["Python", "System Design", "Algorithms", "Distributed Systems"], "type": "Full-time", "description": "Build scalable systems at Google. Work on core infra for billions of users."},
    {"job_id": "job_002", "title": "Data Scientist", "company": "Microsoft", "logo": "https://logo.clearbit.com/microsoft.com", "location": "Hyderabad, India", "mode": "Onsite", "salary": "₹22-40 LPA", "experience": "3-5 years", "skills": ["Python", "Machine Learning", "SQL", "TensorFlow", "Statistics"], "type": "Full-time", "description": "Drive data-informed decisions across Microsoft products using ML."},
    {"job_id": "job_003", "title": "Frontend Developer", "company": "Amazon", "logo": "https://logo.clearbit.com/amazon.com", "location": "Remote", "mode": "Remote", "salary": "₹15-28 LPA", "experience": "1-3 years", "skills": ["React", "TypeScript", "CSS", "JavaScript", "REST APIs"], "type": "Full-time", "description": "Build customer-facing shopping experiences at scale."},
    {"job_id": "job_004", "title": "DevOps Engineer", "company": "Netflix", "logo": "https://logo.clearbit.com/netflix.com", "location": "Remote", "mode": "Remote", "salary": "₹25-45 LPA", "experience": "3-6 years", "skills": ["AWS", "Kubernetes", "Terraform", "CI/CD", "Docker"], "type": "Full-time", "description": "Operate the infrastructure that streams to 250M+ subscribers."},
    {"job_id": "job_005", "title": "SDE Intern", "company": "TCS", "logo": "https://logo.clearbit.com/tcs.com", "location": "Pune, India", "mode": "Onsite", "salary": "₹35k/month", "experience": "0-1 years", "skills": ["Java", "OOP", "SQL", "Data Structures"], "type": "Internship", "description": "6-month internship building enterprise software."},
    {"job_id": "job_006", "title": "Full Stack Developer", "company": "Infosys", "logo": "https://logo.clearbit.com/infosys.com", "location": "Bangalore, India", "mode": "Hybrid", "salary": "₹8-16 LPA", "experience": "1-3 years", "skills": ["React", "Node.js", "MongoDB", "Express", "REST APIs"], "type": "Full-time", "description": "End-to-end product development on modern stack."},
    {"job_id": "job_007", "title": "AI Research Engineer", "company": "OpenAI", "logo": "https://logo.clearbit.com/openai.com", "location": "Remote", "mode": "Remote", "salary": "$150k-$250k", "experience": "3-7 years", "skills": ["Python", "PyTorch", "NLP", "Deep Learning", "Transformers"], "type": "Full-time", "description": "Push the frontier of AI research."},
    {"job_id": "job_008", "title": "Cloud Engineer", "company": "IBM", "logo": "https://logo.clearbit.com/ibm.com", "location": "Chennai, India", "mode": "Hybrid", "salary": "₹12-22 LPA", "experience": "2-5 years", "skills": ["AWS", "Azure", "GCP", "Kubernetes", "Linux"], "type": "Full-time", "description": "Design and manage enterprise cloud architectures."},
    {"job_id": "job_009", "title": "UI/UX Designer", "company": "Accenture", "logo": "https://logo.clearbit.com/accenture.com", "location": "Mumbai, India", "mode": "Hybrid", "salary": "₹10-18 LPA", "experience": "2-4 years", "skills": ["Figma", "Design Systems", "User Research", "Prototyping"], "type": "Full-time", "description": "Design digital experiences for enterprise clients."},
    {"job_id": "job_010", "title": "Data Analyst", "company": "Deloitte", "logo": "https://logo.clearbit.com/deloitte.com", "location": "Gurgaon, India", "mode": "Onsite", "salary": "₹8-14 LPA", "experience": "1-3 years", "skills": ["SQL", "Power BI", "Excel", "Python", "Tableau"], "type": "Full-time", "description": "Turn data into strategic insights for consulting clients."},
    {"job_id": "job_011", "title": "Backend Engineer", "company": "Wipro", "logo": "https://logo.clearbit.com/wipro.com", "location": "Bangalore, India", "mode": "Onsite", "salary": "₹10-20 LPA", "experience": "2-4 years", "skills": ["Java", "Spring Boot", "MySQL", "Microservices", "Kafka"], "type": "Full-time", "description": "Build scalable backend services."},
    {"job_id": "job_012", "title": "Freelance React Developer", "company": "Toptal", "logo": "https://logo.clearbit.com/toptal.com", "location": "Remote", "mode": "Remote", "salary": "$40-$80/hr", "experience": "3+ years", "skills": ["React", "Redux", "TypeScript", "GraphQL"], "type": "Freelance", "description": "Work with top clients across the globe."},
]

async def seed_jobs():
    count = await db.jobs.count_documents({})
    if count == 0:
        for j in SEED_JOBS:
            await db.jobs.insert_one({**j, "posted_at": now_utc().isoformat()})

@api.get("/jobs")
async def list_jobs(q: Optional[str] = None, mode: Optional[str] = None, jtype: Optional[str] = None):
    query: Dict[str, Any] = {}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
            {"skills": {"$regex": q, "$options": "i"}},
        ]
    if mode:
        query["mode"] = mode
    if jtype:
        query["type"] = jtype
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(200)
    return jobs

@api.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    return job

def compute_match_score(user_skills: List[str], job_skills: List[str]) -> Dict[str, Any]:
    us = {s.lower() for s in user_skills if isinstance(s, str)}
    js = {s.lower() for s in job_skills}
    if not js:
        return {"score": 50, "matched": [], "missing": []}
    matched = us & js
    missing = js - us
    score = int(round((len(matched) / len(js)) * 100))
    return {"score": min(score, 100), "matched": list(matched), "missing": list(missing)}

@api.post("/jobs/{job_id}/match")
async def job_match(job_id: str, user=Depends(get_current_user)):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    skills = (user_doc.get("resume_parsed", {}) or {}).get("skills", []) + (user_doc.get("profile", {}) or {}).get("skills", [])
    match = compute_match_score(skills, job.get("skills", []))
    return {"job": job, **match}

@api.get("/jobs/recommend/me")
async def recommend_jobs(user=Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    skills = (user_doc.get("resume_parsed", {}) or {}).get("skills", []) + (user_doc.get("profile", {}) or {}).get("skills", [])
    jobs = await db.jobs.find({}, {"_id": 0}).to_list(200)
    scored = [{**j, "match": compute_match_score(skills, j.get("skills", []))} for j in jobs]
    scored.sort(key=lambda x: x["match"]["score"], reverse=True)
    return scored

# ---------- Career Coach Chat ----------
@api.post("/chat")
async def career_chat(body: ChatIn, user=Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    skills = (user_doc.get("resume_parsed", {}) or {}).get("skills", [])
    target = user_doc.get("target_role", "")
    session_id = body.session_id or f"chat-{user['user_id']}"
    system = f"""You are an expert AI Career Coach for the Job Recipe platform.
User profile: name={user['name']}, target_role={target}, skills={skills[:20]}.
Give concise, practical, encouraging advice. Use bullet points when helpful. Keep replies under 200 words."""
    reply = await call_llm(system, body.message, session_id=session_id)
    await db.chat_history.insert_one({
        "user_id": user["user_id"], "session_id": session_id,
        "user_msg": body.message, "assistant_msg": reply, "ts": now_utc().isoformat(),
    })
    return {"reply": reply, "session_id": session_id}

@api.get("/chat/history")
async def chat_history(user=Depends(get_current_user)):
    msgs = await db.chat_history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("ts", 1).to_list(200)
    return msgs

# ---------- Cover Letter ----------
@api.post("/cover-letter")
async def cover_letter(body: CoverLetterIn, user=Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    resume = user_doc.get("resume_text", "")[:3000]
    prof = user_doc.get("profile", {})
    system = "You are an expert cover letter writer. Write professional, tailored cover letters."
    prompt = f"""Write a compelling cover letter (250-350 words) for:
Company: {body.company}
Role: {body.role}
Job Description: {body.job_description[:1500]}

Candidate: {user['name']}
Profile: {json.dumps(prof)[:1000]}
Resume excerpt: {resume}

Return the letter text only (no JSON, no markdown fences)."""
    text = await call_llm(system, prompt)
    doc = {"cover_id": f"cl_{uuid.uuid4().hex[:10]}", "user_id": user["user_id"], "company": body.company, "role": body.role, "text": text, "created_at": now_utc().isoformat()}
    await db.cover_letters.insert_one(doc)
    return {"cover_id": doc["cover_id"], "text": text}

@api.get("/cover-letter/list")
async def list_cover_letters(user=Depends(get_current_user)):
    items = await db.cover_letters.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items

# ---------- Mock Interview ----------
@api.post("/interview/start")
async def interview_start(body: MockInterviewStartIn, user=Depends(get_current_user)):
    system = "You are an expert interviewer. Return STRICT JSON only."
    prompt = f"""Generate 5 {body.difficulty} {body.round_type} interview questions for the role "{body.role}"{" at " + body.company if body.company else ""}. Return JSON:
{{"questions": ["Q1", "Q2", "Q3", "Q4", "Q5"]}}
Return ONLY JSON."""
    raw = await call_llm(system, prompt)
    data = extract_json(raw) or {}
    questions = data.get("questions") if isinstance(data, dict) else None
    if not questions:
        # Fallback questions per round type
        role = body.role
        fallback = {
            "HR": [f"Tell me about yourself.", f"Why do you want to be a {role}?", f"What are your strengths and weaknesses?", f"Where do you see yourself in 5 years?", f"Why should we hire you as a {role}?"],
            "Technical": [f"Explain a recent {role} project you built.", f"How would you debug a production issue?", f"What's the difference between synchronous and asynchronous code?", f"Design a system to handle 1M requests/day.", f"Walk me through your favorite algorithm."],
            "Behavioral": ["Describe a time you failed and what you learned.", "Tell me about a conflict with a teammate and how you resolved it.", "Describe a time you led a project.", "How do you handle tight deadlines?", "Give an example of going above and beyond."],
            "Managerial": ["How do you prioritize competing deadlines?", "Describe your leadership style.", "How do you motivate a struggling teammate?", "Tell me about a difficult decision you made.", "How do you handle disagreements with a manager?"],
        }
        questions = fallback.get(body.round_type, fallback["HR"])
    interview_id = f"int_{uuid.uuid4().hex[:10]}"
    doc = {
        "interview_id": interview_id, "user_id": user["user_id"],
        "role": body.role, "round_type": body.round_type, "difficulty": body.difficulty,
        "company": body.company, "questions": questions,
        "answers": [], "current_idx": 0, "status": "in_progress",
        "started_at": now_utc().isoformat(),
    }
    await db.interviews.insert_one(doc)
    return {"interview_id": interview_id, "question": doc["questions"][0] if doc["questions"] else None, "index": 0, "total": len(doc["questions"])}

@api.post("/interview/answer")
async def interview_answer(body: MockAnswerIn, user=Depends(get_current_user)):
    interview = await db.interviews.find_one({"interview_id": body.interview_id, "user_id": user["user_id"]}, {"_id": 0})
    if not interview:
        raise HTTPException(404, "Interview not found")
    idx = interview["current_idx"]
    answers = interview.get("answers", [])
    answers.append({"question": interview["questions"][idx], "answer": body.answer})
    next_idx = idx + 1
    done = next_idx >= len(interview["questions"])
    await db.interviews.update_one(
        {"interview_id": body.interview_id},
        {"$set": {"answers": answers, "current_idx": next_idx, "status": "completed" if done else "in_progress"}}
    )
    return {"done": done, "next_question": None if done else interview["questions"][next_idx], "index": next_idx, "total": len(interview["questions"])}

@api.post("/interview/{interview_id}/evaluate")
async def interview_evaluate(interview_id: str, user=Depends(get_current_user)):
    interview = await db.interviews.find_one({"interview_id": interview_id, "user_id": user["user_id"]}, {"_id": 0})
    if not interview:
        raise HTTPException(404, "Not found")
    system = "You are an expert interview evaluator. Return STRICT JSON only."
    qa = "\n\n".join([f"Q: {a['question']}\nA: {a['answer']}" for a in interview.get("answers", [])])
    prompt = f"""Evaluate this {interview['round_type']} interview for role {interview['role']}.
Q&A transcript:
{qa}

Return JSON:
{{
  "overall_score": <int 0-100>,
  "technical_knowledge": <int 0-100>,
  "communication": <int 0-100>,
  "grammar": <int 0-100>,
  "confidence": <int 0-100>,
  "logical_thinking": <int 0-100>,
  "problem_solving": <int 0-100>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "verdict": "one-sentence summary"
}}
Return ONLY JSON."""
    raw = await call_llm(system, prompt)
    data = extract_json(raw) or {"overall_score": 60}
    await db.interviews.update_one({"interview_id": interview_id}, {"$set": {"evaluation": data, "status": "evaluated", "evaluated_at": now_utc().isoformat()}})
    return data

@api.get("/interview/history")
async def interview_history(user=Depends(get_current_user)):
    items = await db.interviews.find({"user_id": user["user_id"]}, {"_id": 0}).sort("started_at", -1).to_list(50)
    return items

# ---------- Application Tracker ----------
@api.post("/applications")
async def create_app(body: AppTrackerCreate, user=Depends(get_current_user)):
    job = await db.jobs.find_one({"job_id": body.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(404, "Job not found")
    existing = await db.applications.find_one({"user_id": user["user_id"], "job_id": body.job_id}, {"_id": 0})
    if existing:
        await db.applications.update_one({"app_id": existing["app_id"]}, {"$set": {"status": body.status, "notes": body.notes, "updated_at": now_utc().isoformat()}})
        return {"app_id": existing["app_id"]}
    app_id = f"app_{uuid.uuid4().hex[:10]}"
    doc = {
        "app_id": app_id, "user_id": user["user_id"], "job_id": body.job_id,
        "job_snapshot": job, "status": body.status, "notes": body.notes,
        "created_at": now_utc().isoformat(), "updated_at": now_utc().isoformat(),
    }
    await db.applications.insert_one(doc)
    return {"app_id": app_id}

@api.get("/applications")
async def list_apps(user=Depends(get_current_user)):
    items = await db.applications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return items

@api.patch("/applications/{app_id}")
async def update_app(app_id: str, body: AppTrackerUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_utc().isoformat()
    r = await db.applications.update_one({"app_id": app_id, "user_id": user["user_id"]}, {"$set": updates})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/applications/{app_id}")
async def delete_app(app_id: str, user=Depends(get_current_user)):
    await db.applications.delete_one({"app_id": app_id, "user_id": user["user_id"]})
    return {"ok": True}

# ---------- Dashboard ----------
@api.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    ats = (user_doc.get("ats_result") or {}).get("ats_score", 0)
    skill_gap = user_doc.get("skill_gap") or {}
    match_pct = skill_gap.get("match_percentage", 0)
    interviews = await db.interviews.find({"user_id": user["user_id"]}, {"_id": 0}).sort("started_at", -1).to_list(50)
    apps = await db.applications.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    interview_scores = [i.get("evaluation", {}).get("overall_score", 0) for i in interviews if i.get("evaluation")]
    avg_interview = int(sum(interview_scores) / len(interview_scores)) if interview_scores else 0
    status_counts: Dict[str, int] = {}
    for a in apps:
        status_counts[a["status"]] = status_counts.get(a["status"], 0) + 1
    return {
        "ats_score": ats,
        "skill_match": match_pct,
        "avg_interview_score": avg_interview,
        "total_applications": len(apps),
        "status_counts": status_counts,
        "interviews_count": len(interviews),
        "target_role": user_doc.get("target_role", ""),
        "recent_interviews": [{"role": i["role"], "round_type": i["round_type"], "score": i.get("evaluation", {}).get("overall_score", 0), "started_at": i["started_at"]} for i in interviews[:5]],
    }

# ---------- Root ----------
@api.get("/")
async def root():
    return {"message": "Job Recipe API", "ok": True}

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_start():
    await seed_jobs()
    logger.info("Job Recipe backend ready")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()
