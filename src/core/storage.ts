import type { TinyManagerStorage } from './types';

const DB_NAME = 'tinymanager';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const FALLBACK_PREFIX = 'tinymanager.fallback.';

interface StoredRecord {
  key: string;
  value: unknown;
  updatedAt: string;
}

const hasIndexedDb = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });

class IndexedDbTinyManagerStorage implements TinyManagerStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (!hasIndexedDb()) {
      return Promise.reject(new Error('IndexedDB is not available.'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open TinyManager database.'));
      request.onblocked = () => reject(new Error('TinyManager database upgrade is blocked by another tab.'));
    });

    return this.dbPromise;
  }

  private fallbackGet<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(`${FALLBACK_PREFIX}${key}`);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  private fallbackSet<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`${FALLBACK_PREFIX}${key}`, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    if (!hasIndexedDb()) return this.fallbackGet<T>(key);

    try {
      const db = await this.openDb();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const record = await requestToPromise(store.get(key) as IDBRequest<StoredRecord | undefined>);
      return (record?.value as T | undefined) ?? null;
    } catch {
      return this.fallbackGet<T>(key);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!hasIndexedDb()) {
      this.fallbackSet(key, value);
      return;
    }

    try {
      const db = await this.openDb();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({
        key,
        value,
        updatedAt: new Date().toISOString(),
      } satisfies StoredRecord);
      await transactionDone(transaction);
    } catch {
      this.fallbackSet(key, value);
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`${FALLBACK_PREFIX}${key}`);
    }

    if (!hasIndexedDb()) return;

    const db = await this.openDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);
    await transactionDone(transaction);
  }

  async keys(prefix = ''): Promise<string[]> {
    const keys = new Set<string>();

    if (typeof window !== 'undefined') {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const item = window.localStorage.key(index);
        if (!item?.startsWith(FALLBACK_PREFIX)) continue;
        const key = item.slice(FALLBACK_PREFIX.length);
        if (key.startsWith(prefix)) keys.add(key);
      }
    }

    if (hasIndexedDb()) {
      try {
        const db = await this.openDb();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const dbKeys = await requestToPromise(store.getAllKeys());
        for (const rawKey of dbKeys) {
          const key = String(rawKey);
          if (key.startsWith(prefix)) keys.add(key);
        }
      } catch {
        // Fallback keys are still useful if IndexedDB is unavailable or blocked.
      }
    }

    return [...keys].sort();
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const output: Record<string, unknown> = {};
    for (const key of await this.keys()) {
      output[key] = await this.get(key);
    }
    return output;
  }

  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }
}

export const tinyStorage: TinyManagerStorage = new IndexedDbTinyManagerStorage();
