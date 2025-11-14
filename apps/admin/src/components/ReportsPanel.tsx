import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Card } from './Card';
import { useReports } from '../hooks/useReports';
import { adminApi } from '../lib/api';
import { reportStatuses, type ReportStatus } from '@gmgncard/types';
import { useAuth } from '../stores/auth';

export const ReportsPanel = () => {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const reportsQuery = useReports(statusFilter);
  const queryClient = useQueryClient();
  const reports = reportsQuery.data?.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeReport = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? reports[0],
    [reports, selectedId]
  );

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: typeof reportStatuses[number] }) =>
      adminApi.updateReportStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  return (
    <Card
      title="Reports"
      description="反馈处理"
      actions={
        <div className="reports-filter">
          {['all', ...reportStatuses].map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? 'active' : ''}
              onClick={() => setStatusFilter(status as ReportStatus | 'all')}
            >
              {status}
            </button>
          ))}
        </div>
      }
    >
      {!token && <p className="error">登录后可更新状态</p>}
      {reportsQuery.isLoading && <p className="muted">加载中…</p>}
      {reportsQuery.isError && <p className="error">无法加载</p>}
      <div className="reports-panel">
        <aside>
          <ul className="reports-list">
            {reports.map((report) => (
              <li key={report.id}>
                <button
                  type="button"
                  className={activeReport?.id === report.id ? 'active' : ''}
                  onClick={() => setSelectedId(report.id)}
                >
                  <div>
                    <strong>#{report.id}</strong>
                    <span>{report.reason}</span>
                  </div>
                  <span className="status">{report.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="reports-detail">
          {activeReport ? (
            <>
              <header>
                <div>
                  <h3>#{activeReport.id}</h3>
                  <p className="muted">{activeReport.reason}</p>
                </div>
                <select
                  value={activeReport.status}
                  disabled={!token || mutation.isPending}
                  onChange={(event) =>
                    mutation.mutate({
                      id: activeReport.id,
                      status: event.target.value as ReportStatus
                    })
                  }
                >
                  {reportStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </header>
              {activeReport.reporterEmail && (
                <p className="muted text-sm">Reporter: {activeReport.reporterEmail}</p>
              )}
              {activeReport.metadata && (
                <pre className="metadata-block">{JSON.stringify(activeReport.metadata, null, 2)}</pre>
              )}
              {activeReport.linkId && (
                <p className="text-sm">
                  关联 link: <code>#{activeReport.linkId}</code>
                </p>
              )}
            </>
          ) : (
            <p className="muted">暂无反馈。</p>
          )}
        </section>
      </div>
    </Card>
  );
};
