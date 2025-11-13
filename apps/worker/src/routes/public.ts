import type { Hono } from 'hono';
import { HttpError } from '../utils/errors';
import type { AppBindings } from '../types';
import { UserRepository } from '../repos/user-repo';
import { UserService } from '../services/user-service';
import { renderProfilePage, renderNotFoundPage } from '../templates/profile';

const getService = (env: AppBindings['Bindings']) =>
  new UserService(UserRepository.fromEnv(env));

const renderHandle = async (c: Parameters<Parameters<typeof app.get>[1]>[0], handle: string) => {
  const service = getService(c.env);
  try {
    const user = await service.getByHandle(handle);
    return c.html(renderProfilePage(user));
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return c.html(renderNotFoundPage(handle), 404);
    }
    throw error;
  }
};

export const registerPublicRoutes = (app: Hono<AppBindings>) => {
  app.get('/@:handle', (c) => {
    const handle = c.req.param('handle');
    return renderHandle(c, handle);
  });

  app.get('/:handle', (c) => {
    const param = c.req.param('handle');
    const normalized = param.startsWith('@') ? param.slice(1) : param;
    return renderHandle(c, normalized);
  });
};
