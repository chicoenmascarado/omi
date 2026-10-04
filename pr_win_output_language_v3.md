## What changed and why

Part of #20379. Tasks, memories, focus messages, and suggested goals were always generated in English, even for non-English accounts.

- New `assistants/core/outputLanguage.ts`: the `/v1/users/language` lookup (the only one in the Windows main process), `outputLanguageInstruction(code)`, and `withOutputLanguage(prompt)`, which never throws.
- The lookup is cached per session epoch (`getSessionEpoch()`, bumped by `setBackendSession`), so a new account never gets the previous one's language. A successful read is kept 1h, a failed one 60s, and concurrent assistants share one in-flight request.
- Applied to Tasks, Memory, Focus, and Goals (suggestions). English, `multi`, signed-out, and failed lookups leave prompts byte-identical.
- One shared instruction for every assistant, so they all phrase the language requirement the same way.

## Product invariants affected

none

## How it was verified

- Merged current `main` (after #20494 retired the Insight assistant); Goals keeps the new `geminiProxyFetch` lane call and only swaps in the language-aware system prompt.
- `pnpm typecheck`: clean.
- `vitest run`: 5,681 passed, 1 failed (`atomicWrite.test.ts` permission-denied case; fails the same on `main` when run as root).
- Review follow-up (df35293): `pnpm typecheck` clean, `eslint` clean on changed files, `vitest run`: 5,685 passed, 1 failed (same `atomicWrite.test.ts` root-only case). The new `getUserLanguage` cases fail on the previous code.
- After merging `main` (0626f46, plus 2f47e24 for a comment): `pnpm typecheck` clean, `eslint` and `prettier --check` clean on changed files, `vitest run`: 5,586 passed, 1 failed (same `atomicWrite.test.ts` root-only case).
- **Not verified:** a live extraction run against a Spanish account (needs a signed-in session and Gemini).

## Tests

`core/outputLanguage.test.ts`: instruction text for es / pt-BR / unknown codes, null for en / en-GB / multi / empty, prompt unchanged for English / signed-out / failed lookups, 1h cache for a successful read, 60s cache for a failed one, no reuse across a session change (including a lookup that lands after the switch), and one shared request for concurrent callers.

## Failure class (fixes)

Failure-Class: none
