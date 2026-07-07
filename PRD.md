# Product Requirements Document (PRD)
## Smart Bharat – AI-Powered Civic Companion
**Prepared for:** DEVENGERS PromptWars 2026
**Version:** 1.0
**Owner:** [Your Team Name]
**Status:** Draft for Build

---

## 1. Overview

### 1.1 Problem Statement
Citizens struggle to navigate fragmented, jargon-heavy government processes — finding the right scheme, knowing which documents are needed, or reporting a civic issue and tracking it. Information is scattered across portals, often not available in regional languages, and there's no single companion that simplifies and personalizes this experience.

### 1.2 Solution
Smart Bharat is a web platform with an AI companion (LLM-powered) that:
- Answers citizen queries about government services in plain, simplified language
- Recommends relevant public schemes based on user profile
- Extracts document requirements for a stated goal ("I want a passport")
- Lets citizens report civic issues (with photo + location) and auto-classifies them
- Tracks complaint status end-to-end
- Works in multiple languages (English + at least one regional language, e.g. Hindi)

### 1.3 Non-Goals (explicitly out of scope for hackathon build)
- Real integration with actual government APIs/databases (simulated/mock backend acceptable)
- Payment processing
- Full production-grade auth/security hardening
- Native mobile app (web-responsive only)

---

## 2. Goals & Success Metrics

| Goal | Metric (for demo/judging) |
|---|---|
| Simplify civic info access | AI answers a scheme/document query in <5s with structured, plain-language output |
| Real GenAI use (not just chatbot) | At least 2 features use structured LLM outputs (function calling / JSON mode), not just free chat |
| Complaint transparency | Citizen can file a complaint and see a live tracking ID + status in dashboard |
| Digital inclusion | UI + AI responses toggle between English and Hindi |
| Reduce hallucination risk | AI cites source/scheme name and shows a disclaimer/fallback when unsure |

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Fast setup, clean UI, good Tailwind ecosystem for hackathon speed |
| Backend | Node.js + Express (or Supabase Edge Functions) | Simple REST API layer between frontend, Supabase, and LLM |
| Database & Auth | **Supabase** (Postgres + Auth + Storage) | Free tier, instant Postgres DB, built-in auth, file storage for complaint photos, realtime subscriptions for live status updates |
| GenAI | Claude API (or GPT API) with structured/JSON output | Chat, classification, extraction, translation |
| Maps | **Leaflet.js + OpenStreetMap tiles** | Free, no API key, lightweight — only need lat/long pin + reverse geocoding via free Nominatim API |
| Geolocation capture | Browser Geolocation API (`navigator.geolocation`) | Get user's current lat/long for complaint reporting, no map SDK cost |
| Hosting | Vercel/Netlify (frontend) + Supabase (backend/db) | Free tier, zero-config deploy |

**Note on Leaflet + Nominatim:** Nominatim (OSM's free geocoding service) has a usage policy (max ~1 request/sec, needs a User-Agent header). Fine for demo traffic; cache results client-side to avoid repeat calls.

---

## 4. User Personas

1. **Riya, 24, urban resident** — wants to report a broken streetlight quickly and track it.
2. **Ramesh, 52, semi-urban, Hindi-speaking** — wants to know which government scheme he's eligible for and what documents he needs, in Hindi.
3. **Ayesha, 30, first-time applicant** — wants to know exact document checklist before visiting a government office.

---

## 5. Functional Requirements (by Module)

### Module A: AI Chat Assistant
- **FR-A1:** Citizen types a query in natural language (English/Hindi).
- **FR-A2:** System detects intent via LLM: `general_query | scheme_recommendation | document_requirement | complaint_intent`.
- **FR-A3:** Response is simplified (grade-8 reading level), cites the relevant scheme/department name.
- **FR-A4:** If LLM is not confident, show fallback: *"I'm not fully sure — please verify at [official portal name]."*
- **FR-A5:** Maintain last 5 messages of context per session (stored in Supabase `chat_sessions` table or client state).

### Module B: Complaint / Grievance Reporter
- **FR-B1:** User describes issue in free text + optional photo upload.
- **FR-B2:** User's location captured via browser Geolocation API (lat/long) → shown as pin on Leaflet map, user can drag pin to adjust.
- **FR-B3:** LLM classifies complaint into category (`pothole | garbage | streetlight | water | electricity | other`) and urgency (`low | medium | high`) — returned as **structured JSON**, not free text.
- **FR-B4:** System auto-generates a tracking ID (e.g. `SB-2026-000123`) and stores complaint in Supabase.
- **FR-B5:** Photo uploaded to Supabase Storage; public URL saved with complaint record.
- **FR-B6:** Citizen can look up complaint status via tracking ID.

### Module C: Document Requirement Assistant
- **FR-C1:** User states a goal (e.g., "I want to apply for a passport").
- **FR-C2:** LLM performs retrieval-augmented lookup against a curated local dataset (`schemes_documents.json` seeded in Supabase) of ~20–30 common services (passport, birth certificate, ration card, Aadhaar update, PAN card, driving license, etc.)
- **FR-C3:** Returns structured checklist: document name, format accepted, where to submit, approx processing time.
- **FR-C4:** If service not in curated dataset, LLM answers from general knowledge but flags it as *"unverified — please confirm at official portal."*

### Module D: Scheme Recommender
- **FR-D1:** User fills a short profile form (age, occupation, income bracket, state, gender — all optional fields to reduce friction).
- **FR-D2:** LLM matches profile against curated scheme dataset and returns top 3–5 relevant schemes with 1-line eligibility reason each.
- **FR-D3:** Each scheme links to (mock or real) official portal URL.

### Module E: Multilingual Support
- **FR-E1:** Language toggle (English ⇄ Hindi) in UI header.
- **FR-E2:** All LLM-generated responses (chat, checklists, recommendations) are generated directly in the selected language via prompt instruction (no separate translation API needed — simpler and more natural output).
- **FR-E3:** Static UI strings (labels, buttons) via a simple i18n JSON dictionary.

### Module F: Complaint Tracking Dashboard
- **FR-F1:** Citizen enters tracking ID → sees status (`submitted | in_review | in_progress | resolved`), category, submitted date, and pin location on mini-map.
- **FR-F2:** (Stretch) Admin-only simple view to manually update complaint status (demonstrates full lifecycle in demo).

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | LLM response returned in <5s for chat/classification calls |
| Availability | Must run reliably for live demo — have a recorded backup video as fallback |
| Security | Supabase Row Level Security (RLS) enabled; no service keys exposed client-side; complaint photos stored in a private bucket with signed URLs if privacy matters |
| Accessibility | Mobile-responsive layout, minimum readable font sizes, high contrast for outdoor/mobile use |
| Data Privacy | No collection of sensitive PII beyond what's needed (name optional on complaints) |
| Cost | Stay within Supabase free tier + LLM API free/trial credits |

---

## 7. Data Model (Supabase / Postgres)

### `complaints`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| tracking_id | text (unique) | e.g. SB-2026-000123 |
| description | text | user's raw input |
| category | text | LLM-classified |
| urgency | text | LLM-classified |
| latitude | float8 | |
| longitude | float8 | |
| photo_url | text | nullable |
| status | text | default 'submitted' |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `chat_sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid | nullable if anonymous, FK to auth.users |
| messages | jsonb | array of {role, content, timestamp} |
| language | text | 'en' / 'hi' |
| created_at | timestamptz | |

### `schemes` (seed data, read-mostly)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| category | text | e.g. health, agriculture, education |
| eligibility | text | plain description |
| documents_required | jsonb | array of strings |
| official_url | text | |
| processing_time | text | |

### `users` (via Supabase Auth, extended profile table)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK auth.users) | |
| age | int | nullable |
| occupation | text | nullable |
| income_bracket | text | nullable |
| state | text | nullable |
| preferred_language | text | default 'en' |

---

## 8. API Endpoints (Backend layer)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/chat` | Send message → returns LLM response + detected intent |
| POST | `/api/complaints` | Submit new complaint → classify via LLM → store in Supabase → return tracking ID |
| GET | `/api/complaints/:trackingId` | Fetch complaint status |
| PATCH | `/api/complaints/:trackingId` | (Admin) update status |
| POST | `/api/documents/lookup` | Given a stated goal, return structured document checklist |
| POST | `/api/schemes/recommend` | Given profile, return matched schemes |
| GET | `/api/schemes` | List all seeded schemes (for admin/debug) |

**LLM call pattern (structured output) — example for complaint classification:**
```json
// Prompt instructs: "Respond ONLY with valid JSON matching this schema"
{
  "category": "pothole",
  "urgency": "high",
  "summary": "Large pothole causing traffic risk near main market road",
  "confidence": 0.92
}
```

---

## 9. System Architecture (flow)

```
[React Frontend]
   ├── Chat UI ──────────────► /api/chat ──► LLM (intent + response)
   ├── Complaint Form
   │     ├── Leaflet map (pin via Geolocation API)
   │     ├── Photo upload ───► Supabase Storage
   │     └── Submit ─────────► /api/complaints ──► LLM (classify JSON) ──► Supabase DB
   ├── Document Assistant ───► /api/documents/lookup ──► LLM + curated dataset (RAG-lite)
   ├── Scheme Recommender ───► /api/schemes/recommend ──► LLM + curated dataset
   └── Tracking Dashboard ───► /api/complaints/:id ──► Supabase (realtime optional)

[Supabase]
   ├── Postgres (complaints, chat_sessions, schemes, profiles)
   ├── Auth (optional login, anonymous complaints allowed)
   └── Storage (complaint photos)
```

---

## 10. Folder Structure (suggested)

```
smart-bharat/
├── frontend/
│   ├── src/
│   │   ├── components/ (ChatWindow, ComplaintForm, MapPicker, SchemeCard, TrackingLookup)
│   │   ├── pages/ (Home, Chat, ReportIssue, Schemes, TrackComplaint)
│   │   ├── i18n/ (en.json, hi.json)
│   │   ├── lib/supabaseClient.js
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── routes/ (chat.js, complaints.js, documents.js, schemes.js)
│   ├── services/ (llmService.js, supabaseService.js)
│   ├── data/schemes_documents.json (seed data)
│   └── server.js
└── supabase/
    └── migrations/ (schema SQL)
```

---

## 11. Build Timeline (24–36 hr hackathon)

| Phase | Hours | Deliverable |
|---|---|---|
| 1. Setup | 0–3 | Repo, Supabase project + schema, React scaffold, LLM API key wired |
| 2. Chat Assistant | 3–8 | Working chat with intent detection |
| 3. Complaint Reporter | 8–15 | Form + Leaflet map + photo upload + LLM classification + Supabase save |
| 4. Document Assistant | 15–20 | Curated dataset + lookup endpoint + UI |
| 5. Scheme Recommender | 20–25 | Profile form + matching logic |
| 6. Multilingual + Tracking Dashboard | 25–30 | Hindi toggle, tracking ID lookup page |
| 7. Polish + Demo Prep | 30–36 | UI pass, seed demo data, rehearse, record fallback video |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM API rate limits/downtime during demo | Cache a few pre-generated responses; have backup screen recording |
| Nominatim rate limiting | Cache geocoding results; limit to reverse-geocode only on submit, not on every drag |
| LLM hallucinating scheme/document info | Ground with curated dataset (RAG-lite) + explicit "unverified" disclaimer for anything outside it |
| Scope creep (5 modules half-done) | Prioritize Chat + Complaint Reporter as the core demo path; treat Scheme Recommender/multilingual as stretch |
| Supabase RLS misconfiguration exposing data | Set explicit RLS policies early (read: public for schemes, restricted for complaints by session/user) |

---

## 13. Demo Script (for judging)

1. Open chat → ask in Hindi "मुझे राशन कार्ड कैसे मिलेगा?" → get simplified, cited answer.
2. Switch to Report Issue → describe a pothole, drag map pin, upload photo → submit → get tracking ID instantly, show structured JSON classification happened behind the scenes.
3. Go to Track Complaint → enter tracking ID → show live status.
4. Go to Schemes → fill quick profile → get 3 personalized scheme recommendations.
5. Close with the "unverified" fallback demo — ask something obscure, show the AI flagging it rather than hallucinating confidently.

---

End of PRD
