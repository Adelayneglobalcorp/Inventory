import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import i18n from '@/lib/i18n';

type TranslationTree = { [key: string]: TranslationTree | string };

function flattenedKeys(value: TranslationTree, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? prefix + '.' + key : key;
    return typeof child === 'string' ? [path] : flattenedKeys(child, path);
  });
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const full = join(dir, item.name);
    if (item.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(item.name) && !/\.test\.|\.spec\./.test(item.name) ? [full] : [];
  });
}

describe('complete bilingual interface', () => {
  const english = i18n.getResourceBundle('en', 'translation') as TranslationTree;
  const spanish = i18n.getResourceBundle('es', 'translation') as TranslationTree;

  it('provides the same translation keys in English and Spanish', () => {
    expect(flattenedKeys(spanish).sort()).toEqual(flattenedKeys(english).sort());
  });

  it('resolves every statically referenced dotted translation key', () => {
    const englishKeys = new Set(flattenedKeys(english));
    const spanishKeys = new Set(flattenedKeys(spanish));
    const missing: string[] = [];

    for (const file of sourceFiles(join(process.cwd(), 'src'))) {
      const content = readFileSync(file, 'utf8');
      const matches = content.matchAll(/\bt\(\s*['"`]([a-zA-Z][\w-]+(?:\.[\w-]+)+)['"`]/g);
      for (const match of matches) {
        const key = match[1];
        if (!englishKeys.has(key) || !spanishKeys.has(key)) {
          missing.push(file.replace(process.cwd(), '') + ': ' + key);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('never falls back to English in the Spanish financing form', () => {
    const finance = readFileSync(join(process.cwd(), 'src/pages/Financing.tsx'), 'utf8');
    const required = [
      'financing.inventoryProperty',
      'financing.manualProperty',
      'financing.searchProperty',
      'financing.chooseProperty',
      'financing.inventoryUnavailable',
      'financing.autoFillHint',
    ];
    for (const key of required) {
      expect(finance).toContain("t('" + key + "')");
      expect(i18n.exists(key, { lng: 'es' })).toBe(true);
      expect(i18n.exists(key, { lng: 'en' })).toBe(true);
    }
    expect(finance).not.toMatch(/defaultValue:\s*['"`](?:Select|Enter|Search|Choose|Inventory|Selecting)/);
  });
});
