import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { VerificationService } from '../services/verification-service';
import { UserRepository } from '../repos/user-repo';
import { LinkRepository } from '../repos/link-repo';
import { withRequestMeta } from '../utils/responses';

const getService = (env: AppBindings['Bindings']) =>
  new VerificationService(UserRepository.fromEnv(env), LinkRepository.fromEnv(env));

export const registerVerificationRoutes = (router: Hono<AppBindings>) => {
  router.post('/verification', async (c) => {
    const remoteIp = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? undefined;
    const service = getService(c.env);
    const user = await service.submitPublicRequest(await c.req.json(), c.env, remoteIp);
    return withRequestMeta(c, {
      handle: user.handle,
      status: user.profile?.verificationStatus ?? 'pending'
    });
  });
};
