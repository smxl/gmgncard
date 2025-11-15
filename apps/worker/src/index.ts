import { Hono } from 'hono';
import { ZodError } from 'zod';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ExecutionContext, MessageBatch, ScheduledController } from '@cloudflare/workers-types';
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
import { registerVerificationRoutes } from './routes/verification';
import { registerMetricsRoutes } from './routes/metrics';
import { registerAvatarRoutes } from './routes/avatar';
import { withRequestMeta } from './utils/responses';
import { HttpError, isHttpError } from './utils/errors';
import { JobProcessor } from './jobs/processor';
import type { QueueJob } from './jobs/types';

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
registerVerificationRoutes(api);
registerAvatarRoutes(api);
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
registerMetricsRoutes(app);

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

const handleQueueBatch = async (batch: MessageBatch<QueueJob>, env: AppBindings['Bindings']) => {
  const processor = new JobProcessor(env);
  for (const message of batch.messages) {
    try {
      await processor.process(message.body);
    } catch (error) {
      console.error('Queue job failed', message.body, error);
    }
  }
};

const handleScheduled = async (_: ScheduledController, env: AppBindings['Bindings']) => {
  if (!env.GMGNCARD_QUEUE) {
    return;
  }
  await env.GMGNCARD_QUEUE.send({ type: 'daily-backup' });
};

export default {
  fetch(request: Request, env: AppBindings['Bindings'], ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  queue(batch: MessageBatch<QueueJob>, env: AppBindings['Bindings'], ctx: ExecutionContext) {
    ctx.waitUntil(handleQueueBatch(batch, env));
  },
  scheduled(controller: ScheduledController, env: AppBindings['Bindings'], ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(controller, env));
  }
};
