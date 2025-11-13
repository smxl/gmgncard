import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../lib/api';

export const useSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: adminApi.getSettings,
    staleTime: 60_000
  });

  const mutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  return {
    ...settingsQuery,
    updateSettings: mutation.mutateAsync,
    updating: mutation.isPending,
    updateError: mutation.error
  };
};
