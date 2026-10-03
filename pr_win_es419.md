Part of #20379.

## What changed and why

The backend (`utils/user_language.py`, streaming STT) and the macOS language list already support `es-419`, but the Windows/Linux app only offered generic Spanish. Adds **Spanish (Latin America)** to `lib/languages.ts` (Settings → Transcription and onboarding share it) plus aliases (`español latino`, `Latin American Spanish`, …), so an account set to `es-419` elsewhere shows correctly on Windows.

## Product invariants affected

none

## How it was verified

- Rebased on current `main`. `pnpm typecheck`: clean. `vitest run`: 5,677 passed, 1 failed (`atomicWrite.test.ts` permission-denied case, which cannot fail as intended when the suite runs as root; unrelated).
- **Not verified:** a live transcription session with `es-419`.

## Tests

`languages.test.ts`: `es-419`, its label and aliases resolve to `es-419`; plain "Spanish" still resolves to `es`.
