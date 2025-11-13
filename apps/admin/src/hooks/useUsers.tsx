import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';

export const useUsers = (limit = 20) =>
  useQuery({
    queryKey: ['users', limit],
    queryFn: () => adminApi.listUsers({ limit }),
    staleTime: 60_000
  });
