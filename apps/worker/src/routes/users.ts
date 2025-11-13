import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { UserService } from '../services/user-service';
import { UserRepository } from '../repos/user-repo';
import { withRequestMeta } from '../utils/responses';
import { requireAuth } from '../middleware/auth';

const getService = (env: AppBindings['Bindings']) =>
  new UserService(UserRepository.fromEnv(env));

export const registerUserRoutes = (router: Hono<AppBindings>) => {
  router.get('/users', async (c) => {
    const requestedLimit = Number.parseInt(c.req.query('limit') ?? '', 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : undefined;
    const service = getService(c.env);
    const result = await service.list(limit);

    return withRequestMeta(
      c,
      result.items,
      {
        pagination: {
          total: result.total,
          cursor: result.cursor,
          hasMore: result.hasMore
        }
      }
    );
  });

  router.get('/users/:handle', async (c) => {
    const service = getService(c.env);
    const user = await service.getByHandle(c.req.param('handle'));
    return withRequestMeta(c, user);
  });

  router.put('/users/:handle/profile', requireAuth({ role: 'admin' }), async (c) => {
    const body = await c.req.json();
    const service = getService(c.env);
    const updated = await service.updateProfile(c.req.param('handle'), body);
    return withRequestMeta(c, updated);
  });

  router.post(
    '/users/:handle/profile',
    requireAuth({ allowSelf: { param: 'handle', require: true } }),
    async (c) => {
      const body = await c.req.json();
      const service = getService(c.env);
      const updated = await service.submitProfile(c.req.param('handle'), body);
      return withRequestMeta(c, updated);
    }
  );
};
