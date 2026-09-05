import { describe, expect, it } from 'vitest';
import type { TinyManagerStorage } from '../core/types';
import { TinyAssistantOrchestrator } from './orchestrator';

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

describe('Tiny AI orchestrator', () => {
  it('does not write a project before confirmation', async () => {
    const storage = new MemoryStorage();
    const assistant = new TinyAssistantOrchestrator(storage);

    const first = await assistant.submit('پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن', 'fa', null);
    expect(first.kind).toBe('confirmation');
    expect(first.draft?.phase).toBe('confirming');
    expect(await storage.get('core.projects.v1')).toBeNull();

    const confirmed = await assistant.submit('تأیید', 'fa', first.draft);
    expect(confirmed.kind).toBe('success');
    const projects = await storage.get<Array<{ name: string; budgetAmount: number }>>('core.projects.v1');
    expect(projects?.[0]?.name).toBe('نمایشگاه');
    expect(projects?.[0]?.budgetAmount).toBe(300_000_000);
  });

  it('asks only for the missing project amount and then confirms', async () => {
    const storage = new MemoryStorage();
    const assistant = new TinyAssistantOrchestrator(storage);

    const first = await assistant.submit('پروژه انبار جدید ایجاد کن', 'fa', null);
    expect(first.kind).toBe('question');
    expect(first.draft?.missingFieldIds).toContain('budgetAmount');

    const second = await assistant.submit('۵۰۰ میلیون', 'fa', first.draft);
    expect(second.kind).toBe('confirmation');
    expect(second.draft?.values.budgetAmount).toBe(500_000_000);
  });

  it('returns a meeting calculation immediately because it is read-only', async () => {
    const assistant = new TinyAssistantOrchestrator(new MemoryStorage());
    const reply = await assistant.submit(
      'جلسه ۸ نفره ۹۰ دقیقه با هزینه ساعتی ۵۰۰ هزار تومان چقدر هزینه دارد؟',
      'fa',
      null,
    );
    expect(reply.kind).toBe('success');
    expect(reply.draft).toBeNull();
    expect(reply.text).toContain('۶٬۰۰۰٬۰۰۰');
  });

  it('does not write a Waiting For item before confirmation', async () => {
    const storage = new MemoryStorage();
    const assistant = new TinyAssistantOrchestrator(storage);

    const first = await assistant.submit('منتظر لیست قیمت از علی هستم', 'fa', null);
    expect(first.kind).toBe('confirmation');
    expect(await storage.get('module.tiny-waiting.items')).toBeNull();

    const confirmed = await assistant.submit('تأیید', 'fa', first.draft);
    expect(confirmed.kind).toBe('success');
    const items = await storage.get<Array<{ subject: string; waitingOn: string }>>('module.tiny-waiting.items');
    expect(items?.[0]?.subject).toBe('لیست قیمت');
    expect(items?.[0]?.waitingOn).toBe('علی');
  });

  it('asks only for the missing Waiting For person', async () => {
    const assistant = new TinyAssistantOrchestrator(new MemoryStorage());
    const first = await assistant.submit('منتظر لیست قیمت هستم', 'fa', null);
    expect(first.kind).toBe('question');
    expect(first.draft?.missingFieldIds).toEqual(['waitingOn']);

    const second = await assistant.submit('علی', 'fa', first.draft);
    expect(second.kind).toBe('confirmation');
    expect(second.draft?.values.waitingOn).toBe('علی');
  });

  it('cancels without writing', async () => {
    const storage = new MemoryStorage();
    const assistant = new TinyAssistantOrchestrator(storage);
    const first = await assistant.submit('Create project Expo with budget 100000 USD', 'en', null);
    const cancelled = await assistant.submit('cancel', 'en', first.draft);
    expect(cancelled.draft).toBeNull();
    expect(await storage.get('core.projects.v1')).toBeNull();
  });
});
