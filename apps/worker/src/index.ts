import { Hono } from 'hono';
import { ZodError } from 'zod';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
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
import { registerOgRoutes } from './routes/og';
import { registerStaticRoutes } from './routes/static';
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
registerOgRoutes(app);

app.route('/api', api);

app.get('/', (c) =>
  withRequestMeta(c, {
    status: 'ok',
    service: 'gmgncard-worker'
  })
);

registerStaticRoutes(app);
registerPublicRoutes(app);

app.onError((err, c) => {
  if (isHttpError(err)) {
    const safeStatus = toContentfulStatus(err.status);
    return c.json(
      {
        error: err.message,
        details: err.details,
        requestId: c.get('requestId')
      },
      safeStatus
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

const toContentfulStatus = (status?: number): ContentfulStatusCode => {
  if (!status) {
    return 500;
  }
  if (status < 200 || status > 599) {
    return 500;
  }
  const notAllowed = new Set([101, 204, 205, 304]);
  if (notAllowed.has(status)) {
    return 500;
  }
  return status as ContentfulStatusCode;
};

export default app;
