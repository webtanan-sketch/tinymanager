import { describe, expect, it } from 'vitest';
import type { TinyManagerStorage } from '../core/types';
import { TINY_LANGUAGE_STORAGE_KEY } from './language-engine';
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

  it('teaches a new controlled alias only after confirmation and then uses it', async () => {
    const storage = new MemoryStorage();
    const assistant = new TinyAssistantOrchestrator(storage);

    const unknown = await assistant.submit('پروژه انبار با بودجه ۲۰۰ میلیون راه بینداز', 'fa', null);
    expect(unknown.kind).toBe('question');
    expect(unknown.draft).toBeNull();

    const teach = await assistant.submit('برای «ایجاد» واژه «راه بینداز» را اضافه کن', 'fa', null);
    expect(teach.kind).toBe('confirmation');
    expect(await storage.get(TINY_LANGUAGE_STORAGE_KEY)).toBeNull();

    const saved = await assistant.submit('تأیید', 'fa', teach.draft);
    expect(saved.kind).toBe('success');
    expect(await storage.get(TINY_LANGUAGE_STORAGE_KEY)).not.toBeNull();

    const recognized = await assistant.submit('پروژه انبار با بودجه ۲۰۰ میلیون راه بینداز', 'fa', null);
    expect(recognized.kind).toBe('confirmation');
    expect(recognized.draft?.actionId).toBe('core.project.create');
  });

  it('allows confirmation vocabulary itself to be extended', async () => {
    const storage = new MemoryStorage();
    const assistant = new TinyAssistantOrchestrator(storage);

    const teach = await assistant.submit('برای «تأیید» واژه «قطعی کن» را اضافه کن', 'fa', null);
    const saved = await assistant.submit('تأیید', 'fa', teach.draft);
    expect(saved.kind).toBe('success');

    const project = await assistant.submit('پروژه دفتر با بودجه ۱۰۰ میلیون ایجاد کن', 'fa', null);
    const confirmed = await assistant.submit('قطعی کن', 'fa', project.draft);
    expect(confirmed.kind).toBe('success');
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
