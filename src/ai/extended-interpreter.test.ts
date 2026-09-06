import { describe, expect, it } from 'vitest';
import { interpretExtended } from './extended-interpreter';
import { emptyTinyLanguageLexicon } from './language-engine';

const lexicon = emptyTinyLanguageLexicon();

describe('interpretExtended', () => {
  it('extracts a Persian delegation command', () => {
    const result = interpretExtended('پیگیری قرارداد را به علی بسپار', 'fa', lexicon);
    expect(result?.actionId).toBe('tiny-delegation.create');
    expect(result?.values.task).toBe('پیگیری قرارداد');
    expect(result?.values.assigneeName).toBe('علی');
  });

  it('extracts a Persian deadline command', () => {
    const result = interpretExtended('موعد ارسال قرارداد را برای فردا ثبت کن', 'fa', lexicon);
    expect(result?.actionId).toBe('tiny-deadline.create');
    expect(result?.values.title).toBe('ارسال قرارداد');
    expect(result?.values.datePhrase).toBe('فردا');
  });

  it('extracts risk score inputs', () => {
    const result = interpretExtended('ریسک تاخیر تامین را ثبت کن احتمال ۴ اثر ۵', 'fa', lexicon);
    expect(result?.actionId).toBe('tiny-risk.create');
    expect(result?.values.title).toBe('تاخیر تامین');
    expect(result?.values.probability).toBe(4);
    expect(result?.values.impact).toBe(5);
  });

  it('routes weekly review without mutation confirmation', () => {
    const result = interpretExtended('مرور هفتگی', 'fa', lexicon);
    expect(result?.actionId).toBe('tiny-weekly-review.generate');
  });

  it('routes project health', () => {
    const result = interpretExtended('سلامت پروژه چطوره', 'fa', lexicon);
    expect(result?.actionId).toBe('tiny-project-health.calculate');
  });
});
