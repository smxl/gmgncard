import {
  loginSchema,
  registerSchema,
  type AuthResponse,
  type LoginPayload,
  type RegisterPayload
} from '@gmgncard/types';
import { HttpError } from '../utils/errors';
import { signJwt, verifyJwt } from '../utils/jwt';
import { UserRepository } from '../repos/user-repo';
import type { WorkerEnv } from '../types';

const encoder = new TextEncoder();

const hashPassword = async (password: string) => {
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export class AuthService {
  constructor(
    private readonly repo: UserRepository,
    private readonly env: WorkerEnv
  ) {}

  static fromEnv(env: WorkerEnv) {
    return new AuthService(UserRepository.fromEnv(env), env);
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = registerSchema.parse(payload);
    const existing = await this.repo.findUserRecord(data.handle);
    if (existing) {
      throw new HttpError(409, 'Handle already exists');
    }

    await this.repo.createUser({
      handle: data.handle,
      displayName: data.displayName,
      email: data.email,
      passwordHash: await hashPassword(data.password)
    });

    const user = await this.repo.findByHandle(data.handle);
    if (!user) {
      throw new HttpError(500, 'Unable to load created user');
    }

    return {
      token: await this.generateToken(user.id, user.handle, user.role ?? 'user'),
      user
    };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = loginSchema.parse(payload);
    const record = await this.repo.findUserRecord(data.handle);
    if (!record || !record.passwordHash) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const hashed = await hashPassword(data.password);
    if (hashed !== record.passwordHash) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const user = await this.repo.findByHandle(data.handle);
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return {
      token: await this.generateToken(user.id, user.handle, user.role ?? 'user'),
      user
    };
  }

  async verify(token: string) {
    const payload = await verifyJwt<{ sub: string; handle: string; role: string }>(
      token,
      this.env.JWT_SECRET
    );
    const user = await this.repo.findByHandle(payload.handle);
    if (!user) {
      throw new HttpError(401, 'User no longer exists');
    }
    return {
      id: Number(payload.sub),
      handle: payload.handle,
      role: payload.role ?? 'user',
      user
    };
  }

  private async generateToken(id: number, handle: string, role: string) {
    return signJwt(
      {
        sub: String(id),
        handle,
        role
      },
      this.env.JWT_SECRET,
      60 * 60 * 24 * 7
    );
  }

  static async hash(password: string) {
    return hashPassword(password);
  }
}
