import { describe, expect, it } from 'vitest';
import { interpretLocally } from './local-interpreter';

describe('Tiny AI local interpreter', () => {
  it('extracts a Persian project command', () => {
    const result = interpretLocally('پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن', 'fa');
    expect(result.actionId).toBe('core.project.create');
    expect(result.values.name).toBe('نمایشگاه');
    expect(result.values.budgetAmount).toBe(300_000_000);
    expect(result.values.currency).toBe('TOMAN');
  });

  it('extracts an English project command', () => {
    const result = interpretLocally('Create project Expo with budget 250000 USD', 'en');
    expect(result.actionId).toBe('core.project.create');
    expect(result.values.name).toBe('Expo');
    expect(result.values.budgetAmount).toBe(250_000);
    expect(result.values.currency).toBe('USD');
  });

  it('recognizes a module enable command', () => {
    const result = interpretLocally('ماژول ریسک را فعال کن', 'fa');
    expect(result.actionId).toBe('core.module.enable');
    expect(result.values.moduleId).toBe('tiny-risk');
  });

  it('returns unknown for unrelated text', () => {
    expect(interpretLocally('سلام، امروز چه خبر؟', 'fa').actionId).toBeNull();
  });
});
