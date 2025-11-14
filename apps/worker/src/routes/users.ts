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
    const status = c.req.query('status');
    const service = getService(c.env);
    const result = await service.list(limit, status);

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

  router.put(
    '/users/:handle/profile',
    requireAuth({ role: 'admin', allowSelf: { param: 'handle' } }),
    async (c) => {
      const body = await c.req.json();
      const service = getService(c.env);
      const updated = await service.updateProfile(c.req.param('handle'), body);
      if (c.env.GMGNCARD_QUEUE && updated?.id) {
        const jobs: Promise<unknown>[] = [];
        if (body.wechatQrUrl) {
          jobs.push(
            c.env.GMGNCARD_QUEUE.send({
              type: 'qr-cache',
              payload: {
                userId: updated.id,
                handle: updated.handle,
                target: 'wechat',
                sourceUrl: body.wechatQrUrl
              }
            })
          );
        }
        if (body.groupQrUrl) {
          jobs.push(
            c.env.GMGNCARD_QUEUE.send({
              type: 'qr-cache',
              payload: {
                userId: updated.id,
                handle: updated.handle,
                target: 'group',
                sourceUrl: body.groupQrUrl
              }
            })
          );
        }
        if (jobs.length) {
          c.executionCtx?.waitUntil(Promise.all(jobs));
        }
      }
      return withRequestMeta(c, updated);
    }
  );

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

  router.put('/users/:handle/featured', requireAuth({ role: 'admin' }), async (c) => {
    const body = await c.req.json();
    const service = getService(c.env);
    const updated = await service.updateFeatured(c.req.param('handle'), body);
    return withRequestMeta(c, updated);
  });
};
