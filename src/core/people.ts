import type { TinyManagerStorage } from './types';

export const PEOPLE_STORAGE_KEY = 'core.people.v1';

export interface TinyPerson {
  id: string;
  displayName: string;
  email?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTinyPersonInput {
  displayName: string;
  email?: string;
  role?: string;
}

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeName = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک');

export class TinyPeopleRepository {
  constructor(private readonly storage: TinyManagerStorage) {}

  async list(): Promise<TinyPerson[]> {
    return (await this.storage.get<TinyPerson[]>(PEOPLE_STORAGE_KEY)) ?? [];
  }

  async findByName(displayName: string): Promise<TinyPerson | null> {
    const normalized = normalizeName(displayName);
    if (!normalized) return null;
    return (await this.list()).find((person) => normalizeName(person.displayName) === normalized) ?? null;
  }

  async create(input: CreateTinyPersonInput): Promise<TinyPerson> {
    const displayName = input.displayName.trim().replace(/\s+/g, ' ');
    if (!displayName) throw new Error('Person display name is required.');

    const existing = await this.findByName(displayName);
    if (existing) return existing;

    const now = new Date().toISOString();
    const person: TinyPerson = {
      id: makeId(),
      displayName,
      createdAt: now,
      updatedAt: now,
      ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      ...(input.role?.trim() ? { role: input.role.trim() } : {}),
    };

    const people = await this.list();
    await this.storage.set(PEOPLE_STORAGE_KEY, [person, ...people]);
    return person;
  }

  async resolveOrCreate(displayName: string): Promise<TinyPerson> {
    const existing = await this.findByName(displayName);
    return existing ?? this.create({ displayName });
  }
}
