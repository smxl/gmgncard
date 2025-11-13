import type {
  PaginatedResult,
  UpdateUserProfilePayload,
  UserDTO
} from '@gmgncard/types';
import {
  updateUserProfileSchema,
  verificationRequestSchema
} from '@gmgncard/types';
import { UserRepository } from '../repos/user-repo';
import { HttpError } from '../utils/errors';

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async list(limit = 20, status?: string): Promise<PaginatedResult<UserDTO>> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const users =
      status === 'pending'
        ? await this.repo.listPending(safeLimit)
        : await this.repo.listUsers(safeLimit);

    return {
      items: users,
      total: users.length,
      cursor: users.at(-1)?.id.toString(),
      hasMore: users.length === safeLimit
    };
  }

  async listFeatured(limit = 12) {
    return this.repo.listFeatured(limit);
  }

  async getByHandle(handle: string) {
    const user = await this.repo.findByHandle(handle);
    if (!user) {
      throw new HttpError(404, `User ${handle} not found`);
    }
    return user;
  }

  async updateProfile(handle: string, payload: UpdateUserProfilePayload) {
    const parsed = updateUserProfileSchema.parse(payload);
    const user = await this.repo.findByHandle(handle);

    if (!user) {
      throw new HttpError(404, `User ${handle} not found`);
    }

    const updated = await this.repo.updateProfile(user.id, parsed);

    if (!updated) {
      throw new HttpError(500, 'Unable to update profile');
    }

    return updated;
  }

  validateVerificationRequest(body: unknown) {
    return verificationRequestSchema.parse(body);
  }

  async submitProfile(handle: string, payload: UpdateUserProfilePayload) {
    const base = verificationRequestSchema.parse(payload);
    const user = await this.repo.findByHandle(handle);
    if (!user) {
      throw new HttpError(404, `User ${handle} not found`);
    }
    const updated = await this.repo.updateProfile(user.id, {
      ...base,
      verificationStatus: 'pending',
      qrAccess: false
    });
    if (!updated) {
      throw new HttpError(500, 'Unable to submit profile');
    }
    return updated;
  }
}
