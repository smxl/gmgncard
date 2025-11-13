import type { MiddlewareHandler } from 'hono';
import { AuthService } from '../services/auth-service';
import { HttpError } from '../utils/errors';
import type { AppBindings } from '../types';

interface RequireAuthOptions {
  role?: 'admin';
  allowSelf?: {
    param: string;
    require?: boolean;
  };
}

export const requireAuth = (options?: RequireAuthOptions): MiddlewareHandler<AppBindings> => {
  return async (c, next) => {
    const header = c.req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    const service = AuthService.fromEnv(c.env);
    const authResult = await service.verify(token);

    const handleParamName = options?.allowSelf?.param;
    const handleParam = handleParamName ? c.req.param(handleParamName) : undefined;
    const normalizedHandle = handleParam?.startsWith('@') ? handleParam.slice(1) : handleParam;
    const isSelf = normalizedHandle ? normalizedHandle === authResult.handle : false;
    const isAdmin = authResult.role === 'admin';

    const hasAdminAccess = !options?.role || options.role !== 'admin' || isAdmin || (options.allowSelf && isSelf);
    if (!hasAdminAccess) {
      throw new HttpError(403, 'Admin permission required');
    }

    if (options?.allowSelf?.require && !isSelf && !isAdmin) {
      throw new HttpError(403, 'Forbidden');
    }

    c.set('authUser', {
      id: authResult.id,
      handle: authResult.handle,
      role: authResult.role
    });
    c.set('requestId', c.get('requestId'));
    await next();
  };
};
