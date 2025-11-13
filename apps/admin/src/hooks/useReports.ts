import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';

export const useReports = () =>
  useQuery({
    queryKey: ['reports'],
    queryFn: adminApi.listReports
  });
