import type { TinyProject } from './ProjectTypes';
import { tinyStorage } from '../../core/storage';

const STORAGE_KEY = 'core.projects.v1';

export const projectRepository = {
  async list(): Promise<TinyProject[]> {
    return (await tinyStorage.get<TinyProject[]>(STORAGE_KEY)) ?? [];
  },

  async create(project: TinyProject): Promise<void> {
    const projects = await this.list();
    await tinyStorage.set(STORAGE_KEY, [...projects, project]);
  },

  async find(id: string): Promise<TinyProject | undefined> {
    const projects = await this.list();
    return projects.find((item) => item.id === id);
  },
};
