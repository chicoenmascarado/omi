# macOS app localization

Translation tables for the Omi macOS app. The app is currently English-only; this folder
holds work-in-progress translations that are **not yet wired into the build**.

## Layout

- `es.lproj/Localizable.strings` — Spanish. Keys are the English SwiftUI string literals
  from `Desktop/Sources` (SwiftUI looks up `Text("Save")` by the key `"Save"`).

These files deliberately live outside `Desktop/Sources/Resources`: SwiftPM rejects a
`.lproj` resource unless `Package.swift` declares `defaultLocalization`, and resources
processed by SwiftPM land in the nested `Omi Computer_Omi Computer.bundle`, which SwiftUI
does not consult for `Text("…")` lookups (those use `Bundle.main`).

## Checking coverage

```bash
scripts/l10n/extract_strings.py            # literal keys missing from es.lproj
scripts/l10n/extract_strings.py --json     # all keys with source locations
```

## Remaining work

1. **Wiring** (needs a Mac to verify): copy `Localization/*.lproj` into
   `Omi.app/Contents/Resources/` in `run.sh` and the Codemagic release build, and add
   `CFBundleLocalizations` (`en`, `es`) to `Desktop/Info.plist`.
2. **Interpolated strings** (~136): `Text("\(count) tasks")` becomes a format key such as
   `"%lld tasks"`; the specifier depends on the interpolated type, so these need
   per-call-site review.
3. **Non-literal strings**: text built as `String` values (view models, enums, alerts) is
   not localized by SwiftUI automatically and needs `String(localized:)`.

## Spanish style guide

- Informal *tú*, neutral Spanish understandable in Spain and Latin America.
- Product and feature names stay in English: Omi, Omi Pro, Rewind, Operator, Omi Type,
  Marketplace, Claude, ChatGPT, Gmail, Google Calendar, MCP.
- Glossary: memory → recuerdo, task → tarea, conversation → conversación,
  insight → idea, skill → habilidad, settings → ajustes, floating bar → barra flotante,
  push to talk → pulsar para hablar, Ask Omi → Pregunta a Omi, transcript → transcripción,
  upgrade → mejorar, retry / try again → reintentar.
- Keep macOS system names as Apple localizes them: Ajustes del Sistema, Finder,
  Vista rápida, Grabación de pantalla, Accesibilidad.
