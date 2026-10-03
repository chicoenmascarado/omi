Screenshots of the Windows/Linux app and the web app with the Spanish catalogs from [fork PR #3](https://github.com/chicoenmascarado/omi/pull/3) and [fork PR #11](https://github.com/chicoenmascarado/omi/pull/11). The language follows the system by default and can be changed under Settings → App language.

<!-- arrastra aquí omi-es-collage.png -->

Two small fixes from this work are already rebased on current `main` and pass `make preflight` and `scripts/pr-preflight`. I'll open them as separate PRs unless you'd prefer otherwise:

- **#19246**: the memory graph labels the user's own node with a hardcoded English "Me" in every locale. It now falls back to the existing localized `you` string. Includes tests.
- **Dropped translation placeholders**: 62 strings in da/de/fi/hi/id/sk/vi omit a value the English string shows (e.g. Danish "Estimeret tid" with no ETA). Restored, and `scripts/l10n.py check` now rejects a dropped placeholder. The check runs as a manifest check, and the PR declares a new failure class, `FC-translation-drops-placeholder`.
