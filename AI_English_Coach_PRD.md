# Product Requirements Document (PRD)
## AI English Coach — Personal AI Speaking Coach, Interviewer & Roleplay Partner

---

### Document Info

| Field | Value |
|---|---|
| Product Name | AI English Coach |
| Document Type | Product Requirements Document |
| Version | 1.0 |
| Status | Draft |
| Owner | Product/Founder |

---

## 1. Executive Summary

AI English Coach is not a conventional English-learning app. It is positioned as a **personal AI Communication Coach** that combines four experiences in one platform:

1. A real-time AI voice conversation partner
2. An AI interviewer that simulates real job interviews based on uploaded resumes/JDs
3. An unlimited roleplay simulator for real-life and professional scenarios
4. A custom-knowledge tutor that can teach and quiz users from any uploaded document

The long-term vision is to evolve this from a single app into a scalable SaaS platform for English fluency, interview readiness, and professional communication training.

---

## 2. Problem Statement

Most English-learning apps focus narrowly on vocabulary drills, grammar exercises, or scripted lessons. They fail to address the real pain points users face:

- Lack of a safe environment to **practice real spoken conversation** without judgment
- No tool that prepares users for **actual job interviews** specific to a role, company, or resume
- No integration between **language learning and professional skill-building** (interviews, meetings, sales calls, presentations)
- Existing tools don't give **structured, multi-dimensional feedback** (grammar + pronunciation + confidence + technical correctness) in a single session

---

## 3. Goals & Objectives

### 3.1 Primary Goals
- Enable natural, continuous spoken conversation practice with an AI, in real time
- Allow users to upload any PDF/document and get quizzed or interviewed on it
- Provide detailed, multi-dimensional feedback (grammar, vocabulary, pronunciation, confidence, technical accuracy)
- Support unlimited roleplay scenarios across personal, academic, and professional contexts

### 3.2 Success Metrics (KPIs)
- Daily Active Users (DAU) completing at least 1 conversation session
- Average session length (target: 5+ minutes)
- Retention: Day 1 / Day 7 / Day 30
- % of users completing a full "Interview Simulator" flow
- User-reported improvement in confidence/fluency (survey-based)
- Free-to-paid conversion rate (post-MVP monetization phase)

---

## 4. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| Job Seeker | Preparing for technical/HR interviews | Realistic mock interviews with feedback |
| Non-native English Speaker | Wants to improve spoken fluency | Daily conversation practice + correction |
| Working Professional | Needs to communicate confidently at work | Meeting/presentation/sales roleplay |
| Student | Preparing for IELTS or academic English | Structured level-based learning |

---

## 5. Product Scope — Core Features

### 5.1 AI Voice Conversation
- Real-time, bidirectional voice conversation (speech-to-text → LLM → text-to-speech)
- AI corrects grammar/phrasing inline without breaking conversational flow
- Conversation continues naturally like a human dialogue partner

**Example Flow:**
```
AI: "Hi Mukund, how was your day?"
User: "Today I go market."
AI: "Good try. The correct sentence is: 'Today I went to the market.'
     Now tell me, what did you buy?"
```

### 5.2 Proficiency Levels
Auto-detected by the AI based on conversation quality:
- Level 0 (Native language → English)
- Beginner
- Elementary
- Intermediate
- Advanced
- Business English
- Interview English
- IELTS Preparation
- Corporate Communication

### 5.3 PDF/Document Trainer
- User uploads any PDF (e.g., "React Interview.pdf")
- AI reads and parses the document
- AI conducts a structured Q&A/interview session based strictly on that content
- Evaluation across 5 dimensions after each answer:
  - Technical Correctness
  - Grammar
  - Pronunciation
  - Confidence
  - Vocabulary & Fluency
- Score card + suggested ideal answer generated at the end

### 5.4 Unlimited Roleplay Scenarios
Pre-built and freeform scenarios, including but not limited to:
- HR Interview / Google Interview / Amazon Interview
- Customer Support / Sales Call
- Doctor / Teacher / Airport / Hotel / Restaurant
- Daily Life Conversations
- Business Meeting / Presentation Practice
- Startup Pitch / Investor Pitch

### 5.5 Live Grammar Correction (Post-Conversation)
- AI does not interrupt mid-conversation
- After the session, AI compiles a mistake log:
  - ❌ Incorrect sentence
  - ✅ Corrected sentence
  - Explanation of the grammar rule

### 5.6 Pronunciation Scoring
- Speech-to-text output compared against expected pronunciation
- Word-level highlighting of mispronunciations
- Phonetic breakdown provided (e.g., "comfortable" → correct: *kumf-ter-bul*)

### 5.7 Vocabulary Builder
- Detects repetitive/basic word usage (e.g., overuse of "good," "nice," "bad")
- Suggests richer alternatives in real time (e.g., "excellent," "outstanding," "impressive")

### 5.8 Daily Speaking Challenges
- 2-minute speaking prompts
- 5-minute speaking prompts
- 10-minute debate topics
- Storytelling exercises
- Picture description tasks
- News discussion prompts

### 5.9 Interview Simulator (Flagship Feature)
- User uploads: Resume + Job Description + (optionally) Company info PDF
- AI assumes the role of an interviewer for that exact role (e.g., "Google Frontend Engineer")
- Covers: Technical questions, cross-questions, behavioral questions, DSA, System Design, HR, and English communication
- Generates a final consolidated performance report

### 5.10 Custom Knowledge Base (RAG)
- Supported upload types: PDF, DOCX, TXT, Markdown, Website URL, GitHub Repo, Books, Notes, Company SOPs, Research Papers
- AI restricts its responses strictly to the uploaded knowledge base content (retrieval-augmented generation)

---

## 6. User Flow (High-Level)

```
User speaks (voice input)
        ↓
Speech-to-Text
        ↓
Conversation Memory Lookup
        ↓
Uploaded Document / Vector Search (RAG)
        ↓
LLM Processing
        ↓
Grammar Analysis + English Analysis + Technical Analysis
        ↓
Response Generation
        ↓
Text-to-Speech (Voice Output)
```

---

## 7. Technical Architecture

### 7.1 Tech Stack (Zero-Cost MVP)

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js + Express |
| Database | Supabase (Free tier) or Firebase (Free tier) |
| Authentication | Clerk (Free) or Supabase Auth |
| Vector Database | Supabase pgvector (Free) |
| PDF Parsing | pdf.js, pdf-parse |
| RAG Framework | LangChain |
| LLM Providers | OpenRouter (free models), Groq (free tier), Google Gemini (free API) |
| Speech-to-Text | Browser Web Speech API (Free) |
| Text-to-Speech | Browser SpeechSynthesis API (Free) |
| Deployment (Frontend) | Vercel |
| Deployment (Backend) | Render or Railway (free tier) |

### 7.2 Zero-Cost Constraints & Risks
- Free-tier LLM APIs have **daily/rate limits** — will require paid infrastructure as user base grows
- Browser-based Speech APIs vary in quality/accuracy across browsers and devices
- Vector search performance on free-tier Supabase may need optimization as document volume grows

---

## 8. Non-Functional Requirements
- **Latency:** Voice-to-voice round trip should feel near real-time (target: under 3 seconds)
- **Scalability:** Architecture should allow swapping free-tier services for paid infrastructure without major rework
- **Privacy:** Uploaded documents (resumes, company data) must be securely stored and access-restricted per user
- **Cross-platform:** Should work on modern desktop and mobile browsers supporting Web Speech APIs

---

## 9. Future Roadmap (Post-MVP)

| Feature | Description |
|---|---|
| Conversation Memory | Long-term memory of user's progress and past sessions |
| Streaks & XP System | Gamification to drive daily engagement |
| AI Teacher Personalities | Multiple selectable coach personas |
| Accent Selection | US / UK / Indian accent options for AI voice |
| Speaking Speed Analysis | Pace and filler-word detection |
| Camera-based Eye Contact Tracking | For interview/presentation practice |
| Emotion Detection | Confidence/nervousness detection via voice tone |
| Whiteboard Explanations | Visual aid during technical explanations |
| Group Discussions | Multi-participant simulated GD practice |
| Mock Meetings | Simulated multi-person business meetings |
| Live Coding Interview | Integrated code editor for technical interviews |
| Resume Review | AI-based resume feedback and improvement suggestions |
| Email Writing Practice | Business email drafting practice with feedback |

---

## 10. Monetization Strategy (Future Consideration)
- Freemium model: limited daily conversation minutes / limited PDF uploads on free tier
- Paid tiers unlocking: unlimited Interview Simulator sessions, higher-quality voice models, advanced analytics
- Potential B2B angle: licensing to colleges, coaching institutes, or corporate L&D teams

---

## 11. Assumptions & Constraints
- Users have access to a microphone and a modern browser
- Initial MVP will rely entirely on free-tier services; scaling triggers a paid infrastructure phase
- LLM quality on free tiers (Groq/Gemini/OpenRouter free models) may be inconsistent compared to premium models like GPT-4 or Claude — this should be evaluated during MVP testing

---

## 12. Open Questions
- Which free LLM model provides the best balance of quality and rate limits for real-time conversation?
- Should pronunciation scoring rely solely on browser STT, or should a dedicated speech-analysis API be integrated later for accuracy?
- What is the ideal onboarding flow to auto-detect a user's starting English level?

---

*End of Document*
