Part of #20379.

## What

62 simple (non-plural) translations in **da, de, fi, hi, id, sk and vi** omit a placeholder that the English string renders, so those users see a label with the value missing:

| Key | English | Before (da) |
|---|---|---|
| `etaLabel` | `ETA: {time}` | `Estimeret tid` |
| `transferFailedMessage` | `Transfer failed: {error}` | `Overførsel mislykkedes. Prøv venligst igen.` |
| `updatedDate` | `Updated {date}` | `Opdateret dato` |

`flutter gen-l10n` accepts these, and nothing in CI compared placeholder sets, so they shipped.

- Restores the placeholder in all 62 strings via `scripts/l10n.py set`, so generated Dart stays in sync.
- `scripts/l10n.py check` now rejects a simple translation that drops an English placeholder. Plural/select messages are exempt because locales legitimately restructure them.
- Adds `mobile-l10n-arb-contract` to `.github/checks-manifest.yaml`, so the check runs on every ARB change instead of only when an author remembers to run it, plus hermetic fixtures (`app/scripts/test_l10n_placeholders.py`).

**Why isn't this a shared primitive instead?** It is the existing one: the rule lives in `scripts/l10n.py`, the tool every ARB edit already goes through. The manifest entry only makes CI run it.

## Verification

- `python3 app/scripts/l10n.py check` on `main`: 62 errors. On this branch: `ok: 49 locales, 3652 keys`, including the generated-Dart freshness step.
- `cd app && flutter gen-l10n && git diff --exit-code -- lib/l10n` (the `Check Flutter l10n` CI step): clean.
- `python3 app/scripts/test_l10n_placeholders.py`: 6 passed. With `l10n.py` from `main`: 1 failure, 4 errors.
- `python3 .github/scripts/pr_preflight.py --lane local --base upstream/main`: all checks pass.

## Product invariants affected

none

## Failure class (fixes)

Failure-Class: new

New class `FC-translation-drops-placeholder`.
- **Root cause:** translated ARB values were only checked for ICU syntax and for not *adding* unknown placeholders, never for *dropping* English ones.
- **Durable guard:** `scripts/l10n.py check`, wired as a manifest check with fixtures.
