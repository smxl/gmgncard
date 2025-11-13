import { Hono } from 'hono';
import { ZodError } from 'zod';
import type { StatusCode } from 'hono/utils/http-status';
import type { AppBindings } from './types';
import { requestContext } from './middleware/request-context';
import { corsMiddleware } from './middleware/cors';
import { registerHealthRoutes } from './routes/health';
import { registerUserRoutes } from './routes/users';
import { registerSettingsRoutes } from './routes/settings';
import { registerReportRoutes } from './routes/reports';
import { registerAuthRoutes } from './routes/auth';
import { registerPublicRoutes } from './routes/public';
import { registerLinkRoutes } from './routes/links';
import { registerPlazaRoutes } from './routes/plaza';
import { withRequestMeta } from './utils/responses';
import { HttpError, isHttpError } from './utils/errors';

const app = new Hono<AppBindings>();

app.use('*', corsMiddleware());
app.use('*', requestContext());

const api = new Hono<AppBindings>();
registerHealthRoutes(api);
registerUserRoutes(api);
registerSettingsRoutes(api);
registerReportRoutes(api);
registerAuthRoutes(api);
registerLinkRoutes(api);
registerPlazaRoutes(api);

app.route('/api', api);

app.get('/', (c) =>
  withRequestMeta(c, {
    status: 'ok',
    service: 'gmgncard-worker'
  })
);

registerPublicRoutes(app);

app.onError((err, c) => {
  if (isHttpError(err)) {
    return c.json(
      {
        error: err.message,
        details: err.details,
        requestId: c.get('requestId')
      },
      err.status as StatusCode
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation error',
        issues: err.issues,
        requestId: c.get('requestId')
      },
      400
    );
  }

  console.error('Unhandled worker error', err);
  return c.json(
    {
      error: 'Internal error',
      requestId: c.get('requestId')
    },
    500
  );
});

app.notFound((c) => {
  throw new HttpError(404, `Route ${c.req.path} not found`);
});

export default app;
