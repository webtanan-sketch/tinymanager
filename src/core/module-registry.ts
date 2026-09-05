import type {
  TinyManagerModuleManifest,
  TinyManagerStorage,
} from './types';

const ENABLED_MODULES_KEY = 'core.modules.enabled';

export class TinyManagerModuleRegistry {
  private readonly catalog = new Map<string, TinyManagerModuleManifest>();
  private enabled = new Set<string>();

  constructor(
    modules: TinyManagerModuleManifest[],
    private readonly storage: TinyManagerStorage,
  ) {
    for (const module of modules) {
      if (this.catalog.has(module.id)) {
        throw new Error(`Duplicate TinyManager module id: ${module.id}`);
      }
      this.catalog.set(module.id, module);
    }
  }

  async hydrate(): Promise<void> {
    const stored = await this.storage.get<string[]>(ENABLED_MODULES_KEY);
    const validIds = (stored ?? []).filter((id) => this.catalog.has(id));
    this.enabled = new Set(validIds);
  }

  list(): TinyManagerModuleManifest[] {
    return [...this.catalog.values()];
  }

  listEnabled(): TinyManagerModuleManifest[] {
    return this.list().filter((module) => this.enabled.has(module.id));
  }

  isEnabled(id: string): boolean {
    return this.enabled.has(id);
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    if (!this.catalog.has(id)) {
      throw new Error(`Unknown TinyManager module: ${id}`);
    }

    if (enabled) this.enabled.add(id);
    else this.enabled.delete(id);

    await this.storage.set(ENABLED_MODULES_KEY, [...this.enabled].sort());
  }

  async reset(): Promise<void> {
    this.enabled.clear();
    await this.storage.remove(ENABLED_MODULES_KEY);
  }
}
