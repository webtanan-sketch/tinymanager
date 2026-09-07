import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const workspaceArg = process.argv.slice(2).find((arg) => arg.startsWith('--workspace='));
const workspace = path.resolve(workspaceArg ? workspaceArg.slice('--workspace='.length) : '../TinyManagerWorkspace');
const installCore = args.has('--install') || args.has('--install-core') || args.has('--install-all');
const installAll = args.has('--install-all');
const skipCore = args.has('--skip-core');

const registryPath = path.resolve('config/repositories.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const repositories = [registry.core, ...registry.modules, ...registry.shared].filter((entry) => !(skipCore && entry.role === 'core'));

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
  }
};

const output = (command, commandArgs, cwd) => {
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) return '';
  return (result.stdout ?? '').trim();
};

if (!output('git', ['--version'])) {
  throw new Error('Git is required for source synchronization.');
}

fs.mkdirSync(workspace, { recursive: true });
console.log(`TinyManager workspace: ${workspace}`);

for (const entry of repositories) {
  const destination = path.join(workspace, entry.id);
  const gitDir = path.join(destination, '.git');

  if (!fs.existsSync(gitDir)) {
    if (fs.existsSync(destination) && fs.readdirSync(destination).length > 0) {
      throw new Error(`${destination} exists but is not a Git repository.`);
    }
    console.log(`\n[clone] ${entry.id}`);
    run('git', ['clone', '--filter=blob:none', entry.repository, destination]);
  } else {
    const dirty = output('git', ['status', '--porcelain'], destination);
    if (dirty) {
      throw new Error(`${entry.id} has local changes. Commit/stash them before automatic synchronization.`);
    }
    console.log(`\n[update] ${entry.id}`);
  }

  run('git', ['fetch', '--all', '--tags', '--prune'], { cwd: destination });

  if (/^[0-9a-f]{40}$/i.test(entry.ref)) {
    run('git', ['checkout', '--detach', entry.ref], { cwd: destination });
  } else {
    run('git', ['checkout', entry.ref], { cwd: destination });
    run('git', ['pull', '--ff-only', 'origin', entry.ref], { cwd: destination });
  }

  const head = output('git', ['rev-parse', 'HEAD'], destination);
  console.log(`[ready] ${entry.id} @ ${head.slice(0, 12)}`);

  if (installAll || (installCore && entry.role === 'core')) {
    const packagePath = path.join(destination, 'package.json');
    if (fs.existsSync(packagePath)) {
      console.log(`[npm] ${entry.id}`);
      run('npm', ['install'], { cwd: destination });
      if (entry.role === 'core') run('npm', ['run', 'build'], { cwd: destination });
    }
  }
}

console.log('\nTinyManager repositories synchronized successfully.');
