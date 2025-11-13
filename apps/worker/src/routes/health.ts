import type { Hono } from 'hono';
import { FEATURE_FLAGS } from '@gmgncard/config';
import type { AppBindings } from '../types';
import { withRequestMeta } from '../utils/responses';

const BOOT_TIME = Date.now();

export const registerHealthRoutes = (router: Hono<AppBindings>) => {
  router.get('/health', (c) =>
    withRequestMeta(c, {
      ok: true,
      service: 'gmgncard-worker',
      uptime: Date.now() - BOOT_TIME,
      featureFlags: FEATURE_FLAGS,
      bindings: {
        d1: Boolean(c.env.GMGNCARD_DB),
        kv: Boolean(c.env.GMGNCARD_KV),
        r2: Boolean(c.env.GMGNCARD_R2)
      }
    })
  );
};
