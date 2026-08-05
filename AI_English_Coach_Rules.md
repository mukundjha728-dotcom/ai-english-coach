# Project Rules
## AI English Coach — Development Rules & Conventions

---

### Document Info

| Field | Value |
|---|---|
| Product Name | AI English Coach |
| Document Type | Engineering Rules / Conventions |
| Version | 1.0 |
| Related Docs | AI_English_Coach_PRD.md, AI_English_Coach_Architecture.md |

---

## 1. Purpose

This document defines the coding standards, project conventions, and working rules for anyone (human or AI coding assistant) contributing to the AI English Coach codebase. It exists to keep the project consistent, maintainable, and easy to scale from a zero-cost MVP into a paid, production-grade SaaS.

These rules apply to **all contributors**, including AI pair-programming tools (Claude Code, Copilot, Cursor, etc.). Any AI assistant working on this repo should read this file first before making changes.

---

## 2. Project Structure Rules

```
/client                 → React + Vite frontend
  /src
    /components          → Reusable UI components (PascalCase files)
    /modules              → Feature modules (VoiceCapture, DocumentUploader, etc.)
    /hooks                 → Custom React hooks (useXyz.ts)
    /lib                    → Client-side utilities, API client
    /pages                  → Route-level components
    /styles                 → Tailwind config, global styles

/server                 → Node.js + Express backend
  /routes                → Express route handlers, grouped by domain
  /services               → Business logic (conversationOrchestrator, ragPipeline, scoringEngine)
  /llm                      → LLM provider abstraction (LLMClient + provider adapters)
  /db                        → Supabase/Firebase client, query helpers
  /middleware               → Auth, rate-limiting, validation
  /utils                      → Shared backend utilities

/docs                   → PRD.md, Architecture.md, Rules.md, API docs
/scripts                → One-off scripts (migrations, seed data)
```

**Rule:** Never mix frontend and backend code in the same directory. Never place business logic inside route handlers — routes should only validate input and call a service function.

---

## 3. General Coding Rules

1. **Language:** TypeScript is preferred over plain JavaScript for both client and server, wherever feasible. If the project starts in JS, migrate incrementally — do not block MVP delivery for this.
2. **No hardcoded secrets.** All API keys (LLM providers, Supabase, Clerk) must come from environment variables (`.env`), never committed to git.
3. **One responsibility per file.** A file/module should do one thing (e.g., `sttParser.ts` should only handle speech-to-text parsing, not also call the LLM).
4. **No dead code.** Remove unused imports, commented-out blocks, and placeholder functions before merging.
5. **Consistent naming:**
   - Components: `PascalCase` (e.g., `VoiceCaptureModule.tsx`)
   - Functions/variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
   - Files for hooks: `useSomething.ts`
   - Database tables/columns: `snake_case`
6. **Error handling is mandatory.** Every API call (LLM, database, external service) must be wrapped in try/catch with meaningful error messages — never fail silently.
7. **No magic numbers/strings.** Extract into named constants (e.g., `MAX_CONVERSATION_TURNS`, `DEFAULT_CHUNK_SIZE`).

---

## 4. Frontend Rules

- Use **functional components** with hooks only — no class components.
- All shared UI must use **shadcn/ui** components + **Tailwind** utility classes — avoid custom CSS unless absolutely necessary.
- State that is local to a component stays in `useState`/`useReducer`; state shared across features goes into a lightweight global store (e.g., Zustand) — avoid prop-drilling more than 2 levels deep.
- Every async UI action (upload, conversation start, etc.) must show a loading state and handle error state — no silent failures on the UI.
- Voice/mic permissions must always be requested with a clear user-facing explanation before triggering the browser permission prompt.
- Never block the UI thread during STT/TTS processing — always use non-blocking, async patterns.

---

## 5. Backend Rules

- All routes must validate input (use a schema validator, e.g., Zod) before passing data to services.
- Business logic belongs in `/services`, never in `/routes`.
- The **LLM Provider Layer must always be abstracted** behind a single `LLMClient` interface. Never call a provider's SDK directly from a service — always go through `LLMClient.generate(...)`. This is critical for swapping/load-balancing free-tier providers.
- All database access goes through `/db` helper functions — no raw Supabase/Firebase calls scattered across services.
- WebSocket handlers must be kept thin — delegate to the Conversation Orchestrator service immediately.
- Rate-limit all public-facing endpoints, especially document upload and conversation start, to protect free-tier LLM quota.

---

## 6. LLM & Prompt Rules

- All system prompts must be stored as versioned templates (in DB or `/server/llm/prompts`), never inlined ad-hoc in service code.
- Every LLM call must specify a `mode` (`conversation`, `interview`, `grammar_review`, `embedding`) so behavior stays predictable and testable.
- Never send more context to the LLM than necessary — trim conversation memory and RAG chunks to the minimum needed (respect free-tier token limits).
- Always have a **fallback provider** configured — if the primary free-tier LLM is rate-limited, the system should gracefully switch to a secondary provider rather than fail the request.
- Do not silently swallow LLM errors — if a provider fails, log it and surface a user-friendly retry message.

---

## 7. Data & Privacy Rules

- Uploaded documents (resumes, company PDFs) must be stored with **row-level security** — a user must never be able to access another user's documents, sessions, or scores.
- No PII (resume content, personal conversation transcripts) should be logged in plaintext in server logs or error trackers.
- Documents and vector embeddings must be deletable by the user (support a "delete my data" action from day one, even in MVP).
- Auth tokens must be validated on every protected route and WebSocket connection — no unauthenticated access to conversation or document endpoints.

---

## 8. Git & Version Control Rules

- **Branching:** `main` is always deployable. Feature work happens in `feature/<short-description>` branches.
- **Commit messages:** Use conventional commits format:
  ```
  feat: add PDF trainer scoring engine
  fix: correct pronunciation scoring off-by-one
  refactor: extract LLM client abstraction
  docs: update architecture.md with RAG flow
  ```
- **Pull requests:** Every PR must include a short description of what changed and why. No direct pushes to `main`.
- **No committed secrets:** `.env` files must always be in `.gitignore`. If a secret is accidentally committed, rotate it immediately.

---

## 9. Testing Rules

- Every service function that touches business logic (scoring engine, grammar analysis, RAG retrieval) should have at least a basic unit test.
- Mock LLM provider calls in tests — never call real free-tier APIs in automated tests (to avoid burning rate limits).
- Manual QA checklist before any deploy:
  - [ ] Voice conversation round-trip works end-to-end
  - [ ] PDF upload → parsing → Q&A flow works
  - [ ] Scoring output renders correctly on the client
  - [ ] Auth-protected routes reject unauthenticated requests
  - [ ] No console errors in browser during a full session

---

## 10. Rules for AI Coding Assistants (Claude Code / Copilot / Cursor)

When an AI assistant is used to write or modify code in this repository, it must:

1. **Read this file (`rules.md`) and `Architecture.md` before making structural changes.**
2. Never introduce a new LLM provider call outside the `LLMClient` abstraction.
3. Never hardcode API keys or secrets — always reference `process.env.*`.
4. Follow the existing folder structure (Section 2) — do not create new top-level directories without justification.
5. When adding a new feature (e.g., a new roleplay type), prefer **configuration-driven changes** (new prompt template, new DB row) over hardcoded logic, in line with the modularity principles in `Architecture.md`.
6. Always add basic error handling to any new async function.
7. When unsure about a convention, prefer consistency with existing code over introducing a new pattern.
8. Do not silently delete or overwrite existing files — flag changes clearly.
9. Keep changes scoped — do not refactor unrelated code while implementing a feature, unless explicitly asked.

---

## 11. Definition of Done (Feature-Level Checklist)

A feature is considered "done" only when:
- [ ] Code follows the structure and naming rules above
- [ ] Errors are handled gracefully (no silent failures)
- [ ] Loading/error states exist on the frontend for any async action
- [ ] Sensitive data (documents, transcripts) is access-controlled per user
- [ ] Basic test coverage exists for core logic
- [ ] Feature is documented (README or inline comments where non-obvious)
- [ ] No secrets or debug logs are committed

---

*End of Document*
