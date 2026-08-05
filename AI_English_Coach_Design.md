# Design Document
## AI English Coach — UI/UX & Design System

---

### Document Info

| Field | Value |
|---|---|
| Product Name | AI English Coach |
| Document Type | Design Document (UI/UX + Design System) |
| Version | 1.0 |
| Related Docs | AI_English_Coach_PRD.md, AI_English_Coach_Architecture.md, AI_English_Coach_Phases.md |

---

## 1. Design Philosophy

AI English Coach should feel less like a "learning app" and more like **talking to a calm, encouraging human coach**. The design should:

- Reduce anxiety around speaking — no red error banners, no exam-like pressure
- Feel conversational and voice-first, not form-heavy or cluttered
- Make feedback feel like coaching, not grading
- Stay minimal during active conversation (voice is the focus, not UI chrome)
- Feel credible and professional enough to be used for real interview prep, not just casual practice

**Tone:** Warm, encouraging, focused. Think "personal coach in your pocket," not "language-learning app with mascots and gamified pop-ups."

---

## 2. Design System

### 2.1 Color Palette

| Role | Color | Usage |
|---|---|---|
| Primary | Deep Indigo `#4F46E5` | Primary buttons, active states, brand accent |
| Primary Light | `#818CF8` | Hover states, secondary accents |
| Background | Off-white `#FAFAFA` / Dark mode `#0F0F14` | App background |
| Surface | White `#FFFFFF` / Dark `#1A1A22` | Cards, panels |
| Success | Green `#22C55E` | Correct answers, positive scores |
| Warning | Amber `#F59E0B` | Areas needing improvement |
| Error (soft) | Muted Red `#EF4444` (used sparingly) | Only for actual errors (upload failed, mic denied) — never for grammar mistakes |
| Text Primary | `#111827` / Dark `#F3F4F6` | Main text |
| Text Secondary | `#6B7280` / Dark `#9CA3AF` | Supporting text, captions |

**Note:** Grammar mistakes and low scores should use **amber/neutral tones, not red** — red signals failure/danger, which increases speaking anxiety. Reserve red only for system errors (e.g., "mic permission denied," "upload failed").

### 2.2 Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Headings (H1) | Inter / Sora | 700 | 32px |
| Headings (H2) | Inter / Sora | 600 | 24px |
| Body | Inter | 400 | 16px |
| Captions/Labels | Inter | 500 | 13px |
| Transcript Text | Inter | 400 | 18px (larger for readability during conversation) |

### 2.3 Spacing & Layout
- Base spacing unit: **4px** (Tailwind default scale: 4, 8, 12, 16, 24, 32, 48, 64)
- Max content width: `1080px` for dashboard views; conversation view can be full-width on mobile
- Card border radius: `12px` (soft, approachable — not sharp corners)
- Consistent 24px padding inside cards/panels

### 2.4 Components (via shadcn/ui + Tailwind)
- Buttons: rounded-xl, primary/secondary/ghost variants
- Cards: soft shadow (`shadow-sm`), rounded-xl, white/dark surface
- Badges: used for proficiency level, roleplay category tags
- Modals: used sparingly — only for critical confirmations (delete document, end session)
- Toasts: for non-blocking feedback (e.g., "Document uploaded successfully")

---

## 3. Core Screens

### 3.1 Onboarding Flow
**Goal:** Get the user speaking within 60 seconds, not stuck in a long setup wizard.

1. **Welcome screen** — brief value prop ("Practice speaking English naturally, get real feedback")
2. **Mic permission screen** — explains *why* mic access is needed before triggering the browser prompt
3. **Quick level check** — 2–3 short spoken prompts; AI auto-detects starting level (no long quiz/form)
4. **Land directly in a starter conversation** — no empty dashboard; the first experience is a live AI conversation

---

### 3.2 Dashboard (Home)
Layout: single-column on mobile, two-column on desktop.

- **Top:** Greeting + current proficiency level badge + streak (if enabled)
- **Primary CTA card:** "Start a Conversation" — most prominent element on the screen
- **Secondary cards (grid):**
  - Roleplay Library
  - Document Trainer (upload PDF)
  - Interview Simulator
  - Daily Challenge (today's prompt)
- **Bottom/sidebar:** Recent sessions with quick score summary

**Principle:** The dashboard should never feel like a "menu of features" — one clear primary action, everything else secondary.

---

### 3.3 Conversation Screen (Voice-First)
This is the most-used screen — design must minimize distraction.

- **Center stage:** Large mic button / waveform animation showing live listening state
- **Live transcript:** Appears below/beside the mic, scrolling chat-style (user turns left-aligned, AI turns right-aligned or visually distinct with an avatar)
- **Minimal chrome:** No heavy navigation bars during active conversation — a simple "End Session" and "Pause" control
- **States to design explicitly:**
  - Idle (waiting for user to speak)
  - Listening (mic active, waveform animating)
  - Processing (AI "thinking" — subtle pulse animation, no jarring spinner)
  - Speaking (AI voice playing — waveform or avatar animation)
- **No mid-conversation red error text** for grammar — corrections are saved for the session summary, not shown inline (per PRD Section 5.5, corrections happen post-session)

---

### 3.4 Session Summary / Scorecard Screen
Shown after any conversation, PDF trainer session, or interview.

- **Top:** Overall session snapshot (duration, scenario, level)
- **Score breakdown:** Visual bars/rings for Technical, Grammar, Confidence, Vocabulary, Pronunciation (use amber/green scale, not red)
- **Mistake log:** Expandable list — ❌ original → ✅ corrected, with a short "why" explanation
- **Suggested answer** (for PDF/interview mode): shown in a distinct card, clearly labeled as a "model answer," not a judgment
- **CTA at bottom:** "Practice this again" or "Try a related challenge" — always end on a forward action, not just a score

---

### 3.5 Document Trainer / Upload Screen
- Drag-and-drop upload zone (PDF/DOCX/TXT) with clear file-type guidance
- Upload progress + parsing status ("Reading your document...")
- Once parsed: show a short AI-generated summary of the document ("Got it — this looks like a React interview guide with 12 questions") before starting, so the user trusts the AI actually understood it
- "Start Session" CTA appears only after parsing completes successfully

---

### 3.6 Roleplay Selector
- Grid/list of scenario cards grouped by category (Interviews, Daily Life, Business, Travel, etc. — per PRD Section 5.4)
- Each card: icon/illustration, scenario name, one-line description, difficulty tag
- Search/filter bar at top for users who know what they want
- Tapping a card goes straight into the conversation screen with that scenario pre-loaded — no extra confirmation step

---

### 3.7 Interview Simulator Flow
Multi-step, but should feel guided, not like a form:

1. Upload Resume (required)
2. Upload Job Description (required)
3. Upload Company Info (optional)
4. AI shows a short confirmation: "Ready to interview you for [Role] at [Company]. This will take about 15–20 minutes."
5. Interview begins — same voice-first conversation UI as Section 3.3, with a subtle stage indicator (e.g., "Technical Round 2 of 4")
6. Ends in the Session Summary screen (Section 3.4) with the full interview report

---

### 3.8 Daily Challenge Screen
- Single-focus card: today's prompt (e.g., "Describe your morning routine in 2 minutes")
- Timer visible but not stressful (soft countdown, no harsh red flashing at the end)
- After completion → same scorecard pattern as Section 3.4, but lightweight (fewer dimensions scored)

---

## 4. Interaction & Motion Principles

- **Voice state transitions** (idle → listening → processing → speaking) should use smooth, subtle animations (waveform pulses, gentle fades) — avoid abrupt UI jumps that break conversational flow
- **No jarring sounds** for errors — a soft, neutral tone for "didn't catch that, try again," never a harsh buzzer
- **Loading states** should never be blank spinners on their own — pair with a short reassuring label ("Listening...", "Thinking...", "Preparing your feedback...")
- **Micro-celebrations** (subtle, not childish) for milestones — e.g., streak achieved, first interview completed — small toast or badge animation, not full-screen confetti overload

---

## 5. Accessibility & Responsiveness

- All interactive elements must have visible focus states (keyboard navigation support)
- Color contrast must meet WCAG AA minimum, especially for score indicators (don't rely on color alone — use icons/labels alongside amber/green scoring)
- Mic-based interaction must have a **text-input fallback** for users without mic access or in noisy environments
- Fully responsive: conversation screen must work well on mobile (primary use case — practicing speaking on the go) as well as desktop (interview simulator likely used more on desktop before real interviews)
- Dark mode supported from the start (many users will practice speaking at night)

---

## 6. Content & Microcopy Guidelines

- Feedback language should be **coach-like, never exam-like**:
  - ✅ "Nice try — here's a more natural way to say that"
  - ❌ "Incorrect. Error in sentence structure."
- Avoid negative framing in scores — pair low scores with a specific, actionable next step, not just a number
- Roleplay and challenge descriptions should be short, concrete, and scenario-driven (avoid vague labels like "Practice 3")
- Keep all UI copy encouraging but not over-the-top ("You're improving!" is fine; avoid excessive exclamation marks or forced enthusiasm)

---

## 7. Design Deliverables Checklist

- [ ] Color palette + typography tokens implemented in Tailwind config
- [ ] Core component library (buttons, cards, badges, modals) built in shadcn/ui
- [ ] Wireframes/mockups for: Onboarding, Dashboard, Conversation, Scorecard, Document Upload, Roleplay Selector, Interview Flow, Daily Challenge
- [ ] Voice state animations (idle/listening/processing/speaking) prototyped
- [ ] Dark mode variants for all core screens
- [ ] Mobile + desktop responsive layouts validated
- [ ] Accessibility pass (contrast, keyboard nav, text-input fallback) completed

---

*End of Document*
