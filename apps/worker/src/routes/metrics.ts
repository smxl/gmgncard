import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { withRequestMeta } from '../utils/responses';
import { HttpError } from '../utils/errors';

export const registerMetricsRoutes = (app: Hono<AppBindings>) => {
  app.post('/api/metrics/links', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      linkId?: number | string;
      handle?: string;
    };
    const linkId = Number.parseInt(String(body.linkId ?? ''), 10);
    if (!Number.isFinite(linkId)) {
      return c.json({ error: 'Invalid link id' }, 400);
    }

    if (!c.env.GMGNCARD_QUEUE) {
      throw new HttpError(503, 'Metrics queue unavailable');
    }

    await c.env.GMGNCARD_QUEUE.send({
      type: 'record-link-click',
      payload: {
        linkId,
        handle: typeof body.handle === 'string' ? body.handle : undefined,
        referrer: c.req.header('referer') ?? undefined,
        userAgent: c.req.header('user-agent') ?? undefined,
        country: (c.req.raw as Request & { cf?: { country?: string } }).cf?.country
      }
    });

    return withRequestMeta(c, { queued: true });
  });
};
