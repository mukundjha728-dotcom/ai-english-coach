# Development Phases
## AI English Coach — Build Roadmap (Zero-Cost MVP → Scale)

---

### Document Info

| Field | Value |
|---|---|
| Product Name | AI English Coach |
| Document Type | Phased Development Plan |
| Version | 1.0 |
| Related Docs | AI_English_Coach_PRD.md, AI_English_Coach_Architecture.md, AI_English_Coach_Rules.md |

---

## 1. Purpose

This document breaks the product down into sequential build phases so development stays focused, testable, and shippable at every stage. Each phase produces a working, demoable increment — not a half-built feature. Phases are designed to be built solo or with AI coding assistance (Claude Code), following the conventions in `Rules.md` and the structure in `Architecture.md`.

---

## 2. Phase Overview

| Phase | Name | Goal | Cost |
|---|---|---|---|
| 0 | Setup & Foundations | Repo, auth, DB, deployment pipeline | Free |
| 1 | Core Voice Conversation | Basic AI voice chat working end-to-end | Free |
| 2 | Levels & Memory | Proficiency detection + conversation memory | Free |
| 3 | Grammar & Pronunciation Feedback | Post-session correction + scoring | Free |
| 4 | Document Trainer (RAG) | PDF upload → Q&A grounded in content | Free |
| 5 | Roleplay Engine | Configurable roleplay scenarios | Free |
| 6 | Interview Simulator | Resume + JD based mock interviews | Free |
| 7 | Vocabulary & Daily Challenges | Engagement features | Free |
| 8 | Polish, QA & Public MVP Launch | Bug fixes, UX polish, soft launch | Free |
| 9 | Scale-Up Infrastructure | Move off free tiers as usage grows | Paid |
| 10 | Advanced Features | Camera, emotion detection, live coding, etc. | Paid |

---

## 3. Phase Details

---

### Phase 0 — Setup & Foundations
**Goal:** A deployable skeleton app with auth and database wired up, nothing functional yet.

Tasks:
- Initialize monorepo structure (`/client`, `/server`, `/docs`) per `Architecture.md`
- Set up React + Vite + Tailwind + shadcn/ui in `/client`
- Set up Node.js + Express in `/server`
- Configure Supabase project (Postgres + Auth + pgvector + Storage)
- Integrate Clerk or Supabase Auth (sign up / login / session handling)
- Set up `.env` structure and secrets management (per `Rules.md` Section 3.2)
- Deploy skeleton: frontend → Vercel, backend → Render/Railway
- Set up GitHub repo, branching strategy, and CI auto-deploy

**Done when:** A user can sign up, log in, and see an empty authenticated dashboard, fully deployed.

---

### Phase 1 — Core Voice Conversation
**Goal:** The single most important feature — a working AI voice conversation loop.

Tasks:
- Implement `VoiceCaptureModule` (Web Speech API STT) on client
- Implement `VoicePlaybackModule` (SpeechSynthesis API TTS) on client
- Build WebSocket connection between client and backend
- Implement `LLMClient` abstraction (Section 6, `Rules.md`) with one provider (start with Gemini or Groq free tier)
- Implement basic `Conversation Orchestrator` service (no memory/RAG yet — single-turn context)
- Build minimal `ConversationUI` (transcript + mic button)
- Persist each turn to `messages` table

**Done when:** A user can speak, see their transcript, hear an AI voice response, and have a continuous back-and-forth conversation.

---

### Phase 2 — Levels & Memory
**Goal:** The AI remembers context and adapts to the user's proficiency.

Tasks:
- Add `proficiency_level` field to `users` table
- Build level auto-detection logic (LLM analyzes first few turns, assigns a level from the list in `PRD.md` Section 5.2)
- Implement conversation memory: fetch last N turns from `messages` and inject into prompt
- Add session summarization for long conversations (avoid exceeding token limits)
- Display current detected level in the UI

**Done when:** The AI conversation adapts noticeably based on a user's demonstrated level, and remembers earlier parts of the same session.

---

### Phase 3 — Grammar & Pronunciation Feedback
**Goal:** Users get structured, actionable feedback after a session.

Tasks:
- Build `grammar_review` LLM mode: takes full session transcript, returns mistake list (incorrect → corrected → explanation)
- Build pronunciation comparison logic using STT confidence/word-level output
- Design and build the mistake log UI (❌ / ✅ format per `PRD.md` Section 5.5)
- Persist mistakes to `mistakes` table
- Add a basic "Session Summary" screen shown at the end of a conversation

**Done when:** After any conversation, the user sees a clear list of their grammar mistakes and pronunciation issues with corrections.

---

### Phase 4 — Document Trainer (RAG)
**Goal:** Users can upload a PDF and have a grounded conversation/quiz based on it.

Tasks:
- Build file upload endpoint + Supabase Storage integration
- Implement PDF parsing (pdf.js / pdf-parse)
- Implement chunking (LangChain text splitter)
- Generate embeddings and store in `document_chunks` (pgvector)
- Implement vector similarity search for retrieval
- Wire retrieved chunks into the Conversation Orchestrator prompt
- Build `DocumentUploader` UI + document selection before starting a session

**Done when:** A user can upload a PDF (e.g., "React Interview.pdf") and have the AI ask questions strictly grounded in that document's content.

---

### Phase 5 — Roleplay Engine
**Goal:** Unlimited, configuration-driven roleplay scenarios.

Tasks:
- Design `roleplays` table (scenario name, system prompt template, category)
- Seed initial scenarios: HR Interview, Customer Support, Sales Call, Restaurant, Airport, Business Meeting, etc. (full list in `PRD.md` Section 5.4)
- Build `RoleplaySelector` UI (category-grouped scenario picker)
- Wire selected roleplay's prompt template into the Conversation Orchestrator
- Ensure roleplay switching doesn't require a code deploy (data-driven, per `Rules.md` Section 10.5)

**Done when:** A user can pick any scenario from a list and immediately start a roleplay conversation matching that context.

---

### Phase 6 — Interview Simulator
**Goal:** The flagship feature — full mock interviews from resume + JD.

Tasks:
- Extend document upload to support Resume + Job Description + optional Company PDF
- Build interview-specific LLM mode combining: technical, behavioral, HR, and English evaluation
- Implement multi-stage interview flow (intro → technical → behavioral → HR → wrap-up)
- Build the `Scoring Engine` (per `Architecture.md` Section 3.7) producing the final rubric-based report
- Build final report UI (scores + suggested answers, per `PRD.md` Section 5.3)

**Done when:** A user can upload a resume + JD (e.g., "Google Frontend Engineer") and go through a full simulated interview ending in a detailed report.

---

### Phase 7 — Vocabulary & Daily Challenges
**Goal:** Engagement and retention features.

Tasks:
- Build repetitive-word detection (tracks overused words like "good," "nice") and suggests alternatives
- Build daily challenge generator (2-min speaking, picture description, news discussion, debate topics — per `PRD.md` Section 5.8)
- Add a simple daily challenge UI on the dashboard
- (Optional at this stage) Add streak tracking as a lightweight engagement hook

**Done when:** Users see a new daily speaking challenge on login, and get vocabulary suggestions during conversations.

---

### Phase 8 — Polish, QA & Public MVP Launch
**Goal:** Ship a stable, usable MVP to real users.

Tasks:
- Full manual QA pass using the checklist in `Rules.md` Section 9
- Fix cross-browser issues with Web Speech API (Chrome-first, document limitations elsewhere)
- Add proper loading/error states across all async flows
- Add basic analytics (session count, feature usage) to inform Phase 9 priorities
- Write a minimal onboarding flow (mic permission explanation, first roleplay suggestion)
- Soft launch to a small user group; collect feedback

**Done when:** The product is stable enough for real users to complete a full session (conversation, PDF trainer, or interview simulator) without breaking.

---

### Phase 9 — Scale-Up Infrastructure (Paid Phase)
**Goal:** Remove free-tier bottlenecks as usage grows.

Tasks:
- Move LLM calls to paid API tiers; implement multi-provider load balancing in `LLMClient`
- Upgrade backend hosting to a non-sleeping paid instance
- Evaluate dedicated STT/TTS APIs to replace browser-based Web Speech API for consistency
- Evaluate dedicated vector DB (Pinecone/Weaviate) if Supabase pgvector becomes a bottleneck
- Introduce basic monetization (freemium limits per `PRD.md` Section 10)

**Done when:** The app can reliably support a growing user base without hitting free-tier rate limits or cold-start delays.

---

### Phase 10 — Advanced Features (Post-Scale)
**Goal:** Differentiated, premium features from the `PRD.md` future roadmap.

Tasks (prioritize based on user feedback from Phase 8–9):
- Camera-based eye contact / emotion detection for interview practice
- Live coding interview mode with integrated code editor
- Group discussion / multi-participant mock meetings
- AI teacher personalities + accent selection
- Resume review and email writing practice modules

**Done when:** Selected advanced features are live and adopted by a meaningful portion of the paid user base.

---

## 4. Suggested Build Order Rationale

- **Phase 1 before everything else** because the voice conversation loop is the technical riskiest and most central piece — validate it works before investing in surrounding features.
- **Phase 4 (RAG) before Phase 6 (Interview Simulator)** because the Interview Simulator depends entirely on the document pipeline being reliable.
- **Phase 5 (Roleplay) is intentionally lightweight and data-driven** so it can be expanded continuously without slowing down later phases.
- **Monetization (Phase 9) is deliberately deferred** until there's a stable, tested product — avoids optimizing payment flows before the core experience is proven.

---

## 5. Milestone Checklist (Quick Reference)

- [ ] Phase 0 — Deployed skeleton with auth
- [ ] Phase 1 — Working voice conversation loop
- [ ] Phase 2 — Level detection + memory
- [ ] Phase 3 — Grammar/pronunciation feedback
- [ ] Phase 4 — PDF-grounded RAG conversations
- [ ] Phase 5 — Roleplay scenario engine
- [ ] Phase 6 — Full interview simulator with report
- [ ] Phase 7 — Vocabulary builder + daily challenges
- [ ] Phase 8 — QA complete, MVP soft-launched
- [ ] Phase 9 — Paid infrastructure migration
- [ ] Phase 10 — Advanced/premium features

---

*End of Document*
