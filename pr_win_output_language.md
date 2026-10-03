## What changed and why

Part of #20379. Only Insight appended a language directive, so tasks, memories, focus messages, and suggested goals were always generated in English for non-English accounts.

- New `assistants/core/outputLanguage.ts`: the cached `/v1/users/language` lookup (moved from `insight/context.ts`, behavior unchanged), `outputLanguageInstruction(code)`, and `withOutputLanguage(prompt)`, which never throws.
- Applied to Tasks, Memory, Focus, Goals (suggestions), and Insight. English, `multi`, signed-out, and failed lookups leave prompts byte-identical.
- Same instruction wording the backend uses for its own language-aware prompts.

## Product invariants affected

none

## How it was verified

- Rebased on current `main`; Goals keeps the new `geminiProxyFetch` lane call and only swaps in the language-aware system prompt.
- `pnpm typecheck`: clean.
- `vitest run`: 5,681 passed, 1 failed (`atomicWrite.test.ts` permission-denied case; fails the same on `main` when run as root).
- **Not verified:** a live extraction run against a Spanish account (needs a signed-in session and Gemini).

## Tests

`core/outputLanguage.test.ts`: instruction text for es / pt-BR / unknown codes, null for en / en-GB / multi / empty, prompt unchanged for English / signed-out / failed lookups, 1h cache and retry after failure. `insightAssistant.test.ts` mock updated for the moved lookup.
