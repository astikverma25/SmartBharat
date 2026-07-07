# UI/UX & User Flow Design Document
## Smart Bharat – AI-Powered Civic Companion
**Prepared for:** DEVENGERS PromptWars 2026
**Version:** 1.0
**Role:** UI Designer + Product Manager companion doc to the PRD

---

## 1. Design Intent

Before drawing screens, a real decision: what does this product need to *feel* like?

Government platforms in India today feel either bureaucratic-cold (dense forms, no guidance) or cheaply "startup-generic" (rounded cards, stock gradients). Smart Bharat needs to sit in between: **trustworthy like an official service, warm like a helpful person.** The AI companion shouldn't feel like a chatbot bolted onto a govt portal — it should feel like the *front door* to the whole experience.

**One-line design thesis:** *A calm, official surface with one warm, human voice running through it — the AI companion.*

Since multilingual support (English/Hindi, Devanagari script) is core to the brief, not a stretch feature, the typography choice is driven by that — not by generic web-app defaults.

---

## 2. Design Tokens

### 2.1 Color Palette
Avoiding the generic "cream + terracotta" or "dark + neon" AI-default look. Grounded instead in Indian civic identity, but reinterpreted — not literal flag colors.

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#F7F6F2` | Base background — warm off-white, paper-like, not stark white |
| `--color-surface` | `#FFFFFF` | Cards, input fields |
| `--color-ink` | `#1B2430` | Primary text — deep indigo-charcoal, not pure black |
| `--color-primary` | `#0B4F6C` | Deep teal-indigo — trust, official, used for headers/nav/primary buttons |
| `--color-accent` | `#E08A2C` | Warm marigold/saffron — used ONLY for the AI companion's presence (avatar, chat bubble accent, "ask AI" affordances) so it reads as one consistent character throughout |
| `--color-success` | `#2F7A4D` | Resolved complaint status, confirmations |
| `--color-warning` | `#B23A2E` | Urgent complaint tags, errors, unverified-info disclaimer |
| `--color-border` | `#E0DED7` | Hairline dividers, input borders |

**Rule:** the marigold accent (`--color-accent`) is reserved *exclusively* for anything the AI companion says or does — this is the signature element. Everywhere else stays disciplined indigo/ink/paper. This gives the AI a visual identity distinct from the rest of the UI, so citizens always know "this part is the AI talking to me."

### 2.2 Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / Headings | **Fraunces** (serif, has real character, works at large sizes) | Used sparingly — page titles, hero line only |
| Body / UI | **Hind** (humanist sans, purpose-built with native Devanagari support alongside Latin) | Everything else — the correct pairing choice given multilingual is core, not decorative |
| Data / Captions / Tracking IDs | **IBM Plex Mono** | Tracking IDs, timestamps, coordinates — gives them a "official record" feel |

Type scale: 40/28/20/16/14px, weights 400/500/600 only — no more than 3 weights across the whole app to keep it disciplined.

### 2.3 Iconography & Imagery
- Line icons (not filled), 1.5px stroke, rounded joins — matches the calm/official but approachable tone.
- No stock illustration people. Use simple line-drawn civic motifs (a building, a road, a document, a leaf) as empty-state art — feels local and specific rather than generic SaaS.

### 2.4 Spacing & Shape
- 8px base spacing grid.
- Corner radius: 8px on cards/inputs, 999px (pill) only on the AI companion's chat bubble and floating action button — again, reinforcing "the AI has a distinct shape language."

---

## 3. Information Architecture

```
Smart Bharat
│
├── Home (companion greeting + 4 entry tiles)
│
├── Ask the Companion (chat) ── the hub; can be reached from anywhere via floating button
│
├── Report an Issue
│   ├── Describe + photo
│   ├── Pin location (Leaflet map)
│   └── Confirmation + Tracking ID
│
├── Track a Complaint
│   └── Enter Tracking ID → Status detail
│
├── Explore Schemes
│   ├── Quick profile (optional)
│   └── Recommended schemes list → Scheme detail
│
├── Document Checklist
│   └── "What do I need for ___?" → Checklist result
│
└── Profile / Settings
    ├── Language toggle (English / हिंदी)
    └── Saved complaints & profile info (if logged in)
```

**Navigation pattern:** Bottom tab bar on mobile (Home, Companion, Report, Track, Schemes), top header on desktop with the same 5 items. The AI companion is *always* one tap away via a persistent floating action button (marigold, pill-shaped) — this is the signature element per the design plan.

---

## 4. Screens — Detailed Breakdown

### Screen 1: Home
**Purpose:** Orient the citizen in <3 seconds, funnel into the right module.

```
┌─────────────────────────────────────────┐
│  Smart Bharat            [EN|हि]  [👤]   │  ← header, indigo
├─────────────────────────────────────────┤
│                                           │
│   "नमस्ते, Riya 👋                        │
│    What would you like help with today?" │  ← AI companion greeting,
│    [ Type your question...        ➤ ]    │    marigold accent bubble
│                                           │
├─────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐            │
│  │ 📢 Report  │  │ 📄 Documents│           │  ← 4 entry tiles,
│  │ an Issue   │  │ Needed     │           │    plain indigo/white cards
│  └───────────┘  └───────────┘            │
│  ┌───────────┐  ┌───────────┐            │
│  │ 🎯 Find a  │  │ 🔍 Track my│           │
│  │ Scheme     │  │ Complaint  │           │
│  └───────────┘  └───────────┘            │
├─────────────────────────────────────────┤
│  Recent activity                         │
│  • SB-2026-000123 — In Progress          │
└─────────────────────────────────────────┘
```

**Copy note:** greeting is generated by the LLM per-session, not a hardcoded string — reinforces that the companion is genuinely present, not a static banner.

---

### Screen 2: Ask the Companion (Chat)
**Purpose:** Core conversational surface — answers questions, detects intent, routes to modules.

```
┌─────────────────────────────────────────┐
│  ← Back      Ask the Companion    [EN|हि]│
├─────────────────────────────────────────┤
│                                           │
│  You: मुझे राशन कार्ड कैसे मिलेगा?         │  ← user bubble, plain white
│                                           │
│  🟠 Companion:                            │  ← AI bubble, marigold left-border
│  राशन कार्ड के लिए आपको ये दस्तावेज़          │
│  चाहिए: पहचान प्रमाण, पता प्रमाण...         │
│  [ View full checklist → ]                │  ← inline action chip, routes
│                                           │     to Document Checklist screen
│  ⚠ Unverified for your state — confirm    │  ← warning-color disclaimer,
│    at your local ration office            │     only shown when confidence low
│                                           │
├─────────────────────────────────────────┤
│  [ Type a message...              ➤ ]    │
│  🎤 (voice input, stretch goal)           │
└─────────────────────────────────────────┘
```

**Key interaction pattern:** when the companion's answer maps to a structured module (document checklist, complaint filing, scheme match), it renders an **inline action chip**, not just text — this is what makes the chat feel like a real product surface, not a plain LLM wrapper.

---

### Screen 3: Report an Issue
**Purpose:** Fastest possible path from "there's a problem" to a tracking ID.

**Step 3a — Describe**
```
┌─────────────────────────────────────────┐
│  ← Back        Report an Issue           │
├─────────────────────────────────────────┤
│  What's the issue?                       │
│  [ Large streetlight has been off for   ]│
│  [ a week near the market...           ]│
│                                           │
│  📷 [ Add a photo (optional) ]           │
│                                           │
│                    [ Next: Pin Location →]│
└─────────────────────────────────────────┘
```

**Step 3b — Pin Location (Leaflet + OSM)**
```
┌─────────────────────────────────────────┐
│  ← Back        Pin the Location          │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐   │
│  │                                   │   │
│  │        🗺  [Leaflet/OSM map]       │   │
│  │              📍 (draggable pin)   │   │
│  │                                   │   │
│  └───────────────────────────────────┘   │
│  Using your current location.            │
│  Drag the pin to adjust if needed.       │
│                                           │
│                       [ Submit Report → ] │
└─────────────────────────────────────────┘
```

**Step 3c — Confirmation**
```
┌─────────────────────────────────────────┐
│         ✅  Report submitted             │
│                                           │
│   Tracking ID:  SB-2026-000123           │  ← IBM Plex Mono, large
│                                           │
│   🟠 Companion: "I've classified this as │
│   a Streetlight issue, high priority.    │
│   You can track it anytime with this ID."│
│                                           │
│   [ Track this complaint ]  [ Done ]     │
└─────────────────────────────────────────┘
```

**Design rationale:** classification (category + urgency) is shown back to the user in the companion's own words — makes the "AI did real work" moment visible and rewarding, not hidden in a backend log.

---

### Screen 4: Track a Complaint
```
┌─────────────────────────────────────────┐
│  ← Back        Track a Complaint         │
├─────────────────────────────────────────┤
│  [ Enter Tracking ID   SB-2026-000123 ]  │
│                          [ Search ]      │
├─────────────────────────────────────────┤
│  Streetlight — High Priority             │
│  ●────────●────────○────────○            │
│  Submitted  In Review  In Progress Resolved│
│                                           │
│  📍 Mini-map showing pin location         │
│  Submitted: 6 July 2026, 4:12 PM         │
└─────────────────────────────────────────┘
```

Status stepper uses filled dots for completed stages, hollow for pending — single glance clarity, no jargon.

---

### Screen 5: Explore Schemes
**Step 5a — Quick profile (all optional, skippable)**
```
┌─────────────────────────────────────────┐
│  Tell us a bit about you (optional)      │
│  Age: [ 52 ]   State: [ Uttar Pradesh ▾]│
│  Occupation: [ Farmer ▾ ]                │
│                        [ Show my matches]│
│                        [ Skip → ]        │
└─────────────────────────────────────────┘
```

**Step 5b — Recommendations**
```
┌─────────────────────────────────────────┐
│  Recommended for you                     │
│  ┌───────────────────────────────────┐   │
│  │ PM-KISAN                          │   │
│  │ Income support for small farmers  │   │
│  │ Why: matches your occupation      │   │
│  │            [ View details → ]     │   │
│  └───────────────────────────────────┘   │
│  ┌───────────────────────────────────┐   │
│  │ Ayushman Bharat                   │   │
│  │ Health coverage up to ₹5 lakh     │   │
│  │            [ View details → ]     │   │
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### Screen 6: Document Checklist
```
┌─────────────────────────────────────────┐
│  What do you need help applying for?     │
│  [ Passport                            ] │
│                              [ Search ]  │
├─────────────────────────────────────────┤
│  Passport — Document Checklist           │
│  ☐ Proof of identity (Aadhaar/PAN)       │
│  ☐ Proof of address                      │
│  ☐ Birth certificate                     │
│  ☐ Passport-size photo (white bg)        │
│                                           │
│  Submit at: Passport Seva Kendra          │
│  Processing time: ~15 working days       │
│  [ Official portal → ]                   │
└─────────────────────────────────────────┘
```
Checkboxes let the citizen tick off documents they already have — small, useful interactive touch that costs nothing to build (client-side state only) but makes the screen feel like a tool, not a static answer.

---

## 5. Primary User Flows

### Flow 1: "Report a civic issue" (core demo path)
```
Home
 └─► Tap "Report an Issue"
      └─► Describe issue + optional photo
           └─► Pin/confirm location on map
                └─► Submit
                     └─► [LLM classifies category+urgency in background]
                          └─► Confirmation screen with Tracking ID
                               └─► (optional) → Track Complaint screen
```
**Success criterion:** citizen reaches a Tracking ID in ≤3 taps + 1 form fill.

### Flow 2: "Find out what I'm eligible for"
```
Home
 └─► Tap "Find a Scheme"
      └─► Fill quick profile (or Skip)
           └─► View recommended schemes
                └─► Tap a scheme → detail view
                     └─► Tap "Official portal" (external link)
```

### Flow 3: "Ask a general question" (chat-first, most flexible)
```
Home
 └─► Type question in companion bar
      └─► [LLM detects intent]
           ├─► general_query → plain-language answer inline
           ├─► document_requirement → answer + "View full checklist" chip → Screen 6
           ├─► scheme_recommendation → answer + "See matches" chip → Screen 5
           └─► complaint_intent → "It sounds like you want to report something —
                                    shall I start that for you?" → Screen 3
```
This is the flow that demonstrates real intent-routing, not a static menu — worth emphasizing live in the demo.

### Flow 4: "Track an existing complaint"
```
Home / Bottom nav
 └─► Tap "Track my Complaint"
      └─► Enter Tracking ID
           └─► View status stepper + location + timestamp
```

---

## 6. States That Need Explicit Design (often skipped, judges notice)

| State | What to show |
|---|---|
| **Loading (LLM thinking)** | Companion bubble with a subtle 3-dot pulse in marigold — never a generic spinner, keep it "in character" |
| **Empty — no complaints yet** | Simple line-drawn icon of a document + "You haven't reported anything yet. Tap Report an Issue to get started." |
| **Error — LLM/API failure** | "The companion couldn't respond just now. Please try again in a moment." — never a raw error code |
| **Low-confidence AI answer** | Warning-color inline disclaimer banner, always attached directly under the relevant answer, never a separate popup |
| **Offline / network issue** | Banner at top: "You're offline — some features may not work until you're back online." |

---

## 7. Responsive & Accessibility Notes

- **Mobile-first**: primary user is likely on a phone, possibly on a slower connection — keep initial payload light, lazy-load the Leaflet map only when Report Issue is opened.
- Bottom tab bar (5 items max) on mobile; collapses to top nav on desktop ≥1024px.
- Minimum tap target 44×44px.
- Color contrast: `--color-ink` on `--color-bg` exceeds WCAG AA; `--color-accent` (marigold) never used for body text, only backgrounds/borders/icons, to avoid contrast issues.
- All interactive elements have visible keyboard focus rings (2px, `--color-primary`).
- Map pin dragging has a keyboard-accessible fallback: manual lat/long entry field, hidden by default, revealed via "Enter coordinates manually" link — small but shows accessibility wasn't an afterthought.
- Hindi/English toggle affects both UI chrome strings (static i18n dictionary) and AI-generated content (via prompt instruction) — tested to make sure layout doesn't break with longer Devanagari text strings (design with ~30% extra width tolerance in buttons/labels).

---

## 8. Component Inventory (for build handoff)

| Component | Used in |
|---|---|
| `CompanionBubble` (marigold-accented chat message) | Chat, Home greeting, Confirmation screens |
| `EntryTile` | Home |
| `MapPicker` (Leaflet wrapper, draggable pin) | Report Issue, Track Complaint (mini view) |
| `StatusStepper` | Track Complaint |
| `SchemeCard` | Explore Schemes |
| `ChecklistItem` (checkbox row) | Document Checklist |
| `DisclaimerBanner` (warning-color) | Chat, Document Checklist |
| `TrackingIdDisplay` (monospace, large) | Confirmation, Track Complaint |
| `LanguageToggle` | Header (global) |
| `FloatingCompanionButton` | Global, all screens except Chat itself |

---

## 9. What to Screenshot for the Judging Deck

1. Home screen with companion greeting (shows personality + entry points)
2. Chat mid-conversation with an inline action chip (shows real intent-routing)
3. Report Issue map-pin step (shows the lightweight map integration)
4. Confirmation screen with Tracking ID + companion's classification summary (shows structured AI output made visible)
5. Track Complaint status stepper (shows transparency, the core brief ask)

These five screens alone tell the full product story even without a live demo, in case of technical issues.

---

*End of UI/UX & User Flow document — pairs with Smart_Bharat_PRD.md for full build reference.*
