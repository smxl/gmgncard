import type { Context, Hono } from 'hono';
import { HttpError } from '../utils/errors';
import type { AppBindings } from '../types';
import { UserRepository } from '../repos/user-repo';
import { UserService } from '../services/user-service';
import { renderProfilePage, renderNotFoundPage } from '../templates/profile';

const getService = (env: AppBindings['Bindings']) =>
  new UserService(UserRepository.fromEnv(env));

type PublicContext = Context<AppBindings>;

const renderHandle = async (c: PublicContext, handle: string) => {
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
  const profilePaths = ['/card/@:handle', '/@:handle'];
  for (const path of profilePaths) {
    app.get(path, (c) => {
      const handle = c.req.param('handle');
      if (!handle) {
        throw new HttpError(400, 'Handle is required');
      }
      return renderHandle(c, handle);
    });
  }

  app.get('/card/:handle', (c) => {
    const normalized = (c.req.param('handle') ?? '').replace(/^@/, '');
    if (!normalized) {
      throw new HttpError(400, 'Handle is required');
    }
    return renderHandle(c, normalized);
  });
};
