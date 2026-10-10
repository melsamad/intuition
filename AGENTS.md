<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All Teach Nour data access goes through server functions in `src/lib/nour/api.functions.ts` using the admin client; tables have RLS on with no anon/authenticated grants. Why: demo has no login, so the browser must never write sessions or scores directly.
- Status transitions, evidence-quote checks, quiz answers and scoring live as pure functions in `src/lib/nour/rules.ts` with tests beside it. Why: the AI only proposes; deterministic server code decides.
- AI calls go through `src/lib/nour/ai.server.ts` (Lovable AI Gateway, Gemini model, overridable via `GEMINI_MODEL`), streamed and schema-validated. Why: keeps keys server-side and one place to handle errors.
- Assignments snapshot their misconceptions into `assignment_confusions`. Why: editing an assignment must never change the library or past sessions.
- New-topic approval passes the saved topic ID to the assignment builder via validated search; initialize its draft once and retain teacher edits during refreshes. Why: new lessons must use the selected topic rather than silently reverting to a library default.
- Teacher-written tests live in `assignments.test_questions` (jsonb, each tied to a misconception code); Jonathan's answers and the test score come from `buildTeacherTest`/`scoreTest` in rules.ts, falling back to one default question per misconception. Why: the score must follow what was taught, not the AI.
- Jonathan's voice uses ElevenLabs via the `speakAsJonathan` server function (key server-side), falling back to the browser voice on failure. Why: keeps the key private and never blocks the lesson.
- Waiting music uses a bundled instrumental audio loop and confirms the media play promise before displaying playback state. Why: avoids silent suspended synthesis contexts and false success states.
- Student explanation insertion restrictions are scoped to the journal notes field through `explanation-input.ts`. Why: prevents clipboard/drop insertion without changing teacher inputs or ordinary typing.
- Written solutions are plain text with delimited LaTeX rendered by KaTeX, persisted as a dedicated solution turn through server functions, and kept separate from drawing canvases. Why: teacher/student reviews share safe formatting without requiring schema changes or storing HTML.
- Virtual exams live in `virtual_exams`/`virtual_exam_attempts`/`virtual_exam_recordings` with files in the private `virtual-exams` bucket; browsers upload only via server-issued signed upload URLs and read via signed URLs, and deadlines/attempt limits are enforced in `virtual-exam.functions.ts` using pure rules in `virtual-exam-rules.ts`. Why: no login in the demo, so the server must own timing, limits and file access; the AI report runs only after submission and quotes are verified before being labelled evidence.
