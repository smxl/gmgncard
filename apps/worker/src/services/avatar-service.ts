import { RESOURCE_IDS } from '@gmgncard/config';
import type { WorkerEnv } from '../types';
import { UserRepository } from '../repos/user-repo';
import { HttpError } from '../utils/errors';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class AvatarService {
  constructor(
    private readonly repo: UserRepository,
    private readonly env: WorkerEnv
  ) {}

  static fromEnv(env: WorkerEnv) {
    return new AvatarService(UserRepository.fromEnv(env), env);
  }

  async upload(handle: string, file: File) {
    const user = await this.repo.findUserRecord(handle);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new HttpError(400, 'Avatar too large (max 2MB)');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new HttpError(400, 'Unsupported image type');
    }
    const bucket = this.env[RESOURCE_IDS.r2];
    if (!bucket) {
      throw new HttpError(503, 'Avatar storage unavailable');
    }
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const key = `avatars/${handle}/${Date.now()}.${extension}`;

    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=86400'
      }
    });

    await this.repo.updateUserBasics(user.id!, {
      avatarUrl: `/cdn/${key}`
    });

    return {
      avatarUrl: `/cdn/${key}`
    };
  }
}
