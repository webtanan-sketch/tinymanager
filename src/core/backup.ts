import type { TinyManagerStorage } from './types';

export const TINYMANAGER_BACKUP_SCHEMA = 1;

export interface TinyManagerBackupEnvelope {
  schema: 'tinymanager-backup';
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export async function createBackup(
  storage: TinyManagerStorage,
): Promise<TinyManagerBackupEnvelope> {
  return {
    schema: 'tinymanager-backup',
    schemaVersion: TINYMANAGER_BACKUP_SCHEMA,
    appVersion: '0.1.0-alpha.1',
    createdAt: new Date().toISOString(),
    data: await storage.exportAll(),
  };
}

export async function restoreBackup(
  storage: TinyManagerStorage,
  raw: unknown,
): Promise<void> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid TinyManager backup.');
  }

  const candidate = raw as Partial<TinyManagerBackupEnvelope>;
  if (
    candidate.schema !== 'tinymanager-backup' ||
    candidate.schemaVersion !== TINYMANAGER_BACKUP_SCHEMA ||
    !candidate.data ||
    typeof candidate.data !== 'object'
  ) {
    throw new Error('Unsupported TinyManager backup format.');
  }

  await storage.importAll(candidate.data);
}

export function downloadBackupFile(envelope: TinyManagerBackupEnvelope): void {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = envelope.createdAt.slice(0, 10);
  anchor.href = url;
  anchor.download = `tinymanager-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
