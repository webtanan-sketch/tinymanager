import type {
  TinyAssistantInterpretation,
  TinyAssistantProvider,
  TinyAssistantProviderInput,
} from './types';

interface ProviderResponse {
  actionId?: unknown;
  confidence?: unknown;
  values?: unknown;
}

export class HttpTinyAssistantProvider implements TinyAssistantProvider {
  readonly id = 'http-ai-provider';

  constructor(private readonly endpoint: string) {}

  async interpret(input: TinyAssistantProviderInput): Promise<TinyAssistantInterpretation | null> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`Tiny AI endpoint failed with ${response.status}.`);

    const payload = await response.json() as ProviderResponse;
    if (typeof payload.actionId !== 'string' || typeof payload.confidence !== 'number') return null;
    if (!payload.values || typeof payload.values !== 'object' || Array.isArray(payload.values)) return null;

    return {
      actionId: payload.actionId,
      confidence: payload.confidence,
      values: payload.values as Record<string, string | number | boolean | null>,
      source: 'provider',
    };
  }
}

export const createConfiguredAssistantProvider = (): TinyAssistantProvider | undefined => {
  const endpoint = import.meta.env.VITE_TINY_AI_ENDPOINT as string | undefined;
  return endpoint ? new HttpTinyAssistantProvider(endpoint) : undefined;
};
