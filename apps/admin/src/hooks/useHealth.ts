import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: adminApi.health
  });
