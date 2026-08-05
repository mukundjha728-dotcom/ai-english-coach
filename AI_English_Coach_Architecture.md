# Technical Architecture Document
## AI English Coach — System Architecture & Design

---

### Document Info

| Field | Value |
|---|---|
| Product Name | AI English Coach |
| Document Type | Technical Architecture Document |
| Version | 1.0 |
| Status | Draft |
| Related Document | AI_English_Coach_PRD.md |

---

## 1. Overview

This document describes the technical architecture of AI English Coach — a real-time, voice-based AI conversation platform combining speaking practice, interview simulation, document-based tutoring, and roleplay scenarios. The architecture is designed to run at **zero cost for the MVP**, using free tiers of managed services, while remaining structured enough to migrate to paid infrastructure as usage scales.

### 1.1 Architecture Goals
- Real-time (near-instant) voice conversation loop
- Modular services that can be swapped (e.g., free LLM → paid LLM) without rewriting the system
- Secure, per-user isolated storage for uploaded documents and conversation history
- Retrieval-Augmented Generation (RAG) pipeline for document-grounded conversations
- Horizontally scalable backend, stateless where possible

---

## 2. High-Level System Architecture

```
                         ┌─────────────────────────┐
                         │        Client (Browser)  │
                         │  React + Vite + Tailwind │
                         │  Web Speech API (STT/TTS)│
                         └────────────┬─────────────┘
                                      │ HTTPS / WebSocket
                                      ▼
                         ┌─────────────────────────┐
                         │      API Gateway Layer    │
                         │   Node.js + Express (BFF) │
                         └────────────┬─────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌──────────────────┐
│  Auth Service   │           │  Conversation      │           │  Document/RAG      │
│  (Clerk /       │           │  Orchestrator      │           │  Pipeline          │
│  Supabase Auth) │           │  (LLM routing,     │           │  (Parsing +        │
│                 │           │  memory, scoring)  │           │  Embeddings)       │
└───────────────┘           └────────┬─────────┘           └─────────┬──────────┘
                                      │                                │
                    ┌─────────────────┼─────────────────┐              │
                    ▼                 ▼                 ▼              ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  LLM Provider  │  │  Grammar/       │  │  Scoring        │  │  Vector DB      │
            │  (Gemini/Groq/ │  │  Pronunciation  │  │  Engine         │  │  (Supabase      │
            │  OpenRouter)   │  │  Analysis       │  │  (Rubric-based) │  │  pgvector)      │
            └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     Primary Database      │
                         │  Supabase / Firebase       │
                         │  (Users, Sessions,          │
                         │   Documents, Scores)        │
                         └─────────────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Client Layer (Frontend)
**Stack:** React + Vite, Tailwind CSS, shadcn/ui

Responsibilities:
- Capture microphone input via **Web Speech API (STT)**
- Play AI responses via **SpeechSynthesis API (TTS)**
- Render chat/voice UI, scorecards, roleplay selection, PDF upload interface
- Maintain local session state (current roleplay, active document context)
- Communicate with backend via REST (for uploads/config) and WebSocket (for real-time conversation streaming)

Key modules:
- `VoiceCaptureModule` — mic access, STT streaming
- `VoicePlaybackModule` — TTS playback queue
- `ConversationUI` — chat bubbles, live transcript
- `DocumentUploader` — PDF/DOCX/TXT upload + progress
- `ScoreCardRenderer` — displays grammar/pronunciation/confidence scores
- `RoleplaySelector` — scenario picker

---

### 3.2 API Gateway / Backend-for-Frontend (BFF)
**Stack:** Node.js + Express

Responsibilities:
- Single entry point for all client requests
- Authentication middleware (validates Clerk/Supabase session tokens)
- Routes requests to appropriate internal services
- Manages WebSocket connections for real-time voice conversation
- Rate-limiting and request validation

Key routes (illustrative):
```
POST   /api/auth/session
POST   /api/documents/upload
GET    /api/documents/:id
POST   /api/conversation/start
WS     /ws/conversation/:sessionId
POST   /api/interview/simulate
GET    /api/scores/:sessionId
GET    /api/roleplays
```

---

### 3.3 Conversation Orchestrator
The core "brain" of the system. Responsibilities:

1. Receives transcribed user speech (text) from the client
2. Fetches relevant context:
   - Conversation memory (recent turns)
   - Retrieved document chunks (if a PDF/knowledge base is active)
   - User's current proficiency level
3. Constructs the LLM prompt (system + context + user turn)
4. Sends request to the LLM Provider
5. Passes the raw LLM response through:
   - Grammar/Pronunciation Analysis module
   - Scoring Engine (if in interview/PDF-trainer mode)
6. Returns final structured response to client for TTS playback

This is implemented as a stateless service — session state is persisted in the database, not in server memory, so any backend instance can handle any request (important for scaling on Render/Railway free tier which may restart instances).

---

### 3.4 Document / RAG Pipeline

**Flow:**
```
Upload (PDF/DOCX/TXT/URL/GitHub Repo)
        ↓
Parsing (pdf.js / pdf-parse / custom parsers)
        ↓
Chunking (LangChain text splitters)
        ↓
Embedding Generation (via LLM provider's embedding model)
        ↓
Store vectors in Supabase pgvector
        ↓
On each conversation turn → similarity search → inject top-k chunks into LLM context
```

Responsibilities:
- Parse various file formats into clean text
- Chunk text into semantically coherent segments (e.g., 500–1000 tokens with overlap)
- Generate embeddings and store alongside metadata (document id, user id, page number)
- Serve top-k relevant chunks per query via cosine similarity search

---

### 3.5 LLM Provider Layer
Abstracted behind a single internal interface (`LLMClient`) so providers can be swapped without touching business logic.

```
LLMClient.generate({ prompt, context, mode })
   → routes to Gemini / Groq / OpenRouter based on config
```

Modes supported:
- `conversation` — natural dialogue mode
- `interview` — structured Q&A with evaluation
- `grammar_review` — post-session correction summary
- `embedding` — for RAG vectorization

This abstraction is critical for the zero-cost MVP, since free-tier rate limits may require dynamically routing between multiple providers (e.g., fallback from Groq to Gemini if rate-limited).

---

### 3.6 Grammar & Pronunciation Analysis
- **Grammar analysis:** LLM-based correction pass comparing user's raw transcript to a grammatically correct version; outputs a structured diff (incorrect → corrected → explanation)
- **Pronunciation analysis:** Compares STT confidence/phoneme output against expected pronunciation; flags mismatches at the word level

---

### 3.7 Scoring Engine
Used primarily in **PDF Trainer** and **Interview Simulator** modes. Produces a rubric-based score across:
- Technical Correctness
- Grammar
- Pronunciation
- Confidence (derived from pacing, filler words, hesitation markers)
- Vocabulary & Fluency

Output format (example):
```json
{
  "technical": 8,
  "grammar": 5,
  "confidence": 6,
  "vocabulary": 4,
  "suggested_answer": "..."
}
```

---

### 3.8 Database Layer
**Stack:** Supabase (Postgres) or Firebase

Core tables/collections:

| Table | Purpose |
|---|---|
| `users` | Profile, auth reference, proficiency level |
| `sessions` | Conversation sessions, roleplay type, timestamps |
| `messages` | Turn-by-turn transcript per session |
| `documents` | Uploaded file metadata |
| `document_chunks` | Text chunks + vector embeddings (pgvector) |
| `scores` | Per-session evaluation results |
| `mistakes` | Logged grammar mistakes with corrections |

---

### 3.9 Authentication
- Clerk (free tier) or Supabase Auth
- Session tokens validated at the API Gateway
- Per-user row-level security (RLS) enforced in Supabase for documents, sessions, and scores

---

## 4. Real-Time Voice Conversation Flow (Detailed)

```
1. User speaks → Browser Web Speech API converts speech to text (client-side)
2. Client sends transcript over WebSocket to backend
3. Conversation Orchestrator:
      a. Fetches last N turns from `messages`
      b. If active document exists → vector search in `document_chunks`
      c. Builds final prompt (system + memory + retrieved context + user turn)
4. LLMClient sends prompt to active provider (Gemini/Groq/OpenRouter)
5. Response received → passed through Grammar Analysis (async, non-blocking)
6. Final response text streamed back to client over WebSocket
7. Client's SpeechSynthesis API converts text to voice and plays it
8. Turn persisted to `messages` table; mistakes (if any) persisted to `mistakes` table
```

**Target latency budget:**
| Stage | Target |
|---|---|
| STT (client-side) | < 500ms |
| Network + orchestration | < 300ms |
| LLM response | < 1.5s |
| TTS playback start | < 300ms |
| **Total round-trip** | **~2.5–3s** |

---

## 5. Deployment Architecture

| Component | Platform (MVP - Free Tier) | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy from GitHub, edge CDN |
| Backend (Express + WS) | Render or Railway | Free tier; may sleep on inactivity — acceptable for MVP |
| Database | Supabase | Includes Postgres + pgvector + Auth |
| File Storage | Supabase Storage (Free tier) | For uploaded PDFs/DOCX |
| LLM Inference | External APIs (Gemini/Groq/OpenRouter) | No self-hosting required |

**CI/CD:** GitHub → auto-deploy on push to `main` (Vercel for frontend, Render/Railway webhook for backend)

---

## 6. Scaling Path (Post-MVP)

| Concern | MVP (Free Tier) | Scaled Solution |
|---|---|---|
| LLM rate limits | Free tiers (Gemini/Groq/OpenRouter) | Paid API keys, multi-provider load balancing |
| Backend sleep/cold starts | Render/Railway free tier | Dedicated paid dyno/VM, or serverless with warm pools |
| Speech quality | Browser Web Speech API | Dedicated STT/TTS API (e.g., paid cloud speech services) for consistency across browsers |
| Vector search performance | Supabase pgvector free tier | Dedicated vector DB (e.g., Pinecone/Weaviate) at scale |
| Real-time transport | WebSocket on single backend instance | Managed WebSocket service / sticky-session load balancer |

---

## 7. Security & Privacy Considerations
- All uploaded documents (resumes, company data) stored with **row-level security** — accessible only to the owning user
- Auth tokens validated on every API/WebSocket request
- No document content should be logged in plaintext in application logs
- LLM prompts should strip any sensitive PII where not required for functionality
- HTTPS/WSS enforced for all client-server communication

---

## 8. Modularity & Extensibility Principles
- **LLM Provider abstraction** allows switching or load-balancing across free/paid models without touching orchestration logic
- **Roleplay scenarios** are configuration-driven (stored as prompt templates in DB), not hardcoded — new roleplays can be added without a code deploy
- **Scoring rubric** is defined as a configurable schema, allowing new evaluation dimensions to be added later (e.g., "Eye Contact Score" once camera-based features are introduced)
- **RAG pipeline** is source-agnostic — same pipeline handles PDF, DOCX, website URLs, and GitHub repos with different parser adapters feeding into the same chunking/embedding flow

---

## 9. Open Technical Questions
- Should conversation memory be full-session (all turns) or a sliding window with summarization for long sessions?
- Which free LLM provider gives the most consistent low-latency responses for real-time conversation mode?
- Should pronunciation scoring eventually move off the browser STT confidence scores to a dedicated phoneme-analysis model for accuracy?
- What's the fallback behavior when all free-tier LLM providers hit rate limits simultaneously?

---

*End of Document*
