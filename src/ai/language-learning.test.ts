import { describe, expect, it } from 'vitest';
import { createTinyLanguageLearningPrompt } from './language-learning';
import { emptyTinyLanguageLexicon } from './language-engine';

describe('Tiny Language inline learning', () => {
  it('extracts a trailing unknown Persian action phrase', () => {
    const prompt = createTinyLanguageLearningPrompt(
      'پروژه انبار با بودجه ۲۰۰ میلیون راه بینداز',
      'fa',
      emptyTinyLanguageLexicon(),
    );
    expect(prompt.phrase).toBe('راه بینداز');
    expect(prompt.suggestedConceptIds).toContain('action.create');
  });

  it('extracts a trailing unknown English action phrase', () => {
    const prompt = createTinyLanguageLearningPrompt(
      'project warehouse with budget 200 million launch now',
      'en',
      emptyTinyLanguageLexicon(),
    );
    expect(prompt.phrase).toContain('launch');
    expect(prompt.suggestedConceptIds).toContain('action.create');
  });

  it('does not auto-assign a concept when context is insufficient', () => {
    const prompt = createTinyLanguageLearningPrompt('پیگیری ویژه', 'fa', emptyTinyLanguageLexicon());
    expect(prompt.phrase).toBe('پیگیری ویژه');
    expect(prompt.suggestedConceptIds).toEqual([]);
  });
});
