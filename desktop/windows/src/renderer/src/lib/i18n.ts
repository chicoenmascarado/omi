// UI translation. Catalogs are keyed by the English source text (the same convention
// as the macOS Localizable.strings), so untranslated strings fall back to English and
// a string is translated by adding one entry — no key naming scheme to maintain.
//
// The language is resolved once per window at module load: the `uiLanguage`
// preference, or the OS language when it is 'system' (the default). Changing it
// reloads every window that called installUiLanguageReload(), so `t()` can stay a
// plain function instead of a hook threaded through every component.
import { getPreferences, onPreferencesChange, type UiLanguagePreference } from './preferences'
import es from './i18n/es.json'

export type UiLanguage = 'en' | 'es'

export const UI_LANGUAGES: { code: UiLanguagePreference; label: string }[] = [
  { code: 'system', label: 'System default' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' }
]

const catalogs: Record<Exclude<UiLanguage, 'en'>, Record<string, string>> = { es }

export function resolveUiLanguage(
  preference: UiLanguagePreference | undefined,
  systemLanguages: readonly string[]
): UiLanguage {
  if (preference === 'en' || preference === 'es') return preference
  for (const tag of systemLanguages) {
    const base = tag.split(/[-_]/)[0]?.toLowerCase()
    if (base === 'es') return 'es'
    if (base === 'en') return 'en'
  }
  return 'en'
}

function systemLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

// Never let a translation lookup break startup: an unreadable preference means 'system'.
function preferredUiLanguage(): UiLanguagePreference | undefined {
  try {
    return getPreferences().uiLanguage
  } catch {
    return undefined
  }
}

let current: UiLanguage = resolveUiLanguage(preferredUiLanguage(), systemLanguages())

export function uiLanguage(): UiLanguage {
  return current
}

// Test seam: switch the active catalog without a window reload.
export function setUiLanguageForTesting(language: UiLanguage): void {
  current = language
}

export function translate(
  language: UiLanguage,
  text: string,
  vars?: Record<string, unknown>
): string {
  const translated = language === 'en' ? text : (catalogs[language][text] ?? text)
  if (!vars) return translated
  return translated.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  )
}

/** Locale for Intl/Date formatting: the chosen UI language, or the OS default in English. */
export function uiLocale(): string | undefined {
  return current === 'en' ? undefined : current
}

/**
 * Compact "time ago" label ("just now", "5m ago", "3h ago", "2d ago") for an elapsed
 * duration in ms. `seconds` adds "12s ago" under a minute (Rewind's precision).
 */
export function timeAgo(ms: number, opts?: { seconds?: boolean }): string {
  const secs = Math.floor(Math.max(0, ms) / 1000)
  if (opts?.seconds && secs >= 5 && secs < 60) return t('{count}s ago', { count: secs })
  const mins = Math.floor(secs / 60)
  if (mins < 1) return t('just now')
  if (mins < 60) return t('{count}m ago', { count: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('{count}h ago', { count: hours })
  return t('{count}d ago', { count: Math.floor(hours / 24) })
}

/** Translate English UI text. `{name}` placeholders are filled from `vars`. */
export function t(text: string, vars?: Record<string, unknown>): string {
  return translate(current, text, vars)
}

/**
 * Translate a short English word whose meaning depends on where it appears
 * ("Open" the button vs "Open" the task filter). The catalog key is
 * `context|text`; English and missing entries show `text`.
 */
export function tc(context: string, text: string, vars?: Record<string, unknown>): string {
  const key = `${context}|${text}`
  const hasEntry = current !== 'en' && key in catalogs[current]
  return hasEntry ? translate(current, key, vars) : translate('en', text, vars)
}

/** Reload this window when the resolved UI language changes (in any window). */
export function installUiLanguageReload(): () => void {
  return onPreferencesChange((prefs) => {
    if (resolveUiLanguage(prefs.uiLanguage, systemLanguages()) !== current) {
      window.location.reload()
    }
  })
}
