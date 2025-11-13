import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { LinkService } from '../services/link-service';
import { LinkRepository } from '../repos/link-repo';
import { UserRepository } from '../repos/user-repo';
import { withRequestMeta } from '../utils/responses';
import { requireAuth } from '../middleware/auth';

const getService = (env: AppBindings['Bindings']) =>
  new LinkService(LinkRepository.fromEnv(env), UserRepository.fromEnv(env));

export const registerLinkRoutes = (router: Hono<AppBindings>) => {
  router.get('/users/:handle/links', async (c) => {
    const service = getService(c.env);
    const data = await service.list(c.req.param('handle'));
    return withRequestMeta(c, data);
  });

  router.post('/users/:handle/links', requireAuth({ role: 'admin' }), async (c) => {
    const service = getService(c.env);
    const body = await c.req.json();
    const link = await service.create(c.req.param('handle'), body);
    return withRequestMeta(c, link);
  });

  router.put('/users/:handle/links/:linkId', requireAuth({ role: 'admin' }), async (c) => {
    const linkId = Number.parseInt(c.req.param('linkId') ?? '', 10);
    if (!Number.isFinite(linkId)) {
      return c.json({ error: 'Invalid link id' }, 400);
    }
    const service = getService(c.env);
    const body = await c.req.json();
    const link = await service.update(c.req.param('handle'), linkId, body);
    return withRequestMeta(c, link);
  });

  router.delete('/users/:handle/links/:linkId', requireAuth({ role: 'admin' }), async (c) => {
    const linkId = Number.parseInt(c.req.param('linkId') ?? '', 10);
    if (!Number.isFinite(linkId)) {
      return c.json({ error: 'Invalid link id' }, 400);
    }
    const service = getService(c.env);
    await service.delete(c.req.param('handle'), linkId);
    return withRequestMeta(c, { deleted: true });
  });
};
