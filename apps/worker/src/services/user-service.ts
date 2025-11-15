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
import { AuthService } from './auth-service';

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

  async listPlaza(limit = 20) {
    const all = await this.repo.listPublic(limit);
    return all.sort((a, b) => {
      const aAd = Boolean(a.adLabel);
      const bAd = Boolean(b.adLabel);
      if (aAd !== bAd) {
        return aAd ? -1 : 1;
      }
      const aFeatured = Boolean(a.isFeatured);
      const bFeatured = Boolean(b.isFeatured);
      if (aFeatured !== bFeatured) {
        return aFeatured ? -1 : 1;
      }
      return (b.profile?.updatedAt ? Date.parse(b.profile.updatedAt) : 0) -
        (a.profile?.updatedAt ? Date.parse(a.profile.updatedAt) : 0);
    });
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

    const { displayName, password, bio, ...profilePayload } = parsed;

    if (displayName) {
      await this.repo.updateUserBasics(user.id, { displayName: displayName.trim() });
    }

    if (bio !== undefined) {
      await this.repo.updateUserBasics(user.id, { bio });
    }

    if (password) {
      const hashed = await AuthService.hash(password);
      await this.repo.updatePassword(user.id, hashed);
    }

    const updated = await this.repo.updateProfile(user.id, {
      ...profilePayload,
      sidePreference: profilePayload.sidePreference
        ? (profilePayload.sidePreference as 'Left' | 'Right')
        : undefined
    });

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
      qrAccess: false,
      sidePreference: base.sidePreference ? (base.sidePreference as 'Left' | 'Right') : undefined
    });
    if (!updated) {
      throw new HttpError(500, 'Unable to submit profile');
    }
    return updated;
  }

  async updateFeatured(handle: string, input: { isFeatured?: boolean; adLabel?: string | null }) {
    const record = await this.repo.updateUserMeta(handle, input);
    if (!record) {
      throw new HttpError(404, 'User not found');
    }
    return this.getByHandle(handle);
  }
}
