import { describe, expect, it } from 'vitest';
import type { TinyManagerStorage } from './types';
import { PEOPLE_STORAGE_KEY, TinyPeopleRepository } from './people';

class MemoryStorage implements TinyManagerStorage {
  private readonly data = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> { return (this.data.get(key) as T | undefined) ?? null; }
  async set<T>(key: string, value: T): Promise<void> { this.data.set(key, value); }
  async remove(key: string): Promise<void> { this.data.delete(key); }
  async keys(prefix = ''): Promise<string[]> { return [...this.data.keys()].filter((key) => key.startsWith(prefix)); }
  async exportAll(): Promise<Record<string, unknown>> { return Object.fromEntries(this.data); }
  async importAll(data: Record<string, unknown>): Promise<void> { for (const [key, value] of Object.entries(data)) this.data.set(key, value); }
}

describe('TinyPeopleRepository', () => {
  it('creates a person with only a display name', async () => {
    const storage = new MemoryStorage();
    const people = new TinyPeopleRepository(storage);
    const person = await people.create({ displayName: 'علی رضایی' });
    expect(person.displayName).toBe('علی رضایی');
    expect((await storage.get<unknown[]>(PEOPLE_STORAGE_KEY))?.length).toBe(1);
  });

  it('resolves Persian Arabic character variants as the same person', async () => {
    const people = new TinyPeopleRepository(new MemoryStorage());
    const first = await people.create({ displayName: 'علي كريمي' });
    const second = await people.resolveOrCreate('علی کریمی');
    expect(second.id).toBe(first.id);
    expect((await people.list()).length).toBe(1);
  });

  it('does not duplicate an existing name', async () => {
    const people = new TinyPeopleRepository(new MemoryStorage());
    const first = await people.resolveOrCreate('Sara Ahmadi');
    const second = await people.resolveOrCreate('  sara   ahmadi ');
    expect(second.id).toBe(first.id);
    expect((await people.list()).length).toBe(1);
  });
});
