import { describe, expect, it } from 'vitest';
import type { TinyManagerStorage } from './types';
import { ageDays, collectManagerSignals } from './manager-signals';

class MemoryStorage implements TinyManagerStorage {
  private readonly data = new Map<string, unknown>();

  constructor(seed: Record<string, unknown> = {}) {
    Object.entries(seed).forEach(([key, value]) => this.data.set(key, value));
  }

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
    Object.entries(data).forEach(([key, value]) => this.data.set(key, value));
  }
}

const nowIso = '2026-09-07T08:00:00.000Z';
const now = new Date(nowIso).getTime();

const daysFromNow = (days: number): string =>
  new Date(now + (days * 86_400_000)).toISOString();

describe('manager signals', () => {
  it('aggregates only open attention items and calculates health', async () => {
    const storage = new MemoryStorage({
      'module.tiny-delegation.items': [
        { status: 'open', dueAt: daysFromNow(-1), updatedAt: daysFromNow(-6) },
        { status: 'open', dueAt: daysFromNow(4), updatedAt: daysFromNow(0) },
        { status: 'done', dueAt: daysFromNow(-10), updatedAt: daysFromNow(-10) },
      ],
      'module.tiny-deadline.items': [
        { status: 'open', dueAt: daysFromNow(-1) },
        { status: 'open', dueAt: daysFromNow(3) },
        { status: 'done', dueAt: daysFromNow(-5) },
      ],
      'module.tiny-risk.items': [
        { status: 'open', score: 20 },
        { status: 'open', score: 12 },
        { status: 'mitigated', score: 25 },
      ],
      'module.tiny-waiting.items': [
        { status: 'open', followUpAt: daysFromNow(-1), updatedAt: daysFromNow(-6) },
        { status: 'open', followUpAt: daysFromNow(2), updatedAt: daysFromNow(0) },
        { status: 'done', followUpAt: daysFromNow(-8), updatedAt: daysFromNow(-8) },
      ],
    });

    const result = await collectManagerSignals(storage, now);

    expect(result).toMatchObject({
      openWaiting: 2,
      staleWaiting: 1,
      followUpsDue: 1,
      openDelegations: 2,
      staleDelegations: 1,
      overdueDelegations: 1,
      openDeadlines: 2,
      overdueDeadlines: 1,
      dueSoonDeadlines: 1,
      openRisks: 2,
      highRisks: 2,
      criticalRisks: 1,
      attentionTotal: 5,
      health: { score: 58, status: 'attention' },
    });
  });

  it('returns a healthy empty state and ignores invalid dates', async () => {
    const storage = new MemoryStorage({
      'module.tiny-deadline.items': [{ status: 'open', dueAt: 'not-a-date' }],
      'module.tiny-waiting.items': [{ status: 'open', followUpAt: 'bad-date' }],
    });

    const result = await collectManagerSignals(storage, now);

    expect(result.overdueDeadlines).toBe(0);
    expect(result.dueSoonDeadlines).toBe(0);
    expect(result.followUpsDue).toBe(0);
    expect(result.attentionTotal).toBe(0);
    expect(result.health).toMatchObject({ score: 100, status: 'healthy' });
  });

  it('calculates age in whole non-negative days', () => {
    expect(ageDays(daysFromNow(-5.9), now)).toBe(5);
    expect(ageDays(daysFromNow(1), now)).toBe(0);
    expect(ageDays(undefined, now)).toBe(0);
  });
});
