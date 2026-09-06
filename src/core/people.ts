import type { TinyManagerStorage } from './types';

export const PEOPLE_STORAGE_KEY = 'core.people.v1';

export interface TinyPerson {
  id: string;
  displayName: string;
  aliases?: string[];
  email?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTinyPersonInput {
  displayName: string;
  aliases?: string[];
  email?: string;
  role?: string;
}

export interface TinyPersonResolution {
  person: TinyPerson | null;
  ambiguous: TinyPerson[];
}

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const normalizePersonName = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک');

const namesOf = (person: TinyPerson): string[] => [person.displayName, ...(person.aliases ?? [])];

export class TinyPeopleRepository {
  constructor(private readonly storage: TinyManagerStorage) {}

  async list(): Promise<TinyPerson[]> {
    return (await this.storage.get<TinyPerson[]>(PEOPLE_STORAGE_KEY)) ?? [];
  }

  async findExact(value: string): Promise<TinyPerson | null> {
    const normalized = normalizePersonName(value);
    if (!normalized) return null;
    return (await this.list()).find((person) =>
      namesOf(person).some((name) => normalizePersonName(name) === normalized),
    ) ?? null;
  }

  async findByName(displayName: string): Promise<TinyPerson | null> {
    return this.findExact(displayName);
  }

  async candidates(value: string): Promise<TinyPerson[]> {
    const normalized = normalizePersonName(value);
    if (!normalized) return [];
    return (await this.list()).filter((person) =>
      namesOf(person).some((name) => {
        const candidate = normalizePersonName(name);
        return candidate === normalized || candidate.startsWith(`${normalized} `) || candidate.includes(` ${normalized} `);
      }),
    );
  }

  async resolveUnique(value: string): Promise<TinyPersonResolution> {
    const exact = await this.findExact(value);
    if (exact) return { person: exact, ambiguous: [] };
    const matches = await this.candidates(value);
    if (matches.length === 1) return { person: matches[0] ?? null, ambiguous: [] };
    return { person: null, ambiguous: matches.length > 1 ? matches : [] };
  }

  async create(input: CreateTinyPersonInput): Promise<TinyPerson> {
    const displayName = input.displayName.trim().replace(/\s+/g, ' ');
    if (!displayName) throw new Error('Person display name is required.');

    const existing = await this.findExact(displayName);
    if (existing) return existing;

    const aliases = [...new Set((input.aliases ?? []).map((alias) => alias.trim()).filter(Boolean))];
    const now = new Date().toISOString();
    const person: TinyPerson = {
      id: makeId(),
      displayName,
      createdAt: now,
      updatedAt: now,
      ...(aliases.length ? { aliases } : {}),
      ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      ...(input.role?.trim() ? { role: input.role.trim() } : {}),
    };

    const people = await this.list();
    await this.storage.set(PEOPLE_STORAGE_KEY, [person, ...people]);
    return person;
  }

  async createMinimal(displayName: string): Promise<TinyPerson> {
    return this.create({ displayName });
  }

  async resolveOrCreate(displayName: string): Promise<TinyPerson> {
    const resolution = await this.resolveUnique(displayName);
    if (resolution.person) return resolution.person;
    if (resolution.ambiguous.length > 1) {
      throw new Error('Person name is ambiguous.');
    }
    return this.createMinimal(displayName);
  }
}
