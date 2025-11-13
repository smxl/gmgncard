import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from './Card';
import { useReports } from '../hooks/useReports';
import { adminApi } from '../lib/api';
import { reportStatuses } from '@gmgncard/types';
import { useAuth } from '../stores/auth';

export const ReportsPanel = () => {
  const { token } = useAuth();
  const reportsQuery = useReports();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: typeof reportStatuses[number] }) =>
      adminApi.updateReportStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  return (
    <Card title="Reports" description="反馈处理">
      {!token && <p className="error">登录后可更新状态</p>}
      {reportsQuery.isLoading && <p className="muted">加载中…</p>}
      {reportsQuery.isError && <p className="error">无法加载</p>}
      <ul className="reports-list">
        {(reportsQuery.data?.data ?? []).map((report) => (
          <li key={report.id}>
            <div>
              <p>
                <strong>#{report.id}</strong> {report.reason}
              </p>
              {report.reporterEmail && <span>{report.reporterEmail}</span>}
            </div>
            <div className="report-actions">
              <select
                value={report.status}
                disabled={!token || mutation.isPending}
                onChange={(event) =>
                  mutation.mutate({ id: report.id, status: event.target.value as typeof report.status })
                }
              >
                {reportStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
