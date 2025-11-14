import type { Hono } from 'hono';
import type { AppBindings } from '../types';
import { ReportRepository } from '../repos/report-repo';
import { ReportService } from '../services/report-service';
import { withRequestMeta } from '../utils/responses';
import { requireAuth } from '../middleware/auth';
import { reportStatuses, updateReportStatusSchema, type ReportStatus } from '@gmgncard/types';

const getService = (env: AppBindings['Bindings']) =>
  new ReportService(ReportRepository.fromEnv(env));

export const registerReportRoutes = (router: Hono<AppBindings>) => {
  router.get('/reports', async (c) => {
    const limit = Number.parseInt(c.req.query('limit') ?? '', 10);
    const service = getService(c.env);
    const statusParam = c.req.query('status');
    const status = reportStatuses.includes((statusParam ?? '') as ReportStatus)
      ? (statusParam as ReportStatus)
      : undefined;
    const reports = await service.list(
      Number.isFinite(limit) && limit > 0 ? limit : undefined,
      status
    );
    return withRequestMeta(c, reports);
  });

  router.post('/reports', async (c) => {
    const body = await c.req.json();
    const service = getService(c.env);
    const report = await service.submit(body);
    return withRequestMeta(c, report);
  });

  router.patch('/reports/:id', requireAuth({ role: 'admin' }), async (c) => {
    const id = Number.parseInt(c.req.param('id') ?? '', 10);
    if (!Number.isFinite(id)) {
      return c.json({ error: 'Invalid report id' }, 400);
    }
    const body = updateReportStatusSchema.parse(await c.req.json());
    const service = getService(c.env);
    const report = await service.updateStatus(id, body.status);
    return withRequestMeta(c, report);
  });
};
