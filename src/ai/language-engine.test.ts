import { describe, expect, it } from 'vitest';
import type { TinyManagerStorage } from '../core/types';
import {
  TinyLanguageRepository,
  TINY_LANGUAGE_STORAGE_KEY,
  tinyLanguageMatches,
} from './language-engine';

class MemoryStorage implements TinyManagerStorage {
  private readonly data = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.data.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }

  async keys(prefix = ''): Promise<string[]> {
    return [...this.data.keys()].filter((key) => key.startsWith(prefix)).sort();
  }

  async exportAll(): Promise<Record<string, unknown>> {
    return Object.fromEntries(this.data.entries());
  }

  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) this.data.set(key, value);
  }
}

describe('Tiny Language Engine', () => {
  it('matches only defined built-in concepts', () => {
    expect(tinyLanguageMatches('پروژه جدید ایجاد کن', 'entity.project', 'fa')).toBe(true);
    expect(tinyLanguageMatches('پروژه جدید ایجاد کن', 'action.create', 'fa')).toBe(true);
    expect(tinyLanguageMatches('پروژه جدید راه بینداز', 'action.create', 'fa')).toBe(false);
  });

  it('persists and uses a custom Persian alias', async () => {
    const storage = new MemoryStorage();
    const repository = new TinyLanguageRepository(storage);
    await repository.addAlias({ conceptId: 'action.create', locale: 'fa', phrase: 'راه بینداز' });

    const lexicon = await repository.load();
    expect(tinyLanguageMatches('پروژه جدید راه بینداز', 'action.create', 'fa', lexicon)).toBe(true);
    expect(await storage.get(TINY_LANGUAGE_STORAGE_KEY)).not.toBeNull();
  });

  it('keeps Persian and English aliases scoped to their language', async () => {
    const storage = new MemoryStorage();
    const repository = new TinyLanguageRepository(storage);
    await repository.addAlias({ conceptId: 'action.open', locale: 'en', phrase: 'launch' });

    const lexicon = await repository.load();
    expect(tinyLanguageMatches('launch risk', 'action.open', 'en', lexicon)).toBe(true);
    expect(tinyLanguageMatches('launch risk', 'action.open', 'fa', lexicon)).toBe(false);
  });

  it('normalizes common Arabic/Persian letter variants in aliases', async () => {
    const storage = new MemoryStorage();
    const repository = new TinyLanguageRepository(storage);
    await repository.addAlias({ conceptId: 'system.confirm', locale: 'fa', phrase: 'قطعی کن' });
    const lexicon = await repository.load();

    expect(tinyLanguageMatches('قطعي كن', 'system.confirm', 'fa', lexicon)).toBe(true);
  });
});
