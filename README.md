# Intuition — Teach Jonathan

Students teach an AI student, Jonathan, who starts with three misconceptions. Jonathan changes its mind only when the server verifies the student's exact words contain a reason plus an example. Jonathan then takes a rule-based quiz; the score is what Jonathan learned. Teachers get a live misconception heatmap.

## Architecture
- TanStack Start (React 19, Vite, Tailwind v4) — routes in `src/routes`.
- Lovable Cloud database (schema + idempotent seed in `drizzle/migrations`).
- Server functions (`src/lib/nour/api.functions.ts`) replace Edge Functions: start-session, nour-turn, hint, finish-session (quiz), dashboard, teacher session, override, create-assignment, draft/save topic.
- Jonathan's brain: Gemini via the Lovable AI Gateway (`LOVABLE_API_KEY` is managed automatically; set `GEMINI_MODEL` secret to change model, default `google/gemini-3.8-flash`). No separate `GEMINI_API_KEY` is needed.
- Rules (`src/lib/nour/rules.ts`): evidence-quote validation, locked→fixed/taught_wrong only, deterministic quiz, graded hint penalty `max(0, fixed − hinted ideas)`.

## Tests
`bunx vitest run`

## Voice
Hold-to-talk uses MediaRecorder (webm/opus on Chrome/Firefox, mp4 on Safari); audio is transcribed and judged in one AI call and never stored. Typing always works. Jonathan's voice uses browser speechSynthesis (toggle in the session header).

## Demo data and privacy
The 24 "Sample Student" records are synthetic. There is no login: role choice is only a view switch. Real school use requires authentication, class-level authorization and production privacy rules.
