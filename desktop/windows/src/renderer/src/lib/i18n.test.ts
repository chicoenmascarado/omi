import { describe, expect, it } from 'vitest'
import { resolveUiLanguage, setUiLanguageForTesting, t, tc, translate } from './i18n'
import es from './i18n/es.json'

const placeholders = (s: string): string[] => (s.match(/\{\w+\}/g) ?? []).sort()

describe('resolveUiLanguage', () => {
  it('honors an explicit preference over the OS language', () => {
    expect(resolveUiLanguage('es', ['en-US'])).toBe('es')
    expect(resolveUiLanguage('en', ['es-MX'])).toBe('en')
  })

  it('follows the first supported OS language when set to system or unset', () => {
    expect(resolveUiLanguage('system', ['es-419', 'en-US'])).toBe('es')
    expect(resolveUiLanguage(undefined, ['fr-FR', 'es_ES'])).toBe('es')
    expect(resolveUiLanguage(undefined, ['en-GB', 'es-ES'])).toBe('en')
  })

  it('falls back to English for unsupported or missing OS languages', () => {
    expect(resolveUiLanguage(undefined, ['fr-FR', 'de-DE'])).toBe('en')
    expect(resolveUiLanguage(undefined, [])).toBe('en')
  })
})

describe('translate', () => {
  it('returns the English text unchanged in English', () => {
    expect(translate('en', 'Settings')).toBe('Settings')
  })

  it('looks up Spanish and falls back to English for missing keys', () => {
    expect(translate('es', 'Settings')).toBe(es['Settings'])
    expect(translate('es', 'A string nobody translated')).toBe('A string nobody translated')
  })

  it('fills placeholders and leaves unknown ones intact', () => {
    expect(translate('en', '{count} tasks for {name}', { count: 3 })).toBe('3 tasks for {name}')
  })
})

describe('tc', () => {
  it('uses the context-specific entry and shows the plain English text otherwise', () => {
    setUiLanguageForTesting('es')
    expect(tc('task-filter', 'open')).toBe(es['task-filter|open'])
    expect(t('Open')).toBe(es['Open'])
    expect(tc('no-such-context', 'open')).toBe('open')
    setUiLanguageForTesting('en')
    expect(tc('task-filter', 'open')).toBe('open')
  })
})

describe('Spanish catalog', () => {
  it('has a non-empty translation with the same placeholders for every key', () => {
    for (const [key, value] of Object.entries(es as Record<string, string>)) {
      expect(value.trim(), key).not.toBe('')
      expect(placeholders(value), key).toEqual(placeholders(key.split('|').pop() ?? key))
    }
  })
})
