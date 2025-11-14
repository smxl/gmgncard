import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';
import type { ReportStatus } from '@gmgncard/types';

export const useReports = (status?: ReportStatus | 'all') =>
  useQuery({
    queryKey: ['reports', status ?? 'all'],
    queryFn: () => adminApi.listReports(status && status !== 'all' ? { status } : {})
  });
