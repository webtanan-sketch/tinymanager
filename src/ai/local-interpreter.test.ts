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

  it('extracts a complete Persian meeting cost question', () => {
    const result = interpretLocally('جلسه ۸ نفره ۹۰ دقیقه با هزینه ساعتی ۵۰۰ هزار تومان چقدر هزینه دارد؟', 'fa');
    expect(result.actionId).toBe('tiny-meeting-cost.calculate');
    expect(result.values.participants).toBe(8);
    expect(result.values.durationMinutes).toBe(90);
    expect(result.values.averageHourlyCost).toBe(500_000);
    expect(result.values.currency).toBe('TOMAN');
  });

  it('extracts an English meeting cost question', () => {
    const result = interpretLocally("What's the cost of a 90 minute meeting with 8 people at $45/hour?", 'en');
    expect(result.actionId).toBe('tiny-meeting-cost.calculate');
    expect(result.values.participants).toBe(8);
    expect(result.values.durationMinutes).toBe(90);
    expect(result.values.averageHourlyCost).toBe(45);
    expect(result.values.currency).toBe('USD');
  });

  it('extracts a complete Persian Waiting For request', () => {
    const result = interpretLocally('منتظر لیست قیمت از علی هستم', 'fa');
    expect(result.actionId).toBe('tiny-waiting.create');
    expect(result.values.subject).toBe('لیست قیمت');
    expect(result.values.waitingOn).toBe('علی');
  });

  it('extracts an English Waiting For request', () => {
    const result = interpretLocally("I'm waiting for the signed contract from Sara", 'en');
    expect(result.actionId).toBe('tiny-waiting.create');
    expect(result.values.subject).toBe('the signed contract');
    expect(result.values.waitingOn).toBe('Sara');
  });

  it('keeps a partial Waiting For request for progressive completion', () => {
    const result = interpretLocally('منتظر لیست قیمت هستم', 'fa');
    expect(result.actionId).toBe('tiny-waiting.create');
    expect(result.values.subject).toBe('لیست قیمت');
    expect(result.values.waitingOn).toBeUndefined();
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
