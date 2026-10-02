# macOS app localization

Translation tables for the Omi macOS app.

## Layout

- `es.lproj/Localizable.strings` — Spanish. Keys are the English SwiftUI string literals
  from `Desktop/Sources` (SwiftUI looks up `Text("Save")` by the key `"Save"`), plus
  format keys for interpolated text (`Text("\(n) tasks")` → `"%lld tasks"`).

## How it ships

`scripts/l10n/install-localizations.sh` copies `Localization/*.lproj` into the assembled
app's `Contents/Resources/`. `run.sh` and the Codemagic release build both call it, and
`Desktop/Info.plist` lists the languages in `CFBundleLocalizations`. macOS then shows the
app in Spanish when Spanish is the user's preferred language (System Settings → General →
Language & Region, or per app).

The tables live outside `Desktop/Sources/Resources` on purpose: SwiftPM would compile them
into the nested `Omi Computer_Omi Computer.bundle`, which SwiftUI does not consult for
`Text("…")` (it uses `Bundle.main`), and it rejects `.lproj` resources unless
`Package.swift` declares `defaultLocalization`.

## Checking coverage

```bash
scripts/l10n/extract_strings.py            # literal keys missing from es.lproj
scripts/l10n/extract_strings.py --json     # all keys with source locations
```

## Remaining work

1. **Verify on a Mac**: build with `./run.sh`, set Omi's language to Spanish in System
   Settings → General → Language & Region → Applications, and check the main window.
2. **Interpolated strings**: 62 of ~136 are translated. Format specifiers were inferred
   from each source expression; a wrong guess falls back to English, never crashes.
   Remaining ones are numeric-only, use `Date` styles, or build plurals inline
   (`"session\(n == 1 ? "" : "s")"`) and need a source change first.
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
