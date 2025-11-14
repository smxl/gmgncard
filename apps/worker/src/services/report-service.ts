import type { CreateReportPayload, ReportDTO, ReportStatus } from '@gmgncard/types';
import { createReportSchema } from '@gmgncard/types';
import { ReportRepository } from '../repos/report-repo';
import { HttpError } from '../utils/errors';

export class ReportService {
  constructor(private readonly repo: ReportRepository) {}

  async list(limit = 50, status?: ReportStatus): Promise<ReportDTO[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.repo.list(safeLimit, status);
  }

  async submit(payload: CreateReportPayload) {
    const parsed = createReportSchema.parse(payload);
    return this.repo.create(parsed);
  }

  async updateStatus(id: number, status: ReportStatus) {
    const updated = await this.repo.updateStatus(id, status);
    if (!updated) {
      throw new HttpError(404, `Report ${id} not found`);
    }
    return this.list().then((reports) => reports.find((r) => r.id === id)!);
  }
}
