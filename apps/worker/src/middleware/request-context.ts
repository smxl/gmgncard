import type { MiddlewareHandler } from 'hono';
import type { AppBindings } from '../types';

export const requestContext = (): MiddlewareHandler<AppBindings> => {
  return async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    await next();
  };
};
