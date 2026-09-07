import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist');

const requiredFiles = [
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'sw.js',
  'registerSW.js',
];

for (const file of requiredFiles) {
  const path = join(dist, file);
  if (!existsSync(path) || statSync(path).size === 0) {
    throw new Error(`PWA verification failed: missing or empty dist/${file}`);
  }
}

const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
if (!indexHtml.includes('manifest.webmanifest')) {
  throw new Error('PWA verification failed: manifest is not linked from index.html');
}
if (!indexHtml.includes('registerSW.js')) {
  throw new Error('PWA verification failed: service worker registration is not injected');
}

const manifest = JSON.parse(readFileSync(join(dist, 'manifest.webmanifest'), 'utf8'));
if (manifest.name !== 'TinyManager' || manifest.display !== 'standalone' || !manifest.start_url) {
  throw new Error('PWA verification failed: web manifest is missing installability metadata');
}

const assetsDir = join(dist, 'assets');
const appAssets = existsSync(assetsDir)
  ? readdirSync(assetsDir).filter((file) => /\.(?:js|css)$/.test(file))
  : [];
if (appAssets.length < 2) {
  throw new Error('PWA verification failed: production JS/CSS assets were not found');
}

const serviceWorker = readFileSync(join(dist, 'sw.js'), 'utf8');
const cachedAsset = appAssets.some((file) => serviceWorker.includes(`assets/${file}`));
if (!cachedAsset) {
  throw new Error('PWA verification failed: generated app assets are not present in the precache manifest');
}

console.log(`PWA verification passed: ${appAssets.length} app assets are backed by the generated service worker.`);
