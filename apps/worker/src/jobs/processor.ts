import { RESOURCE_IDS } from '@gmgncard/config';
import { LinkRepository } from '../repos/link-repo';
import { UserRepository } from '../repos/user-repo';
import { BackupService } from '../services/backup-service';
import type { WorkerEnv } from '../types';
import type { QueueJob } from './types';

export class JobProcessor {
  constructor(private readonly env: WorkerEnv) {}

  async process(job: QueueJob) {
    switch (job.type) {
      case 'daily-backup':
        await new BackupService(UserRepository.fromEnv(this.env)).run(this.env);
        break;
      case 'record-link-click':
        await LinkRepository.fromEnv(this.env).recordVisit(job.payload.linkId, {
          referrer: job.payload.referrer,
          userAgent: job.payload.userAgent,
          country: job.payload.country
        });
        break;
      case 'qr-cache':
        await this.handleQrCache(job.payload);
        break;
      default:
        console.warn('Unknown queue job', job);
    }
  }

  private async handleQrCache(payload: {
    userId: number;
    handle: string;
    target: 'wechat' | 'group';
    sourceUrl: string;
  }) {
    const bucket = this.env[RESOURCE_IDS.r2];
    if (!bucket) {
      console.warn('Skip QR cache job, R2 missing');
      return;
    }

    const response = await fetch(payload.sourceUrl);
    if (!response.ok) {
      console.error('Unable to fetch QR source', payload.sourceUrl, response.status);
      return;
    }

    const contentType =
      response.headers.get('content-type') ?? 'image/png';
    const extension = contentType.includes('svg')
      ? 'svg'
      : contentType.includes('jpeg')
        ? 'jpg'
        : contentType.includes('webp')
          ? 'webp'
          : 'png';
    const filename = `${payload.target}-${Date.now()}.${extension}`;
    const key = `qr/${payload.handle}/${filename}`;

    const body = await response.arrayBuffer();

    await bucket.put(key, body, {
      httpMetadata: {
        contentType
      }
    });

    const repo = UserRepository.fromEnv(this.env);
    const field =
      payload.target === 'wechat' ? 'wechatQrUrl' : 'groupQrUrl';
    await repo.updateQrFields(payload.userId, {
      [field]: `/cdn/qr/${payload.handle}/${filename}`
    });
  }
}
