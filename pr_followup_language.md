## What changed and why

Part of #20379. `produce_followup` (`backend/utils/proactivity_producers.py`) phrased the due-task follow-up with a fixed English prompt, so the feed card for a non-English account came out in English. The mentor in the same module already adds the account's language to its prompt (`legacy.language_instruction(...)`).

This adds the same validated instruction to the follow-up prompt, after the task data. English (`en`, `en-GB`, …), an unset language and a failed preference read add nothing, so the follow-up is written exactly as before and never blocks on the lookup. The language comes from `integration.get_user_language_preference`, read on the DB executor like the mentor's context.

## Product invariants affected

none

## How it was verified

- `pytest backend/tests/unit/test_proactivity_v2_producers.py`: 70 passed.
- The new Spanish case fails on the previous code (1 failed, 15 passed for the follow-up selection); the English, unset and failed-lookup cases pass both before and after, as intended.
- `black -l 120 -S --check` on both files: unchanged.
- `python3 .github/scripts/pr_preflight.py --lane local --base upstream/main`: all checks pass.
- **Not verified:** a live follow-up against a Spanish account (needs the proactivity feed and the model).

## Tests

`test_proactivity_v2_producers.py`: the prompt carries the instruction for `es`; it carries none for `en`, `en-GB` or an unset language; a failing preference lookup is fail-open and the follow-up is still published. The `lane` fixture now stubs the preference lookup so existing follow-up tests do not touch Firestore.

## Failure class (fixes)

Failure-Class: none
