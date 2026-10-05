## What changed and why

Part of #20379. 24 strings in `app_es.arb` were still identical to the English source, so Spanish users saw English in the guided voice introduction (`voiceIntroduction`), the usage stats (`usageListened`, `usageBestDay`, `usagePeakHour`, …), "Mind Map", "Omi says", and the MCP / developer-key fields (`mcpServerUrl`, `clientId`, `clientSecret`, …).

They are translated with the terms the rest of the Spanish app already uses ("Todos", "Tarjeta SD", "aplicación", "Filtro VAD"). Applied with `scripts/l10n.py set`, so the generated Dart is in sync.

## Product invariants affected

none

## How it was verified

- `python3 app/scripts/l10n.py check`: `ok: 49 locales, 3673 keys`.
- `cd app && flutter gen-l10n`: no diff beyond `app_localizations_es.dart`.
- `python3 .github/scripts/pr_preflight.py --lane local --base upstream/main`: all checks pass.
- **Not verified:** the strings on a device; they are display text only and `voiceIntroduction` keeps its ICU `select` branches unchanged.

## Tests

No code changes. The `l10n.py check` step (placeholders and ICU structure for all 49 locales) covers the edited strings.

## Failure class (fixes)

Failure-Class: none
