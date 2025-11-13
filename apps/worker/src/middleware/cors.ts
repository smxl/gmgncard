import type { MiddlewareHandler } from 'hono';
import { parseCorsOrigins } from '@gmgncard/config';
import type { AppBindings } from '../types';

export const corsMiddleware = (): MiddlewareHandler<AppBindings> => {
  return async (c, next) => {
    const origins = parseCorsOrigins(c.env.CORS_ORIGINS);
    const requestOrigin = c.req.header('Origin');
    const allowOrigin =
      !origins || origins.length === 0
        ? requestOrigin ?? '*'
        : origins.includes(requestOrigin ?? '') || requestOrigin === undefined
          ? requestOrigin ?? origins[0]
          : origins[0];

    if (c.req.method === 'OPTIONS') {
      c.header('Access-Control-Allow-Origin', allowOrigin ?? '*');
      c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      c.header(
        'Access-Control-Allow-Headers',
        c.req.header('Access-Control-Request-Headers') ?? 'Authorization,Content-Type'
      );
      c.header('Access-Control-Allow-Credentials', 'true');
      return c.body(null, 204);
    }

    await next();
    if (allowOrigin) {
      c.header('Access-Control-Allow-Origin', allowOrigin);
      c.header('Access-Control-Allow-Credentials', 'true');
    }
  };
};
