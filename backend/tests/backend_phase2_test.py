"""
Phase 2 backend tests for Job Recipe.
Tests all 15 new Phase 2 endpoints introduced in the review request.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://job-roadmap-15.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@jobrecipe.ai"
DEMO_PASSWORD = "Demo@1234"


@pytest.fixture(scope="session")
def auth_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    if r.status_code != 200:
        # Try register (safe if already exists → will 400 → login again)
        rr = requests.post(f"{API}/auth/register", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD, "name": "Demo User"}, timeout=30)
        if rr.status_code == 200:
            return rr.json()["token"]
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def client(auth_token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"})
    return s


# ---------------- Career Twin ----------------
class TestCareerTwin:
    def test_career_twin_post(self, client):
        r = client.post(f"{API}/career-twin", json={"target_role": "Software Engineer"}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["hiring_probability", "salary_prediction", "industry_demand", "competition_level", "readiness_score", "time_to_ready_weeks"]:
            assert k in d, f"missing key {k}"
        assert isinstance(d["hiring_probability"], (int, float))
        assert 0 <= d["hiring_probability"] <= 100

    def test_career_twin_get(self, client):
        r = client.get(f"{API}/career-twin", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "hiring_probability" in d

    def test_career_twin_recalc(self, client):
        r = client.post(f"{API}/career-twin/recalc", json={"target_role": "Software Engineer"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "before" in d and "after" in d and "boost" in d
        assert isinstance(d["boost"], (int, float))


# ---------------- Coding Assessment ----------------
class TestCodingAssessment:
    @pytest.mark.parametrize("kind", ["coding", "mcq", "sql", "aptitude", "debugging"])
    def test_start_all_kinds(self, client, kind):
        r = client.post(f"{API}/coding/assessment/start", json={"kind": kind, "difficulty": "Medium"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "assessment_id" in d
        assert "questions" in d and isinstance(d["questions"], list) and len(d["questions"]) > 0
        assert d["kind"] == kind

    def test_submit_mcq(self, client):
        start = client.post(f"{API}/coding/assessment/start", json={"kind": "mcq"}, timeout=30).json()
        aid = start["assessment_id"]
        answers = [{"q_index": i, "answer": str(q["answer"])} for i, q in enumerate(start["questions"])]
        r = client.post(f"{API}/coding/assessment/submit", json={"assessment_id": aid, "answers": answers}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "score" in d
        assert d["score"] == 100

    def test_submit_coding_trust(self, client):
        start = client.post(f"{API}/coding/assessment/start", json={"kind": "coding"}, timeout=30).json()
        aid = start["assessment_id"]
        answers = [{"q_index": i, "answer": True} for i in range(len(start["questions"]))]
        r = client.post(f"{API}/coding/assessment/submit", json={"assessment_id": aid, "answers": answers}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["score"] == 100


# ---------------- Learning / Resume Optimize / Portfolio ----------------
class TestPreparationHub:
    def test_learning_recommend(self, client):
        r = client.post(f"{API}/learning/recommend", json={"skills": ["Python", "React"]}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "tracks" in d and len(d["tracks"]) == 2
        t = d["tracks"][0]
        for k in ["skill", "courses", "videos", "roadmaps", "practice"]:
            assert k in t

    def test_resume_optimize(self, client):
        r = client.post(f"{API}/resume/optimize", json={"text": "Worked on backend systems. Helped with API design. Responsible for deployment."}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "optimized" in d
        assert "ats_delta" in d
        assert "improvements" in d

    def test_portfolio_generate_and_get_public(self, client):
        r = client.post(f"{API}/portfolio/generate", json={"theme": "midnight", "include_projects": True}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "slug" in d and "url" in d
        slug = d["slug"]
        # Public GET — no auth
        r2 = requests.get(f"{API}/portfolio/{slug}", timeout=30)
        assert r2.status_code == 200, r2.text
        p = r2.json()
        assert p["slug"] == slug
        assert "name" in p
        # Ensure private fields excluded
        assert "email" not in p
        assert "user_id" not in p


# ---------------- Resume Versions ----------------
class TestResumeVersions:
    def test_save_and_list_versions(self, client):
        r = client.post(f"{API}/resume/versions", json={}, timeout=30)
        assert r.status_code == 200
        assert "version_id" in r.json()
        r2 = client.get(f"{API}/resume/versions", timeout=30)
        assert r2.status_code == 200
        assert isinstance(r2.json(), list)
        assert len(r2.json()) >= 1


# ---------------- Application Assistant ----------------
class TestApplicationAssistant:
    def test_application_assistant(self, client):
        r = client.post(f"{API}/application-assistant", json={"company": "Google", "role": "SDE", "hiring_manager": "Jane"}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["cold_email", "checklist", "resume_tips", "reminder"]:
            assert k in d, f"missing {k}"
        assert isinstance(d["checklist"], list)


# ---------------- Recruiter ----------------
class TestRecruiter:
    def test_get_candidates_seeded(self, client):
        r = requests.get(f"{API}/recruiter/candidates", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d, list)
        assert len(d) == 8, f"expected 8 seeded got {len(d)}"

    def test_rank(self, client):
        r = client.post(f"{API}/recruiter/rank", json={"job_description": "Looking for Python Django AWS engineer with Docker experience", "required_skills": ["Python", "Django", "AWS", "Docker"]}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "candidates" in d
        assert len(d["candidates"]) == 8
        # First candidate should be Aditi (Python/Django/AWS/Docker)
        assert d["candidates"][0]["match_score"] >= d["candidates"][-1]["match_score"]
        assert "matched_skills" in d["candidates"][0]
        assert "missing_skills" in d["candidates"][0]


# ---------------- Analytics ----------------
class TestAnalytics:
    def test_analytics(self, client):
        r = client.get(f"{API}/analytics", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["total_applications", "success_rate", "learning_streak", "interview_timeline", "resume_timeline", "status_counts"]:
            assert k in d, f"missing {k}"


# ---------------- Badges ----------------
class TestBadges:
    def test_badges(self, client):
        r = client.get(f"{API}/badges", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "badges" in d and len(d["badges"]) == 9
        assert "unlocked_count" in d and "total" in d
        for b in d["badges"]:
            assert "id" in b and "title" in b and "unlocked" in b


# ---------------- Hired ----------------
class TestHired:
    def test_hired(self, client):
        r = client.post(f"{API}/hired", json={}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True


# ---------------- LinkedIn Import ----------------
class TestLinkedIn:
    def test_linkedin_import(self, client):
        r = client.post(f"{API}/linkedin/import", json={"profile_url": "https://linkedin.com/in/testuser"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "parsed" in d
        assert d["source"] == "linkedin_mock"
        p = d["parsed"]
        for k in ["skills", "education", "experience", "projects", "certifications"]:
            assert k in p
