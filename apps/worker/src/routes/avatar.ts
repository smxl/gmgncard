import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { AvatarService } from '../services/avatar-service';
import { requireAuth } from '../middleware/auth';
import { withRequestMeta } from '../utils/responses';

export const registerAvatarRoutes = (router: Hono<AppBindings>) => {
  router.post(
    '/users/:handle/avatar',
    requireAuth({ allowSelf: { param: 'handle', require: true } }),
    async (c) => {
      const form = await c.req.parseBody();
      const file = form['avatar'];
      if (!(file instanceof File)) {
        return c.json({ error: 'Missing avatar file' }, 400);
      }
      const service = AvatarService.fromEnv(c.env);
      const result = await service.upload(c.req.param('handle'), file);
      return withRequestMeta(c, result);
    }
  );
};
