import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const distDir = resolve(projectRoot, 'dist');
const sourceFile = resolve(projectRoot, '_worker.js');
const targetFile = resolve(distDir, '_worker.js');

const ensureDist = async () => {
  await mkdir(distDir, { recursive: true });
};

const copyWorker = async () => {
  await ensureDist();
  await copyFile(sourceFile, targetFile);
};

copyWorker().catch((error) => {
  console.error('Failed to copy _worker.js into dist:', error);
  process.exitCode = 1;
});
