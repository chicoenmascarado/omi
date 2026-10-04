Part of #20379.

## What changed and why

The backend already applies `users/{uid}.transcription_preferences.vocabulary` to every `/v4/listen` session (`listen_session_bootstrap` → STT keywords), and macOS and mobile let users edit it, but the Windows/Linux app had no control (`TranscriptionTab.tsx` listed it under "Deliberately NOT built"). Vocabulary matters most for names, brands and jargon the model mishears — especially in non-English speech.

- `lib/transcriptionVocabulary.ts`: `normalizeVocabulary` (trim, collapse spaces, locale-independent case-insensitive de-dupe, ≤100 terms as the backend caps; no per-term length cap, since neither the backend nor macOS has one), `fetchVocabulary`, `saveVocabulary` (PATCHes only `vocabulary`, then hands the saved list to the PTT keyword cache so the next PTT turn uses it).
- Settings → Transcription → **Custom vocabulary** card, copy matching macOS: add with Enter or + (a pasted comma list splits; Enter that confirms an IME composition is ignored), remove with ×, `n/100` counter with a "list is full" notice at 100.
- Safety: editing is disabled until the saved list loads (a failed load offers Retry), so a failed read can never overwrite the account's list with a partial one; a failed save reverts the optimistic change and toasts, but only if no newer save was made since.

## Product invariants affected

none

## How it was verified

- Rebased on current `main`. `pnpm typecheck`: clean.
- `vitest run`: 5,686 passed, 1 failed (`atomicWrite.test.ts` permission-denied case; fails the same on `main` when run as root).
- Built (`pnpm build`) and drove the real app under `xvfb-run` with Playwright and `OMI_E2E_FAKE_AUTH=1`:
  - with the API routed to return `["Omi","Callie"]`: typing `Mercadona, OpenAI` + Enter sent `PATCH {"vocabulary":["Omi","Callie","Mercadona","OpenAI"]}`, and removing Callie sent `{"vocabulary":["Omi","Mercadona","OpenAI"]}`;
  - with no backend reachable: the card shows "Couldn't load your vocabulary" and no input.
- **Not verified:** that a real transcription session picks up the terms (backend path unchanged).
- Review follow-up: `pnpm typecheck` clean, `eslint` clean on changed files, `vitest run`: 5,695 passed, 1 failed (`atomicWrite.test.ts`, root-only, same on `main`). The new cases fail on the previous code.

## Tests

- `transcriptionVocabulary.test.ts`: normalization (backend cap, long terms kept, locale-independent de-dupe), comma parsing, fetch/save wire shape, and the PTT cache updated only after the backend accepted the save.
- `TranscriptionTab.test.tsx`: load + add via Enter, remove, no save after a failed load, revert after a failed save, a failed earlier save not undoing a newer one, IME Enter, the full-list notice, and Retry after a failed load.
- `ptt/userVocabulary.test.ts`: a save from Settings is served on the next PTT turn, wins over an in-flight fetch, and does nothing while signed out.

## Failure class (fixes)

Failure-Class: none
