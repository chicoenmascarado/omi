Fixes #19246.

## What

With no given name set, the knowledge graph (Memories page and the onboarding step that embeds it) labelled the user's own node with a hardcoded English `'Me'` in all 49 locales. It now falls back to the existing localized `you` string, so Spanish shows `Tú`, German `Sie`, and so on. A set given name is still used, trimmed.

The backend's English `me` / `the user` labels still identify the user node, so graph merging is unchanged. Only the displayed label changes.

## Verification

- `flutter test test/widgets/memory_graph_empty_state_test.dart`: 6 passed. Two new cases cover the localized fallback (es / de / en) and a given name.
- `flutter analyze` on both changed files: no new issues. The two remaining infos are pre-existing `shareXFiles` deprecations.
- `python3 .github/scripts/pr_preflight.py --lane local --base upstream/main`: all checks pass.

## Product invariants affected

- `INV-MEM-1`: touched only because `app/lib/pages/memories/` is under its paths. This change alters the display label of the graph's user node. It does not touch memory tiers, collections or access.

## Failure class (fixes)

Failure-Class: none

This is a pre-existing hardcoded literal. New ones in changed `app/lib` files are already rejected by the INV-UI-3 `mobile-ux-contract` ratchet, so no new class or guard is needed.
