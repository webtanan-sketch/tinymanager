import type { TinyManagerStorage } from './types';

const PROJECTS_KEY = 'core.projects.v1';

export type TinyProjectCurrency = 'TOMAN' | 'IRR' | 'USD' | 'EUR' | 'OTHER';
export type TinyProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface TinyProject {
  id: string;
  name: string;
  budgetAmount: number;
  currency: TinyProjectCurrency;
  status: TinyProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTinyProjectInput {
  name: string;
  budgetAmount: number;
  currency: TinyProjectCurrency;
}

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export class TinyProjectRepository {
  constructor(private readonly storage: TinyManagerStorage) {}

  async list(): Promise<TinyProject[]> {
    return (await this.storage.get<TinyProject[]>(PROJECTS_KEY)) ?? [];
  }

  async create(input: CreateTinyProjectInput): Promise<TinyProject> {
    const name = input.name.trim();
    if (!name) throw new Error('Project name is required.');
    if (!Number.isFinite(input.budgetAmount) || input.budgetAmount < 0) {
      throw new Error('Project budget must be a valid non-negative number.');
    }

    const now = new Date().toISOString();
    const project: TinyProject = {
      id: makeId(),
      name,
      budgetAmount: input.budgetAmount,
      currency: input.currency,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const projects = await this.list();
    await this.storage.set(PROJECTS_KEY, [project, ...projects]);
    return project;
  }

  async findByName(name: string): Promise<TinyProject | null> {
    const normalized = name.trim().toLocaleLowerCase();
    if (!normalized) return null;
    return (await this.list()).find((project) => project.name.toLocaleLowerCase() === normalized) ?? null;
  }
}
