import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { AuthService } from '../services/auth-service';
import { withRequestMeta } from '../utils/responses';
import { requireAuth } from '../middleware/auth';

export const registerAuthRoutes = (router: Hono<AppBindings>) => {
  router.post('/auth/register', async (c) => {
    const service = AuthService.fromEnv(c.env);
    const body = await c.req.json();
    const result = await service.register(body);
    return withRequestMeta(c, result);
  });

  router.post('/auth/login', async (c) => {
    const service = AuthService.fromEnv(c.env);
    const body = await c.req.json();
    const result = await service.login(body);
    return withRequestMeta(c, result);
  });

  router.get('/auth/profile', requireAuth(), async (c) => {
    const service = AuthService.fromEnv(c.env);
    const token = c.req.header('authorization')?.split(' ')[1] ?? '';
    const auth = await service.verify(token);
    return withRequestMeta(c, auth.user);
  });
};
