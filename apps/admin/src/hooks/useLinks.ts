import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';

export const useLinks = (handle: string, enabled = true) =>
  useQuery({
    queryKey: ['links', handle],
    queryFn: () => adminApi.listLinks(handle),
    enabled: Boolean(handle) && enabled
  });
