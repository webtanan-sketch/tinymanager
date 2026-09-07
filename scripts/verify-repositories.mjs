import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'config', 'repositories.json'), 'utf8'));

const entries = [...registry.modules, ...registry.shared];
const failures = [];

for (const entry of entries) {
  const expected = `github:${registry.owner}/${entry.id}#${entry.ref}`;
  const actual = packageJson.dependencies?.[entry.id];
  if (actual !== expected) {
    failures.push(`${entry.id}: expected ${expected}, found ${actual ?? '<missing>'}`);
  }
}

const registeredIds = new Set(entries.map((entry) => entry.id));
for (const [name, value] of Object.entries(packageJson.dependencies ?? {})) {
  const isManagedRepository = name.startsWith('tiny-') || name === 'webtanan-jalali-date-engine';
  if (isManagedRepository && !registeredIds.has(name)) {
    failures.push(`${name}: GitHub dependency exists in package.json but is missing from config/repositories.json (${value})`);
  }
}

if (registry.modules.length !== 9) {
  failures.push(`Expected exactly 9 TinyManager modules, found ${registry.modules.length}.`);
}

if (failures.length > 0) {
  console.error('Repository registry verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Repository registry verified: ${registry.modules.length} modules + ${registry.shared.length} shared repository.`);
