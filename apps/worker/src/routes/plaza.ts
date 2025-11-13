import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { UserService } from '../services/user-service';
import { UserRepository } from '../repos/user-repo';
import { withRequestMeta } from '../utils/responses';

const getService = (env: AppBindings['Bindings']) =>
  new UserService(UserRepository.fromEnv(env));

export const registerPlazaRoutes = (router: Hono<AppBindings>) => {
  router.get('/plaza', async (c) => {
    const limit = Number.parseInt(c.req.query('limit') ?? '12', 10);
    const service = getService(c.env);
    const users = await service.listPlaza(
      Number.isFinite(limit) && limit > 0 ? limit : 12
    );
    return withRequestMeta(c, users);
  });
};
