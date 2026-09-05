import type { TinyLocale, TinyManagerStorage } from '../core/types';

export type TinyAssistantValue = string | number | boolean | null;

export interface TinyAssistantFieldDefinition {
  id: string;
  label: { fa: string; en: string };
  required: boolean;
  type: 'text' | 'number' | 'currency' | 'module';
}

export interface TinyAssistantActionDefinition {
  id: string;
  moduleId: string | 'core';
  title: { fa: string; en: string };
  description: { fa: string; en: string };
  fields: TinyAssistantFieldDefinition[];
  execute(values: Record<string, TinyAssistantValue>, context: TinyAssistantExecutionContext): Promise<TinyAssistantExecutionResult>;
}

export interface TinyAssistantExecutionContext {
  locale: TinyLocale;
  storage: TinyManagerStorage;
}

export interface TinyAssistantExecutionResult {
  ok: boolean;
  message: { fa: string; en: string };
  entityId?: string;
  route?: string;
}

export interface TinyAssistantInterpretation {
  actionId: string | null;
  confidence: number;
  values: Record<string, TinyAssistantValue>;
  source: 'provider' | 'local';
  reason?: string;
}

export interface TinyAssistantDraft {
  actionId: string;
  values: Record<string, TinyAssistantValue>;
  missingFieldIds: string[];
  phase: 'collecting' | 'confirming';
}

export interface TinyAssistantProviderInput {
  text: string;
  locale: TinyLocale;
  actions: Array<{
    id: string;
    moduleId: string;
    title: { fa: string; en: string };
    fields: TinyAssistantFieldDefinition[];
  }>;
}

export interface TinyAssistantProvider {
  id: string;
  interpret(input: TinyAssistantProviderInput): Promise<TinyAssistantInterpretation | null>;
}

export interface TinyAssistantTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  kind?: 'message' | 'question' | 'confirmation' | 'success' | 'error';
}
