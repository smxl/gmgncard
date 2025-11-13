import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { SettingsService } from '../services/settings-service';
import { withRequestMeta } from '../utils/responses';
import { requireAuth } from '../middleware/auth';

const getService = (env: AppBindings['Bindings']) =>
  new SettingsService(env.GMGNCARD_KV);

export const registerSettingsRoutes = (router: Hono<AppBindings>) => {
  router.get('/settings', async (c) => {
    const service = getService(c.env);
    const data = await service.getSettings();
    return withRequestMeta(c, data);
  });

  router.put('/settings', requireAuth({ role: 'admin' }), async (c) => {
    const service = getService(c.env);
    const body = await c.req.json();
    const data = await service.updateSettings(body);
    return withRequestMeta(c, data);
  });
};
