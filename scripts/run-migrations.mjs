#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const migrations = [
  '0001_init.sql',
  '0002_auth.sql',
  '0003_qr_access.sql',
  '0004_profile_extended.sql',
  '0005_featured_users.sql',
  '0006_profile_positions.sql'
];

const args = new Set(process.argv.slice(2));
const useLocal = args.has('--local') || args.has('-l');
const skipSeed = args.has('--skip-seed');

const wranglerBin = process.env.WRANGLER_BIN ?? 'wrangler';
const configFile = process.env.WRANGLER_CONFIG ?? 'infra/wrangler.toml';
const database = process.env.D1_DATABASE ?? 'gmgncard-db';

const runSql = (file) => {
  const absolute = resolve(process.cwd(), file);
  const execArgs = ['d1', 'execute', database, '--config', configFile];
  if (useLocal) execArgs.push('--local');
  execArgs.push('--file', absolute);

  console.log(`\n>>> Applying ${file}`);
  const result = spawnSync(wranglerBin, execArgs, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Command failed for ${file}`);
    process.exit(result.status ?? 1);
  }
};

for (const name of migrations) {
  runSql(`packages/db/migrations/${name}`);
}

if (!skipSeed) {
  runSql('packages/db/seed/dev_seed.sql');
}

console.log('\nAll migrations applied successfully.');
