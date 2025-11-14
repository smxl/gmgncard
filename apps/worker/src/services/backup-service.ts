import { RESOURCE_IDS } from '@gmgncard/config';
import { UserRepository } from '../repos/user-repo';
import type { WorkerEnv } from '../types';

export class BackupService {
  constructor(private readonly repo: UserRepository) {}

  async run(env: WorkerEnv) {
    const bucket = env[RESOURCE_IDS.r2];
    if (!bucket) {
      console.warn('R2 bucket unavailable, skip backup run');
      return { skipped: true };
    }

    const users = await this.repo.exportAll();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/${timestamp}.json`;
    const body = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalUsers: users.length,
        users
      },
      null,
      2
    );

    await bucket.put(key, body, {
      httpMetadata: {
        contentType: 'application/json'
      }
    });

    return { key, size: body.length };
  }
}
