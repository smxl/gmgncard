import type {
  PublicProfileRequestPayload,
  UserDTO
} from '@gmgncard/types';
import { publicProfileRequestSchema, upsertLinkSchema } from '@gmgncard/types';
import { UserRepository } from '../repos/user-repo';
import { LinkRepository } from '../repos/link-repo';
import { verifyTurnstileToken } from '../utils/turnstile';
import { AuthService } from './auth-service';
import type { WorkerEnv } from '../types';
import { HttpError } from '../utils/errors';

export class VerificationService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly linkRepo: LinkRepository
  ) {}

  async submitPublicRequest(
    payload: unknown,
    env: WorkerEnv,
    remoteIp?: string
  ): Promise<UserDTO> {
    const data = publicProfileRequestSchema.parse(payload);
    await verifyTurnstileToken(
      data.turnstileToken,
      env.TURNSTILE_SECRET,
      remoteIp
    );

    const normalizedHandle = data.handle.toLowerCase();
    const existingRecord = await this.userRepo.findUserRecord(
      normalizedHandle
    );
    if (existingRecord?.passwordHash) {
      throw new HttpError(409, 'Handle already registered');
    }

    if (!existingRecord) {
      await this.userRepo.createUser({
        handle: normalizedHandle,
        displayName: data.displayName.trim(),
        email: data.email,
        passwordHash: await AuthService.hash(data.password),
        role: 'user'
      });
    } else {
      await this.userRepo.updateUserBasics(existingRecord.id!, {
        displayName: data.displayName.trim(),
        email: data.email
      });
    }

    const user = await this.userRepo.findByHandle(normalizedHandle);
    if (!user) {
      throw new HttpError(500, 'Unable to load created user');
    }

    await this.userRepo.updateUserBasics(user.id, {
      bio: data.bio
    });

    await this.userRepo.updateProfile(user.id, {
      ...data.profile,
      verificationStatus: 'pending',
      qrAccess: false,
      sidePreference: data.profile.sidePreference
        ? (data.profile.sidePreference as 'Left' | 'Right')
        : undefined
    });

    if (data.links?.length) {
      const normalizedLinks = data.links.map((link) =>
        upsertLinkSchema.parse(link)
      );
      await this.linkRepo.replaceLinksForUser(user.id, normalizedLinks);
    }

    const updated = await this.userRepo.findByHandle(normalizedHandle);
    if (!updated) {
      throw new HttpError(500, 'Unable to return user profile');
    }
    return updated;
  }
}
