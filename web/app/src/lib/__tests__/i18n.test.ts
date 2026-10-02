import { beforeAll, describe, expect, it } from 'vitest';
import {
  loadUiCatalog,
  resolveUiLanguage,
  setUiLanguageForTesting,
  t,
  tc,
  translate,
} from '@/lib/i18n';
import es from '@/lib/i18n/es.json';
import ptBR from '@/lib/i18n/pt-BR.json';

beforeAll(async () => {
  await loadUiCatalog('es');
  await loadUiCatalog('pt-BR');
});

const placeholders = (s: string): string[] => (s.match(/\{\w+\}/g) ?? []).sort();

describe('resolveUiLanguage', () => {
  it('honors an explicit preference over the browser language', () => {
    expect(resolveUiLanguage('es', ['en-US'])).toBe('es');
    expect(resolveUiLanguage('en', ['es-MX'])).toBe('en');
  });

  it('follows the first supported browser language when unset', () => {
    expect(resolveUiLanguage(null, ['fr-FR', 'es-419'])).toBe('es');
    expect(resolveUiLanguage('system', ['pt-PT'])).toBe('pt-BR');
    expect(resolveUiLanguage(undefined, ['en-GB', 'es-ES'])).toBe('en');
  });

  it('falls back to English for unsupported or missing languages', () => {
    expect(resolveUiLanguage(null, ['fr-FR', 'de-DE'])).toBe('en');
    expect(resolveUiLanguage(null, [])).toBe('en');
  });
});

describe('translate', () => {
  it('returns English unchanged and falls back to it for missing keys', () => {
    expect(translate('en', 'Settings')).toBe('Settings');
    expect(translate('es', 'A string nobody translated')).toBe('A string nobody translated');
  });

  it('looks up the loaded catalogs and fills placeholders', () => {
    expect(translate('es', 'Search memories...')).toBe(es['Search memories...']);
    expect(translate('pt-BR', '{count} conversations', { count: 3 })).toBe('3 conversas');
  });

  it('tc uses a context-specific entry only when one exists', () => {
    setUiLanguageForTesting('es');
    expect(tc('no-such-context', 'Open')).toBe('Open');
    expect(t('Search memories...')).toBe(es['Search memories...']);
    setUiLanguageForTesting('en');
  });
});

describe.each([
  ['Spanish', es],
  ['Brazilian Portuguese', ptBR],
])('%s catalog', (_name, catalog) => {
  it('has a non-empty translation with the same placeholders for every key', () => {
    for (const [key, value] of Object.entries(catalog as Record<string, string>)) {
      expect(value.trim(), key).not.toBe('');
      expect(placeholders(value), key).toEqual(placeholders(key.split('|').pop() ?? key));
    }
  });

  it('covers the same keys as the Spanish catalog', () => {
    expect(Object.keys(catalog).sort()).toEqual(Object.keys(es).sort());
  });
});
