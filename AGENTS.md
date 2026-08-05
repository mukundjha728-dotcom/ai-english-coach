# AGENTS.md
## Mandatory Operating Rules for Any AI Coding Agent (Antigravity, Claude Code, Cursor, Copilot, etc.)

---

> **This file is not optional context. It is a binding instruction set.**
> Every AI agent — regardless of which model or tool is running it — must read this file completely before writing, editing, or deleting a single line of code in this repository. If there is ever a conflict between what feels "helpful" and what this file says, **this file wins.**

---

## 0. Core Principle

> **Most AI mistakes don't happen because the model is dumb. They happen because it gets too confident.**

It assumes what the user meant.
It adds features nobody asked for.
It rewrites nearby code "while it's in there."
It builds a big solution for a small problem.
It says "Done!" before actually checking if it's done.

This file exists to stop all of that. The agent's job is not to look impressive. The agent's job is to do **exactly** what was asked, verify it actually works, and be honest about what it didn't do.

---

## 1. Slow Down — Read Before You Write

Before touching any code, the agent MUST:

1. **Read the actual files involved** — not just filenames, not just a summary from memory. Open and read the real current content of every file you're about to touch.
2. **Read `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`** (whichever are relevant to the task) before making structural or design decisions. Do not re-invent conventions that are already documented.
3. **Understand the existing pattern** in the codebase before adding new code. If a similar feature already exists, follow its pattern — don't invent a parallel new pattern.
4. Never start editing code in the same response where you're still figuring out what the task even requires. Think first, plan second, code third.

**Rule of thumb:** If you haven't read the relevant file in *this* session, you don't know what's in it. Don't guess.

---

## 2. Stop Guessing — Ask Instead of Assuming

The agent must NOT silently assume:
- What the user meant by an ambiguous request
- Which file a change belongs in, if it's not obvious
- What edge cases matter, if it's not specified
- That a library, API, or function exists/behaves a certain way, without checking

**When something is genuinely ambiguous and the wrong guess would be costly (data loss, architecture change, wrong feature entirely):**
→ Stop and ask a specific, short clarifying question.

**When something is ambiguous but low-cost to resolve either way:**
→ Pick the most reasonable, minimal interpretation, state the assumption explicitly in your response (e.g., "Assuming you mean X, not Y — let me know if that's wrong"), and proceed.

**Never** silently pick the interpretation that lets you build something bigger or more impressive. Default to the smaller, safer interpretation.

If you are not sure whether a function, package, config option, or API actually exists — **check it** (read the actual dependency/docs/codebase). Do not fabricate an API and hope it's real.

---

## 3. Stop Overbuilding — Do the Smallest Correct Thing

This is the single most important rule in this file.

**Rules:**
- Build **only** what was asked for. Not the "better version" you think they'll want later.
- Do not add extra configuration options, extra abstraction layers, extra flexibility, or extra features "while you're at it" unless explicitly requested.
- Do not introduce a new library, framework, or pattern to solve a problem that existing code already handles adequately.
- Do not refactor unrelated code in the same task. If you notice something else that looks wrong, **mention it separately** — don't fix it silently as a drive-by change.
- Prefer editing existing files over creating new ones, unless the project structure (per `Rules.md`) clearly calls for a new file.
- A 20-line fix should be ~20 lines. If your fix for a small bug touches 10 files, stop and reconsider — you have probably misunderstood the problem or are overengineering the solution.

**Test before writing code:** "Is this the smallest change that correctly solves exactly what was asked?" If no, cut it down.

---

## 4. No Silent Rewrites

- Never rewrite a working function/file "for cleanliness" unless explicitly asked to refactor.
- Never change formatting, naming, or code style in files/lines you weren't asked to touch — this creates noisy diffs that hide the actual change.
- If a change requires touching a shared/critical file, call that out explicitly before or while doing it — don't bury a risky change inside a routine task.
- Preserve existing comments, log statements, and structure unless they are directly related to the task or clearly incorrect.

---

## 5. Verify Before Saying "Done"

**This is the rule most agents break.** An agent must never report a task as complete without actually verifying it.

Before saying anything like "Done," "This should work," or "Fixed it," the agent MUST:

1. **Re-read the changed file(s)** after editing to confirm the change is actually in place and syntactically correct.
2. **Run the code** where possible (tests, linter, build, or the actual script/endpoint) rather than assuming it works from reading it.
3. **Check for the specific outcome the user asked for** — not just "no errors thrown," but "does this actually do the thing that was requested."
4. **Check for obvious side effects** — did this change break an adjacent feature, an import, a type, a route?
5. If verification is not possible in the current environment (e.g., no way to run the frontend), the agent must **say so explicitly** — "I made this change but could not run it to verify; here's what to check manually" — instead of implying it was tested.

**Never say "this should work" as a substitute for actually checking that it works.** If you didn't run it, say you didn't run it.

---

## 6. Be Honest About Uncertainty and Limitations

- If you are not fully confident a fix addresses the root cause (vs. a symptom), say so.
- If you had to make a judgment call, state it plainly instead of hiding it inside the explanation.
- If a task is bigger than it looked, or you hit something you don't have enough information to solve correctly, stop and flag it — don't force a fragile fix just to appear finished.
- It is always better to say "I fixed X, but I'm not certain about Y — can you confirm?" than to claim full success and be wrong.

---

## 7. Minimal, Honest Communication

When reporting back to the user, the agent should:
- State clearly and briefly **what was changed** and **where** (file names, functions)
- State **what was verified** and how (ran tests? ran the app? read the output?)
- State **what was NOT verified**, if anything
- Avoid inflating small changes with long explanations, and avoid shrinking large/risky changes into a one-liner
- Never claim a feature is "production-ready," "fully tested," or "complete" unless that is literally true and verified

---

## 8. Scope Discipline Checklist (Run This Mentally Before Every Change)

Before submitting any code change, the agent must be able to answer **yes** to all of these:

- [ ] Did I read the actual current code before changing it?
- [ ] Does this change do exactly what was asked — no more, no less?
- [ ] Did I avoid touching files/lines unrelated to the task?
- [ ] Did I avoid introducing new dependencies/patterns unless necessary?
- [ ] Did I follow the existing conventions in `Rules.md` / `Architecture.md`?
- [ ] Did I actually verify this works (ran it, tested it, or re-read it carefully) rather than assuming?
- [ ] If I made an assumption, did I state it out loud instead of hiding it?
- [ ] Is my summary to the user accurate about what was and wasn't verified?

If any answer is "no," go back and fix that before calling the task done.

---

## 9. Specific Anti-Patterns to Avoid (Examples)

| ❌ Don't do this | ✅ Do this instead |
|---|---|
| User asks to fix a typo in a button label → agent also refactors the whole component | Fix only the typo |
| User asks for a bug fix → agent adds a new config system "for flexibility" | Fix the bug with the minimal necessary change |
| Agent assumes a library function exists and writes code against it | Check the actual package/docs/codebase first |
| Agent says "Fixed!" without running the code | Run it (or state clearly that it wasn't run and why) |
| Agent silently renames variables across the file while fixing one line | Touch only what's needed for the fix |
| Ambiguous request → agent picks the most feature-rich interpretation | Pick the minimal interpretation, state the assumption, ask if wrong |
| Agent claims a feature is "fully tested" after writing it | Only claim tested if tests were actually run and passed |

---

## 10. When In Doubt

If you are ever unsure whether to:
- Ask a question vs. proceed → **lean toward asking**, if the cost of a wrong guess is high
- Build more vs. build less → **always build less**
- Claim it works vs. verify it works → **always verify, or say you couldn't**
- Touch more files vs. fewer files → **always touch fewer**

**Confidence without verification is the root cause of almost every AI coding mistake. This file exists to remove that confidence and replace it with checking.**

---

*This file applies to every AI agent working in this repository, for every task, every time — not just for complex features. Small tasks deserve the same discipline as large ones.*

*End of Document*
