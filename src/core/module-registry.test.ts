import { describe, expect, it } from 'vitest';
import { TinyManagerModuleRegistry } from './module-registry';
import type { TinyManagerModuleManifest, TinyManagerStorage } from './types';

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
    return Object.fromEntries(this.data);
  }

  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) this.data.set(key, value);
  }
}

const moduleManifest: TinyManagerModuleManifest = {
  id: 'tiny-test',
  version: '0.1.0',
  name: { fa: 'تست', en: 'Test' },
  description: { fa: 'ماژول تست', en: 'Test module' },
  icon: 'Puzzle',
  route: '/modules/test',
  repository: 'https://github.com/example/tiny-test',
  category: 'planning',
  maturity: 'alpha',
  capabilities: {
    dashboardWidget: false,
    globalSearch: false,
    exportData: false,
    sharedPeople: false,
    sharedProjects: false,
    notifications: false,
  },
};

describe('TinyManagerModuleRegistry', () => {
  it('persists enabled modules and hydrates them again', async () => {
    const storage = new MemoryStorage();
    const first = new TinyManagerModuleRegistry([moduleManifest], storage);

    await first.setEnabled('tiny-test', true);
    expect(first.isEnabled('tiny-test')).toBe(true);

    const second = new TinyManagerModuleRegistry([moduleManifest], storage);
    await second.hydrate();

    expect(second.listEnabled().map((module) => module.id)).toEqual(['tiny-test']);
  });

  it('rejects unknown module ids', async () => {
    const storage = new MemoryStorage();
    const registry = new TinyManagerModuleRegistry([moduleManifest], storage);

    await expect(registry.setEnabled('missing-module', true)).rejects.toThrow(
      'Unknown TinyManager module',
    );
  });
});
