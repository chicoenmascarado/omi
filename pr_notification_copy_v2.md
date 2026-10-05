## What changed and why

Part of #20379. A few push notifications were fixed English strings whatever the account language: the task added / task completed titles, the silent-user nudge (and its "there" fallback name), and the fair-use notices. The notifications that are LLM-generated already follow the account language; these did not.

- New `backend/utils/notification_copy.py`: en / es / pt-BR copy keyed by message, with English as the fallback. The English values are byte-identical to the previous hard-coded text.
- `utils/notifications.py` (task added / completed, silent user), `utils/fair_use.py` and `generate_silent_user_notification(name, language='en')` use it.
- `user_copy_language(uid)` reads the stored language preference with a lazy import and returns English on any failure, so a lookup problem never blocks or changes a notification, and importing these modules does not require `database.users`. Unknown languages get the English copy.

## Product invariants affected

none

## How it was verified

- `pytest backend/tests/unit/test_notification_copy.py backend/tests/unit/test_notification_async_boundaries.py`: 15 passed. `test_notification_async_boundaries.py` stubs `generate_silent_user_notification`; the stub now accepts the new `language` argument.
- The other notification, fair-use, credit-limit and goal suites pass file by file. Running them all in one pytest session shows the same 10 failures and 18 errors on unmodified `main` (cross-file test pollution), and this branch adds only passing tests to that run (568 passed vs 558).
- `black -l 120 -S --check` on the changed files: unchanged.
- `python3 .github/scripts/pr_preflight.py --lane local --base upstream/main`: all checks pass except `backend-route-policy-baseline`, which cannot download its `tiktoken` encoding behind this environment's proxy (`403` on `openaipublic.blob.core.windows.net`); it does not read the changed files and runs in CI.
- **Not verified:** a real push to a Spanish-language device.

## Tests

`test_notification_copy.py`: the English copy is unchanged, es / pt-BR copy and the `case_ref` formatting, English fallback for unknown and unset languages, and a failing preference lookup returning English without raising. `test_notification_async_boundaries.py`: stub updated for the new signature.

## Failure class (fixes)

Failure-Class: none
