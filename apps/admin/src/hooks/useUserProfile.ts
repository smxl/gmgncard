import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../lib/api';

export const useUserProfile = (handle?: string) =>
  useQuery({
    queryKey: ['user-profile', handle],
    queryFn: () => adminApi.getUser(handle!),
    enabled: Boolean(handle)
  });
