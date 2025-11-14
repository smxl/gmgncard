import { createDb, schema, type Database } from '@gmgncard/db';
import type { CreateReportPayload, ReportDTO, ReportStatus } from '@gmgncard/types';
import { desc, eq } from 'drizzle-orm';
import { RESOURCE_IDS } from '@gmgncard/config';
import type { WorkerEnv } from '../types';

const { reports, links } = schema;

export class ReportRepository {
  constructor(private readonly db: Database) {}

  static fromEnv(env: WorkerEnv) {
    return new ReportRepository(createDb(env[RESOURCE_IDS.d1]));
  }

  async list(limit = 50, status?: ReportStatus): Promise<ReportDTO[]> {
    const baseQuery = this.db
      .select({
        report: reports,
        linkTitle: links.title
      })
      .from(reports)
      .leftJoin(links, eq(links.id, reports.linkId));

    const filtered = status ? baseQuery.where(eq(reports.status, status)) : baseQuery;

    const rows = await filtered.orderBy(desc(reports.createdAt)).limit(limit);

    return rows.map((row) => ({
      id: row.report.id!,
      linkId: row.report.linkId ?? undefined,
      reporterEmail: row.report.reporterEmail ?? undefined,
      reason: row.report.reason!,
      status: row.report.status!,
      metadata: row.report.metadata ?? undefined,
      createdAt: row.report.createdAt!,
      ...(row.linkTitle ? { metadata: { ...(row.report.metadata ?? {}), linkTitle: row.linkTitle } } : {})
    }));
  }

  async create(payload: CreateReportPayload): Promise<ReportDTO> {
    const [inserted] = await this.db
      .insert(reports)
      .values({
        linkId: payload.linkId ?? null,
        reporterEmail: payload.reporterEmail,
        reason: payload.reason,
        metadata: payload.metadata ?? null
      })
      .returning();

    return {
      id: inserted.id!,
      linkId: inserted.linkId ?? undefined,
      reporterEmail: inserted.reporterEmail ?? undefined,
      reason: inserted.reason!,
      status: inserted.status!,
      metadata: inserted.metadata ?? undefined,
      createdAt: inserted.createdAt!
    };
  }

  async updateStatus(id: number, status: ReportStatus) {
    const [updated] = await this.db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return updated;
  }
}
