import type { Context } from 'hono';
import type { AppBindings } from '../types';

type MetaPayload = Record<string, unknown> | undefined;

export const withRequestMeta = <T>(
  c: Context<AppBindings>,
  data: T,
  meta?: MetaPayload
) =>
  c.json({
    data,
    meta: {
      requestId: c.get('requestId'),
      ...meta
    }
  });
